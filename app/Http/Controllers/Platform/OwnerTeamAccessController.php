<?php

namespace App\Http\Controllers\Platform;

use App\Notifications\RestaurantStaffInvitation;
use App\Platform\Models\PlatformAuditLog;
use App\Platform\Models\RestaurantInvitation;
use App\Platform\Models\RestaurantMembership;
use App\Platform\Models\RestaurantRole;
use App\Platform\Tenancy\TenantContext;
use Igniter\Local\Models\Location;
use Igniter\User\Models\User;
use Igniter\User\Models\UserRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class OwnerTeamAccessController extends Controller
{
    private const PERMISSIONS = [
        'dashboard.view', 'orders.manage', 'reservations.manage', 'catalog.manage',
        'customers.view', 'locations.manage', 'team.manage', 'settings.manage',
        'branding.manage', 'builds.manage',
    ];

    public function __construct(private readonly TenantContext $tenant) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeOwner($request);
        $roles = RestaurantRole::query()->where('restaurant_id', $this->tenant->id())->orderBy('name')->get();
        $invitations = RestaurantInvitation::query()->with('role')->where('restaurant_id', $this->tenant->id())
            ->where('status', 'pending')->latest()->get();

        return response()->json([
            'data' => [
                'roles' => $roles->map(fn (RestaurantRole $role) => $this->roleData($role))->values(),
                'invitations' => $invitations->map(fn (RestaurantInvitation $invitation) => $this->invitationData($invitation))->values(),
            ],
            'meta' => ['available_permissions' => self::PERMISSIONS],
        ]);
    }

    public function storeRole(Request $request): JsonResponse
    {
        $this->authorizeOwner($request);
        $data = $this->validateRole($request);
        $role = RestaurantRole::query()->create([
            'restaurant_id' => $this->tenant->id(),
            'name' => $data['name'], 'slug' => $this->uniqueSlug($data['name']),
            'base_role' => $data['base_role'], 'permissions' => array_values(array_unique($data['permissions'])),
        ]);
        $this->audit($request, 'team.role_created', 'restaurant_role', $role->getKey(), ['name' => $role->name]);

        return response()->json(['data' => $this->roleData($role)], 201);
    }

    public function updateRole(Request $request, int $roleId): JsonResponse
    {
        $this->authorizeOwner($request);
        $role = $this->roleQuery()->findOrFail($roleId);
        $data = $this->validateRole($request);
        $role->update([
            'name' => $data['name'], 'base_role' => $data['base_role'],
            'permissions' => array_values(array_unique($data['permissions'])),
        ]);
        $role->memberships()->where('restaurant_id', $this->tenant->id())->update(['role' => $role->base_role]);
        $this->audit($request, 'team.role_updated', 'restaurant_role', $roleId, ['name' => $role->name]);

        return response()->json(['data' => $this->roleData($role)]);
    }

    public function destroyRole(Request $request, int $roleId): Response
    {
        $this->authorizeOwner($request);
        $role = $this->roleQuery()->findOrFail($roleId);
        abort_if($role->memberships()->exists() || RestaurantInvitation::query()->where('restaurant_role_id', $roleId)->where('status', 'pending')->exists(), 409, 'This role is still assigned.');
        $role->delete();
        $this->audit($request, 'team.role_deleted', 'restaurant_role', $roleId, []);

        return response()->noContent();
    }

    public function invite(Request $request): JsonResponse
    {
        $this->authorizeOwner($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email:filter', 'max:96', Rule::unique('admin_users', 'email')],
            'base_role' => ['required_without:restaurant_role_id', Rule::in(['manager', 'staff'])],
            'restaurant_role_id' => ['nullable', 'integer'],
            'location_ids' => ['required', 'array', 'min:1'], 'location_ids.*' => ['integer'],
        ]);
        $this->assertTenantLocations($data['location_ids']);
        $role = isset($data['restaurant_role_id']) ? $this->roleQuery()->findOrFail($data['restaurant_role_id']) : null;
        $email = Str::lower($data['email']);
        abort_if(RestaurantInvitation::query()->where('restaurant_id', $this->tenant->id())->where('email', $email)
            ->where('status', 'pending')->where('expires_at', '>', now())->exists(), 409, 'An active invitation already exists for this email.');
        $token = Str::random(64);
        $invitation = RestaurantInvitation::query()->create([
            'restaurant_id' => $this->tenant->id(), 'restaurant_role_id' => $role?->getKey(),
            'invited_by' => $request->user()->getKey(), 'name' => $data['name'], 'email' => $email,
            'base_role' => $role?->base_role ?? $data['base_role'], 'location_ids' => array_values(array_unique($data['location_ids'])),
            'token_hash' => hash('sha256', $token), 'status' => 'pending', 'expires_at' => now()->addDays(7),
        ]);
        $restaurant = $this->tenant->get();
        Notification::route('mail', $email)->notify(new RestaurantStaffInvitation(
            $restaurant->public_id, $restaurant->name, $invitation->public_id, $token,
        ));
        $this->audit($request, 'team.invitation_created', 'restaurant_invitation', $invitation->getKey(), ['email' => $email]);

        return response()->json(['data' => $this->invitationData($invitation->load('role'))], 201);
    }

    public function cancel(Request $request, string $publicId): Response
    {
        $this->authorizeOwner($request);
        $invitation = RestaurantInvitation::query()->where('restaurant_id', $this->tenant->id())
            ->where('public_id', $publicId)->where('status', 'pending')->firstOrFail();
        $invitation->update(['status' => 'cancelled']);
        $this->audit($request, 'team.invitation_cancelled', 'restaurant_invitation', $invitation->getKey(), []);

        return response()->noContent();
    }

    public function accept(Request $request): JsonResponse
    {
        $data = $request->validate([
            'invitation_id' => ['required', 'uuid'], 'token' => ['required', 'string', 'size:64'],
            'password' => ['required', 'string', 'min:10', 'max:72', 'confirmed'],
        ]);
        $invitation = RestaurantInvitation::query()->where('restaurant_id', $this->tenant->id())
            ->where('public_id', $data['invitation_id'])->first();
        if (!$invitation || $invitation->status !== 'pending' || $invitation->expires_at->isPast()
            || !hash_equals($invitation->token_hash, hash('sha256', $data['token']))) {
            throw ValidationException::withMessages(['token' => ['This invitation is invalid or expired.']]);
        }

        $membership = DB::transaction(function () use ($invitation, $data): RestaurantMembership {
            $locked = RestaurantInvitation::query()->whereKey($invitation->getKey())->lockForUpdate()->firstOrFail();
            abort_unless($locked->status === 'pending' && $locked->expires_at->isFuture(), 409, 'This invitation has already been used.');
            abort_if(User::query()->where('email', $locked->email)->exists(), 409, 'An account already exists for this email.');
            $roleId = UserRole::query()->orderBy('user_role_id')->value('user_role_id');
            abort_if(!$roleId, 503, 'No staff role is configured.');
            $user = (new User)->register([
                'name' => $locked->name, 'email' => $locked->email,
                'username' => $this->uniqueUsername($locked->email), 'password' => $data['password'],
                'user_role_id' => $roleId, 'status' => true,
            ], true);
            $user->locations()->sync($locked->location_ids);
            $membership = RestaurantMembership::query()->create([
                'restaurant_id' => $locked->restaurant_id, 'user_id' => $user->getKey(),
                'role' => $locked->base_role, 'restaurant_role_id' => $locked->restaurant_role_id,
                'status' => 'active', 'location_ids' => $locked->location_ids,
            ]);
            $locked->update(['status' => 'accepted', 'accepted_at' => now(), 'token_hash' => hash('sha256', Str::random(64))]);
            return $membership;
        });

        return response()->json(['data' => ['membership_id' => $membership->getKey(), 'email' => $invitation->email]], 201);
    }

    private function authorizeOwner(Request $request): void
    {
        abort_unless(RestaurantMembership::query()->where('restaurant_id', $this->tenant->id())
            ->where('user_id', $request->user()->getKey())->where('status', 'active')->where('role', 'owner')->exists(), 403, 'Restaurant owner access is required.');
    }

    private function validateRole(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:80'], 'base_role' => ['required', Rule::in(['manager', 'staff'])],
            'permissions' => ['required', 'array'], 'permissions.*' => ['string', Rule::in(self::PERMISSIONS)],
        ]);
    }

    private function roleQuery()
    {
        return RestaurantRole::query()->where('restaurant_id', $this->tenant->id());
    }

    private function assertTenantLocations(array $locationIds): void
    {
        abort_unless(Location::query()->where('restaurant_id', $this->tenant->id())->whereIn('location_id', $locationIds)
            ->count() === count(array_unique($locationIds)), 422, 'One or more locations do not belong to this restaurant.');
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::limit(Str::slug($name), 70, '') ?: 'custom-role';
        $slug = $base;
        for ($suffix = 2; $this->roleQuery()->where('slug', $slug)->exists(); $suffix++) $slug = $base.'-'.$suffix;
        return $slug;
    }

    private function uniqueUsername(string $email): string
    {
        $base = Str::limit(Str::slug(Str::before($email, '@'), '_'), 24, '') ?: 'staff';
        $username = $base;
        for ($suffix = 2; User::query()->where('username', $username)->exists(); $suffix++) $username = $base.'_'.$suffix;
        return $username;
    }

    private function roleData(RestaurantRole $role): array
    {
        return ['id' => $role->getKey(), 'name' => $role->name, 'slug' => $role->slug, 'base_role' => $role->base_role, 'permissions' => $role->permissions ?? []];
    }

    private function invitationData(RestaurantInvitation $invitation): array
    {
        return [
            'id' => $invitation->public_id, 'name' => $invitation->name, 'email' => $invitation->email,
            'base_role' => $invitation->base_role, 'role' => $invitation->role ? $this->roleData($invitation->role) : null,
            'location_ids' => $invitation->location_ids, 'status' => $invitation->status,
            'expires_at' => $invitation->expires_at->toIso8601String(),
        ];
    }

    private function audit(Request $request, string $action, string $subjectType, int $subjectId, array $metadata): void
    {
        PlatformAuditLog::query()->create([
            'restaurant_id' => $this->tenant->id(), 'actor_type' => 'owner', 'actor_id' => $request->user()->getKey(),
            'action' => $action, 'subject_type' => $subjectType, 'subject_id' => (string) $subjectId,
            'metadata' => $metadata, 'ip_address' => $request->ip(),
        ]);
    }
}

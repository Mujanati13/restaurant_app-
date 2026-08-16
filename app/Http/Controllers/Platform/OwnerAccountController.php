<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\PlatformAuditLog;
use App\Platform\Models\RestaurantMembership;
use App\Platform\Support\OwnerAccountSecurity;
use App\Platform\Tenancy\TenantContext;
use Igniter\User\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class OwnerAccountController extends Controller
{
    public function __construct(
        private readonly TenantContext $tenant,
        private readonly OwnerAccountSecurity $security,
    ) {}

    public function resendVerification(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email:filter', 'max:96']]);
        $user = $this->memberByEmail($data['email']);
        if ($user && !$user->is_activated) {
            $this->security->sendVerification($this->tenant->get(), $user);
        }

        return response()->json(['message' => 'If the account is eligible, a verification email has been sent.']);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => ['required', 'string', 'size:64']]);
        $user = $this->security->verifyEmail($this->tenant->get(), $data['token']);
        $this->audit($request, $user, 'owner.email_verified');

        return response()->json(['message' => 'Email verified. You can now sign in.']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email:filter', 'max:96']]);
        $user = $this->memberByEmail($data['email']);
        if ($user && $user->is_activated) {
            $this->security->sendPasswordReset($this->tenant->get(), $user);
        }

        return response()->json(['message' => 'If the account exists, a password reset email has been sent.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'size:64'],
            'password' => ['required', 'string', 'min:10', 'max:72', 'confirmed'],
        ]);
        $user = $this->security->resetPassword($this->tenant->get(), $data['token'], $data['password']);
        $this->audit($request, $user, 'owner.password_reset');

        return response()->json(['message' => 'Password updated. Sign in again on your devices.']);
    }

    private function memberByEmail(string $email): ?User
    {
        $membership = RestaurantMembership::query()->with('user')
            ->where('restaurant_id', $this->tenant->id())->whereIn('status', ['active', 'invited'])
            ->whereHas('user', fn($query) => $query->where('email', strtolower($email)))
            ->first();

        return $membership?->user;
    }

    private function audit(Request $request, User $user, string $action): void
    {
        PlatformAuditLog::query()->create([
            'restaurant_id' => $this->tenant->id(), 'actor_type' => 'owner_account', 'actor_id' => $user->getKey(),
            'action' => $action, 'subject_type' => User::class, 'subject_id' => (string) $user->getKey(),
            'metadata' => [], 'ip_address' => $request->ip(),
        ]);
    }
}

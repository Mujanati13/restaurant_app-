<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\PlatformAuditLog;
use App\Platform\Models\PlatformAdmin;
use App\Platform\Models\Restaurant;
use App\Platform\Models\AppBuild;
use App\Platform\Models\RestaurantDomain;
use App\Platform\Models\RestaurantSubscription;
use App\Platform\Models\SubscriptionPlan;
use App\Platform\Provisioning\RestaurantProvisioner;
use App\Platform\Support\OwnerAccountSecurity;
use App\Jobs\PrepareAppBuild;
use Igniter\Cart\Models\Menu;
use Igniter\Cart\Models\Order;
use Igniter\Local\Models\Location;
use Igniter\Reservation\Models\Reservation;
use Igniter\User\Models\Customer;
use Igniter\User\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SuperAdminRestaurantController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);
        $statusCounts = Restaurant::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        return response()->json(['data' => [
            'restaurants' => (int)Restaurant::query()->count(),
            'active_restaurants' => (int)Restaurant::query()->where('status', 'active')->count(),
            'trial_restaurants' => (int)Restaurant::query()->where('status', 'trial')->count(),
            'suspended_restaurants' => (int)Restaurant::query()->where('status', 'suspended')->count(),
            'orders' => (int)Order::query()->count(), 'customers' => (int)Customer::query()->count(),
            'builds_waiting' => (int)AppBuild::query()->whereIn('status', ['queued', 'preparing'])->count(),
            'status_counts' => $statusCounts,
        ]]);
    }

    public function reports(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);
        [$from, $to, $restaurantId] = $this->reportFilters($request);

        return response()->json(['data' => $this->reportRows($from, $to, $restaurantId), 'meta' => [
            'from' => $from->toDateString(), 'to' => $to->toDateString(),
            'restaurant_id' => $request->input('restaurant'),
        ]]);
    }

    public function exportReports(Request $request): StreamedResponse
    {
        $this->authorizeSuperAdmin($request);
        [$from, $to, $restaurantId] = $this->reportFilters($request);
        $rows = $this->reportRows($from, $to, $restaurantId);

        return response()->streamDownload(function () use ($rows): void {
            $stream = fopen('php://output', 'wb');
            fputcsv($stream, ['date', 'orders', 'revenue', 'reservations', 'new_restaurants']);
            foreach ($rows as $row) {
                fputcsv($stream, [$row['date'], $row['orders'], $row['revenue'], $row['reservations'], $row['new_restaurants']]);
            }
            fclose($stream);
        }, 'vondo-platform-report-'.$from->toDateString().'-'.$to->toDateString().'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function store(Request $request, RestaurantProvisioner $provisioner, OwnerAccountSecurity $security): JsonResponse
    {
        $user = $this->authorizeSuperAdmin($request);
        $data = $request->validate([
            'owner_name' => ['required', 'string', 'max:80'], 'restaurant_name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email:filter', 'max:96', Rule::unique('admin_users', 'email')],
            'password' => ['required', 'string', 'min:10', 'max:72', 'confirmed'], 'timezone' => ['required', 'timezone'],
            'currency_code' => ['required', 'string', 'size:3'],
        ]);
        $restaurant = $provisioner->provision($data, $request->ip());
        $owner = $restaurant->memberships()->with('user')->where('role', 'owner')->firstOrFail()->user;
        $security->sendVerification($restaurant, $owner);
        $this->audit($request, $user, $restaurant, 'restaurant.created_by_super_admin', ['owner_email' => strtolower($data['email'])]);

        return response()->json(['data' => $this->detailedData($restaurant)], 201);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);
        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'], 'status' => ['nullable', Rule::in(['draft', 'trial', 'active', 'suspended', 'archived'])],
            'page' => ['nullable', 'integer', 'min:1'], 'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);
        $restaurants = Restaurant::query()->withCount(['domains', 'memberships'])
            ->when($data['search'] ?? null, fn($query, $search) => $query->where(fn($match) => $match->where('name', 'like', '%'.$search.'%')->orWhere('slug', 'like', '%'.$search.'%')))
            ->when($data['status'] ?? null, fn($query, $status) => $query->where('status', $status))
            ->orderByDesc('id')->paginate($data['limit'] ?? 30, ['*'], 'page', $data['page'] ?? 1);

        return response()->json(['data' => $restaurants->getCollection()->map(fn($restaurant) => $this->data($restaurant))->values(),
            'meta' => ['page' => $restaurants->currentPage(), 'limit' => $restaurants->perPage(), 'total' => $restaurants->total(), 'last_page' => $restaurants->lastPage()]]);
    }

    public function show(Request $request, string $publicId): JsonResponse
    {
        $this->authorizeSuperAdmin($request);
        $restaurant = Restaurant::query()->withCount(['domains', 'memberships'])->where('public_id', $publicId)->firstOrFail();
        return response()->json(['data' => $this->detailedData($restaurant)]);
    }

    public function updateStatus(Request $request, string $publicId): JsonResponse
    {
        $user = $this->authorizeSuperAdmin($request);
        $data = $request->validate(['status' => ['required', Rule::in(['draft', 'trial', 'active', 'suspended', 'archived'])], 'reason' => ['required', 'string', 'max:500']]);
        $restaurant = Restaurant::query()->where('public_id', $publicId)->firstOrFail();
        $previous = $restaurant->status;
        $restaurant->forceFill(['status' => $data['status']])->save();
        PlatformAuditLog::query()->create([
            'restaurant_id' => $restaurant->getKey(), 'actor_type' => 'super_admin', 'actor_id' => $user->getKey(),
            'action' => 'restaurant.status_changed', 'subject_type' => Restaurant::class, 'subject_id' => (string)$restaurant->getKey(),
            'metadata' => ['from' => $previous, 'to' => $restaurant->status, 'reason' => $data['reason']], 'ip_address' => $request->ip(),
        ]);
        return response()->json(['data' => $this->data($restaurant)]);
    }

    public function updateFeature(Request $request, string $publicId, string $feature): JsonResponse
    {
        $user = $this->authorizeSuperAdmin($request);
        abort_unless((bool)preg_match('/^[a-z][a-z0-9_.-]{1,79}$/', $feature), 422, 'Invalid feature key.');
        $data = $request->validate(['enabled' => ['required', 'boolean'], 'limits' => ['nullable', 'array'], 'reason' => ['required', 'string', 'max:500']]);
        $restaurant = Restaurant::query()->where('public_id', $publicId)->firstOrFail();
        $record = $restaurant->features()->updateOrCreate(['feature' => $feature], ['enabled' => $data['enabled'], 'limits' => $data['limits'] ?? null]);
        $this->audit($request, $user, $restaurant, 'restaurant.feature_updated', ['feature' => $feature, 'enabled' => $record->enabled, 'reason' => $data['reason']]);
        return response()->json(['data' => ['feature' => $record->feature, 'enabled' => $record->enabled, 'limits' => $record->limits]]);
    }

    public function verifyDomain(Request $request, string $publicId, int $domainId): JsonResponse
    {
        $user = $this->authorizeSuperAdmin($request);
        $data = $request->validate(['verified' => ['required', 'boolean'], 'reason' => ['required', 'string', 'max:500']]);
        $restaurant = Restaurant::query()->where('public_id', $publicId)->firstOrFail();
        $domain = $restaurant->domains()->findOrFail($domainId);
        $domain->update(['verified_at' => $data['verified'] ? now() : null]);
        $this->audit($request, $user, $restaurant, 'restaurant.domain_verification_changed', ['host' => $domain->host, 'verified' => $data['verified'], 'reason' => $data['reason']]);
        return response()->json(['data' => ['id' => $domain->getKey(), 'host' => $domain->host, 'verified_at' => $domain->verified_at?->toIso8601String()]]);
    }

    public function builds(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);
        $data = $request->validate(['status' => ['nullable', 'string', 'max:30'], 'page' => ['nullable', 'integer', 'min:1'], 'limit' => ['nullable', 'integer', 'min:1', 'max:100']]);
        $builds = AppBuild::query()->with('restaurant')->when($data['status'] ?? null, fn($query, $status) => $query->where('status', $status))
            ->latest()->paginate($data['limit'] ?? 30, ['*'], 'page', $data['page'] ?? 1);
        return response()->json(['data' => $builds->getCollection()->map(fn($build) => $this->buildData($build))->values(),
            'meta' => ['page' => $builds->currentPage(), 'limit' => $builds->perPage(), 'total' => $builds->total(), 'last_page' => $builds->lastPage()]]);
    }

    public function build(Request $request, string $publicId): JsonResponse
    {
        $this->authorizeSuperAdmin($request);
        $build = AppBuild::query()->with(['restaurant', 'events', 'artifacts'])->where('public_id', $publicId)->firstOrFail();
        return response()->json(['data' => $this->buildData($build, true)]);
    }

    public function cancelBuild(Request $request, string $publicId): JsonResponse
    {
        $user = $this->authorizeSuperAdmin($request);
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $build = AppBuild::query()->with('restaurant')->where('public_id', $publicId)->firstOrFail();
        abort_unless(in_array($build->status, ['queued', 'preparing', 'configuration_ready', 'submitted', 'building'], true), 409, 'This build cannot be cancelled.');
        $build->update(['status' => 'cancelled', 'cancelled_at' => now()]);
        $build->recordEvent('build.cancelled_by_platform', 'Build cancelled by Super Admin.', context: ['reason' => $data['reason']]);
        $this->audit($request, $user, $build->restaurant, 'app_build.cancelled_by_platform', ['build_id' => $build->public_id, 'reason' => $data['reason']]);
        return response()->json(['data' => $this->buildData($build->fresh(['restaurant']), true)]);
    }

    public function retryBuild(Request $request, string $publicId): JsonResponse
    {
        $user = $this->authorizeSuperAdmin($request);
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $build = AppBuild::query()->with('restaurant')->where('public_id', $publicId)->firstOrFail();
        abort_unless(in_array($build->status, ['failed', 'cancelled'], true), 409, 'Only failed or cancelled builds can be retried.');
        $build->update(['status' => 'queued', 'cancelled_at' => null, 'finished_at' => null, 'failure_message' => null]);
        $build->recordEvent('build.retried_by_platform', 'Build retried by Super Admin.', context: ['reason' => $data['reason']]);
        PrepareAppBuild::dispatch($build->getKey(), $build->restaurant_id)->onQueue('builds');
        $this->audit($request, $user, $build->restaurant, 'app_build.retried_by_platform', ['build_id' => $build->public_id, 'reason' => $data['reason']]);
        return response()->json(['data' => $this->buildData($build->fresh(['restaurant']), true)], 202);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);
        $data = $request->validate(['restaurant_id' => ['nullable', 'integer'], 'page' => ['nullable', 'integer', 'min:1'], 'limit' => ['nullable', 'integer', 'min:1', 'max:100']]);
        $logs = PlatformAuditLog::query()->when($data['restaurant_id'] ?? null, fn($query, $id) => $query->where('restaurant_id', $id))
            ->latest('created_at')->paginate($data['limit'] ?? 50, ['*'], 'page', $data['page'] ?? 1);
        return response()->json(['data' => $logs->getCollection()->map(fn($log) => [
            'id' => $log->getKey(), 'restaurant_id' => $log->restaurant_id, 'actor_type' => $log->actor_type,
            'actor_id' => $log->actor_id, 'action' => $log->action, 'subject_type' => $log->subject_type,
            'subject_id' => $log->subject_id, 'metadata' => $log->metadata, 'created_at' => $log->created_at?->toIso8601String(),
        ])->values(), 'meta' => ['page' => $logs->currentPage(), 'limit' => $logs->perPage(), 'total' => $logs->total(), 'last_page' => $logs->lastPage()]]);
    }

    public function plans(Request $request): JsonResponse
    {
        $this->authorizeSuperAdmin($request);
        return response()->json(['data' => SubscriptionPlan::query()->orderBy('price_minor')->get()->map(fn(SubscriptionPlan $plan) => $this->planData($plan))->values()]);
    }

    public function storePlan(Request $request): JsonResponse
    {
        $user = $this->authorizeSuperAdmin($request);
        $data = $request->validate([
            'code' => ['required', 'alpha_dash', 'max:60', Rule::unique('subscription_plans', 'code')],
            'name' => ['required', 'string', 'max:100'], 'price_minor' => ['required', 'integer', 'min:0'],
            'currency_code' => ['required', 'string', 'size:3'], 'features' => ['nullable', 'array'], 'active' => ['required', 'boolean'],
        ]);
        $plan = SubscriptionPlan::query()->create([...$data, 'currency_code' => strtoupper($data['currency_code'])]);
        PlatformAuditLog::query()->create([
            'restaurant_id' => null, 'actor_type' => 'super_admin', 'actor_id' => $user->getKey(), 'action' => 'subscription_plan.created',
            'subject_type' => SubscriptionPlan::class, 'subject_id' => (string)$plan->getKey(), 'metadata' => ['code' => $plan->code], 'ip_address' => $request->ip(),
        ]);
        return response()->json(['data' => $this->planData($plan)], 201);
    }

    public function updatePlan(Request $request, int $planId): JsonResponse
    {
        $user = $this->authorizeSuperAdmin($request);
        $plan = SubscriptionPlan::query()->findOrFail($planId);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'], 'price_minor' => ['required', 'integer', 'min:0'],
            'currency_code' => ['required', 'string', 'size:3'], 'features' => ['nullable', 'array'], 'active' => ['required', 'boolean'],
        ]);
        $plan->update([...$data, 'currency_code' => strtoupper($data['currency_code'])]);
        PlatformAuditLog::query()->create([
            'restaurant_id' => null, 'actor_type' => 'super_admin', 'actor_id' => $user->getKey(), 'action' => 'subscription_plan.updated',
            'subject_type' => SubscriptionPlan::class, 'subject_id' => (string)$plan->getKey(), 'metadata' => ['code' => $plan->code], 'ip_address' => $request->ip(),
        ]);
        return response()->json(['data' => $this->planData($plan)]);
    }

    public function assignSubscription(Request $request, string $publicId): JsonResponse
    {
        $user = $this->authorizeSuperAdmin($request);
        $restaurant = Restaurant::query()->where('public_id', $publicId)->firstOrFail();
        $data = $request->validate([
            'plan_id' => ['required', 'integer', 'exists:subscription_plans,id'], 'status' => ['required', Rule::in(['trial', 'active', 'past_due', 'cancelled'])],
            'trial_ends_at' => ['nullable', 'date'], 'current_period_ends_at' => ['nullable', 'date'], 'reason' => ['required', 'string', 'max:500'],
        ]);
        $subscription = RestaurantSubscription::query()->updateOrCreate(
            ['restaurant_id' => $restaurant->getKey()],
            ['subscription_plan_id' => $data['plan_id'], 'status' => $data['status'], 'trial_ends_at' => $data['trial_ends_at'] ?? null,
                'current_period_ends_at' => $data['current_period_ends_at'] ?? null],
        );
        $this->audit($request, $user, $restaurant, 'restaurant.subscription_updated', ['plan_id' => $data['plan_id'], 'status' => $data['status'], 'reason' => $data['reason']]);
        return response()->json(['data' => $this->subscriptionData($subscription->load('plan'))]);
    }

    private function authorizeSuperAdmin(Request $request): PlatformAdmin
    {
        $user = $request->user();
        abort_unless($user instanceof PlatformAdmin && $user->active, 403, 'Super Admin access is required.');
        return $user;
    }

    private function reportFilters(Request $request): array
    {
        $data = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'restaurant' => ['nullable', 'uuid', 'exists:restaurants,public_id'],
        ]);
        $from = Carbon::createFromFormat('Y-m-d', $data['from'] ?? now()->subDays(29)->toDateString())->startOfDay();
        $to = Carbon::createFromFormat('Y-m-d', $data['to'] ?? now()->toDateString())->endOfDay();
        abort_if($from->diffInDays($to) > 365, 422, 'The report range cannot exceed 366 days.');
        $restaurantId = isset($data['restaurant'])
            ? Restaurant::query()->where('public_id', $data['restaurant'])->value('id')
            : null;

        return [$from, $to, $restaurantId];
    }

    private function reportRows(Carbon $from, Carbon $to, ?int $restaurantId): array
    {
        $orders = DB::table('orders')->selectRaw('order_date as report_date, count(*) as total, coalesce(sum(order_total), 0) as revenue')
            ->whereBetween('order_date', [$from->toDateString(), $to->toDateString()])
            ->when($restaurantId, fn($query) => $query->where('restaurant_id', $restaurantId))
            ->groupBy('order_date')->get()->keyBy('report_date');
        $reservations = DB::table('reservations')->selectRaw('reserve_date as report_date, count(*) as total')
            ->whereBetween('reserve_date', [$from->toDateString(), $to->toDateString()])
            ->when($restaurantId, fn($query) => $query->where('restaurant_id', $restaurantId))
            ->groupBy('reserve_date')->pluck('total', 'report_date');
        $restaurants = DB::table('restaurants')->selectRaw('date(created_at) as report_date, count(*) as total')
            ->whereBetween('created_at', [$from, $to])
            ->when($restaurantId, fn($query) => $query->where('id', $restaurantId))
            ->groupByRaw('date(created_at)')->pluck('total', 'report_date');

        $rows = [];
        for ($date = $from->copy()->startOfDay(); $date->lte($to); $date->addDay()) {
            $key = $date->toDateString();
            $order = $orders->get($key);
            $rows[] = [
                'date' => $key,
                'orders' => (int) ($order->total ?? 0),
                'revenue' => round((float) ($order->revenue ?? 0), 2),
                'reservations' => (int) ($reservations[$key] ?? 0),
                'new_restaurants' => (int) ($restaurants[$key] ?? 0),
            ];
        }

        return $rows;
    }

    private function buildData(AppBuild $build, bool $details = false): array
    {
        $data = [
            'id' => $build->public_id, 'restaurant' => ['id' => $build->restaurant->public_id, 'name' => $build->restaurant->name],
            'platform' => $build->platform, 'status' => $build->status, 'attempts' => $build->attempts,
            'failure_message' => $build->failure_message, 'created_at' => $build->created_at?->toIso8601String(),
            'finished_at' => $build->finished_at?->toIso8601String(),
        ];
        if (!$details) return $data;
        return [...$data,
            'configuration' => $build->configuration,
            'events' => $build->events()->limit(100)->get()->map(fn($event) => [
                'level' => $event->level, 'event' => $event->event, 'message' => $event->message,
                'context' => $event->context, 'created_at' => $event->created_at?->toIso8601String(),
            ])->values(),
            'artifacts' => $build->artifacts()->get()->map(fn($artifact) => [
                'kind' => $artifact->kind, 'size_bytes' => $artifact->size_bytes, 'sha256' => $artifact->sha256,
                'expires_at' => $artifact->expires_at?->toIso8601String(), 'created_at' => $artifact->created_at?->toIso8601String(),
            ])->values(),
        ];
    }

    private function data(Restaurant $restaurant): array
    {
        return ['id' => $restaurant->public_id, 'name' => $restaurant->name, 'slug' => $restaurant->slug, 'status' => $restaurant->status,
            'timezone' => $restaurant->timezone, 'currency_code' => $restaurant->currency_code,
            'domains_count' => (int)($restaurant->domains_count ?? $restaurant->domains()->count()),
            'memberships_count' => (int)($restaurant->memberships_count ?? $restaurant->memberships()->count()),
            'created_at' => $restaurant->created_at?->toIso8601String()];
    }

    private function detailedData(Restaurant $restaurant): array
    {
        $base = $this->data($restaurant);
        $domains = $restaurant->domains()->orderByDesc('is_primary')->get();
        $members = $restaurant->memberships()->with('user')->orderBy('role')->get();
        $subscription = RestaurantSubscription::query()->with('plan')->where('restaurant_id', $restaurant->getKey())->latest()->first();
        return [...$base,
            'domains' => $domains->map(fn($domain) => [
                'id' => (int)$domain->getKey(), 'host' => $domain->host, 'is_primary' => (bool)$domain->is_primary,
                'verified_at' => $domain->verified_at?->toIso8601String(),
            ])->values(),
            'members' => $members->map(fn($membership) => [
                'id' => (int)$membership->getKey(), 'name' => $membership->user?->name, 'email' => $membership->user?->email,
                'role' => $membership->role, 'status' => $membership->status,
            ])->values(),
            'features' => $restaurant->features()->orderBy('feature')->get()->map(fn($feature) => [
                'key' => $feature->feature, 'enabled' => (bool)$feature->enabled, 'limits' => $feature->limits,
            ])->values(),
            'subscription' => $this->subscriptionData($subscription),
            'usage' => [
                'locations' => (int)Location::query()->where('restaurant_id', $restaurant->getKey())->count(),
                'menus' => (int)Menu::query()->where('restaurant_id', $restaurant->getKey())->count(),
                'customers' => (int)Customer::query()->where('restaurant_id', $restaurant->getKey())->count(),
                'orders' => (int)Order::query()->where('restaurant_id', $restaurant->getKey())->count(),
                'reservations' => (int)Reservation::query()->where('restaurant_id', $restaurant->getKey())->count(),
            ],
        ];
    }

    private function planData(SubscriptionPlan $plan): array
    {
        return ['id' => (int)$plan->getKey(), 'code' => $plan->code, 'name' => $plan->name, 'price_minor' => (int)$plan->price_minor,
            'currency_code' => $plan->currency_code, 'features' => $plan->features ?? [], 'active' => (bool)$plan->active];
    }

    private function subscriptionData(?RestaurantSubscription $subscription): ?array
    {
        if (!$subscription) return null;
        return ['id' => (int)$subscription->getKey(), 'status' => $subscription->status,
            'trial_ends_at' => $subscription->trial_ends_at?->toIso8601String(),
            'current_period_ends_at' => $subscription->current_period_ends_at?->toIso8601String(),
            'plan' => $subscription->plan ? $this->planData($subscription->plan) : null];
    }

    private function audit(Request $request, PlatformAdmin $user, Restaurant $restaurant, string $action, array $metadata): void
    {
        PlatformAuditLog::query()->create(['restaurant_id' => $restaurant->getKey(), 'actor_type' => 'super_admin', 'actor_id' => $user->getKey(),
            'action' => $action, 'subject_type' => Restaurant::class, 'subject_id' => (string)$restaurant->getKey(),
            'metadata' => $metadata, 'ip_address' => $request->ip()]);
    }
}

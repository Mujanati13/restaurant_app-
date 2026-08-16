<?php

namespace App\Http\Controllers\Platform;

use App\Jobs\PrepareAppBuild;
use App\Platform\Models\AppBuild;
use App\Platform\Models\PlatformAuditLog;
use App\Platform\Models\RestaurantMembership;
use App\Platform\Support\IdempotentRequest;
use App\Platform\Support\RestaurantAccess;
use App\Platform\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OwnerAppBuildController extends Controller
{
    public function __construct(private readonly TenantContext $tenant, private readonly IdempotentRequest $idempotency, private readonly RestaurantAccess $access) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeOwner($request);
        $builds = AppBuild::query()->where('restaurant_id', $this->tenant->id())->latest()->paginate(min(max($request->integer('limit', 20), 1), 100));
        return response()->json(['data' => $builds->getCollection()->map(fn($build) => $this->data($build))->values(),
            'meta' => ['page' => $builds->currentPage(), 'limit' => $builds->perPage(), 'total' => $builds->total(), 'last_page' => $builds->lastPage()]]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeOwner($request);
        $data = $request->validate([
            'platform' => ['required', Rule::in(['android', 'ios'])], 'app_name' => ['required', 'string', 'max:30'],
            'bundle_id' => ['required', 'regex:/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/', 'max:180'],
            'icon_url' => ['nullable', 'url:http,https', 'max:2048'], 'splash_url' => ['nullable', 'url:http,https', 'max:2048'],
            'signing_secret_ref' => ['nullable', 'regex:/^(secret|file):\/\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/'],
            'store_credentials_ref' => ['nullable', 'regex:/^(secret|file):\/\/[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/'],
        ]);
        $secretPrefix = 'restaurant-'.$this->tenant->get()->public_id.'-';
        foreach (['signing_secret_ref', 'store_credentials_ref'] as $field) {
            if (!empty($data[$field]) && !str_starts_with(strstr($data[$field], '://') ?: '', '://'.$secretPrefix)) {
                throw ValidationException::withMessages([$field => ["The secret must use this restaurant's {$secretPrefix} namespace."]]);
            }
        }
        return $this->idempotency->run($request, 'owner.app_build.create', function () use ($request, $data): array {
            $build = AppBuild::query()->create(['restaurant_id' => $this->tenant->id(), 'platform' => $data['platform'],
                'status' => 'queued', 'configuration' => $data, 'requested_by' => $request->user()->getKey()]);
            $build->recordEvent('build.queued', 'Build request queued.', context: ['platform' => $data['platform']]);
            PrepareAppBuild::dispatch($build->getKey(), $this->tenant->id())->onQueue('builds');
            $this->audit($request, 'app_build.queued', $build);
            return [['data' => $this->data($build)], 202];
        });
    }

    public function cancel(Request $request, string $publicId): JsonResponse
    {
        $this->authorizeOwner($request);
        $build = AppBuild::query()->where('restaurant_id', $this->tenant->id())->where('public_id', $publicId)->firstOrFail();
        abort_unless(in_array($build->status, ['queued', 'preparing', 'configuration_ready', 'submitted', 'building'], true), 409, 'This build cannot be cancelled.');
        $build->update(['status' => 'cancelled', 'cancelled_at' => now()]);
        $build->recordEvent('build.cancelled', 'Build request cancelled by an owner.');
        $this->audit($request, 'app_build.cancelled', $build);
        return response()->json(['data' => $this->data($build)]);
    }

    public function retry(Request $request, string $publicId): JsonResponse
    {
        $this->authorizeOwner($request);
        $build = AppBuild::query()->where('restaurant_id', $this->tenant->id())->where('public_id', $publicId)->firstOrFail();
        abort_unless(in_array($build->status, ['failed', 'cancelled'], true), 409, 'Only failed or cancelled builds can be retried.');
        $build->update(['status' => 'queued', 'cancelled_at' => null, 'finished_at' => null, 'failure_message' => null]);
        $build->recordEvent('build.retried', 'Build request queued for another attempt.');
        PrepareAppBuild::dispatch($build->getKey(), $this->tenant->id())->onQueue('builds');
        $this->audit($request, 'app_build.retried', $build);
        return response()->json(['data' => $this->data($build)], 202);
    }

    public function download(Request $request, string $publicId, int $artifactId): StreamedResponse
    {
        $this->authorizeOwner($request);
        $build = AppBuild::query()->where('restaurant_id', $this->tenant->id())
            ->where('public_id', $publicId)->firstOrFail();
        $artifact = $build->artifacts()->where('restaurant_id', $this->tenant->id())
            ->whereKey($artifactId)->firstOrFail();
        abort_if($artifact->expires_at?->isPast(), 410, 'This build artifact has expired.');
        abort_unless(Storage::disk($artifact->disk)->exists($artifact->path), 404, 'Build artifact unavailable.');

        $this->audit($request, 'app_build.artifact_downloaded', $build);

        return Storage::disk($artifact->disk)->download(
            $artifact->path,
            'vondo-'.$build->platform.'-'.$build->public_id.'.'.$artifact->kind,
        );
    }

    private function authorizeOwner(Request $request): void
    {
        $this->access->authorize($request, 'builds.manage');
    }

    private function data(AppBuild $build): array
    {
        return ['id' => $build->public_id, 'platform' => $build->platform, 'status' => $build->status,
            'configuration' => $build->configuration, 'attempts' => $build->attempts, 'failure_message' => $build->failure_message,
            'events' => $build->events()->limit(50)->get()->map(fn($event) => [
                'level' => $event->level, 'event' => $event->event, 'message' => $event->message,
                'context' => $event->context, 'created_at' => $event->created_at?->toIso8601String(),
            ])->values(),
            'artifacts' => $build->artifacts()->get()->map(fn($artifact) => [
                'id' => $artifact->getKey(), 'kind' => $artifact->kind, 'size_bytes' => $artifact->size_bytes, 'sha256' => $artifact->sha256,
                'download_url' => route('owner.app-builds.artifacts.download', [$build->public_id, $artifact->getKey()]),
                'expires_at' => $artifact->expires_at?->toIso8601String(),
            ])->values(),
            'created_at' => $build->created_at?->toIso8601String(), 'finished_at' => $build->finished_at?->toIso8601String()];
    }

    private function audit(Request $request, string $action, AppBuild $build): void
    {
        PlatformAuditLog::query()->create(['restaurant_id' => $this->tenant->id(), 'actor_type' => 'owner', 'actor_id' => $request->user()->getKey(),
            'action' => $action, 'subject_type' => AppBuild::class, 'subject_id' => (string)$build->getKey(),
            'metadata' => ['build_id' => $build->public_id, 'platform' => $build->platform], 'ip_address' => $request->ip()]);
    }
}

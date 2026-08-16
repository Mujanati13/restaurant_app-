<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Branding\BrandConfiguration;
use App\Platform\Models\PlatformAuditLog;
use App\Platform\Models\RestaurantBrandRevision;
use App\Platform\Models\RestaurantMembership;
use App\Platform\Support\RestaurantAccess;
use App\Platform\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class OwnerBrandController extends Controller
{
    public function __construct(private readonly TenantContext $tenant, private readonly RestaurantAccess $access) {}

    public function show(): JsonResponse
    {
        $this->authorizeOwner(request());
        $revisions = $this->tenant->get()->brandRevisions()->latest('version')->limit(20)->get();
        return response()->json(['data' => $revisions->map(fn($revision) => $this->data($revision))->values()]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeOwner($request);
        $configuration = $request->validate(BrandConfiguration::rules());
        $restaurant = $this->tenant->get();
        $revision = DB::transaction(function () use ($restaurant, $configuration, $request) {
            $version = (int)$restaurant->brandRevisions()->lockForUpdate()->max('version') + 1;
            return $restaurant->brandRevisions()->create([
                'version' => $version, 'configuration' => $configuration, 'created_by' => $request->user()->getKey(),
            ]);
        });
        $this->audit($request, 'brand.draft_created', $revision);
        return response()->json(['data' => $this->data($revision)], 201);
    }

    public function publish(Request $request, int $revisionId): JsonResponse
    {
        $this->authorizeOwner($request);
        $revision = $this->tenant->get()->brandRevisions()->findOrFail($revisionId);
        $revision->forceFill(['published_at' => now()])->save();
        $this->audit($request, 'brand.published', $revision);
        return response()->json(['data' => $this->data($revision)]);
    }

    public function rollback(Request $request, int $revisionId): JsonResponse
    {
        $this->authorizeOwner($request);
        $source = $this->tenant->get()->brandRevisions()->findOrFail($revisionId);
        $revision = DB::transaction(function () use ($request, $source) {
            $restaurant = $this->tenant->get();
            $version = (int)$restaurant->brandRevisions()->lockForUpdate()->max('version') + 1;
            return $restaurant->brandRevisions()->create([
                'version' => $version, 'configuration' => $source->configuration,
                'created_by' => $request->user()->getKey(), 'published_at' => now(),
            ]);
        });
        $this->audit($request, 'brand.rolled_back', $revision);
        return response()->json(['data' => $this->data($revision)], 201);
    }

    private function data(RestaurantBrandRevision $revision): array
    {
        return ['id' => $revision->getKey(), 'version' => $revision->version, 'configuration' => $revision->configuration,
            'published_at' => $revision->published_at?->toIso8601String(), 'created_at' => $revision->created_at?->toIso8601String()];
    }

    private function authorizeOwner(Request $request): void
    {
        $this->access->authorize($request, 'branding.manage');
    }

    private function audit(Request $request, string $action, RestaurantBrandRevision $revision): void
    {
        PlatformAuditLog::query()->create([
            'restaurant_id' => $this->tenant->id(), 'actor_type' => 'owner', 'actor_id' => $request->user()->getKey(),
            'action' => $action, 'subject_type' => RestaurantBrandRevision::class, 'subject_id' => (string)$revision->getKey(),
            'metadata' => ['version' => $revision->version], 'ip_address' => $request->ip(),
        ]);
    }
}

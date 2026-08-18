<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\PlatformAuditLog;
use App\Platform\Models\PlatformMediaAsset;
use App\Platform\Models\RestaurantDomain;
use App\Platform\Models\RestaurantMembership;
use App\Platform\Models\RestaurantSetting;
use App\Platform\Domains\DomainVerifier;
use App\Jobs\ProvisionDomainTls;
use App\Platform\Support\RestaurantAccess;
use App\Platform\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OwnerRestaurantController extends Controller
{
    public function __construct(private readonly TenantContext $tenant, private readonly RestaurantAccess $access) {}

    public function show(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'dashboard.view');
        $restaurant = $this->tenant->get();
        $settings = $restaurant->settings()->get()->mapWithKeys(fn(RestaurantSetting $s) => [$s->key => $s->value]);

        return response()->json(['data' => [
            'id' => $restaurant->public_id, 'name' => $restaurant->name, 'slug' => $restaurant->slug,
            'status' => $restaurant->status, 'timezone' => $restaurant->timezone, 'currency_code' => $restaurant->currency_code,
            'settings' => $settings,
            'domains' => $restaurant->domains()->orderByDesc('is_primary')->get()->map(fn($domain) => $this->domainData($domain))->values(),
            'members' => $restaurant->memberships()->orderBy('role')->get()->map(fn($member) => [
                'id' => $member->getKey(), 'user_id' => $member->user_id, 'role' => $member->role, 'status' => $member->status,
                'location_ids' => $member->location_ids ?? [],
            ])->values(),
            'features' => $restaurant->features()->orderBy('feature')->get()->map(fn($feature) => [
                'key' => $feature->feature, 'enabled' => $feature->enabled, 'limits' => $feature->limits,
            ])->values(),
        ]]);
    }

    public function update(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'settings.manage');
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:80'],
            'timezone' => ['sometimes', 'required', 'timezone'],
            'currency_code' => ['sometimes', 'required', 'string', 'size:3'],
            'settings' => ['sometimes', 'array'],
        ]);

        $restaurant = $this->tenant->get();
        $baseUpdates = array_intersect_key($data, array_flip(['name', 'timezone']));
        if (isset($data['currency_code'])) {
            $baseUpdates['currency_code'] = strtoupper($data['currency_code']);
        }
        if (!empty($baseUpdates)) {
            $restaurant->update($baseUpdates);
        }

        if (isset($data['settings']) && is_array($data['settings'])) {
            foreach ($data['settings'] as $key => $val) {
                RestaurantSetting::query()->updateOrCreate(
                    ['restaurant_id' => $restaurant->getKey(), 'key' => $key],
                    ['value' => $val]
                );
            }
        }

        $this->audit($request, 'restaurant.settings_updated', ['fields' => array_keys($data)]);
        return $this->show($request);
    }

    public function addDomain(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'settings.manage');
        $data = $request->validate(['host' => ['required', 'string', 'max:253', 'regex:/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i', Rule::unique('restaurant_domains', 'host')]]);
        $domain = $this->tenant->get()->domains()->create([
            'host' => strtolower($data['host']), 'is_primary' => false, 'verification_token' => Str::random(48),
        ]);
        $this->audit($request, 'restaurant.domain_added', ['host' => $domain->host]);
        return response()->json(['data' => $this->domainData($domain)], 201);
    }

    public function deleteDomain(Request $request, int $domainId): JsonResponse
    {
        $this->authorizeOwner($request, 'settings.manage');
        $domain = $this->tenant->get()->domains()->findOrFail($domainId);
        abort_if($domain->is_primary, 409, 'The primary restaurant domain cannot be removed.');
        $host = $domain->host;
        $domain->delete();
        $this->audit($request, 'restaurant.domain_removed', ['host' => $host]);
        return response()->json([], 204);
    }

    public function verifyDomain(Request $request, int $domainId, DomainVerifier $verifier): JsonResponse
    {
        $this->authorizeOwner($request, 'settings.manage');
        $domain = $this->tenant->get()->domains()->findOrFail($domainId);
        abort_if($domain->is_primary, 409, 'The platform subdomain is already trusted.');
        $verified = $verifier->verify($domain);
        $this->audit($request, 'restaurant.domain_verification_checked', ['host' => $domain->host, 'verified' => $verified]);
        if (!$verified) return response()->json(['message' => $domain->verification_error, 'data' => $this->domainData($domain)], 422);
        $domain->forceFill(['tls_status' => 'queued'])->save();
        ProvisionDomainTls::dispatch($domain->getKey(), $this->tenant->id())->onQueue('default');
        return response()->json(['data' => $this->domainData($domain->fresh())], 202);
    }

    public function uploadMedia(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'branding.manage');
        $data = $request->validate(['image' => ['required', 'file', 'image', 'mimes:jpeg,png,webp', 'max:2048']]);
        $file = $data['image'];
        $disk = (string) config('vondo.media_disk');
        $path = $file->storeAs(
            'restaurants/'.$this->tenant->get()->public_id.'/branding',
            Str::uuid().'.'.$file->extension(),
            $disk,
        );

        try {
            $asset = PlatformMediaAsset::query()->create([
                'restaurant_id' => $this->tenant->id(), 'kind' => 'branding', 'disk' => $disk, 'path' => $path,
                'mime_type' => $file->getMimeType(), 'size_bytes' => $file->getSize(), 'visibility' => 'storefront',
                'created_by' => $request->user()->getKey(),
            ]);
        } catch (\Throwable $exception) {
            Storage::disk($disk)->delete($path);
            throw $exception;
        }

        $this->audit($request, 'restaurant.media_uploaded', ['asset_id' => $asset->public_id]);
        return response()->json(['data' => $this->mediaData($asset)], 201);
    }

    public function media(Request $request): JsonResponse
    {
        $this->authorizeOwner($request, 'branding.manage');
        $assets = PlatformMediaAsset::query()->where('restaurant_id', $this->tenant->id())
            ->latest()->limit(100)->get();

        return response()->json(['data' => $assets->map(fn(PlatformMediaAsset $asset) => $this->mediaData($asset))->values()]);
    }

    public function deleteMedia(Request $request, string $publicId): JsonResponse
    {
        $this->authorizeOwner($request, 'branding.manage');
        $asset = PlatformMediaAsset::query()->where('restaurant_id', $this->tenant->id())
            ->where('public_id', $publicId)->firstOrFail();
        Storage::disk($asset->disk)->delete($asset->path);
        $asset->delete();
        $this->audit($request, 'restaurant.media_deleted', ['asset_id' => $publicId]);

        return response()->json([], 204);
    }

    private function authorizeOwner(Request $request, string $permission): void
    {
        $this->access->authorize($request, $permission);
    }

    private function domainData(RestaurantDomain $domain): array
    {
        return ['id' => $domain->getKey(), 'host' => $domain->host, 'is_primary' => $domain->is_primary,
            'verified_at' => $domain->verified_at?->toIso8601String(),
            'verification_checked_at' => $domain->verification_checked_at?->toIso8601String(), 'verification_error' => $domain->verification_error,
            'tls' => ['status' => $domain->tls_status, 'provider' => $domain->tls_provider,
                'provisioned_at' => $domain->tls_provisioned_at?->toIso8601String(),
                'certificate_expires_at' => $domain->certificate_expires_at?->toIso8601String(), 'error' => $domain->tls_error],
            'verification' => $domain->verified_at ? null : ['type' => 'dns_txt', 'name' => '_vondo.'.$domain->host, 'value' => 'vondo-verification='.$domain->verification_token]];
    }

    private function mediaData(PlatformMediaAsset $asset): array
    {
        return [
            'id' => $asset->public_id, 'kind' => $asset->kind, 'mime_type' => $asset->mime_type,
            'size_bytes' => $asset->size_bytes,
            'url' => url('/api/v1/storefront/media/'.$asset->public_id),
            'created_at' => $asset->created_at?->toIso8601String(),
        ];
    }

    private function audit(Request $request, string $action, array $metadata): void
    {
        PlatformAuditLog::query()->create(['restaurant_id' => $this->tenant->id(), 'actor_type' => 'owner',
            'actor_id' => $request->user()->getKey(), 'action' => $action, 'subject_type' => 'restaurant',
            'subject_id' => (string)$this->tenant->id(), 'metadata' => $metadata, 'ip_address' => $request->ip()]);
    }
}

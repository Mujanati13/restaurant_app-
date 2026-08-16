<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\PlatformMediaAsset;
use App\Platform\Tenancy\TenantContext;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TenantMediaController extends Controller
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function show(string $publicId): StreamedResponse
    {
        $asset = PlatformMediaAsset::query()
            ->where('restaurant_id', $this->tenant->id())
            ->where('visibility', 'storefront')
            ->where('public_id', $publicId)
            ->firstOrFail();

        abort_unless(Storage::disk($asset->disk)->exists($asset->path), 404);

        return Storage::disk($asset->disk)->response($asset->path, null, [
            'Content-Type' => $asset->mime_type,
            'Cache-Control' => 'public, max-age=86400, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}

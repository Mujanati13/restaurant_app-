<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\RestaurantPage;
use App\Platform\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class StorefrontPageController extends Controller
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function show(string $slug): JsonResponse
    {
        $page = RestaurantPage::query()->with(['sections' => fn($query) => $query->where('visible', true)])
            ->where('restaurant_id', $this->tenant->id())->where('slug', $slug)->firstOrFail();

        return response()->json(['data' => [
            'slug' => $page->slug, 'title' => $page->title, 'is_home' => $page->is_home,
            'sections' => $page->sections->map(fn($section) => [
                'id' => $section->stable_id, 'type' => $section->type,
                'position' => $section->position, 'content' => $section->content ?? [],
            ])->values(),
        ]]);
    }
}

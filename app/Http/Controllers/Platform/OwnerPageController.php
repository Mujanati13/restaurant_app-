<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\PlatformAuditLog;
use App\Platform\Models\RestaurantMembership;
use App\Platform\Models\RestaurantPage;
use App\Platform\Support\RestaurantAccess;
use App\Platform\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OwnerPageController extends Controller
{
    private const SECTION_TYPES = [
        'hero', 'featured_dishes', 'categories', 'promotions', 'about', 'locations',
        'reservation_cta', 'reviews', 'gallery', 'contact', 'newsletter', 'custom_text',
    ];

    public function __construct(private readonly TenantContext $tenant, private readonly RestaurantAccess $access) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeOwner($request);
        $pages = $this->tenant->get()->pages()->with('sections')->orderByDesc('is_home')->orderBy('title')->get();

        return response()->json(['data' => $pages->map(fn(RestaurantPage $page) => $this->data($page))->values()]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizeOwner($request);
        $data = $request->validate($this->pageRules());
        $page = DB::transaction(function () use ($data): RestaurantPage {
            if ($data['is_home'] ?? false) {
                $this->tenant->get()->pages()->update(['is_home' => false]);
            }

            return $this->tenant->get()->pages()->create($data);
        });
        $this->audit($request, 'page.created', $page);

        return response()->json(['data' => $this->data($page->load('sections'))], 201);
    }

    public function show(Request $request, int $pageId): JsonResponse
    {
        $this->authorizeOwner($request);
        $page = $this->tenant->get()->pages()->with('sections')->findOrFail($pageId);

        return response()->json(['data' => $this->data($page)]);
    }

    public function update(Request $request, int $pageId): JsonResponse
    {
        $this->authorizeOwner($request);
        $page = $this->tenant->get()->pages()->findOrFail($pageId);
        $data = $request->validate($this->pageRules($page));
        DB::transaction(function () use ($data, $page): void {
            if ($data['is_home'] ?? false) {
                $this->tenant->get()->pages()->where('id', '<>', $page->getKey())->update(['is_home' => false]);
            }
            $page->update($data);
        });
        $this->audit($request, 'page.updated', $page);

        return response()->json(['data' => $this->data($page->fresh('sections'))]);
    }

    public function replaceSections(Request $request, int $pageId): JsonResponse
    {
        $this->authorizeOwner($request);
        $page = $this->tenant->get()->pages()->findOrFail($pageId);
        $data = $request->validate([
            'sections' => ['present', 'array', 'max:30'],
            'sections.*.id' => ['required', 'alpha_dash', 'max:80', 'distinct'],
            'sections.*.type' => ['required', Rule::in(self::SECTION_TYPES)],
            'sections.*.position' => ['required', 'integer', 'between:0,1000'],
            'sections.*.visible' => ['required', 'boolean'],
            'sections.*.content' => ['nullable', 'array'],
        ]);

        DB::transaction(function () use ($page, $data): void {
            $page->sections()->delete();
            $page->sections()->createMany(collect($data['sections'])->map(fn(array $section) => [
                'stable_id' => $section['id'], 'type' => $section['type'],
                'position' => $section['position'], 'visible' => $section['visible'],
                'content' => $section['content'] ?? [],
            ])->all());
        });
        $this->audit($request, 'page.sections_replaced', $page, ['count' => count($data['sections'])]);

        return response()->json(['data' => $this->data($page->fresh('sections'))]);
    }

    public function destroy(Request $request, int $pageId): JsonResponse
    {
        $this->authorizeOwner($request);
        $page = $this->tenant->get()->pages()->findOrFail($pageId);
        abort_if($page->is_home, 409, 'The home page cannot be removed. Assign another home page first.');
        $this->audit($request, 'page.deleted', $page);
        $page->delete();

        return response()->json([], 204);
    }

    private function pageRules(?RestaurantPage $page = null): array
    {
        return [
            'slug' => ['required', 'alpha_dash', 'max:100', Rule::unique('restaurant_pages', 'slug')
                ->where('restaurant_id', $this->tenant->id())->ignore($page?->getKey())],
            'title' => ['required', 'string', 'max:160'],
            'is_home' => ['required', 'boolean'],
        ];
    }

    private function data(RestaurantPage $page): array
    {
        return [
            'id' => $page->getKey(), 'slug' => $page->slug, 'title' => $page->title, 'is_home' => $page->is_home,
            'sections' => $page->sections->map(fn($section) => [
                'id' => $section->stable_id, 'type' => $section->type, 'position' => $section->position,
                'visible' => $section->visible, 'content' => $section->content ?? [],
            ])->values(),
        ];
    }

    private function authorizeOwner(Request $request): void
    {
        $this->access->authorize($request, 'branding.manage');
    }

    private function audit(Request $request, string $action, RestaurantPage $page, array $metadata = []): void
    {
        PlatformAuditLog::query()->create([
            'restaurant_id' => $this->tenant->id(), 'actor_type' => 'owner', 'actor_id' => $request->user()->getKey(),
            'action' => $action, 'subject_type' => RestaurantPage::class, 'subject_id' => (string) $page->getKey(),
            'metadata' => ['slug' => $page->slug, ...$metadata], 'ip_address' => $request->ip(),
        ]);
    }
}

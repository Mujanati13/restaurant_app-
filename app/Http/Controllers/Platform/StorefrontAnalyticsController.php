<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Models\StorefrontAnalyticsEvent;
use App\Platform\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class StorefrontAnalyticsController extends Controller
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'session_id' => ['required', 'uuid'],
            'event' => ['required', Rule::in(['page_view', 'menu_view', 'add_to_cart', 'checkout_started', 'order_completed', 'reservation_completed'])],
            'path' => ['nullable', 'string', 'max:200'],
            'properties' => ['nullable', 'array', 'max:12'],
            'properties.*' => ['nullable'],
        ]);
        $properties = collect($data['properties'] ?? [])->map(function (mixed $value): mixed {
            if (is_string($value)) return mb_substr($value, 0, 200);
            if (is_int($value) || is_float($value) || is_bool($value) || is_null($value)) return $value;
            return null;
        })->all();
        StorefrontAnalyticsEvent::query()->create([
            'restaurant_id' => $this->tenant->id(), 'session_id' => $data['session_id'],
            'event' => $data['event'], 'path' => $data['path'] ?? null,
            'properties' => $properties, 'occurred_at' => now(), 'created_at' => now(),
        ]);

        return response()->json([], 202);
    }
}

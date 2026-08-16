<?php

namespace App\Http\Controllers;

use App\Platform\Tenancy\TenantContext;
use Igniter\Reservation\Models\DiningTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class StorefrontTableAvailabilityController extends Controller
{
    public function __construct(private readonly TenantContext $tenant) {}
    /**
     * Return tables that can accommodate a party at a specific location and time.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'location_id' => ['required', 'integer', Rule::exists('locations', 'location_id')->where('restaurant_id', $this->tenant->id())],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'guest_num' => ['required', 'integer', 'min:1', 'max:100'],
            'duration' => ['sometimes', 'integer', 'min:15', 'max:480'],
        ]);

        $dateTime = Carbon::createFromFormat('Y-m-d H:i', $data['date'].' '.$data['time']);
        $tables = DiningTable::query()
            ->reservable([
                'locationId' => $data['location_id'],
                'dateTime' => $dateTime,
                'guestNum' => $data['guest_num'],
                'duration' => $data['duration'] ?? 90,
            ])
            ->get(['dining_tables.id', 'dining_tables.name', 'dining_tables.min_capacity', 'dining_tables.max_capacity']);

        return response()->json([
            'data' => $tables->map(fn(DiningTable $table): array => [
                'id' => $table->getKey(),
                'name' => $table->name,
                'min_capacity' => $table->min_capacity,
                'max_capacity' => $table->max_capacity,
            ])->values(),
        ]);
    }
}

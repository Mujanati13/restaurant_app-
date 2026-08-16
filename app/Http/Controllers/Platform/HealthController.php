<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Monitoring\PlatformHealth;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class HealthController extends Controller
{
    public function live(): JsonResponse
    {
        return response()->json(['status' => 'ok', 'service' => 'vondo-api']);
    }

    public function ready(PlatformHealth $health): JsonResponse
    {
        $snapshot = $health->snapshot(false, false);
        return response()->json(['status' => $snapshot['status'], 'checked_at' => $snapshot['checked_at']], $snapshot['status'] === 'healthy' ? 200 : 503);
    }
}

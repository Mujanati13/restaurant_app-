<?php

namespace App\Platform\Support;

use App\Platform\Models\PlatformIdempotencyKey;
use App\Platform\Tenancy\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class IdempotentRequest
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function run(Request $request, string $operation, callable $callback): JsonResponse
    {
        $key = trim((string)$request->header('Idempotency-Key'));
        abort_unless((bool)preg_match('/^[A-Za-z0-9._:-]{8,128}$/', $key), 422, 'A valid Idempotency-Key header is required.');
        $hash = hash('sha256', json_encode($request->all(), JSON_THROW_ON_ERROR));

        return DB::transaction(function () use ($request, $operation, $callback, $key, $hash): JsonResponse {
            $stored = PlatformIdempotencyKey::query()
                ->where('restaurant_id', $this->tenant->id())->where('operation', $operation)
                ->where('idempotency_key', $key)->lockForUpdate()->first();
            if ($stored) {
                abort_unless(hash_equals($stored->request_hash, $hash), 409, 'This idempotency key was already used with a different request.');
                return response()->json($stored->response_body, $stored->response_status, ['Idempotent-Replay' => 'true']);
            }

            [$body, $status] = $callback();
            PlatformIdempotencyKey::query()->create([
                'restaurant_id' => $this->tenant->id(), 'operation' => $operation, 'idempotency_key' => $key,
                'request_hash' => $hash, 'response_status' => $status, 'response_body' => $body, 'expires_at' => now()->addDay(),
            ]);
            return response()->json($body, $status);
        }, 3);
    }
}

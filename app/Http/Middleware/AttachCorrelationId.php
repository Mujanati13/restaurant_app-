<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AttachCorrelationId
{
    public function handle(Request $request, Closure $next)
    {
        $provided = trim((string)$request->header('X-Request-ID'));
        $correlationId = preg_match('/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/', $provided)
            ? $provided
            : (string)Str::uuid();

        $request->attributes->set('correlation_id', $correlationId);
        Log::withContext(['correlation_id' => $correlationId]);

        $response = $next($request);
        $response->headers->set('X-Request-ID', $correlationId);

        return $response;
    }
}

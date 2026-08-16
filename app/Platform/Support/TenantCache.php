<?php

namespace App\Platform\Support;

use App\Platform\Tenancy\TenantContext;
use Closure;
use Illuminate\Support\Facades\Cache;

class TenantCache
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function key(string $namespace, string|int ...$parts): string
    {
        $suffix = collect($parts)->map(fn($part) => rawurlencode((string)$part))->implode(':');

        return 'vondo:restaurant:'.$this->tenant->id().':'.$namespace.($suffix === '' ? '' : ':'.$suffix);
    }

    public function remember(string $namespace, int $seconds, Closure $callback, string|int ...$parts): mixed
    {
        return Cache::remember($this->key($namespace, ...$parts), $seconds, $callback);
    }

    public function forget(string $namespace, string|int ...$parts): bool
    {
        return Cache::forget($this->key($namespace, ...$parts));
    }
}

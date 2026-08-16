<?php

namespace App\Platform\Monitoring;

use App\Platform\Models\AppBuild;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Throwable;

class PlatformHealth
{
    public function snapshot(bool $probeStorefront = true, bool $probeApi = true): array
    {
        $checks = [];
        $checks['database'] = $this->probe(fn() => DB::selectOne('SELECT 1') !== null);
        $checks['cache'] = $this->probe(function (): bool { $key = 'vondo:health:'.bin2hex(random_bytes(6)); Cache::put($key, 'ok', 10); return Cache::pull($key) === 'ok'; });
        foreach (collect([(string) config('vondo.media_disk'), (string) config('vondo.build_disk')])->filter()->unique() as $diskName) {
            $checks['object_storage_'.$diskName] = $this->probe(fn(): bool => $this->probeDisk($diskName));
        }
        $failedJobs = DB::table('failed_jobs')->where('failed_at', '>=', now()->subHour())->count();
        $lastHeartbeat = (int) Cache::get('vondo:health:queue-worker', 0);
        $heartbeatAge = $lastHeartbeat ? now()->timestamp - $lastHeartbeat : null;
        $checks['queue'] = ['ok' => $failedJobs === 0 && $heartbeatAge !== null && $heartbeatAge <= (int) config('vondo.monitoring.queue_heartbeat_seconds', 300),
            'failed_last_hour' => $failedJobs, 'heartbeat_age_seconds' => $heartbeatAge];
        $checks['builds'] = ['ok' => !AppBuild::query()->whereIn('status', ['queued', 'preparing', 'submitted', 'building'])->where('updated_at', '<', now()->subMinutes(30))->exists(),
            'stalled' => AppBuild::query()->whereIn('status', ['queued', 'preparing', 'submitted', 'building'])->where('updated_at', '<', now()->subMinutes(30))->count()];
        $probeTimeout = max(1, (int) config('vondo.monitoring.probe_timeout_seconds', 30));
        if ($probeApi) $checks['api'] = $this->probe(fn() => Http::timeout($probeTimeout)->get((string) config('vondo.monitoring.api_url'))->successful());
        if ($probeStorefront) $checks['storefront'] = $this->probe(fn() => Http::timeout($probeTimeout)->get((string) config('vondo.monitoring.storefront_url'))->successful());
        return ['status' => collect($checks)->every(fn($check) => $check['ok']) ? 'healthy' : 'degraded', 'checked_at' => now()->toIso8601String(), 'checks' => $checks];
    }

    private function probeDisk(string $name): bool
    {
        $disk = Storage::disk($name);
        $key = '.health/'.bin2hex(random_bytes(6));
        $disk->put($key, 'ok');
        try { return $disk->get($key) === 'ok'; }
        finally { $disk->delete($key); }
    }

    private function probe(callable $callback): array
    {
        $started = microtime(true);
        try { $ok = (bool) $callback(); return ['ok' => $ok, 'latency_ms' => round((microtime(true) - $started) * 1000, 1)]; }
        catch (Throwable $exception) { return ['ok' => false, 'latency_ms' => round((microtime(true) - $started) * 1000, 1), 'error' => class_basename($exception)]; }
    }
}

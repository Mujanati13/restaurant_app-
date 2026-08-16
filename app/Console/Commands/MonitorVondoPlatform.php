<?php

namespace App\Console\Commands;

use App\Platform\Models\PlatformAlert;
use App\Platform\Models\RestaurantDomain;
use App\Platform\Models\RestaurantSubscription;
use App\Platform\Monitoring\PlatformHealth;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MonitorVondoPlatform extends Command
{
    protected $signature = 'vondo:monitor {--no-storefront}';
    protected $description = 'Probe platform dependencies and reconcile actionable operational alerts';

    public function handle(PlatformHealth $health): int
    {
        $active = [];
        $snapshot = $health->snapshot(!$this->option('no-storefront'));
        foreach ($snapshot['checks'] as $name => $check) {
            if ($check['ok']) continue;
            $this->raise($active, null, 'health.'.$name, 'critical', ucfirst(str_replace('_', ' ', $name)).' health check failed.', $check);
        }
        foreach (RestaurantDomain::query()->where(fn($q) => $q->where('tls_status', 'failed')->orWhere(function ($inner) {
            $inner->whereNull('verified_at')->where('created_at', '<', now()->subDay());
        }))->get() as $domain) {
            $this->raise($active, $domain->restaurant_id, 'domain.error.'.$domain->getKey(), 'warning', 'Domain '.$domain->host.' needs attention.',
                ['host' => $domain->host, 'tls_status' => $domain->tls_status, 'error' => $domain->tls_error ?: $domain->verification_error]);
        }
        foreach (RestaurantSubscription::query()->where('status', 'past_due')->get() as $subscription) {
            $this->raise($active, $subscription->restaurant_id, 'payment.past_due', 'warning', 'Restaurant subscription payment is past due.', ['subscription_id' => $subscription->getKey()]);
        }
        $failed = DB::table('failed_jobs')->where('failed_at', '>=', now()->subHour())->count();
        if ($failed) $this->raise($active, null, 'queue.failed_jobs', 'critical', $failed.' queue job(s) failed in the last hour.', ['count' => $failed]);

        PlatformAlert::query()->whereIn('status', ['open', 'acknowledged'])->whereNotIn('fingerprint', $active)
            ->update(['status' => 'resolved', 'resolved_at' => now()]);
        $this->info(count($active).' active alert fingerprint(s); platform '.$snapshot['status'].'.');
        return $snapshot['status'] === 'healthy' ? self::SUCCESS : self::FAILURE;
    }

    private function raise(array &$active, ?int $restaurantId, string $key, string $severity, string $message, array $context): void
    {
        $fingerprint = hash('sha256', ($restaurantId ?: 'platform').':'.$key);
        $active[] = $fingerprint;
        $alert = PlatformAlert::query()->firstOrNew(['fingerprint' => $fingerprint]);
        if (!$alert->exists) $alert->first_seen_at = now();
        $alert->fill(['restaurant_id' => $restaurantId, 'type' => str($key)->beforeLast('.')->toString(), 'severity' => $severity,
            'status' => $alert->status === 'acknowledged' ? 'acknowledged' : 'open', 'message' => $message, 'context' => $context,
            'last_seen_at' => now(), 'resolved_at' => null])->save();
    }
}

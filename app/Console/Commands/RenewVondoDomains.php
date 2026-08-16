<?php

namespace App\Console\Commands;

use App\Jobs\ProvisionDomainTls;
use App\Platform\Models\RestaurantDomain;
use Illuminate\Console\Command;

class RenewVondoDomains extends Command
{
    protected $signature = 'vondo:renew-domain-tls';
    protected $description = 'Queue TLS provisioning for verified custom domains that are pending or nearing expiry';

    public function handle(): int
    {
        $queued = 0;
        RestaurantDomain::query()->where('is_primary', false)->whereNotNull('verified_at')
            ->whereNotIn('tls_status', ['queued', 'provisioning'])
            ->where(function ($query): void {
                $query->whereNull('tls_provisioned_at')
                    ->orWhere('certificate_expires_at', '<=', now()->addDays(14))
                    ->orWhere(function ($inner): void {
                        $inner->where('tls_status', 'failed')->where('updated_at', '<=', now()->subHour());
                    });
            })->chunkById(100, function ($domains) use (&$queued): void {
                foreach ($domains as $domain) {
                    $domain->forceFill(['tls_status' => 'queued', 'tls_error' => null])->save();
                    ProvisionDomainTls::dispatch($domain->getKey(), $domain->restaurant_id)->onQueue('default');
                    $queued++;
                }
            });
        $this->info("Queued {$queued} custom domain TLS operation(s).");
        return self::SUCCESS;
    }
}

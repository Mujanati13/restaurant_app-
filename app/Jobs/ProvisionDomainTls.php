<?php

namespace App\Jobs;

use App\Platform\Domains\TlsProvisioner;
use App\Platform\Models\RestaurantDomain;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

class ProvisionDomainTls implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public int $tries = 3;

    public function __construct(public readonly int $domainId, public readonly int $restaurantId) {}

    public function handle(TlsProvisioner $provisioner): void
    {
        $domain = RestaurantDomain::query()->with('restaurant')->where('restaurant_id', $this->restaurantId)->findOrFail($this->domainId);
        $domain->forceFill(['tls_status' => 'provisioning', 'tls_error' => null])->save();
        $provisioner->provision($domain);
    }

    public function failed(Throwable $exception): void
    {
        RestaurantDomain::query()->where('restaurant_id', $this->restaurantId)->whereKey($this->domainId)
            ->update(['tls_status' => 'failed', 'tls_error' => str($exception->getMessage())->limit(500)]);
    }
}

<?php

namespace App\Platform\Domains;

use App\Platform\Models\RestaurantDomain;
use App\Platform\Secrets\SecretResolver;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class TlsProvisioner
{
    public function __construct(private readonly SecretResolver $secrets) {}

    public function provision(RestaurantDomain $domain): void
    {
        if (!$domain->verified_at) throw new RuntimeException('Domain ownership must be verified before TLS provisioning.');
        $url = rtrim((string) config('vondo.tls.provider_url'), '/');
        if ($url === '') throw new RuntimeException('The TLS automation provider is not configured.');
        $secret = $this->secrets->resolve((string) config('vondo.tls.secret_ref'));
        $payload = json_encode(['host' => $domain->host, 'restaurant_id' => $domain->restaurant->public_id], JSON_THROW_ON_ERROR);
        $timestamp = (string) now()->timestamp;
        $response = Http::acceptJson()->withHeaders([
            'X-Vondo-Timestamp' => $timestamp,
            'X-Vondo-Signature' => 'sha256='.hash_hmac('sha256', $timestamp.'.'.$payload, $secret),
        ])->withBody($payload, 'application/json')->timeout(15)->retry(2, 250, throw: false)->post($url.'/v1/domains');
        if (!$response->successful()) throw new RuntimeException('TLS provider rejected the domain with status '.$response->status().'.');
        $expiresAt = $response->json('certificate_expires_at');
        $domain->forceFill(['tls_status' => 'active', 'tls_provider' => $response->json('provider', 'external'),
            'tls_provisioned_at' => now(), 'certificate_expires_at' => $expiresAt, 'tls_error' => null])->save();
    }
}

<?php

namespace App\Platform\Domains;

use App\Platform\Models\RestaurantDomain;
use Illuminate\Support\Facades\Http;

class DomainVerifier
{
    public function verify(RestaurantDomain $domain): bool
    {
        $expected = 'vondo-verification='.$domain->verification_token;
        $dnsValid = collect(dns_get_record('_vondo.'.$domain->host, DNS_TXT) ?: [])
            ->contains(fn(array $record) => hash_equals($expected, (string) ($record['txt'] ?? '')));
        $httpValid = false;
        if (!$dnsValid && (app()->environment('testing') || $this->isPublicHost($domain->host))) {
            $response = Http::timeout(5)->retry(1, 100, throw: false)
                ->get('http://'.$domain->host.'/.well-known/vondo-domain-verification');
            $httpValid = $response->successful() && hash_equals($expected, trim($response->body()));
        }

        $verified = $dnsValid || $httpValid;
        $domain->forceFill([
            'verification_checked_at' => now(),
            'verified_at' => $verified ? ($domain->verified_at ?? now()) : null,
            'verification_error' => $verified ? null : 'Expected DNS TXT or HTTP verification token was not found.',
        ])->save();
        return $verified;
    }

    private function isPublicHost(string $host): bool
    {
        $addresses = gethostbynamel($host) ?: [];
        foreach (dns_get_record($host, DNS_AAAA) ?: [] as $record) {
            if (isset($record['ipv6'])) $addresses[] = $record['ipv6'];
        }
        if ($addresses === []) return false;
        return collect($addresses)->every(fn(string $address) => filter_var($address, FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false);
    }
}

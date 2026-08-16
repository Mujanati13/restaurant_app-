<?php

namespace App\Platform\Builds;

use App\Platform\Models\AppBuild;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use App\Platform\Secrets\SecretResolver;

class ExternalBuildCompiler
{
    public function __construct(private readonly SecretResolver $secrets) {}

    public function configured(): bool
    {
        return filled(config('vondo.build_compiler.url')) && filled(config('vondo.build_compiler.secret_ref'));
    }

    public function submit(AppBuild $build, string $manifestPath, string $manifestSha256): string
    {
        if (!$this->configured()) {
            throw new RuntimeException('The external build compiler is not configured.');
        }

        $payload = json_encode([
            'schema' => 1,
            'job' => [
                'build_id' => $build->public_id,
                'restaurant_id' => $build->restaurant->public_id,
                'platform' => $build->platform,
            ],
            'manifest' => [
                'disk' => config('vondo.build_disk', 'local'),
                'path' => $manifestPath,
                'sha256' => $manifestSha256,
            ],
            'callback_url' => config('vondo.build_compiler.callback_url'),
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
        $timestamp = (string) now()->timestamp;
        $signature = hash_hmac('sha256', $timestamp.'.'.$payload, $this->secret());

        $response = $this->client()
            ->withHeaders([
                'X-Vondo-Timestamp' => $timestamp,
                'X-Vondo-Signature' => 'sha256='.$signature,
            ])
            ->withBody($payload, 'application/json')
            ->post((string) config('vondo.build_compiler.url'));

        if (!$response->successful()) {
            throw new RuntimeException('The external compiler rejected the build request with status '.$response->status().'.');
        }
        $jobId = $response->json('job_id');
        if (!is_string($jobId) || !preg_match('/^[A-Za-z0-9._:-]{1,190}$/', $jobId)) {
            throw new RuntimeException('The external compiler returned an invalid job identifier.');
        }

        return $jobId;
    }

    public function validCallbackSignature(string $body, ?string $timestamp, ?string $signature): bool
    {
        $secret = $this->secret(false);
        if ($secret === '' || !ctype_digit((string) $timestamp) || blank($signature)) {
            return false;
        }
        if (abs(now()->timestamp - (int) $timestamp) > max(30, (int) config('vondo.build_compiler.callback_tolerance_seconds', 300))) {
            return false;
        }

        $expected = 'sha256='.hash_hmac('sha256', $timestamp.'.'.$body, $secret);

        return hash_equals($expected, (string) $signature);
    }

    private function client(): PendingRequest
    {
        return Http::acceptJson()
            ->timeout(max(5, (int) config('vondo.build_compiler.timeout_seconds', 30)))
            ->retry(2, 250, throw: false);
    }

    private function secret(bool $required = true): string
    {
        $reference = (string) config('vondo.build_compiler.secret_ref');
        return (string) $this->secrets->resolve($reference, $required);
    }
}

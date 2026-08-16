<?php

namespace App\Platform\Secrets;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class SecretResolver
{
    public function resolve(?string $reference, bool $required = true): ?string
    {
        $reference = trim((string) $reference);
        if ($reference === '') {
            if ($required) throw new RuntimeException('A secret reference is required.');
            return null;
        }

        if (str_starts_with($reference, 'secret://')) {
            return $this->fromProvider(substr($reference, 9));
        }
        if (str_starts_with($reference, 'file://')) {
            return $this->fromFile(substr($reference, 7));
        }
        if (str_starts_with($reference, 'env://')) {
            if (app()->environment('production')) {
                throw new RuntimeException('Environment-backed secret references are disabled in production.');
            }
            $value = env(substr($reference, 6));
            if (!is_string($value) || $value === '') throw new RuntimeException('The environment secret is unavailable.');
            return $value;
        }
        if (!app()->environment(['local', 'testing'])) {
            throw new RuntimeException('Literal secrets are disabled outside local and testing environments.');
        }

        return $reference;
    }

    private function fromFile(string $name): string
    {
        $this->validateName($name);
        $directory = rtrim((string) config('vondo.secrets.directory'), '/\\');
        if ($directory === '') throw new RuntimeException('The mounted secret directory is not configured.');
        $path = $directory.DIRECTORY_SEPARATOR.$name;
        $value = is_file($path) ? trim((string) file_get_contents($path)) : '';
        if ($value === '') throw new RuntimeException("Secret {$name} is unavailable.");
        return $value;
    }

    private function fromProvider(string $name): string
    {
        $this->validateName($name);
        $url = rtrim((string) config('vondo.secrets.provider_url'), '/');
        $tokenFile = (string) config('vondo.secrets.provider_token_file');
        if ($url === '' || !is_file($tokenFile)) throw new RuntimeException('The external secret provider is not configured.');
        $token = trim((string) file_get_contents($tokenFile));
        $response = Http::acceptJson()->withToken($token)->timeout(5)->retry(2, 200, throw: false)
            ->get($url.'/v1/secrets/'.$name);
        $value = $response->successful() ? $response->json('value') : null;
        if (!is_string($value) || $value === '') throw new RuntimeException("Secret {$name} could not be resolved.");
        return $value;
    }

    private function validateName(string $name): void
    {
        if (!preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/', $name)) {
            throw new RuntimeException('The secret reference name is invalid.');
        }
    }
}

<?php

namespace App\Jobs;

use App\Platform\Models\MobilePushSubscription;
use App\Platform\Secrets\SecretResolver;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class SendTenantPush implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        public readonly int $restaurantId,
        public readonly string $audience,
        public readonly string $title,
        public readonly string $body,
        public readonly array $data = [],
        public readonly ?int $principalId = null,
    ) {
        $this->onQueue('notifications');
    }

    public function handle(SecretResolver $secrets): void
    {
        $subscriptions = MobilePushSubscription::query()
            ->where('restaurant_id', $this->restaurantId)->where('audience', $this->audience)
            ->whereNull('revoked_at')->when($this->principalId, fn($query) => $query->where('principal_id', $this->principalId))
            ->get();
        if ($subscriptions->isEmpty()) {
            return;
        }

        $url = (string) config('vondo.push.provider_url');
        if ($url === '') {
            if (app()->environment(['local', 'testing'])) {
                return;
            }
            throw new RuntimeException('The push provider is not configured.');
        }

        $payload = ['restaurant_id' => $this->restaurantId, 'audience' => $this->audience,
            'notification' => ['title' => $this->title, 'body' => $this->body], 'data' => $this->data,
            'devices' => $subscriptions->map(fn($item) => ['id' => $item->getKey(), 'platform' => $item->platform, 'token' => $item->token])->values()->all()];
        $encoded = json_encode($payload, JSON_THROW_ON_ERROR);
        $secret = $secrets->resolve((string) config('vondo.push.secret_ref'));
        $response = Http::timeout((int) config('vondo.push.timeout_seconds', 15))->acceptJson()
            ->withHeaders(['X-Vondo-Signature' => hash_hmac('sha256', $encoded, $secret)])->withBody($encoded, 'application/json')->post($url);
        $response->throw();
        $invalid = collect($response->json('invalid_device_ids', []))->filter(fn($id) => is_numeric($id))->map(fn($id) => (int) $id);
        if ($invalid->isNotEmpty()) {
            MobilePushSubscription::query()->where('restaurant_id', $this->restaurantId)->whereIn('id', $invalid)->update(['revoked_at' => now()]);
        }
    }
}

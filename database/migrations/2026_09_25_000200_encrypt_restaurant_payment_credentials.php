<?php

use App\Platform\Models\RestaurantSetting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        RestaurantSetting::query()
            ->whereIn('key', [
                'payments_stripe_secret_key',
                'payments_stripe_webhook_secret',
                'payments_paypal_secret',
            ])
            ->orderBy('id')
            ->each(function (RestaurantSetting $setting): void {
                $secret = $setting->value;
                if (is_string($secret) && $secret !== '') {
                    $setting->value = $secret;
                    $setting->save();
                }
            });
    }

    public function down(): void
    {
        // Payment secrets deliberately remain encrypted when rolling back.
    }
};

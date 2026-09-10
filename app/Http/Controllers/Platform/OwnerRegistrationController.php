<?php

namespace App\Http\Controllers\Platform;

use App\Platform\Provisioning\RestaurantProvisioner;
use App\Platform\Support\OnboardingIdempotency;
use App\Platform\Support\OwnerAccountSecurity;
use Igniter\User\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class OwnerRegistrationController extends Controller
{
    public function store(
        Request $request,
        RestaurantProvisioner $provisioner,
        OnboardingIdempotency $idempotency,
        OwnerAccountSecurity $security,
    ): JsonResponse
    {
        return $idempotency->run($request, function () use ($request, $provisioner, $security): array {
            // Normalize timezone if user entered a region/country keyword like "Europa", "Europe", "Swiss", "Switzerland", or empty
            if ($request->filled('timezone')) {
                $tz = trim((string)$request->input('timezone'));
                if (preg_match('/^(europa|europe|swiss|switzerland|ch|zurich|bern|geneva)$/i', $tz)) {
                    $request->merge(['timezone' => 'Europe/Zurich']);
                }
            } else {
                $request->merge(['timezone' => 'Europe/Zurich']);
            }

            if (!$request->filled('currency_code')) {
                $request->merge(['currency_code' => 'CHF']);
            } else {
                $request->merge(['currency_code' => strtoupper(trim((string)$request->input('currency_code')))]);
            }

            $data = $request->validate([
                'owner_name' => ['required', 'string', 'max:80'],
                'restaurant_name' => ['required', 'string', 'max:80'],
                'email' => ['required', 'email:filter', 'max:96', Rule::unique((new User)->getTable(), 'email')],
                'password' => ['required', 'string', 'min:10', 'max:72', 'confirmed'],
                'timezone' => ['nullable', 'timezone'],
                'currency_code' => ['nullable', 'string', 'size:3'],
                'template_code' => ['nullable', 'string', Rule::exists('platform_templates', 'code')->where('active', true)],
            ]);
            $data['timezone'] = $data['timezone'] ?: 'Europe/Zurich';
            $data['currency_code'] = strtoupper($data['currency_code'] ?: 'CHF');
            $restaurant = $provisioner->provision($data, $request->ip());
            $owner = $restaurant->memberships()->with('user')->where('role', 'owner')->firstOrFail()->user;
            $requireVerification = (bool) config('vondo.require_email_verification', false);
            if ($requireVerification) {
                $security->sendVerification($restaurant, $owner);
            }

            return [['data' => [
                'restaurant_id' => $restaurant->public_id,
                'name' => $restaurant->name,
                'slug' => $restaurant->slug,
                'status' => $restaurant->status,
                'storefront_url' => 'https://'.$restaurant->domains->first()->host,
                'verification_required' => $requireVerification,
            ]], 201];
        });
    }
}

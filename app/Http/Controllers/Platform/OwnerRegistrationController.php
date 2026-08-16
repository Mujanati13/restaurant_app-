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
            $data = $request->validate([
                'owner_name' => ['required', 'string', 'max:80'],
                'restaurant_name' => ['required', 'string', 'max:80'],
                'email' => ['required', 'email:filter', 'max:96', Rule::unique((new User)->getTable(), 'email')],
                'password' => ['required', 'string', 'min:10', 'max:72', 'confirmed'],
                'timezone' => ['nullable', 'timezone'],
                'currency_code' => ['nullable', 'string', 'size:3'],
                'template_code' => ['nullable', 'string', Rule::exists('platform_templates', 'code')->where('active', true)],
            ]);
            $restaurant = $provisioner->provision($data, $request->ip());
            $owner = $restaurant->memberships()->with('user')->where('role', 'owner')->firstOrFail()->user;
            $security->sendVerification($restaurant, $owner);

            return [['data' => [
                'restaurant_id' => $restaurant->public_id,
                'name' => $restaurant->name,
                'slug' => $restaurant->slug,
                'status' => $restaurant->status,
                'storefront_url' => 'https://'.$restaurant->domains->first()->host,
                'verification_required' => true,
            ]], 201];
        });
    }
}

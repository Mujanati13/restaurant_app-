<?php

namespace App\Http\Controllers;

use App\Platform\Tenancy\TenantContext;
use Igniter\User\Models\Customer;
use Igniter\User\Models\CustomerGroup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class StorefrontRegistrationController extends Controller
{
    public function __construct(private readonly TenantContext $tenant) {}
    /**
     * Create a customer account from the public storefront.
     *
     * The administration API intentionally requires a token for customer
     * management, so public self-registration is kept in this small,
     * explicitly validated endpoint instead.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'between:1,48'],
            'last_name' => ['required', 'string', 'between:1,48'],
            'email' => ['required', 'email:filter', 'max:96', Rule::unique('customers', 'email')->where('restaurant_id', $this->tenant->id())],
            'telephone' => ['required', 'string', 'max:64'],
            'password' => ['required', 'string', 'min:8', 'max:40', 'same:password_confirm'],
            'password_confirm' => ['required', 'string'],
        ]);

        $customerGroupId = CustomerGroup::query()
            ->where('is_default', true)
            ->value('customer_group_id')
            ?? CustomerGroup::query()->value('customer_group_id');

        abort_unless($customerGroupId, 503, 'Customer registration is not configured.');

        $customer = DB::transaction(function () use ($data, $customerGroupId) {
            $customer = (new Customer)->register([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'telephone' => $data['telephone'],
                'password' => $data['password'],
                'customer_group_id' => $customerGroupId,
                'status' => true,
                'is_activated' => true,
                'activated_at' => now(),
            ]);

            $customer->forceFill(['restaurant_id' => $this->tenant->id()])->save();

            return $customer;
        });

        return response()->json([
            'data' => [
                'id' => $customer->getKey(),
                'attributes' => [
                    'first_name' => $customer->first_name,
                    'last_name' => $customer->last_name,
                    'email' => $customer->email,
                ],
            ],
        ], 201);
    }
}

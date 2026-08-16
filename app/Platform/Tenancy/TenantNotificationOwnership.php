<?php

namespace App\Platform\Tenancy;

use Igniter\User\Models\Notification;
use Illuminate\Support\Facades\DB;

class TenantNotificationOwnership
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function resolve(Notification $notification): ?int
    {
        if ($this->tenant->has()) {
            return $this->tenant->id();
        }

        $url = (string) data_get($notification->data, 'url', '');
        if (preg_match('~/(orders|reservations)/edit/(\d+)~', $url, $matches)) {
            $table = $matches[1];
            $key = $table === 'orders' ? 'order_id' : 'reservation_id';
            $restaurantId = DB::table($table)->where($key, (int) $matches[2])->value('restaurant_id');
            if ($restaurantId) {
                return (int) $restaurantId;
            }
        }

        $type = (string) $notification->notifiable_type;
        $notifiableId = (int) $notification->notifiable_id;
        if ($type === 'customers' || str_ends_with($type, '\\Customer')) {
            $restaurantId = DB::table('customers')->where('customer_id', $notifiableId)->value('restaurant_id');
            if ($restaurantId) {
                return (int) $restaurantId;
            }
        }

        if ($type === 'users' || str_ends_with($type, '\\User')) {
            $restaurantIds = DB::table('restaurant_memberships')->where('user_id', $notifiableId)
                ->where('status', 'active')->distinct()->pluck('restaurant_id');
            if ($restaurantIds->count() === 1) {
                return (int) $restaurantIds->first();
            }
        }

        return null;
    }
}

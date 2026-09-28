<?php

namespace App\Platform\Orders;

use App\Jobs\SendTenantPush;
use Closure;
use Igniter\Cart\Models\Order;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

/** Enforces the five-minute window in which a restaurant must accept an order. */
class OrderConfirmationWindow
{
    public const int MINUTES = 5;

    private const string EXPIRY_REASON = 'Restaurant did not confirm this order within five minutes.';

    public function begin(Order $order): void
    {
        $order->forceFill([
            'confirmation_due_at' => now()->addMinutes(self::MINUTES),
        ])->saveQuietly();
    }

    /**
     * Run a restaurant status transition while ensuring the order has not
     * expired. The first actual transition away from the intake status is the
     * restaurant's confirmation.
     */
    public function updateStatus(Order $order, int $statusId, Closure $update): bool
    {
        $result = DB::transaction(function () use ($order, $statusId, $update): string {
            $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order->getKey());

            if ($lockedOrder->cancelled_at) {
                return 'cancelled';
            }

            $awaitingConfirmation = $this->awaitingConfirmation($lockedOrder);
            if ($awaitingConfirmation && $this->deadlineHasPassed($lockedOrder)) {
                $this->expireLocked($lockedOrder);

                return 'expired';
            }

            $previousStatusId = (int) $lockedOrder->status_id;
            if ($update($lockedOrder) === false) {
                return 'failed';
            }

            if ($awaitingConfirmation && $previousStatusId !== $statusId) {
                $lockedOrder->forceFill(['confirmed_at' => now()])->saveQuietly();
            }

            return 'updated';
        });

        if ($result === 'cancelled') {
            throw new HttpException(409, 'This order has already been cancelled.');
        }

        if ($result === 'expired') {
            throw new HttpException(409, 'The five-minute confirmation deadline passed and the order was cancelled.');
        }

        return $result === 'updated';
    }

    /** Cancel an order only when it is still awaiting an overdue confirmation. */
    public function expireIfOverdue(int $orderId): ?Order
    {
        return DB::transaction(function () use ($orderId): ?Order {
            $order = Order::query()->lockForUpdate()->find($orderId);
            if (!$order || !$this->awaitingConfirmation($order) || !$this->deadlineHasPassed($order)) {
                return null;
            }

            $this->expireLocked($order);

            return $order;
        });
    }

    private function awaitingConfirmation(Order $order): bool
    {
        return filled($order->confirmation_due_at)
            && blank($order->confirmed_at)
            && blank($order->cancelled_at);
    }

    private function deadlineHasPassed(Order $order): bool
    {
        return Carbon::parse($order->confirmation_due_at)->lessThanOrEqualTo(now());
    }

    private function expireLocked(Order $order): void
    {
        $order->forceFill([
            'cancelled_at' => now(),
            'cancel_reason' => self::EXPIRY_REASON,
            'confirmation_expired_at' => now(),
        ])->saveQuietly();

        $restaurantId = (int) $order->restaurant_id;
        $customerId = (int) $order->customer_id;
        $orderId = (string) $order->getKey();
        DB::afterCommit(static function () use ($restaurantId, $customerId, $orderId): void {
            SendTenantPush::dispatch(
                $restaurantId,
                'customer',
                'Order cancelled',
                'The restaurant did not confirm your order within five minutes.',
                ['type' => 'order', 'id' => $orderId, 'route' => '/account/orders/'.$orderId],
                $customerId,
            );
        });
    }
}

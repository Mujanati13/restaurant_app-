<?php

namespace App\Console\Commands;

use App\Platform\Orders\OrderConfirmationWindow;
use Igniter\Cart\Models\Order;
use Illuminate\Console\Command;

class ExpireUnconfirmedOrders extends Command
{
    protected $signature = 'vondo:expire-unconfirmed-orders {--dry-run}';

    protected $description = 'Cancel orders the restaurant did not confirm within five minutes';

    public function handle(OrderConfirmationWindow $confirmationWindow): int
    {
        $overdue = Order::query()
            ->whereNotNull('confirmation_due_at')
            ->whereNull('confirmed_at')
            ->whereNull('cancelled_at')
            ->where('confirmation_due_at', '<=', now());

        if ($this->option('dry-run')) {
            $this->info('Would cancel '.$overdue->count().' unconfirmed order(s).');

            return self::SUCCESS;
        }

        $expired = 0;
        $overdue->orderBy('order_id')->chunkById(100, function ($orders) use ($confirmationWindow, &$expired): void {
            foreach ($orders as $order) {
                $expiredOrder = $confirmationWindow->expireIfOverdue((int) $order->getKey());
                if (!$expiredOrder) {
                    continue;
                }

                $expired++;
            }
        }, 'order_id');

        $this->info('Cancelled '.$expired.' unconfirmed order(s).');

        return self::SUCCESS;
    }
}

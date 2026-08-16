<?php

namespace App\Providers;

use App\Platform\Tenancy\TenantContext;
use App\Platform\Tenancy\TenantPivotOwnership;
use App\Platform\Tenancy\TenantNotificationOwnership;
use App\Platform\Models\PlatformAdmin;
use Igniter\Cart\Models\Category;
use Igniter\Cart\Models\Ingredient;
use Igniter\Cart\Models\Mealtime;
use Igniter\Cart\Models\Menu;
use Igniter\Cart\Models\MenuOption;
use Igniter\Cart\Models\MenuOptionValue;
use Igniter\Cart\Models\MenuItemOption;
use Igniter\Cart\Models\MenuItemOptionValue;
use Igniter\Cart\Models\OrderMenu;
use Igniter\Cart\Models\OrderMenuOptionValue;
use Igniter\Cart\Models\OrderTotal;
use Igniter\Cart\Models\Stock;
use Igniter\Cart\Models\StockHistory;
use Igniter\Cart\Models\Cart;
use Igniter\Cart\Models\Order;
use Igniter\Coupons\Models\Coupon;
use Igniter\Coupons\Models\CouponHistory;
use Igniter\Flame\Database\Attach\Media;
use Igniter\Frontend\Models\Banner;
use Igniter\Frontend\Models\Slider;
use Igniter\Frontend\Models\Subscriber;
use Igniter\Local\Models\Location;
use Igniter\Local\Models\LocationArea;
use Igniter\Local\Models\LocationSettings;
use Igniter\Local\Models\WorkingHour;
use Igniter\Local\Models\Review;
use Igniter\PayRegister\Models\PaymentProfile;
use Igniter\PayRegister\Models\PaymentLog;
use Igniter\Reservation\Models\DiningArea;
use Igniter\Reservation\Models\DiningSection;
use Igniter\Reservation\Models\DiningTable;
use Igniter\Reservation\Models\Reservation;
use Igniter\Reservation\Models\Table;
use Igniter\Admin\Models\StatusHistory;
use Igniter\User\Models\Address;
use Igniter\User\Models\Customer;
use Igniter\User\Models\Notification;
use Igniter\User\Models\AssignableLog;
use Igniter\User\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->scoped(TenantContext::class, fn() => new TenantContext);
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        Relation::morphMap([
            'platform_admins' => PlatformAdmin::class,
        ]);

        // TastyIgniter's legacy administration controllers are not tenant-safe.
        // Owners use the Vondo portal; only the platform Super Admin may retain
        // access to the legacy administration area while its internals remain
        // intentionally global.
        $this->app->booted(function (): void {
            Route::pushMiddlewareToGroup(
                'igniter:admin',
                \App\Http\Middleware\EnsureLegacyAdminSuperUser::class,
            );
        });

        $tenantModels = [
            Location::class, Category::class, Menu::class, Customer::class, Order::class, Reservation::class,
            Address::class, DiningArea::class, DiningSection::class, DiningTable::class, Table::class,
            Coupon::class, Review::class, Ingredient::class, Mealtime::class, MenuOption::class,
            PaymentProfile::class, Banner::class, Slider::class, Subscriber::class, Media::class,
            Notification::class, StatusHistory::class,
            MenuOptionValue::class, MenuItemOption::class, MenuItemOptionValue::class,
            OrderMenu::class, OrderMenuOptionValue::class, OrderTotal::class,
            Stock::class, StockHistory::class, Cart::class, CouponHistory::class,
            LocationArea::class, LocationSettings::class, WorkingHour::class,
            PaymentLog::class, AssignableLog::class,
        ];

        // Staff accounts are platform-global, but their location pivot is
        // tenant-owned and must receive ownership before direct sync/attach.
        if (method_exists(User::class, 'extend')) {
            User::extend(function(Model $model): void {
                app(TenantPivotOwnership::class)->bind($model);
            });
        }

        foreach ($tenantModels as $modelClass) {
            if (method_exists($modelClass, 'extend')) {
                $modelClass::extend(function(Model $model): void {
                    app(TenantPivotOwnership::class)->bind($model);
                });
            }

            $modelClass::addGlobalScope('vondo_restaurant', function ($query): void {
                $context = app(TenantContext::class);
                if ($context->has()) {
                    $query->where($query->getModel()->qualifyColumn('restaurant_id'), $context->id());
                }
            });

            $modelClass::creating(function (Model $model): void {
                $context = app(TenantContext::class);
                if ($context->has() && is_null($model->getAttribute('restaurant_id'))) {
                    $model->setAttribute('restaurant_id', $context->id());
                }
                if ($model instanceof Notification && is_null($model->getAttribute('restaurant_id'))) {
                    $restaurantId = app(TenantNotificationOwnership::class)->resolve($model);
                    if ($restaurantId) {
                        $model->setAttribute('restaurant_id', $restaurantId);
                    }
                }
            });
        }
    }
}

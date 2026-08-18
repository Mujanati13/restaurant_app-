<?php

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

use App\Http\Controllers\StorefrontRegistrationController;
use App\Http\Controllers\StorefrontConfigController;
use App\Http\Controllers\StorefrontSessionController;
use App\Http\Controllers\StorefrontTableAvailabilityController;
use App\Http\Controllers\VendorMobileController;
use App\Http\Controllers\Platform\OwnerBrandController;
use App\Http\Controllers\Platform\OwnerRegistrationController;
use App\Http\Controllers\Platform\StorefrontTenantController;
use App\Http\Controllers\Platform\SuperAdminRestaurantController;
use App\Http\Controllers\Platform\StorefrontLoginController;
use App\Http\Controllers\Platform\VendorLoginController;
use App\Http\Controllers\Platform\StorefrontCommerceController;
use App\Http\Controllers\Platform\OwnerRestaurantController;
use App\Http\Controllers\Platform\OwnerAppBuildController;
use App\Http\Controllers\Platform\OwnerOperationsController;
use App\Http\Controllers\Platform\SessionRefreshController;
use App\Http\Controllers\Platform\OwnerPageController;
use App\Http\Controllers\Platform\OwnerAccountController;
use App\Http\Controllers\Platform\OwnerTeamAccessController;
use App\Http\Controllers\Platform\StorefrontPageController;
use App\Http\Controllers\Platform\TenantMediaController;
use App\Http\Controllers\Platform\StorefrontAnalyticsController;
use App\Http\Controllers\Platform\SuperAdminSessionController;
use App\Http\Controllers\Platform\SuperAdminMfaController;
use App\Http\Controllers\Platform\BuildCompilerCallbackController;
use App\Http\Controllers\Platform\PlatformOperationsController;
use App\Http\Controllers\Platform\SupportImpersonationController;
use App\Http\Controllers\Platform\MobilePushController;
use App\Http\Controllers\Platform\HealthController;
use Igniter\Api\Http\Middleware\Authenticate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('v1/health/live', [HealthController::class, 'live'])->middleware('throttle:60,1');
Route::get('v1/health/ready', [HealthController::class, 'ready'])->middleware('throttle:60,1');

// The extension API protects customer management routes with token abilities.
// This endpoint is deliberately limited to validated public self-registration.
Route::post('storefront/register', [StorefrontRegistrationController::class, 'store'])
    ->middleware(['restaurant', 'throttle:vondo-tenant-auth']);

Route::get('storefront/config', StorefrontConfigController::class)->middleware('restaurant');

Route::get('storefront/tables/availability', StorefrontTableAvailabilityController::class)
    ->middleware(['restaurant', 'throttle:vondo-storefront']);

Route::delete('storefront/token', [StorefrontSessionController::class, 'destroy'])
    ->middleware(Authenticate::class);

// Vendor mobile endpoints intentionally expose small, location-scoped DTOs.
Route::prefix('vendor')->middleware([Authenticate::class, 'restaurant.member', 'throttle:vondo-tenant'])->group(function(): void {
    Route::get('bootstrap', [VendorMobileController::class, 'bootstrap']);
    Route::get('dashboard', [VendorMobileController::class, 'dashboard']);
    Route::get('orders', [VendorMobileController::class, 'orders']);
    Route::patch('orders/{orderId}/status', [VendorMobileController::class, 'updateOrderStatus']);
    Route::get('reservations', [VendorMobileController::class, 'reservations']);
    Route::patch('reservations/{reservationId}/status', [VendorMobileController::class, 'updateReservationStatus']);
    Route::get('menus', [VendorMobileController::class, 'menus']);
    Route::patch('menus/{menuId}/availability', [VendorMobileController::class, 'updateMenuAvailability']);
    Route::delete('session', [VendorMobileController::class, 'destroySession']);
});

// Vondo's versioned platform contract. New clients should only use these routes.
Route::prefix('v1')->group(function (): void {
    Route::post('owner/register', [OwnerRegistrationController::class, 'store'])->middleware('throttle:3,1');
    Route::post('owner/email/verify', [OwnerAccountController::class, 'verifyEmail'])->middleware(['restaurant', 'throttle:vondo-tenant-auth']);
    Route::post('owner/email/resend', [OwnerAccountController::class, 'resendVerification'])->middleware(['restaurant', 'throttle:vondo-tenant-auth']);
    Route::post('owner/password/forgot', [OwnerAccountController::class, 'forgotPassword'])->middleware(['restaurant', 'throttle:vondo-tenant-auth']);
    Route::post('owner/password/reset', [OwnerAccountController::class, 'resetPassword'])->middleware(['restaurant', 'throttle:vondo-tenant-auth']);
    Route::post('owner/invitations/accept', [OwnerTeamAccessController::class, 'accept'])->middleware(['restaurant', 'throttle:vondo-tenant-auth']);
    Route::post('owner/token', [VendorLoginController::class, 'store'])->middleware(['restaurant', 'throttle:vondo-tenant-auth']);
    Route::post('owner/refresh', [SessionRefreshController::class, 'owner'])->middleware(['restaurant', 'throttle:vondo-tenant-auth']);
    Route::post('vendor/token', [VendorLoginController::class, 'store'])->middleware(['restaurant', 'throttle:vondo-tenant-auth']);
    Route::post('vendor/refresh', [SessionRefreshController::class, 'vendor'])->middleware(['restaurant', 'throttle:vondo-tenant-auth']);
    Route::post('platform/token', [SuperAdminSessionController::class, 'store'])->middleware('throttle:6,1');
    Route::post('platform/refresh', [SessionRefreshController::class, 'platform'])->middleware('throttle:12,1');
    Route::post('builds/callback', BuildCompilerCallbackController::class)->middleware('throttle:120,1');
    Route::post('owner/support-session/exchange', [SupportImpersonationController::class, 'exchange'])
        ->middleware(['restaurant', 'throttle:6,1']);

    Route::prefix('storefront')->middleware(['restaurant', 'throttle:vondo-storefront'])->group(function (): void {
        Route::get('bootstrap', [StorefrontTenantController::class, 'bootstrap']);
        Route::post('register', [StorefrontRegistrationController::class, 'store'])->middleware('throttle:6,1');
        Route::post('token', [StorefrontLoginController::class, 'store'])->middleware('throttle:6,1');
        Route::post('refresh', [SessionRefreshController::class, 'storefront'])->middleware('throttle:12,1');
        Route::get('categories', [StorefrontTenantController::class, 'categories']);
        Route::get('menus', [StorefrontTenantController::class, 'menus']);
        Route::get('menus/{menuId}', [StorefrontTenantController::class, 'menu'])->whereNumber('menuId');
        Route::get('locations', [StorefrontTenantController::class, 'locations']);
        Route::get('pages/{slug}', [StorefrontPageController::class, 'show'])->where('slug', '[a-z0-9_-]+');
        Route::get('media/{publicId}', [TenantMediaController::class, 'show'])->whereUuid('publicId');
        Route::post('analytics/events', [StorefrontAnalyticsController::class, 'store'])->middleware('throttle:120,1');

        Route::middleware([Authenticate::class, 'restaurant.customer'])->group(function (): void {
            Route::post('push-subscriptions', fn(Request $request, MobilePushController $controller) => $controller->store($request, 'customer'));
            Route::delete('push-subscriptions', fn(Request $request, MobilePushController $controller) => $controller->destroy($request, 'customer'));
            Route::get('account', [StorefrontCommerceController::class, 'account']);
            Route::patch('account', [StorefrontCommerceController::class, 'updateAccount']);
            Route::get('addresses', [StorefrontCommerceController::class, 'addresses']);
            Route::post('addresses', [StorefrontCommerceController::class, 'createAddress']);
            Route::get('orders', [StorefrontCommerceController::class, 'orders']);
            Route::post('orders', [StorefrontCommerceController::class, 'createOrder']);
            Route::get('orders/{orderId}', [StorefrontCommerceController::class, 'order'])->whereNumber('orderId');
            Route::get('reservations', [StorefrontCommerceController::class, 'reservations']);
            Route::post('reservations', [StorefrontCommerceController::class, 'createReservation']);
            Route::delete('token', [StorefrontSessionController::class, 'destroy']);
        });
    });

    Route::prefix('owner')->middleware([Authenticate::class, 'restaurant.member', 'throttle:vondo-tenant'])->group(function (): void {
        Route::get('bootstrap', [OwnerOperationsController::class, 'bootstrap']);
        Route::get('dashboard', [OwnerOperationsController::class, 'dashboard']);
        Route::get('restaurant', [OwnerRestaurantController::class, 'show']);
        Route::patch('restaurant', [OwnerRestaurantController::class, 'update']);
        Route::post('domains', [OwnerRestaurantController::class, 'addDomain']);
        Route::post('domains/{domainId}/verify', [OwnerRestaurantController::class, 'verifyDomain'])->whereNumber('domainId');
        Route::delete('domains/{domainId}', [OwnerRestaurantController::class, 'deleteDomain'])->whereNumber('domainId');
        Route::post('media', [OwnerRestaurantController::class, 'uploadMedia'])->middleware('throttle:20,1');
        Route::get('media', [OwnerRestaurantController::class, 'media']);
        Route::delete('media/{publicId}', [OwnerRestaurantController::class, 'deleteMedia'])->whereUuid('publicId');
        Route::get('pages', [OwnerPageController::class, 'index']);
        Route::post('pages', [OwnerPageController::class, 'store']);
        Route::get('pages/{pageId}', [OwnerPageController::class, 'show'])->whereNumber('pageId');
        Route::patch('pages/{pageId}', [OwnerPageController::class, 'update'])->whereNumber('pageId');
        Route::put('pages/{pageId}/sections', [OwnerPageController::class, 'replaceSections'])->whereNumber('pageId');
        Route::delete('pages/{pageId}', [OwnerPageController::class, 'destroy'])->whereNumber('pageId');
        Route::get('app-builds', [OwnerAppBuildController::class, 'index']);
        Route::post('app-builds', [OwnerAppBuildController::class, 'store'])->middleware('throttle:6,1');
        Route::post('app-builds/{publicId}/cancel', [OwnerAppBuildController::class, 'cancel']);
        Route::post('app-builds/{publicId}/retry', [OwnerAppBuildController::class, 'retry']);
        Route::get('app-builds/{publicId}/artifacts/{artifactId}', [OwnerAppBuildController::class, 'download'])
            ->name('owner.app-builds.artifacts.download')->whereUuid('publicId')->whereNumber('artifactId');
        Route::get('brand-revisions', [OwnerBrandController::class, 'show']);
        Route::post('brand-revisions', [OwnerBrandController::class, 'store']);
        Route::post('brand-revisions/{revisionId}/publish', [OwnerBrandController::class, 'publish'])->whereNumber('revisionId');
        Route::post('brand-revisions/{revisionId}/rollback', [OwnerBrandController::class, 'rollback'])->whereNumber('revisionId');
        Route::get('orders', [OwnerOperationsController::class, 'orders']);
        Route::patch('orders/{orderId}/status', [OwnerOperationsController::class, 'updateOrderStatus'])->whereNumber('orderId');
        Route::get('reservations', [OwnerOperationsController::class, 'reservations']);
        Route::patch('reservations/{reservationId}/status', [OwnerOperationsController::class, 'updateReservationStatus'])->whereNumber('reservationId');
        Route::get('menus', [OwnerOperationsController::class, 'menus']);
        Route::post('menus', [OwnerOperationsController::class, 'createMenu']);
        Route::patch('menus/{menuId}', [OwnerOperationsController::class, 'updateMenu'])->whereNumber('menuId');
        Route::post('categories', [OwnerOperationsController::class, 'createCategory']);
        Route::patch('categories/{categoryId}', [OwnerOperationsController::class, 'updateCategory'])->whereNumber('categoryId');
        Route::get('customers', [OwnerOperationsController::class, 'customers']);
        Route::post('customers', [OwnerOperationsController::class, 'createCustomer']);
        Route::get('customers/{customerId}', [OwnerOperationsController::class, 'showCustomer'])->whereNumber('customerId');
        Route::patch('customers/{customerId}', [OwnerOperationsController::class, 'updateCustomer'])->whereNumber('customerId');
        Route::delete('customers/{customerId}', [OwnerOperationsController::class, 'deleteCustomer'])->whereNumber('customerId');
        Route::get('locations', [OwnerOperationsController::class, 'locations']);
        Route::post('locations', [OwnerOperationsController::class, 'createLocation']);
        Route::patch('locations/{locationId}', [OwnerOperationsController::class, 'updateLocation'])->whereNumber('locationId');
        Route::get('locations/{locationId}/settings', [OwnerOperationsController::class, 'locationSettings'])->whereNumber('locationId');
        Route::put('locations/{locationId}/settings', [OwnerOperationsController::class, 'updateLocationSettings'])->whereNumber('locationId');
        Route::get('team', [OwnerOperationsController::class, 'team']);
        Route::post('team', [OwnerOperationsController::class, 'createTeamMember']);
        Route::patch('team/{membershipId}', [OwnerOperationsController::class, 'updateTeamMember'])->whereNumber('membershipId');
        Route::get('team-access', [OwnerTeamAccessController::class, 'index']);
        Route::post('team-access/roles', [OwnerTeamAccessController::class, 'storeRole']);
        Route::patch('team-access/roles/{roleId}', [OwnerTeamAccessController::class, 'updateRole'])->whereNumber('roleId');
        Route::delete('team-access/roles/{roleId}', [OwnerTeamAccessController::class, 'destroyRole'])->whereNumber('roleId');
        Route::post('team-access/invitations', [OwnerTeamAccessController::class, 'invite'])->middleware('throttle:12,1');
        Route::delete('team-access/invitations/{publicId}', [OwnerTeamAccessController::class, 'cancel'])->whereUuid('publicId');
        Route::delete('session', [OwnerOperationsController::class, 'destroySession']);
    });

    Route::prefix('platform')->middleware([Authenticate::class, 'platform.admin', 'throttle:60,1'])->group(function (): void {
        Route::delete('session', [SuperAdminSessionController::class, 'destroy']);
        Route::get('overview', [SuperAdminRestaurantController::class, 'overview']);
        Route::get('reports', [SuperAdminRestaurantController::class, 'reports']);
        Route::get('reports/export', [SuperAdminRestaurantController::class, 'exportReports']);
        Route::get('restaurants', [SuperAdminRestaurantController::class, 'index']);
        Route::post('restaurants', [SuperAdminRestaurantController::class, 'store'])->middleware('throttle:6,1');
        Route::get('restaurants/{publicId}', [SuperAdminRestaurantController::class, 'show']);
        Route::patch('restaurants/{publicId}/status', [SuperAdminRestaurantController::class, 'updateStatus']);
        Route::put('restaurants/{publicId}/features/{feature}', [SuperAdminRestaurantController::class, 'updateFeature']);
        Route::patch('restaurants/{publicId}/domains/{domainId}/verification', [SuperAdminRestaurantController::class, 'verifyDomain'])->whereNumber('domainId');
        Route::get('app-builds', [SuperAdminRestaurantController::class, 'builds']);
        Route::get('app-builds/{publicId}', [SuperAdminRestaurantController::class, 'build'])->whereUuid('publicId');
        Route::post('app-builds/{publicId}/cancel', [SuperAdminRestaurantController::class, 'cancelBuild'])->whereUuid('publicId');
        Route::post('app-builds/{publicId}/retry', [SuperAdminRestaurantController::class, 'retryBuild'])->whereUuid('publicId');
        Route::get('audit-logs', [SuperAdminRestaurantController::class, 'auditLogs']);
        Route::get('subscription-plans', [SuperAdminRestaurantController::class, 'plans']);
        Route::get('templates', [PlatformOperationsController::class, 'templates']);
        Route::post('templates', [PlatformOperationsController::class, 'storeTemplate']);
        Route::put('templates/{publicId}', [PlatformOperationsController::class, 'updateTemplate'])->whereUuid('publicId');
        Route::get('alerts', [PlatformOperationsController::class, 'alerts']);
        Route::post('alerts/{alertId}/acknowledge', [PlatformOperationsController::class, 'acknowledgeAlert'])->whereNumber('alertId');
        Route::get('health', [PlatformOperationsController::class, 'health']);
        Route::post('restaurants/{publicId}/support-sessions', [SupportImpersonationController::class, 'create'])->whereUuid('publicId');
        Route::delete('support-sessions/{publicId}', [SupportImpersonationController::class, 'end'])->whereUuid('publicId');
        Route::get('security/mfa', [SuperAdminMfaController::class, 'show']);
        Route::post('security/mfa/setup', [SuperAdminMfaController::class, 'begin']);
        Route::post('security/mfa/confirm', [SuperAdminMfaController::class, 'confirm']);
        Route::delete('security/mfa', [SuperAdminMfaController::class, 'destroy']);
        Route::post('subscription-plans', [SuperAdminRestaurantController::class, 'storePlan']);
        Route::patch('subscription-plans/{planId}', [SuperAdminRestaurantController::class, 'updatePlan'])->whereNumber('planId');
        Route::put('restaurants/{publicId}/subscription', [SuperAdminRestaurantController::class, 'assignSubscription']);
    });

    Route::prefix('vendor')->middleware([Authenticate::class, 'restaurant.member', 'throttle:vondo-tenant'])->group(function (): void {
        Route::post('push-subscriptions', fn(Request $request, MobilePushController $controller) => $controller->store($request, 'vendor'));
        Route::delete('push-subscriptions', fn(Request $request, MobilePushController $controller) => $controller->destroy($request, 'vendor'));
        Route::get('bootstrap', [VendorMobileController::class, 'bootstrap']);
        Route::get('dashboard', [VendorMobileController::class, 'dashboard']);
        Route::get('orders', [VendorMobileController::class, 'orders']);
        Route::patch('orders/{orderId}/status', [VendorMobileController::class, 'updateOrderStatus']);
        Route::get('reservations', [VendorMobileController::class, 'reservations']);
        Route::patch('reservations/{reservationId}/status', [VendorMobileController::class, 'updateReservationStatus']);
        Route::get('menus', [VendorMobileController::class, 'menus']);
        Route::patch('menus/{menuId}/availability', [VendorMobileController::class, 'updateMenuAvailability']);
        Route::delete('session', [VendorMobileController::class, 'destroySession']);
    });
});

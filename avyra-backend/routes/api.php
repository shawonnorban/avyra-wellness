<?php

use App\Http\Controllers\Api\Admin\CourierController as AdminCourierController;
use App\Http\Controllers\Api\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\FraudController;
use App\Http\Controllers\Api\Admin\LandingPageController as AdminLandingPageController;
use App\Http\Controllers\Api\Admin\MarketingController;
use App\Http\Controllers\Api\Admin\NotificationController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\PurchaseController;
use App\Http\Controllers\Api\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Api\Admin\SupplierController;
use App\Http\Controllers\Api\Admin\UploadController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\WarehouseController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourierWebhookController;
use App\Http\Controllers\Api\Storefront\CheckoutController;
use App\Http\Controllers\Api\Storefront\LandingPageController;
use App\Http\Controllers\Api\Storefront\OrderTrackingController;
use App\Http\Controllers\Api\Storefront\OtpController;
use App\Http\Controllers\Api\Storefront\ProductController;
use App\Http\Controllers\Api\Storefront\SettingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public storefront
|--------------------------------------------------------------------------
| No authentication. Every endpoint here is reachable by anyone, so nothing
| in this group may expose stock levels, credentials or customer records.
*/
Route::prefix('storefront')->group(function () {
    Route::get('settings', [SettingController::class, 'index']);
    Route::get('banners', [ProductController::class, 'banners']);
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/{slug}', [ProductController::class, 'show']);

    Route::get('reviews', [LandingPageController::class, 'reviews']);
    Route::get('landing-pages/{slug}', [LandingPageController::class, 'show']);
    Route::post('landing-pages/{slug}/visit', [LandingPageController::class, 'trackVisit']);

    Route::post('coupons/validate', [CheckoutController::class, 'validateCoupon']);
    Route::post('track-order', [OrderTrackingController::class, 'show']);

    // Throttled: these cost SMS credit and create orders.
    Route::middleware('throttle:20,1')->group(function () {
        Route::post('otp/send', [OtpController::class, 'send']);
        Route::post('otp/verify', [OtpController::class, 'verify']);
        Route::post('checkout', [CheckoutController::class, 'store']);
    });
});

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
| Cookie-based (Sanctum SPA). The client calls GET /sanctum/csrf-cookie first.
*/
Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
});

/*
|--------------------------------------------------------------------------
| Courier webhook
|--------------------------------------------------------------------------
| Public route: authenticated by the shared bearer token inside the controller,
| since the courier cannot present a session cookie.
*/
Route::post('webhooks/courier/steadfast', [CourierWebhookController::class, 'steadfast']);

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
| Every route needs a session plus at least the employee role; individual
| modules are then gated by the permission matrix via `module:<name>,<ability>`.
*/
Route::prefix('admin')->middleware(['auth:sanctum', 'role:employee'])->group(function () {

    Route::middleware('module:dashboard')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index']);
        Route::get('dashboard/revenue-chart', [DashboardController::class, 'revenueChart']);
        Route::get('dashboard/recent-orders', [DashboardController::class, 'recentOrders']);
        Route::get('dashboard/top-products', [DashboardController::class, 'topProducts']);
    });

    // Orders
    Route::get('orders', [AdminOrderController::class, 'index'])->middleware('module:sales,view');
    Route::get('orders/status-counts', [AdminOrderController::class, 'statusCounts'])->middleware('module:sales,view');
    Route::get('orders/export', [AdminOrderController::class, 'export'])->middleware('module:sales,view');
    Route::get('orders/{order}', [AdminOrderController::class, 'show'])->middleware('module:sales,view');
    Route::get('orders/{order}/customer-history', [AdminOrderController::class, 'customerHistory'])->middleware('module:sales,view');
    Route::post('orders', [AdminOrderController::class, 'store'])->middleware('module:sales,create');
    Route::put('orders/{order}', [AdminOrderController::class, 'update'])->middleware('module:sales,edit');
    Route::patch('orders/{order}/status', [AdminOrderController::class, 'updateStatus'])->middleware('module:sales,edit');
    Route::delete('orders/{order}', [AdminOrderController::class, 'destroy'])->middleware('module:sales,delete');

    // Customers
    Route::get('customers/stats', [AdminCustomerController::class, 'stats'])->middleware('module:customers,view');
    Route::get('customers', [AdminCustomerController::class, 'index'])->middleware('module:customers,view');
    Route::get('customers/{customer}', [AdminCustomerController::class, 'show'])->middleware('module:customers,view');
    Route::post('customers', [AdminCustomerController::class, 'store'])->middleware('module:customers,create');
    Route::put('customers/{customer}', [AdminCustomerController::class, 'update'])->middleware('module:customers,edit');
    Route::delete('customers/{customer}', [AdminCustomerController::class, 'destroy'])->middleware('module:customers,delete');

    // Inventory / products
    Route::get('products', [AdminProductController::class, 'index'])->middleware('module:inventory,view');
    Route::get('products/{product}', [AdminProductController::class, 'show'])->middleware('module:inventory,view');
    Route::get('products/{product}/movements', [AdminProductController::class, 'movements'])->middleware('module:inventory,view');
    Route::post('products', [AdminProductController::class, 'store'])->middleware('module:inventory,create');
    Route::put('products/{product}', [AdminProductController::class, 'update'])->middleware('module:inventory,edit');
    Route::post('products/{product}/adjust-stock', [AdminProductController::class, 'adjustStock'])->middleware('module:inventory,edit');
    Route::delete('products/{product}', [AdminProductController::class, 'destroy'])->middleware('module:inventory,delete');
    Route::post('products/{product}/variants', [AdminProductController::class, 'storeVariant'])->middleware('module:inventory,create');
    Route::put('products/{product}/variants/{variant}', [AdminProductController::class, 'updateVariant'])->middleware('module:inventory,edit');
    Route::delete('products/{product}/variants/{variant}', [AdminProductController::class, 'destroyVariant'])->middleware('module:inventory,delete');

    // Courier
    Route::get('courier/consignments', [AdminCourierController::class, 'index'])->middleware('module:courier,view');
    Route::get('courier/stats', [AdminCourierController::class, 'stats'])->middleware('module:courier,view');
    Route::get('courier/returns', [AdminCourierController::class, 'returns'])->middleware('module:courier,view');
    Route::get('courier/balance', [AdminCourierController::class, 'balance'])->middleware('module:courier,view');
    Route::get('courier/consignments/{consignment}', [AdminCourierController::class, 'show'])->middleware('module:courier,view');
    Route::post('courier/orders/{order}/dispatch', [AdminCourierController::class, 'dispatchOrder'])->middleware('module:courier,create');
    Route::post('courier/bulk-dispatch', [AdminCourierController::class, 'bulkDispatch'])->middleware('module:courier,create');
    Route::post('courier/consignments/{consignment}/sync', [AdminCourierController::class, 'sync'])->middleware('module:courier,edit');
    Route::post('courier/consignments/{consignment}/return', [AdminCourierController::class, 'createReturn'])->middleware('module:courier,edit');

    // Fraud detection
    Route::get('fraud/settings', [FraudController::class, 'settings'])->middleware('module:fraud,view');
    Route::get('fraud/stats', [FraudController::class, 'stats'])->middleware('module:fraud,view');
    Route::get('fraud/blocked-orders', [FraudController::class, 'blockedOrders'])->middleware('module:fraud,view');
    Route::get('fraud/risk-profiles', [FraudController::class, 'riskProfiles'])->middleware('module:fraud,view');
    Route::get('fraud/blocklist', [FraudController::class, 'blocklist'])->middleware('module:fraud,view');
    Route::put('fraud/settings', [FraudController::class, 'updateSettings'])->middleware('module:fraud,edit');
    Route::post('fraud/blocklist', [FraudController::class, 'block'])->middleware('module:fraud,create');
    Route::post('fraud/blocklist/remove', [FraudController::class, 'unblock'])->middleware('module:fraud,delete');
    Route::post('fraud/whitelist', [FraudController::class, 'toggleWhitelist'])->middleware('module:fraud,edit');

    // Purchase / stock-in
    Route::get('purchases/stats', [PurchaseController::class, 'stats'])->middleware('module:purchase,view');
    Route::get('purchases', [PurchaseController::class, 'index'])->middleware('module:purchase,view');
    Route::get('purchases/{purchase}', [PurchaseController::class, 'show'])->middleware('module:purchase,view');
    Route::post('purchases', [PurchaseController::class, 'store'])->middleware('module:purchase,create');
    Route::put('purchases/{purchase}', [PurchaseController::class, 'update'])->middleware('module:purchase,edit');
    Route::post('purchases/{purchase}/receive', [PurchaseController::class, 'receive'])->middleware('module:purchase,approve');
    Route::post('purchases/{purchase}/payments', [PurchaseController::class, 'addPayment'])->middleware('module:purchase,create');
    Route::delete('purchases/{purchase}', [PurchaseController::class, 'destroy'])->middleware('module:purchase,delete');

    Route::get('suppliers', [SupplierController::class, 'index'])->middleware('module:purchase,view');
    Route::get('suppliers/{supplier}', [SupplierController::class, 'show'])->middleware('module:purchase,view');
    Route::post('suppliers', [SupplierController::class, 'store'])->middleware('module:purchase,create');
    Route::put('suppliers/{supplier}', [SupplierController::class, 'update'])->middleware('module:purchase,edit');
    Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy'])->middleware('module:purchase,delete');

    // Marketing: landing pages, campaigns, coupons, banners
    Route::get('landing-pages', [AdminLandingPageController::class, 'index'])->middleware('module:marketing,view');
    Route::get('landing-pages/{landingPage}', [AdminLandingPageController::class, 'show'])->middleware('module:marketing,view');
    Route::get('landing-pages/{landingPage}/stats', [AdminLandingPageController::class, 'stats'])->middleware('module:marketing,view');
    Route::post('landing-pages', [AdminLandingPageController::class, 'store'])->middleware('module:marketing,create');
    Route::post('landing-pages/{landingPage}/duplicate', [AdminLandingPageController::class, 'duplicate'])->middleware('module:marketing,create');
    Route::put('landing-pages/{landingPage}', [AdminLandingPageController::class, 'update'])->middleware('module:marketing,edit');
    Route::delete('landing-pages/{landingPage}', [AdminLandingPageController::class, 'destroy'])->middleware('module:marketing,delete');

    Route::get('campaigns', [MarketingController::class, 'campaigns'])->middleware('module:marketing,view');
    Route::post('campaigns', [MarketingController::class, 'storeCampaign'])->middleware('module:marketing,create');
    Route::put('campaigns/{campaign}', [MarketingController::class, 'updateCampaign'])->middleware('module:marketing,edit');
    Route::delete('campaigns/{campaign}', [MarketingController::class, 'destroyCampaign'])->middleware('module:marketing,delete');

    Route::get('coupons', [MarketingController::class, 'coupons'])->middleware('module:marketing,view');
    Route::post('coupons', [MarketingController::class, 'storeCoupon'])->middleware('module:marketing,create');
    Route::put('coupons/{coupon}', [MarketingController::class, 'updateCoupon'])->middleware('module:marketing,edit');
    Route::delete('coupons/{coupon}', [MarketingController::class, 'destroyCoupon'])->middleware('module:marketing,delete');

    Route::get('banners', [MarketingController::class, 'banners'])->middleware('module:marketing,view');
    Route::post('banners', [MarketingController::class, 'storeBanner'])->middleware('module:marketing,create');
    Route::put('banners/{banner}', [MarketingController::class, 'updateBanner'])->middleware('module:marketing,edit');
    Route::delete('banners/{banner}', [MarketingController::class, 'destroyBanner'])->middleware('module:marketing,delete');

    // Warehouses sit under the inventory module.
    Route::get('warehouses', [WarehouseController::class, 'index'])->middleware('module:inventory,view');
    Route::post('warehouses', [WarehouseController::class, 'store'])->middleware('module:inventory,create');
    Route::put('warehouses/{warehouse}', [WarehouseController::class, 'update'])->middleware('module:inventory,edit');
    Route::delete('warehouses/{warehouse}', [WarehouseController::class, 'destroy'])->middleware('module:inventory,delete');

    // Image uploads. Any staff member who can create something can upload for it,
    // so this is gated on the session rather than a single module.
    Route::get('uploads', [UploadController::class, 'index']);
    Route::post('uploads', [UploadController::class, 'store']);
    Route::delete('uploads/{upload}', [UploadController::class, 'destroy']);

    // Notifications are visible to any signed-in staff member.
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);

    // Settings, staff accounts and the permission matrix are admin-only.
    Route::middleware('role:admin')->group(function () {
        Route::get('settings', [AdminSettingController::class, 'index']);
        Route::get('settings/{key}', [AdminSettingController::class, 'show']);
        Route::put('settings/{key}', [AdminSettingController::class, 'update']);

        Route::get('users', [UserController::class, 'index']);
        Route::post('users', [UserController::class, 'store']);
        Route::put('users/{user}', [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);

        Route::get('permissions', [UserController::class, 'permissions']);
        Route::put('permissions', [UserController::class, 'updatePermissions']);
    });
});

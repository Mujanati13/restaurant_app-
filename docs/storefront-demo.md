# Storefront demo catalogue

Seed the development-only Swiss marketplace catalogue with:

```powershell
docker compose exec app php artisan vondo:seed-marketplace-demo
```

It is safe to rerun. The seeder creates or updates 24 fictional restaurants across Zurich, Geneva, and Basel; 30 locations; 144 categories; 720 dishes; 120 restaurant-scoped customer accounts; 240 saved addresses; 600 historical/current orders; 90 reservations; 240 verified reviews; and 36 offers (24 valid and 12 expired). It includes published branding, delivery-only and pickup-only locations, unavailable dishes, an empty-menu suspended partner, scheduled/cancelled/payment-pending order states, subscriptions, and operational-alert states. It deliberately is not part of `DatabaseSeeder`, may only run in a local/development/testing environment, and fakes mail, notifications, and queued jobs.

The existing `VondoDemoAccountSeeder` creates the platform and restaurant-owner demo accounts. Menu, customer, order, and reservation fixtures use the TastyIgniter operational schema and should be seeded only after that schema's location, order-status, and payment configuration has been initialized by the normal installer.

Use the **Alpina Pizza** tenant to explore the customer journey with `demo-alpina-pizza-1@vondo.local` and `DemoCustomer!2026`. The normal demo owner account is `owner@vondo.local` / `RestaurantOwner!2026`; the platform admin is `admin@vondo.local` / `VondoAdmin!2026`.

Useful scenarios: customize a size and extras at Alpina Pizza; apply `WELCOME10` on an eligible order; try the expired `LUNCH15`; inspect a pickup-only location at Green Fork and a delivery-only location at La Pomme; use Closed Kitchen for disabled ordering and an empty menu; and view scheduled, cancelled, cash, and payment-pending orders from a demo customer’s account.

To remove only the generated marketplace fixtures and recreate them, run:

```powershell
docker compose exec app php artisan vondo:seed-marketplace-demo --reset
```

The reset command targets the 24 named fixture slugs only; it does not reset the database or alter non-demo restaurants.

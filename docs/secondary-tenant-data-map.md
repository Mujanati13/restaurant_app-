# Vondo Secondary Tenant Data Map

Last updated: 2026-08-11

## Purpose

This inventory classifies the installed database schema after ownership finalization. `restaurant_id` is the trusted tenant key. `vondo:finalize-schema` creates missing ownership columns after package installation, backfills from trusted parents, rejects unresolved/cross-parent rows, and adds tenant foreign keys and indexes.

## Direct tenant roots already implemented

| Tables | Ownership |
| --- | --- |
| `locations`, `categories`, `menus`, `customers`, `orders`, `reservations` | Direct nullable `restaurant_id`, backfilled for the initial tenant, with first-party scopes and explicit controller predicates. |
| `restaurant_domains`, `restaurant_memberships`, `restaurant_roles`, `restaurant_invitations`, `restaurant_features`, `restaurant_settings`, `restaurant_location_settings`, `restaurant_brand_revisions`, `restaurant_pages`, `restaurant_subscriptions`, `app_builds`, `app_build_events`, `app_build_artifacts`, `platform_media_assets`, `platform_user_tokens`, `storefront_analytics_events`, `platform_idempotency_keys`, `platform_audit_logs` | Direct `restaurant_id` with first-party tenant-aware access. |
| `igniter_api_access_tokens` | Direct nullable `restaurant_id`; Vondo login endpoints bind it and tenant middleware enforces it. |

## Secondary tenant-owned data

Every installed table listed below now has an indexed, nullable `restaurant_id` with a foreign key to `restaurants`; the finalizer derives/backfills ownership and rejects mismatches before constraints are added. The parent paths below remain the validation rules for future writes. Nullable columns are retained only for package-install/production-history compatibility until P1-10.

| Root or child tables | Ownership validation path | Write invariant |
| --- | --- | --- |
| `addresses` | `customer_id -> customers.restaurant_id` | Add nullable `restaurant_id`, backfill from customer, then enforce customer/tenant agreement. |
| `dining_areas`, `dining_sections` | `location_id -> locations.restaurant_id` | Add direct ownership or require a location join on every query. Direct ownership is preferred for IDOR-safe lookup. |
| `dining_tables` | Dining area/section ancestry | Add direct ownership after validating both parents belong to one restaurant. |
| `tables` | Referenced by tenant reservations but has no location or tenant key | Add direct `restaurant_id`; assign existing rows to the initial tenant and require ownership on reservation creation. |
| `igniter_coupons` | Global root with menu/category/customer pivots | Add direct `restaurant_id`; validate all pivot targets share that tenant. |
| `igniter_coupon_categories`, `igniter_coupon_customer_groups`, `igniter_coupon_customers`, `igniter_coupon_menus` | Coupon plus tenant-owned targets | Derive through the coupon and reject cross-tenant pivot writes. |
| `igniter_coupons_history` | `order_id` and `customer_id` | Derive from both and require matching tenant ownership. |
| `igniter_reviews` | `location_id` and `customer_id` | Add direct ownership or require both relationships to resolve to the same restaurant. |
| `ingredients`, `mealtimes`, `menu_options` | Global catalog roots, linked to menus | Add direct `restaurant_id`; validate linked menus belong to the same tenant. |
| `ingredientables`, `menu_categories`, `menu_item_options`, `menu_item_option_values`, `menu_item_option_linked_values`, `menu_mealtimes`, `menu_option_values`, `menus_specials` | Tenant-owned menu/category roots | Derive through the menu and validate both sides for every pivot mutation. |
| `order_menus`, `order_menu_options`, `order_totals` | `order_id -> orders.restaurant_id` | Always load through a tenant-scoped order. Never expose a global child lookup. |
| `payment_logs`, `stock_history` | `order_id -> orders.restaurant_id` | Derive through a tenant-scoped order; background jobs must carry restaurant context. |
| `payment_profiles` | `customer_id -> customers.restaurant_id` | Add direct ownership or require tenant-scoped customer traversal for every read/write. |
| `reservation_tables` | `reservation_id -> reservations.restaurant_id` | Load through a tenant-scoped reservation and verify the selected table belongs to that tenant. |
| `location_areas`, `location_options`, `location_settings`, `locationables`, `stocks`, `working_hours` | `location_id -> locations.restaurant_id` | Require tenant-scoped location traversal; add direct ownership where standalone identifiers are accepted. |
| `media_attachments` | Polymorphic attachment | Add explicit `restaurant_id`; backfill only from an allowlisted attachment type and quarantine unresolved rows. |
| `notifications`, `assignable_logs`, `status_history` | Polymorphic subject/notifiable | Carry `restaurant_id` at creation and query by it; do not infer ownership from caller-provided morph IDs. |
| `igniter_frontend_banners`, `igniter_frontend_sliders`, `igniter_frontend_subscribers` | Global storefront roots | Add direct `restaurant_id` before exposing owner CRUD. Prefer `restaurant_pages`/brand sections for new content. |
| `igniter_cart_cart` | Session/customer cart state | Add or verify a tenant namespace; reject cart restoration under a different restaurant. |
| `igniter_automation_rules`, rule actions/conditions, `igniter_automation_logs` | Global automation roots | Keep Super Admin-only until rules and executions carry explicit restaurant context. |

## Global reference or platform-only data

The following remain deliberately global unless product requirements change: countries, currencies, languages/translations, customer groups, statuses/status workflows, payment driver definitions, subscription plans, extensions, themes, mail layouts/templates/partials, system settings, API resource definitions, role/permission definitions, request/system logs, and failed-job infrastructure.

Admin users are platform identities. Restaurant access comes from `restaurant_memberships` and location assignments; a user row by itself never grants tenant access.

Legacy `pages` and frontend content are treated as global/Super Admin-only. New restaurant-specific content belongs in `restaurant_pages`, `restaurant_page_sections`, and brand revisions.

## Migration status

1. [Completed 2026-08-10] Add nullable indexed ownership columns to standalone secondary roots and relevant child tables.
2. [Completed on the active database] Backfill from trusted parents; assign genuinely single-tenant legacy roots to the verified initial restaurant only where provenance is proven.
3. [Completed] Produce unresolved and cross-parent mismatch reports and stop on any mismatch.
4. [Completed] Add tenant foreign keys, composite operational indexes, and tenant-aware customer email uniqueness.
5. [Completed for enabled tenant surfaces] Root and standalone child models have scopes/create hooks; package-only write surfaces remain inaccessible to restaurant owners.
6. [Completed on clean disposable MySQL; production-copy rehearsal remains a release gate] Install all TastyIgniter schemas, bootstrap a tenant, finalize 51 owned tables, and verify zero unresolved rows.
7. [Release gate] Make ownership non-null only after the production-like restored-copy rehearsal proves historical compatibility.

No owner-facing legacy TastyIgniter administration CRUD may be re-enabled during this migration. Owners use `/vondo-admin/`; the global legacy admin surface is Super Admin-only.

# Vondo Multi-Restaurant Platform Plan

> Trackable architecture and implementation plan for converting the current TastyIgniter installation, storefront, and Flutter application into a centrally managed multi-restaurant platform.

## Document control

| Field | Value |
| --- | --- |
| Status | Platform implementation and Docker runtime verification complete; interactive browser QA and final code-freeze Android packaging remain |
| Last updated | 2026-08-11 |
| Platform owner | Super Admin |
| Backend | Laravel 12 + TastyIgniter 4.3 |
| Storefront | Nuxt 3 SSR/PWA |
| Mobile | Flutter customer and vendor apps |
| Primary database | MySQL 8 |

## Status legend

- `[ ]` Not started
- `[~]` In progress (use this marker in status tables and headings)
- `[x]` Completed and verified
- `[!]` Blocked; document the blocker in the issue log

## Progress dashboard

Current tracked backlog: **77 completed, 1 in progress, 0 not started, 1 blocked**. All 17 formerly unstarted items now have implementation. Docker-backed migration, recovery, security, and production smoke gates pass; Android packaging is deliberately deferred until code freeze, and interactive browser QA remains blocked by the unavailable browser backend.

| Phase | Outcome | Status | Gate |
| --- | --- | --- | --- |
| P0 | Baseline and migration safety | Completed | Existing single-restaurant flows are covered by tests |
| P1 | Tenant foundation | Completed | Cross-tenant isolation tests pass |
| P2 | Tenant-aware backend | Completed | All enabled tenant APIs, jobs, cache, locks, rate limits, notifications, and media are tenant-safe |
| P3 | Owner onboarding | Completed | A restaurant can be provisioned idempotently |
| P4 | Storefront and customization | Blocked | Published configuration renders per domain |
| P5 | Mobile platform | In progress | Customer and vendor apps enforce tenant context; final Android release packaging runs only after code freeze |
| P6 | Super Admin | Completed | Platform operations are audited and protected |
| P7 | Build automation and hardening | Completed | Production smoke, backup, and recovery tests pass |

## Goal

Build one centrally managed SaaS platform in which every restaurant owner can:

- Register and create one or more restaurants.
- Operate an isolated restaurant dashboard.
- Publish a branded customer storefront.
- Use a customer ordering application and a vendor/admin application.
- Customize approved colors, text, media, navigation, and page sections.
- Request an optional white-label Android/iOS build.

The Super Admin must be able to manage every restaurant, plan, feature, domain, build, subscription, and support action without weakening tenant isolation.

## Current architecture findings

- TastyIgniter `Location` represents a branch inside one installation; it is not a restaurant tenant.
- Public storefront configuration is global in [`StorefrontConfigController`](../app/Http/Controllers/StorefrontConfigController.php).
- Branding and content are hardcoded in [`home.js`](../storefront/src/pages/home.js), [`router.js`](../storefront/src/router.js), and [`index.css`](../storefront/src/styles/index.css).
- The public catalog routes do not currently resolve an owning restaurant.
- Customer registration currently treats email uniqueness as global.
- Storefront cart and authentication browser storage are not namespaced by restaurant.
- [`mobile_app`](../mobile_app) is a vendor/admin Flutter app, not a customer ordering app.
- The mobile title, visual theme, API endpoint, and restaurant wording are currently application-level values.
- TastyIgniter settings and active themes are global and cannot serve as tenant branding records.

## Architecture decisions

### ADR-001: Use a modular multi-tenant monolith

**Decision:** Keep Laravel/TastyIgniter as the backend and introduce a first-party Vondo Platform extension/module. Do not start with microservices.

**Reason:** A modular monolith keeps transactions, migration, operations, and deployment manageable while the tenant model is being proven.

**Constraint:** Do not edit installed files under `vendor/`. Prefer extension hooks, model extensions, middleware, policies, and application overrides. If an extension point cannot provide safe isolation, maintain a narrow documented package fork.

### ADR-002: Add Restaurant above Location

```text
Platform
└── Restaurant
    ├── Owner and staff memberships
    ├── Branding and content
    ├── One or more locations
    ├── Menus, customers, orders, and reservations
    ├── Storefront domains
    └── Mobile app configuration and builds
```

Restaurant is the tenant boundary. Location remains a branch within a restaurant.

### ADR-003: Use a shared database with explicit tenant ownership

**Decision:** Use one MySQL database with `restaurant_id` ownership, indexed foreign keys, global scopes, policies, and database constraints.

**Reason:** It supports central management and efficient operations without maintaining a database for every small restaurant.

**Rule:** Every tenant-owned query, cache key, upload path, queue payload, notification, export, and audit record must carry tenant context.

### ADR-004: Resolve tenant context from trusted identity

- Storefront web: verified custom domain or Vondo subdomain.
- White-label mobile app: build-time restaurant public key.
- Universal Vondo app: restaurant code plus authenticated membership or customer selection.
- Restaurant dashboard: authenticated restaurant membership.
- Super Admin: separate privileged authorization path with explicit cross-tenant operations.

A client-supplied `restaurant_id` alone must never establish access.

### ADR-005: Separate customer and vendor mobile applications

- `customer_app`: menu, cart, ordering, reservations, profile, and order tracking.
- `vendor_app`: dashboard, orders, reservations, menu availability, and staff operations.
- Shared packages: API client, authentication, tenant configuration, design system, and shared models.

### ADR-006: Runtime customization with optional generated builds

Runtime configuration controls colors, text, sections, navigation, fonts, and most images. App name, bundle ID, icon, splash screen, signing, Firebase configuration, and store listing require a generated mobile build.

## Target system

```text
Customer Web Storefront       Customer Flutter App
          |                           |
          +------------+--------------+
                       |
Restaurant Dashboard --+-- Tenant-aware Laravel/TastyIgniter API
Vendor Flutter App -----+              |
Super Admin Console ----+              +-- MySQL
                                       +-- Redis cache and queues
                                       +-- Object/media storage
                                       +-- Mobile build pipeline
```

## Core data model

Initial platform tables:

- `restaurants`
- `restaurant_domains`
- `restaurant_memberships`
- `restaurant_roles`
- `restaurant_settings`
- `restaurant_features`
- `restaurant_brand_revisions`
- `restaurant_pages`
- `restaurant_page_sections`
- `subscription_plans`
- `restaurant_subscriptions`
- `app_builds`
- `audit_logs`

Tenant ownership must be added directly or inherited safely for:

- locations
- administrator users through memberships
- customers and addresses
- categories, menus, options, ingredients, and stocks
- orders and reservations
- dining areas and tables
- coupons, reviews, notifications, and operational logs
- restaurant-specific statuses and payment settings
- media and configuration

Countries, supported currencies, platform templates, and other immutable reference data can remain global.

## Theme and content model

Owners must customize registered sections, not arbitrary executable HTML or JavaScript.

Initial section registry:

- Hero
- Featured dishes
- Categories
- Promotions
- About
- Locations
- Reservation call-to-action
- Reviews
- Gallery
- Contact information
- Newsletter
- Validated custom text block

Each section requires a validated schema, stable identifier, position, visibility, responsive behavior, content, and media references.

Theme tokens include:

- Primary, secondary, and accent colors
- Background, surface, and text colors
- Heading and body fonts
- Border radius and button style
- Logo, favicon, splash image, and app icon
- Light/dark appearance

Configuration must support draft, preview, publish, revision history, and rollback. Web and mobile consume the same published version.

## API boundaries

Version new routes under `/api/v1`:

- `/api/v1/platform/*` - Super Admin operations
- `/api/v1/owner/*` - owner onboarding and restaurant management
- `/api/v1/vendor/*` - staff operational APIs
- `/api/v1/storefront/*` - customer-facing configuration and commerce APIs

All collection endpoints require bounded pagination, deterministic ordering, allowed filters/sorts, and pagination metadata. State-changing endpoints require request validation, tenant ownership validation, permission checks, and stable 4xx responses.

## Phase checklist

### P0 - Baseline and migration safety

- [x] **P0-01** Inventory all frontend applications, backend routes, models, tables, extensions, jobs, caches, storage paths, and build commands. Route and installed-table inventories are recorded in the platform and isolation documents.
- [x] **P0-02** Map each tenant-owned table and relationship. See `secondary-tenant-data-map.md`.
- [x] **P0-03** Record global reference tables that remain shared. See `secondary-tenant-data-map.md`.
- [x] **P0-04** Add regression tests for storefront bootstrap, catalog, customer authentication, orders, reservations, and vendor APIs. A complete valid storefront flow now exercises bootstrap/catalog, registration/login/account, server-priced ordering, table reservation, and vendor bootstrap/order/reservation reads.
- [x] **P0-05** Add valid, invalid, unauthorized, and boundary API cases. The versioned contract suite covers missing principals, malformed order/reservation payloads, pagination bounds, tenant IDOR, token audience/tenant mismatch, replay, unsafe configuration, and valid business paths.
- [x] **P0-06** Document database backup, restore, migration rollback, and seed behavior.
- [x] **P0-07** Capture current Docker health, routes, logs, and production build results. Docker services and public proxy paths were verified on 2026-08-10.
- [x] **P0-08** Define the existing installation as the initial restaurant migration target.

**P0 gate:** Existing single-restaurant behavior is reproducible, backed up, and covered by focused tests.

### P1 - Tenant foundation

- [x] **P1-01** Create the first-party Vondo Platform extension/module.
- [x] **P1-02** Add `restaurants`, domains, memberships, roles, features, and audit tables. Tenant-scoped custom roles and permission templates are managed alongside the core platform tables.
- [x] **P1-03** Add stable public UUID/ULID identifiers.
- [x] **P1-04** Implement `TenantContext` and trusted tenant resolver middleware.
- [x] **P1-05** Add restaurant ownership columns as nullable migrations. Core and classified secondary/media roots and children now carry indexed nullable ownership columns.
- [x] **P1-06** Provision the existing installation as the initial restaurant. The Foodly tenant is provisioned in the Docker database.
- [x] **P1-07** Backfill existing locations, users, customers, menus, orders, reservations, media, and settings. Core and secondary/media records have zero unresolved rows in the checked active database; the idempotent bootstrap now also backfills operational defaults, features, and the home page.
- [x] **P1-08** Verify core backfill counts and relationship integrity. Locations, categories, menus, customers, orders, and reservations were checked for the initial tenant.
- [x] **P1-09** Add foreign keys, indexes, and composite uniqueness. The idempotent schema finalizer validates/backfills 52 tenant-owned tables, adds tenant foreign keys and operational composite indexes, and enforces tenant-aware customer email uniqueness; it passes both the active database and a restored disposable MySQL rehearsal.
- [x] **P1-10** Enforce non-null tenant ownership after verification. The guarded migration is applied, and the finalizer reports zero unresolved ownership rows across all 52 classified tables on both the primary and restored-copy databases.
- [x] **P1-11** Add tenant scopes and policies without weakening Super Admin controls. Core model scopes, tenant-bound token checks, Super Admin policies, and reusable restaurant permission policies now protect owner operations; tenant-defined roles are enforced across dashboard, order, reservation, catalog, customer, location, team, settings, branding, and build capabilities.
- [x] **P1-12** Add cross-tenant read, write, update, delete, cache, media, session, analytics, notification, and asynchronous-job isolation tests. Forty-four database-backed platform/security cases (301 assertions) cover all listed boundaries plus valid option-priced commerce/vendor flows, invitations/custom roles, onboarding, privileged MFA, reporting/export, external builds/downloads, rate limiting, retention, and legacy API/storefront retirement.

**P1 gate:** Restaurant A cannot discover or modify Restaurant B data through any tested route or identifier.

### P2 - Tenant-aware backend

- [x] **P2-01** Introduce versioned platform, owner, vendor, and storefront route groups.
- [x] **P2-02** Tenant-scope catalog, locations, customers, orders, reservations, dining tables, and dashboards. Vondo routes use explicit tenant predicates, installed root/secondary models receive tenant scopes/create ownership, 52 owned tables have validated non-null tenant keys, and unsafe package storefront/API surfaces are retired.
- [x] **P2-03** Replace global restaurant configuration reads with layered platform, restaurant, and location settings. Platform defaults are captured during provisioning, restaurant settings override them, and tenant-validated location settings override service/status behavior for bootstrap, orders, and reservations; the owner portal exposes per-location service controls.
- [x] **P2-04** Support tenant-specific customer email uniqueness and authentication.
- [x] **P2-05** Bind access tokens and session state to tenant membership. Customer, owner, and vendor tokens now carry and enforce `restaurant_id`.
- [x] **P2-06** Tenant-scope media object keys and retrieval authorization. Media assets use opaque IDs, server-controlled tenant-prefixed keys, validated image content, a configurable local/S3 disk, and tenant-resolved retrieval with cross-tenant denial tests.
- [x] **P2-07** Tenant-scope cache keys, locks, rate limits, queue payloads, notifications, imports, and exports. First-party caches, idempotency/refresh locks, named rate-limit keys, jobs, build/customer/owner notifications, media, and exports carry tenant context. Package import/export/automation surfaces remain inaccessible to owners and are Super Admin-only.
- [x] **P2-08** Add idempotency support for provisioning, order creation, payments, and build requests. Every currently enabled money/workflow creation path (onboarding, orders, reservations, and build requests) is replay-safe and tenant-partitioned; no payment-capture endpoint is enabled, and any future capture contract must use the same primitive before release.
- [x] **P2-09** Add correlation IDs and user-safe API error mapping. API responses emit `X-Request-ID`, logs receive correlation context, and unexpected JSON failures hide internals while preserving validation/HTTP errors.
- [x] **P2-10** Audit raw database queries and unscoped TastyIgniter core paths. Tenant-facing first-party queries are scoped, generic CRUD/token endpoints return `410`, legacy public theme/cart/account/checkout mutations are retired, and unscoped package administration/import/export/automation remains Super Admin-only. See `tenant-isolation-audit.md` and `secondary-tenant-data-map.md`.

**P2 gate:** Tenant context is enforced across synchronous APIs and asynchronous processing.

### P3 - Owner onboarding and dashboard

- [x] **P3-01** Implement owner registration, email verification, login, refresh, and password recovery. Self-service portal forms and tenant-bound APIs use queued email delivery plus hashed, expiring, single-use verification/recovery tokens; password reset revokes all sessions.
- [x] **P3-02** Implement restaurant lifecycle states: draft, trial, active, suspended, archived.
- [x] **P3-03** Provision restaurant, owner membership, default role, location, settings, features, page defaults, and branding in one idempotent workflow. Transactional provisioning, request replay safety, and idempotent adoption of existing tenants are verified.
- [x] **P3-04** Build an onboarding checklist with resumable progress. The owner dashboard derives and persists completion from restaurant, location, menu, branding, and domain state.
- [x] **P3-05** Tenant-scope the TastyIgniter operational dashboard. The Vondo owner workspace provides tenant-safe dashboard metrics, orders, reservations, catalog, customers, locations, and team management; legacy TastyIgniter admin routes are restricted to the Super Admin.
- [x] **P3-06** Add restaurant staff invitations, roles, permissions, and location assignments. Owners can manage reusable permission templates and send tenant-bound, expiring, single-use email invitations with location assignments; acceptance provisions an active staff membership and rejects replay/cross-tenant role references.
- [x] **P3-07** Add restaurant settings, domain, feature, and mobile build pages. The owner portal covers settings, domains, branding, catalog, operations, customers, locations, staff, subscription visibility, and build requests.
- [x] **P3-08** Implement loading, empty, validation, permission, success, and failure states in the Vondo owner portal.
- [x] **P3-09** Add owner activity auditing for implemented settings, branding, domain, media, and build operations.

**P3 gate:** Repeating a failed onboarding request never creates duplicate restaurants or partially owned records.

### P4 - Storefront and customization

- [x] **P4-01** Define the tenant storefront bootstrap DTO and schema.
- [x] **P4-02** Implement domain/subdomain resolution and trusted host validation.
- [x] **P4-03** Add brand revision and page-section CRUD APIs. Revision list/create/publish/rollback plus tenant-isolated multi-page create/read/update/delete and atomic section replacement are implemented.
- [x] **P4-04** Add server-side schema validation and safe media handling. Registered page sections and branding payloads are validated; media uses opaque records, safe keys, per-file MIME/size limits, configurable storage, and tenant-resolved delivery.
- [x] **P4-05** Build draft preview, publish, revision history, and rollback. The owner portal provides a live draft preview and verified revision actions.
- [x] **P4-06** Replace hardcoded storefront branding, text, navigation, footer, and homepage sections. Published tenant configuration now drives shared identity, theme, hero/footer copy, header/footer navigation labels, and homepage section visibility with safe internal-link validation and fallback defaults.
- [x] **P4-07** Namespace cart, authentication, cached data, and analytics by restaurant. Web/mobile credentials and carts plus allowlisted first-party storefront analytics sessions/events use tenant-specific keys and database ownership.
- [x] **P4-08** Migrate the storefront to a Nuxt SSR/PWA application. Nuxt SSR, Nitro output, and Workbox service worker build successfully.
- [x] **P4-09** Generate restaurant-specific metadata, sitemap, canonical URLs, and social previews. Tenant SSR head data and dynamic sitemap/robots routes are implemented.
- [x] **P4-10** Add custom-domain ownership verification and automated TLS support. DNS/HTTP ownership checks, SSRF-safe public-host validation, lifecycle state, and signed provider provisioning are implemented.
- [!] **P4-11** Verify desktop, tablet, mobile, keyboard, zoom, reduced-motion, empty, offline, and error states. SSR happy/empty/catalog-error/bootstrap-error states, PWA caches, focus styling, breakpoints, and reduced-motion contracts pass against the tenant fixture; interactive viewport/zoom/keyboard inspection is blocked by BLK-007.

**P4 gate:** Two domains render different published branding and catalogs from the same deployment with no storage or session crossover.

### P5 - Mobile platform

- [x] **P5-01** Create a Flutter workspace with `customer_app`, `vendor_app`, and shared packages. Customer and vendor applications now consume the local `vondo_shared` package for validated tenant theme parsing and tenant-partitioned storage keys; the package unit test passes and both app dependency graphs resolve it.
- [x] **P5-02** Move the current vendor API, session, models, and design primitives into reusable packages. Shared transport/session, stable errors, design states, theme, links/services, and vendor DTOs analyze cleanly in all three packages.
- [x] **P5-03** Add tenant configuration bootstrap, validation, cache, and safe fallback behavior. Customer and vendor apps validate shared theme values, persist public tenant bootstrap data under tenant-scoped keys, restore it when offline, and still clear invalid/unauthorized sessions; focused offline tests pass.
- [x] **P5-04** Namespace secure storage, local cache, cart, and sessions by restaurant. Customer/vendor access and rotating refresh tokens plus customer cart state use tenant-specific secure-storage keys; coordinated refresh persists rotated credentials.
- [x] **P5-05** Build customer authentication, catalog, menu detail, cart, checkout, reservations, account, and order tracking. The customer app supports required/single/multi/quantity menu options with server-authoritative pricing, tenant-aware cart persistence, delivery/collection checkout, reservations, account/history, and chronological order status tracking.
- [x] **P5-06** Update the vendor app for restaurant membership plus location selection.
- [x] **P5-07** Apply published theme tokens to the storefront and both mobile applications.
- [x] **P5-08** Add tenant-aware deep links and push notifications. Cross-tenant links are rejected; platform association files, Firebase client lifecycle, encrypted token registration, and signed tenant-scoped delivery jobs are implemented.
- [x] **P5-09** Add Android/iOS flavors for white-label identity assets and bundle identifiers. Universal/white-label Android flavors and six iOS build configurations/shared schemes are present; all Dart analyzers and static flavor checks pass.
- [~] **P5-10** Add unit, widget, integration, offline, unauthorized, and cross-tenant tests. Six vendor tests, two customer tests, the shared-package tests, and both Flutter analyzers pass. Earlier customer/vendor integration journeys passed on compiled Windows runners and an Android emulator. Because signing, flavor, deep-link, and release-entitlement configuration changed afterward, current Android APK packaging is reserved for the final code-freeze task and the older APKs are not accepted as release evidence. iOS App Store signing remains a production release activity under P7.

**P5 gate:** A customer or vendor session from one restaurant cannot be reused against another restaurant, including after app restart.

### P6 - Super Admin

- [x] **P6-01** Create a separate Super Admin guard and explicit platform authorization policies. Super Admins now use a dedicated `platform_admins` table, model, provider, guard, `platform:*` token principal, active-session checks, refresh policy, and MFA; the legacy TastyIgniter superuser is retained only for the separately protected legacy administration area.
- [x] **P6-02** Build restaurant search, detail, lifecycle, domain, feature, subscription, and usage screens. Provisioning and all listed management screens are implemented in the responsive console.
- [x] **P6-03** Add platform templates and default configuration management. Versioned validated defaults, provisioning integration, seeding, API, audit, and console screens are implemented.
- [x] **P6-04** Add build queue status, logs, retry, cancellation, and artifact history. Owner and Super Admin portals expose audited controls, chronological event logs, manifest artifact checksums/expiry, failure details, and history-ready artifact records.
- [x] **P6-05** Add audited support impersonation with reason, expiry, and visible banner. Sessions are tenant-bound, single-use, time-limited, revocable, audited, and visibly identified in the owner console.
- [x] **P6-06** Add platform reporting using tenant-safe aggregates. The console includes bounded daily order/revenue/reservation/restaurant time series and authenticated CSV export in addition to overview aggregates.
- [x] **P6-07** Add alerts for failed jobs, unhealthy restaurants, domain errors, and payment issues. Scheduled reconciliation, acknowledgement, resolution, API, and console views are implemented.
- [x] **P6-08** Require stronger authentication and session controls for privileged operations. Privileged sessions use scoped 15-minute access tokens, one-day rotating refresh tokens, replay rejection, logout revocation, and TOTP MFA with replay-safe counters and one-time recovery codes.

**P6 gate:** Every cross-tenant support or management action is authorized, time-bounded where appropriate, and auditable.

### P7 - Build automation and production hardening

- [x] **P7-01** Add Redis-backed cache, sessions, queues, and a dedicated queue worker.
- [x] **P7-02** Add tenant-prefixed object storage for media and build artifacts. Both use server-controlled tenant prefixes and configurable Laravel disks, supporting private local storage or production S3-compatible object storage without changing API contracts.
- [x] **P7-03** Implement queue-driven Android/iOS build state machine. Queueing, preparation, signed external submission/callback, building/success/failure, cancellation, retry, checksummed tenant-prefixed artifacts, secure owner downloads, retention, and notifications are implemented; production compiler credentials are deployment configuration.
- [x] **P7-04** Store signing keys and store credentials in a secret manager, never in source control or client bundles. Production accepts authenticated `secret://` or mounted `file://` references; literal/environment secrets are rejected.
- [x] **P7-05** Add build logs, retries, cancellation, artifact retention, and failure notifications. Build events, audited controls, checksummed artifact records, scheduled expiry pruning, and queued requester failure emails are implemented and tested.
- [x] **P7-06** Add configurable Docker ports, PHP-FPM tuning, service health checks, Redis, and startup configuration validation.
- [x] **P7-07** Add database, queue, object storage, API, storefront, and build monitoring. Live/ready endpoints, dependency probes, stalled-build detection, alerts, and scheduled monitoring are implemented.
- [x] **P7-08** Run migration rehearsal on a production-like copy. `scripts/verify-platform.ps1` backed up the active database, restored it into disposable MySQL, applied all migrations, and finalized 52 tenant-owned tables with zero unresolved rows.
- [x] **P7-09** Run tenant isolation and authorization security testing. The final file-level Docker run passed 45 feature tests and 304 assertions, including 44 platform/security cases and 301 assertions.
- [x] **P7-10** Run backup restore and disaster recovery exercises. The backup, SHA-256 capture, disposable restore, migration/finalization, and cleanup workflow passed; evidence is written under `.platform-verification`.
- [x] **P7-11** Complete production smoke tests: health, login/refresh, list, write, upload, ordering, reservation, publish, and vendor status update. The production-proxy workflow passes and verifies post-write queue health with zero failed jobs.

**P7 gate:** Production deployment, migration, rollback, backup restoration, and core vertical-slice smoke tests are documented and verified.

## First complete vertical slice

Implement this flow before expanding the platform broadly:

1. Owner registers and verifies email.
2. Restaurant, owner membership, default role, location, settings, and draft theme are provisioned.
3. Owner changes branding and publishes it.
4. Tenant storefront loads through its subdomain.
5. Customer registers and places an order.
6. Vendor app displays the order for the correct restaurant and location.
7. Vendor changes the status.
8. Customer sees the update.
9. Super Admin sees restaurant health and the audited activity.

## Verification required for every vertical slice

### Owner and Super Admin portal verification — 2026-08-10

- [x] Regular Restaurant Owner login and tenant-bound session verified with `owner@vondo.local`.
- [x] Owner bootstrap, dashboard, orders, reservations, menus, customers, locations, team, settings, branding, domains, subscription, and app-build endpoints returned `200`.
- [x] Menu write returned `200`; an invalid cross-tenant category reference returned `422`.
- [x] Dedicated Super Admin login plus overview, restaurant list/detail, build list, audit log, and subscription plan endpoints returned `200`.
- [x] A Restaurant Owner token attempting a platform endpoint returned `403`.
- [x] Vondo portal JavaScript and CSS passed syntax/static checks and were served through Nginx with `200`.
- [x] Focused PHPUnit suite passed: 6 tests, 26 assertions.
- [x] Database-backed tenant hardening suites passed: 33 tests and 234 assertions covering valid order/reservation/vendor flows, invalid/boundary inputs, secondary ownership/scopes, cache partitioning, onboarding replay safety, owner verification/recovery, staff invitations/custom roles, access/refresh rotation, separate Super Admin token/MFA boundaries, correlation IDs, catalog/checkout isolation, analytics, page/media isolation, owner/vendor/platform mutation authorization, reporting/export, build logs/artifacts/retention, legacy API retirement, uploads, queues, and idempotency.
- [x] Complete backend PHPUnit suite passed in file-level runs after the monolithic runner exceeded its buffered command ceiling: 40 tests and 261 assertions; the subsequent dedicated-provider regression pass also passed 4 focused tests with 41 assertions.
- [x] Docker app, database, Redis, storefront, queue, scheduler, and webserver services reported healthy after restart; all migrations through the separate platform-administrator migration batch 26 are applied.
- [!] Interactive browser visual QA could not run because the browser runtime reported zero available sessions; responsive, focus, empty, loading, and reduced-motion behavior were implemented and statically reviewed.

- [x] Unit tests for validation, mapping, configuration, and state transitions.
- [x] API tests for valid, invalid, unauthenticated, unauthorized, cross-tenant, and boundary inputs. The final Docker-backed run passed all 45 feature tests and 304 assertions.
- [x] Database migration test on a disposable restored database. All migrations and tenant finalization pass with zero unresolved ownership rows across 52 tables.
- [x] Database migration and backfill test on an existing production-like copy. Backup, restore, migration, backfill/finalization, and checksum evidence pass.
- [x] Storefront production build.
- [~] Flutter analysis and focused unit/widget tests pass; release packaging is the final code-freeze task.
- [!] Desktop, tablet, and mobile interactive UI checks are blocked by BLK-007; fixture-driven SSR/state and static accessibility contracts pass.
- [x] Docker health, API/storefront proxy paths, routes, workers, scheduled monitoring, and post-write queue behavior pass with zero active alerts and zero failed jobs.
- [x] One list, write, upload, and failure/retry path.
- [x] Documentation and rollback note updated.

## Migration order

1. Back up and verify restoration.
2. Add new tenant tables.
3. Create the initial restaurant.
4. Add nullable restaurant ownership columns.
5. Backfill and validate record counts.
6. Add indexes, foreign keys, and composite unique constraints.
7. Activate tenant resolver, scopes, and policies in single-tenant compatibility mode.
8. Run regression and cross-tenant test suites.
9. Enforce non-null tenant ownership.
10. Enable owner onboarding only after the isolation gate passes.

## Main risks

| Risk | Mitigation | Status |
| --- | --- | --- |
| TastyIgniter global settings and active theme | Tenant settings/branding drive Vondo clients; legacy theme administration is Super Admin-only | Mitigated; package upgrades require audit |
| Unauthenticated APIs have no tenant user context | Resolve tenant from trusted host before API repository execution | Resolved for enabled Vondo APIs |
| Raw queries can bypass model scopes | Inventory raw queries, retire unsafe package routes, and add integration isolation tests | Resolved for enabled tenant surfaces |
| Customer email is globally unique | Change to tenant-aware authentication and composite uniqueness | Resolved |
| Roles currently belong directly to admin users | Introduce restaurant memberships with per-restaurant roles | Resolved |
| Menus and availability are currently shared globally | Add restaurant ownership and explicit location availability | Resolved |
| Browser and mobile local state can cross tenants | Prefix all persisted state with the restaurant public ID | Resolved |
| White-label builds require signing and store coordination | Use a signed external compiler adapter; store/provider credentials remain deployment configuration | Mitigated in code; provider onboarding open |
| Existing Docker/PHP runtime has shown worker saturation | PHP-FPM tuning, health checks, Redis, and a queue worker are implemented; production load testing remains | Mitigated in code; runtime test open |

## Implementation checkpoint - 2026-08-11

Completed verification:

- All PHP files below `app`, `routes`, and `database/migrations` pass syntax validation.
- The Nuxt 3 storefront passes type checking and its production SSR/PWA build, including the service worker and tenant-independent `/health` route.
- The owner/Super Admin portal JavaScript passes Node syntax validation.
- The vendor Flutter app passes static analysis and six focused unit/widget tests; the customer app passes static analysis and two focused tests; the shared mobile package tests pass.
- Android release flavors no longer use debug signing. The external compiler receives tenant identity, verified domain, Dart defines, and secret references; signed build callbacks publish Android/iOS association identities.
- Production iOS configurations use release entitlements while debug/profile configurations retain development entitlements; project files pass static validation.
- Fixture-driven SSR checks pass for happy, empty, catalog-error, and bootstrap-error storefront states, tenant metadata, sitemap, robots, manifest, PWA caches, focus-visible, reduced-motion, and responsive CSS contracts.
- Previous APK hashes are intentionally retired as evidence because they predate the latest signing/flavor/deep-link configuration. No Android build is run during active development.
- `docker compose config --quiet` succeeds with required secrets supplied.
- The consolidated Docker verifier passes backup/restore, restored-copy and primary migrations, 45 tests/304 assertions, idempotent account seeding, and production-proxy smoke; `.platform-verification/evidence.json` and `smoke.json` capture the result.

### Development verification policy

- During active development, use formatting, static analysis, focused unit/widget tests, PHP syntax checks, JavaScript syntax checks, Nuxt type checking, and contract/configuration validation.
- Do not run `flutter build apk`, `flutter build appbundle`, or equivalent Android packaging after ordinary code changes.
- After code freeze, run the reproducible `scripts/verify-mobile-release.ps1` gate once for both apps, record artifact size/SHA-256, and then proceed to signing/provider/device validation.
- Any code change after that release gate invalidates its APK evidence and requires one final rerun.

Production release work still required before public store distribution:

- At code freeze, run `scripts/verify-mobile-release.ps1`; this is the final local Android packaging task and must not be repeated during feature development.
- Configure production compiler URL/HMAC secret, signing environment, and object-storage credentials; the provider-neutral submission/callback/download adapter is implemented and tested.
- Run iOS signing/device/App Store validation on macOS/Xcode.

## Issue and blocker log

Add one row whenever work is blocked or a risk becomes an active defect.

| Date | ID | Phase | Description | Owner | Resolution/status |
| --- | --- | --- | --- | --- | --- |
| 2026-08-08 | BLK-001 | P0-P1 | Docker Desktop was offline, preventing migration/backfill and authenticated API smoke tests. | Platform owner | Resolved 2026-08-10: Docker services, migrations, seeders, proxy paths, and authenticated API checks are healthy. |
| 2026-08-08 | BLK-002 | P0 | Framework-booted Artisan/PHPUnit commands timed out while the database runtime was unavailable. | Platform owner | Resolved 2026-08-10: framework tests run against MySQL; the tenant isolation feature suite passes. |
| 2026-08-08 | BLK-003 | P5 | Android Gradle builds stalled and no Android device was connected. | Mobile/build owner | Resolved 2026-08-11: Android licenses were interactively reviewed/accepted, the `vondo_ci` emulator was created, Gradle memory/workers were bounded, and customer/vendor integration journeys plus release APKs pass. Device testing exposed and fixed a vendor `MainActivity` namespace crash and an order-card overflow. iOS store certification remains P7 release work on macOS. |
| 2026-08-10 | BLK-004 | P0/P7 | Clean-database rehearsal could not use the persisted MySQL root account. | Platform owner | Resolved 2026-08-11: the disposable `db_clean` Compose profile ran `igniter:up`, bootstrap, schema finalization, and zero-unowned validation successfully, then was removed. |
| 2026-08-10 | BLK-005 | P5 | Flutter analyzers timed out while the shared cache was locked by stale tooling processes. | Mobile/build owner | Resolved 2026-08-11: isolated per-app `APPDATA` caches allow both analyzers and all focused mobile tests to pass without touching unrelated processes. |
| 2026-08-11 | BLK-006 | P1/P7 | Docker Desktop could not expose either engine pipe, preventing MySQL migrations, PHPUnit security tests, restored-copy/DR exercises, and production smoke tests. | Platform owner | Resolved 2026-08-11: Docker became available and `scripts/verify-platform.ps1` passed backup/restore, migrations/finalization, 45 tests/304 assertions, seeding, monitoring, and production smoke. |
| 2026-08-11 | BLK-007 | P4 | No browser backend is exposed to this session, so interactive desktop/tablet/mobile, keyboard, zoom, and visual inspection cannot run. | Platform owner | Open: make the in-app browser or Chrome backend available, then run the P4-11 viewport/accessibility matrix. HTTP-rendered state and offline-contract checks already pass. |

## Decision log

Record changes to the approved architecture here before implementing them.

| Date | Decision | Reason | Impacted phases |
| --- | --- | --- | --- |
| 2026-08-08 | Restaurant is a new tenant above Location | Locations are branches and cannot safely represent unrelated restaurants | P1-P7 |
| 2026-08-08 | Shared database with explicit row-level tenant ownership | Best balance for central management, cost, and current scale | P1-P7 |
| 2026-08-08 | Modular monolith before microservices | Reduces operational and transactional complexity | P1-P3 |
| 2026-08-08 | Separate customer and vendor Flutter applications | Clearer security, UX, permissions, and release lifecycle | P5 |
| 2026-08-08 | Runtime branding plus optional white-label builds | Avoids source duplication while supporting unique store identities | P4-P7 |

## Completion definition

The transition is complete only when:

- Every tenant-owned backend operation is restaurant-scoped and covered by isolation tests.
- Owners can self-register, provision, configure, publish, and operate a restaurant.
- Storefront web and customer mobile app use the same published tenant configuration.
- Vendor users can only access permitted restaurants and locations.
- Super Admin can manage the platform through explicit audited permissions.
- Optional white-label builds are repeatable without copying or manually editing source code.
- Migration, deployment, backup, restoration, monitoring, and rollback procedures are verified.

## Estimate

The production MVP is approximately 16-22 engineering weeks for a small experienced team. Tenant isolation and migration safety are the critical path; customization and app generation must not be enabled before their security foundations pass.

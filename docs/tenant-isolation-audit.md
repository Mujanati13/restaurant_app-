# Vondo Tenant Isolation Audit

Last updated: 2026-08-11

## Scope and rule

Restaurant is the tenant boundary. A request may use a resource only when the trusted `TenantContext`, authenticated principal, access-token `restaurant_id`, resource `restaurant_id`, and any selected location all resolve to the same restaurant.

The audit covers first-party Vondo storefront, owner, vendor, and Super Admin HTTP routes in `routes/api.php`, raw database calls, cache/media/analytics/notifications/jobs/rate limits, the externally registered TastyIgniter API and public theme surfaces, and installed legacy administration/import/export/automation controllers. Secondary tables are classified in `secondary-tenant-data-map.md`.

## Findings fixed

| Boundary | Finding | Resolution | Regression coverage |
| --- | --- | --- | --- |
| Customer registration | A registered customer was not explicitly assigned the resolved restaurant. | Registration now persists `restaurant_id` inside the registration transaction. | Registration row must contain tenant B ID. |
| Customer login | Authentication began with a global email lookup even though email uniqueness is per restaurant. | Login now selects by resolved `restaurant_id` and normalized email before password validation. | The same email can log into tenant B with tenant B credentials. |
| Storefront checkout | Submitted menu IDs were loaded without a restaurant constraint. | Menu lookup now requires the active `restaurant_id`; location is re-queried with the same constraint. | Tenant A checkout with a tenant B menu returns `422`. |
| Storefront history | Customer ID was the only order/reservation query boundary. | Order and reservation list/detail queries now also require the active `restaurant_id`. | Customer tokens are rejected when replayed under another tenant. |
| Vendor operations | Location assignment constrained operations, but order/reservation queries lacked an explicit restaurant predicate. | Dashboard, list, and status-update queries now require both restaurant and location. | Foreign location, menu, order, and reservation mutations are rejected. |
| Generic API token | `/api/token` could mint caller-selected abilities, including `*`, without tenant binding. | The unsupported legacy token endpoint now returns `410`; clients must use scoped `/api/v1` login endpoints. | Arbitrary ability-minting request returns `410`. |
| Generic API CRUD | Installed `/api/*` resources included tenant-owned and secondary resources without a complete tenant model map. | Generic API resource routes now return `410`; supported clients already use `/api/v1`. Legacy web extension management remains available only to the Super Admin. | `/api/menus` returns `410` while `/api/v1/storefront/bootstrap` remains available. |
| Legacy administration | Installed `admin/*` remap controllers accept multiple verbs and operate on models that are not comprehensively tenant-scoped. | The authenticated `igniter:admin` route group is restricted to a real Super Admin. Restaurant owners use `/vondo-admin/`. | Owner session receives `403`; Super Admin dashboard remains `200`. |
| Owner operations IDOR | Domain/build tests did not cover core operational mutation routes. | Orders, reservations, menus, categories, locations, and team membership updates resolve identifiers inside the active tenant. | Six foreign-resource mutation requests return `404` and foreign rows remain unchanged. |
| Vendor status IDOR | Vendor queries were explicitly scoped but foreign order/reservation mutation lacked route coverage. | Existing restaurant and selected-location predicates are now regression tested. | Foreign order and reservation status changes return `404` without changing status. |
| Build queue payload | Build ID resolved the tenant indirectly but the queued payload did not carry tenant context. | New jobs carry `restaurantId`; handle/failure queries require a matching build and restaurant. Old serialized jobs remain compatible through a nullable fallback. | Matching job writes a tenant-prefixed manifest; mismatched tenant raises not-found. |
| Brand upload | Branding uploads were tenant-prefixed and validated but had no database-backed boundary test. | The upload contract is now covered using isolated fake storage. | Image path includes restaurant public ID; a PHP payload returns `422`. |
| Secondary data | Installed child/root tables lacked a direct, queryable tenant key. | A reversible migration adds indexed nullable ownership to classified secondary tables, derives it from trusted parents, and backfills verified legacy rows to the initial tenant. Model roots receive automatic scope/create ownership. | Active checked tables have zero unresolved rows; coupon scope and automatic ownership are tested. |
| Sessions | Access tokens had no expiry or refresh rotation. | Customer, owner, vendor, and platform logins now issue expiring access plus hashed, single-use refresh tokens bound to tenant and audience. | Rotation succeeds once; replay and cross-restaurant use return `422`. |
| Cache | No first-party tenant cache-key contract existed. | `TenantCache` prefixes restaurant ID and storefront published-brand cache uses the contract. | Identical logical keys differ between tenants. |
| Error tracing | API failures lacked a stable request identifier. | API middleware emits `X-Request-ID` and logging context; unexpected JSON errors return a safe message and request ID. | Success and validation responses preserve correlation headers. |
| Owner onboarding replay | Retrying owner provisioning could encounter uniqueness errors or risk partial duplication. | A global hashed request contract stores completed onboarding responses transactionally and rejects key reuse with different input. | Repeating the same request/key returns the original restaurant with `Idempotent-Replay: true` and one owner row. |
| Protected media | Public storage URLs bypassed tenant resolution. | Media now uses opaque records, private/configurable disks, server-generated tenant keys, and a tenant-resolved delivery endpoint. | Tenant A retrieves its image; tenant B receives `404`. |
| Owner account links | Registration lacked verification/recovery and a reset could leave old sessions valid. | Hashed, expiring, single-use tokens are tenant-bound; queued mail links activate/reset and password changes revoke all access/refresh tokens. | Verification, replay rejection, reset, revoked-session denial, and new-password login are tested. |
| Staff roles and invitations | Staff creation had only fixed roles and owner-selected passwords. | Owners manage tenant-scoped permission templates and send hashed, expiring, single-use invitations with tenant-validated locations. | Cross-tenant role references return `404`; acceptance creates one membership and replay is rejected. |
| Storefront analytics | No tenant-owned analytics contract existed. | An allowlisted first-party event endpoint stores anonymous tenant/session-owned events. | The same session UUID under two restaurants produces two explicitly owned rows; arbitrary events return `422`. |
| Privileged MFA | Platform scope and short expiry did not provide a second factor. | Super Admin TOTP includes replay-safe counters and one-time hashed recovery codes. | Missing, replayed, and reused recovery codes are rejected. |
| Platform reporting | Aggregate reporting had no bounded time-series/export contract. | Daily metrics use bounded date filters and authenticated CSV streaming. | Seven-day JSON/CSV and over-limit validation are tested. |
| Build history | Build status had no durable event/artifact retention record. | Tenant-owned events, checksummed artifacts, audited controls, expiry pruning, and requester failure mail are implemented. | Job success/failure, platform cancel/retry, artifact ownership, and pruning are tested. |
| Rate limiting | Numeric limits shared counters by actor/IP without an explicit restaurant partition. | Owner, vendor, storefront, and tenant-auth route groups use named limiters keyed by trusted restaurant plus actor/IP. | Identical IP requests produce different keys for two restaurant contexts. |
| Legacy public storefront | Package theme/cart/account/checkout routes could bypass Vondo tenant contracts. | Legacy reads redirect permanently to the configured storefront; legacy mutations return `410`. | Cart redirect and checkout retirement are asserted while Vondo bootstrap remains healthy. |
| Build artifact delivery | Compiler artifacts existed but had no tenant-authorized delivery endpoint. | Owner download resolves membership, build, artifact, tenant, expiry, and configured storage before streaming. | Current-tenant download succeeds; a foreign build/artifact returns `404`. |
| Raw database calls | Query-builder calls can bypass Eloquent scopes. | Tenant-facing calls use explicit tenant predicates or already tenant-resolved parent IDs; schema/bootstrap and Super Admin aggregate calls are intentionally privileged. | Route isolation suites plus clean-schema ownership validation cover enabled surfaces. |

## Verified first-party boundaries

- Tenant resolution accepts verified domains/subdomains; the tenant header is configuration-gated and enabled only for local/test clients.
- Customer operations require customer row ownership, token tenant ownership, and `storefront:*` ability.
- Owner/vendor operations require active membership plus a token bound to the same restaurant.
- Owner resources use tenant relations or explicit `restaurant_id` predicates for domains, branding, builds, orders, reservations, menus, categories, customers, locations, and team memberships.
- Super Admin routes require a real superuser and a `platform:*` or `*` token.
- Owner identifiers cannot mutate another tenant's domain or app build.
- Idempotency records are partitioned by restaurant, operation, and idempotency key.
- Rate-limit counters, rotating-session locks, build jobs, notification recipients, cache keys, and private object keys preserve tenant context.
- Package-level public CRUD/token/cart/checkout surfaces are retired; legacy administration, imports, exports, and automation remain Super Admin-only and are not owner APIs.

## Database-backed regression suite

`tests/Feature/TenantIsolationTest.php` and `tests/Feature/TenantInfrastructureIsolationTest.php` currently verify:

1. Customer registration persists the resolved restaurant.
2. A customer token cannot be replayed against another restaurant.
3. Same-email customers authenticate within the resolved restaurant.
4. Tenant A cannot view or purchase tenant B menu records.
5. A multi-membership owner token is still bound to the restaurant selected at login.
6. An owner cannot mutate another tenant's domain or app build by identifier.
7. An owner token cannot access Super Admin routes.
8. Generic CRUD and arbitrary ability-minting endpoints are retired with `410`.
9. Vendor location selection and menu mutation reject foreign tenant identifiers.
10. Branding uploads use tenant-prefixed keys and reject non-images.
11. Build jobs write tenant-prefixed manifests and require matching restaurant context.
12. Identical idempotency keys are independent between restaurants.
13. Restaurant owners cannot enter legacy administration, while the Super Admin retains access.
14. Owner operational mutation routes reject foreign orders, reservations, menus, categories, locations, and team memberships.
15. Vendor status routes reject foreign orders and reservations.
16. Owner page CRUD and protected media delivery reject foreign tenant identifiers.
17. Owner verification/recovery tokens are tenant-bound and revoke sessions on reset.
18. Storefront analytics events are explicitly tenant-owned and schema allowlisted.
19. Super Admin reports are bounded/exportable and MFA prevents TOTP/recovery replay.
20. Build logs, artifacts, notifications, retention, secure downloads, and platform controls preserve tenant context.
21. Rate-limit keys are independent between restaurants even for the same client IP.

The suite uses database transactions and leaves seeded/runtime data unchanged.

## Continuing controls

- Keep legacy administration/import/export/automation Super Admin-only unless a replacement receives explicit tenant predicates and isolation tests.
- Run the route/raw-query inventory whenever a package is installed or upgraded.
- Add isolation coverage with every new owner delete route or notification type.
- Keep ownership nullable until a production-like restored-copy rehearsal proves every historical row; clean and active databases currently report zero unresolved rows across 51 tables.

## Verification command

```powershell
docker compose exec -T app php vendor/bin/phpunit tests/Feature/TenantIsolationTest.php tests/Feature/TenantInfrastructureIsolationTest.php
```

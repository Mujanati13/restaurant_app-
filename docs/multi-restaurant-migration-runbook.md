# Vondo tenant migration runbook

This migration adds tenant tables and nullable ownership columns. It does not delete existing data.

## Before deployment

1. Put the application in maintenance mode.
2. Create a database backup using the platform's managed backup or `mysqldump --single-transaction`.
3. Restore that backup into a temporary database and confirm table counts for `locations`, `categories`, `menus`, `customers`, `orders`, and `reservations`.
4. Set `VONDO_BASE_DOMAIN` and keep `VONDO_ALLOW_TENANT_HEADER=false` in production.
5. Set non-empty `DB_PASSWORD` and `MYSQL_ROOT_PASSWORD` values, and confirm Redis is available to the app and queue worker.

## Deploy and backfill

```powershell
php artisan migrate --force
php artisan vondo:bootstrap-tenant --slug=default
php artisan vondo:finalize-schema --restaurant=default
php artisan storage:link
php artisan route:list --path=api/v1
```

Run `vondo:bootstrap-tenant` and `vondo:finalize-schema` again to confirm both are idempotent. Every reported `unowned` and `invalid` count must be zero before enabling owner self-registration or creating a second restaurant.

## Rollback

If application verification fails before new restaurants are created, deploy the previous application release and run `php artisan migrate:rollback --step=3`. If any new tenant data exists, do not roll back the schema; restore the verified backup into a new database and point the previous release at it.

## Required smoke checks

- `GET /api/v1/storefront/bootstrap` on the base domain.
- Tenant categories, menus, and locations return only adopted records.
- Existing staff login followed by `GET /api/v1/vendor/bootstrap`.
- A draft brand revision can be created and published.
- An order or reservation with a repeated `Idempotency-Key` returns the original result without creating a duplicate.
- A queued mobile build reaches `configuration_ready` (or `submitted` when the external compiler is configured), and its manifest/artifacts remain below the tenant-prefixed storage path.
- An invalid host and a user without membership are rejected.

## Runtime services

The Docker stack includes PHP-FPM, Nginx, MySQL, Redis, a Redis queue worker, and the production storefront. Keep the queue worker running during brand/build operations. The in-platform job prepares a tenant-scoped manifest and submits a signed request to the configured external compiler; APK/IPA compilation and signing run in that separately secured environment, which returns a signed callback referencing a checksummed tenant-prefixed artifact.

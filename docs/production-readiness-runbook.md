# Vondo production-readiness exercises

Run `scripts/verify-platform.ps1` from PowerShell against a production-like database snapshot before every release. It creates a transaction-consistent SQL backup, records its SHA-256 checksum, restores it into the disposable `db_clean` service, applies pending migrations, finalizes tenant constraints, checks monitoring, runs the feature/security suite, and probes backend/storefront health. Evidence is written below `.platform-verification/` and that directory must not be committed.

## Release gate

The gate passes only when all of the following are true:

- The restored copy migrates without errors and tenant finalization reports zero unowned or invalid rows.
- `PlatformCompletionTest` and the full feature suite pass, including cross-tenant authorization boundaries.
- Live and ready health endpoints pass and no critical platform alert remains open.
- Backend and storefront return HTTP 200 after the rebuilt Docker stack starts.
- The backup checksum and JSON evidence are archived in the deployment system.

If any check fails, keep the current release serving traffic. Do not mutate the source backup. Fix the candidate, create a fresh disposable restore, and repeat the complete exercise.

## Disaster recovery

For a real incident, provision a clean database and object-storage target, verify the chosen backup checksum, restore SQL and tenant-prefixed objects, apply only migrations shipped with the deployed release, start workers after the database is consistent, then run the same readiness script against the recovered environment. Rotate secrets and revoke outstanding privileged sessions if compromise is suspected. Record recovery point, recovery time, backup identifier, checksum, operator, and test evidence.

## Production secrets

Use only `secret://` references to an authenticated external provider or `file://` references to read-only mounted Docker/Kubernetes secrets for compiler signing keys, store credentials, TLS automation, and push delivery. Literal secret values are rejected outside local/testing environments and must never be placed in branding JSON, build manifests, mobile bundles, or source control.

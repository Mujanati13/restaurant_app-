<?php

return [
    'base_domain' => env('VONDO_BASE_DOMAIN', parse_url((string)env('APP_URL', 'http://localhost'), PHP_URL_HOST) ?: 'localhost'),
    'default_restaurant_slug' => env('VONDO_DEFAULT_RESTAURANT', 'default'),
    'require_email_verification' => (bool)env('VONDO_REQUIRE_EMAIL_VERIFICATION', false),
    'allow_tenant_header' => (bool)env('VONDO_ALLOW_TENANT_HEADER', false),
    'tenant_header' => 'X-Vondo-Restaurant',
    'access_token_minutes' => (int)env('VONDO_ACCESS_TOKEN_MINUTES', 60),
    'refresh_token_days' => (int)env('VONDO_REFRESH_TOKEN_DAYS', 30),
    'platform_access_token_minutes' => (int)env('VONDO_PLATFORM_ACCESS_TOKEN_MINUTES', 15),
    'platform_refresh_token_days' => (int)env('VONDO_PLATFORM_REFRESH_TOKEN_DAYS', 1),
    'media_disk' => env('VONDO_MEDIA_DISK', 'vondo_media'),
    'owner_portal_url' => env('VONDO_OWNER_PORTAL_URL', rtrim((string) env('APP_URL'), '/').'/vondo-admin'),
    'storefront_url' => env('VONDO_STOREFRONT_URL', 'http://localhost:3000'),
    'build_disk' => env('VONDO_BUILD_DISK', 'local'),
    'build_artifact_retention_days' => (int) env('VONDO_BUILD_ARTIFACT_RETENTION_DAYS', 30),
    'build_compiler' => [
        'url' => env('VONDO_BUILD_COMPILER_URL'),
        'secret_ref' => env('VONDO_BUILD_COMPILER_SECRET_REF'),
        'callback_url' => env('VONDO_BUILD_CALLBACK_URL', rtrim((string) env('APP_URL'), '/').'/api/v1/builds/callback'),
        'timeout_seconds' => (int) env('VONDO_BUILD_COMPILER_TIMEOUT_SECONDS', 30),
        'callback_tolerance_seconds' => (int) env('VONDO_BUILD_CALLBACK_TOLERANCE_SECONDS', 300),
    ],
    'secrets' => [
        'directory' => env('VONDO_SECRET_DIRECTORY', '/run/secrets'),
        'provider_url' => env('VONDO_SECRET_PROVIDER_URL'),
        'provider_token_file' => env('VONDO_SECRET_PROVIDER_TOKEN_FILE', '/run/secrets/vondo-secret-provider-token'),
    ],
    'tls' => [
        'provider_url' => env('VONDO_TLS_PROVIDER_URL'),
        'secret_ref' => env('VONDO_TLS_SECRET_REF', 'secret://vondo-tls-provider-hmac'),
    ],
    'push' => [
        'provider_url' => env('VONDO_PUSH_PROVIDER_URL'),
        'secret_ref' => env('VONDO_PUSH_SECRET_REF', 'secret://vondo-push-provider-hmac'),
        'timeout_seconds' => (int) env('VONDO_PUSH_TIMEOUT_SECONDS', 15),
    ],
    'monitoring' => [
        'api_url' => env('VONDO_API_HEALTH_URL', rtrim((string) env('APP_URL'), '/').'/api/v1/health/live'),
        'storefront_url' => env('VONDO_STOREFRONT_HEALTH_URL', rtrim((string) env('VONDO_STOREFRONT_URL', 'http://localhost:3000'), '/').'/health'),
        'probe_timeout_seconds' => (int) env('VONDO_HEALTH_PROBE_TIMEOUT_SECONDS', 30),
        'queue_heartbeat_seconds' => (int) env('VONDO_QUEUE_HEARTBEAT_SECONDS', 300),
    ],
];

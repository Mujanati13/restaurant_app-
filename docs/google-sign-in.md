# Google Sign-In

Google sign-in is available to customers in the Nuxt storefront and the customer Flutter app. The Laravel API verifies the Google-issued ID token, creates a restaurant-scoped customer only when needed, and issues the normal Deliveriano access and refresh tokens.

## Google Cloud setup

1. In the Google Cloud project, complete the Google Auth branding screen and add `deliveriano.ch` as an authorized domain. Verify the root domain in Google Search Console with the Google account that owns the Cloud project.
2. Create a **Web application** OAuth client. Add `https://deliveriano.ch` and every live restaurant domain, such as `https://chez-lucie.deliveriano.ch`, to **Authorized JavaScript origins**.
3. Create an **Android** OAuth client for each Android application ID and add the SHA-1 fingerprints of its debug and release signing keys.
4. Create an **iOS** OAuth client for each iOS bundle ID. Add its client ID, the web client ID as `GIDServerClientID`, and the generated reversed-client-ID URL scheme to the customer app's `ios/Runner/Info.plist` before building iOS.

Google does not permit wildcard JavaScript origins, so `https://*.deliveriano.ch` cannot be registered. Each restaurant subdomain that exposes the web sign-in button must be registered as an exact origin. This is a Google security rule, not a DNS limitation. The Google Auth platform does allow `deliveriano.ch` as the authorized root domain after DNS verification.

## Deliveriano configuration

Set these in the VPS `.env` file. Client IDs are public identifiers; do not put any Google client secret in this project.

```dotenv
GOOGLE_OAUTH_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_IDS=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com,YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com,YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
```

`GOOGLE_OAUTH_CLIENT_IDS` is the explicit audience allow-list used by Laravel when it verifies ID tokens. Keep only client IDs that belong to this Deliveriano Google Cloud project.

Rebuild the VPS services and run the migration:

```bash
cd ~/restaurant_app-
docker compose up -d --build
docker compose exec -T app php artisan migrate --force
docker compose exec -T app php artisan config:cache
```

Build the customer app with the web client ID as its server client ID:

```bash
cd customer_app
flutter build apk --release \
  --dart-define=VONDO_API_URL=https://backend.deliveriano.ch/api \
  --dart-define=VONDO_RESTAURANT=chez-lucie \
  --dart-define=VONDO_GOOGLE_SERVER_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

Use the same `VONDO_GOOGLE_SERVER_CLIENT_ID` define for iOS builds. Google’s Android setup must match the final app package ID and signing certificate, including white-label variants.

## Account safety

Google authentication requires a signed, unexpired Google ID token with an allowed audience, a Google issuer, and a verified email. The unique Google subject is stored per restaurant. A Google sign-in never automatically attaches itself to an existing password account with the same email, and it never creates or promotes restaurant staff accounts.

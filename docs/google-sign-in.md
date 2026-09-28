# Firebase Google Sign-In for customer apps and the storefront

The customer Flutter app and Nuxt storefront sign customers in with Google through Firebase Authentication. Each sends Firebase's short-lived ID token to `POST /api/v1/storefront/firebase/google`; Laravel verifies the token signature, Firebase project ID, issuer, verified email, and the `google.com` provider before issuing the normal tenant-scoped Deliveriano session.

The previous `POST /api/v1/storefront/google` endpoint remains available for existing app releases and any non-Firebase client. A Firebase login can safely continue an account created through that endpoint only when the Firebase token contains the same Google subject. Matching email addresses alone never link accounts.

## Firebase console setup

1. Create or select the Firebase project for the customer app, then enable **Authentication → Sign-in method → Google**.
2. Register the Android and iOS app IDs used by each released flavor. Add the SHA-1/SHA-256 certificate fingerprints for every Android signing key.
3. Create a Firebase **Web app** for the restaurant storefront. In Authentication settings, add every storefront domain (and `localhost` for development) to **Authorized domains**. In Google Cloud OAuth settings, add those domains as authorized JavaScript origins.
4. Copy the Firebase project ID and the Web app's public API key into the Laravel environment. Do not add a Firebase service-account key to the app or this repository.
5. Copy the public client values for the target Firebase app into that flavor's build command. `FIREBASE_WEB_CLIENT_ID` is the OAuth web client ID created for the Firebase project; it is used to obtain the Google credential before Firebase exchanges it.
6. For iOS, add the Firebase-generated reversed client ID URL scheme to `ios/Runner/Info.plist` for the final bundle ID, alongside the app's existing deep-link scheme.

## Server configuration

Set the Firebase project ID on the API host, then rebuild and cache configuration:

```dotenv
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_API_KEY=your-web-firebase-api-key
GOOGLE_OAUTH_WEB_CLIENT_ID=your-web-oauth-client-id.apps.googleusercontent.com
```

```bash
docker compose up -d --build
docker compose exec -T app php artisan config:cache
```

The Compose storefront exposes those two public values as `NUXT_PUBLIC_FIREBASE_API_KEY` and `NUXT_PUBLIC_GOOGLE_CLIENT_ID`. Its Google prompt exchanges the Google ID token with Firebase Authentication, then sends the Firebase ID token to `POST /api/v1/storefront/firebase/google`.

## Customer-app build

Build each branded app with the public Firebase values for its Android or iOS Firebase app:

```bash
cd customer_app
flutter build apk --release \
  --dart-define=VONDO_API_URL=https://backend.deliveriano.ch/api \
  --dart-define=VONDO_RESTAURANT=chez-lucie \
  --dart-define=FIREBASE_PROJECT_ID=your-firebase-project-id \
  --dart-define=FIREBASE_API_KEY=your-public-api-key \
  --dart-define=FIREBASE_APP_ID=your-android-firebase-app-id \
  --dart-define=FIREBASE_SENDER_ID=your-sender-id \
  --dart-define=FIREBASE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com \
  --dart-define=FIREBASE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
```

Use the equivalent Firebase iOS app ID and bundle ID values for an iOS build. `VONDO_GOOGLE_SERVER_CLIENT_ID` is accepted as a temporary fallback for older build automation, but new build scripts should use `FIREBASE_WEB_CLIENT_ID`.

## Account safety

The API accepts only a signed, unexpired Firebase Authentication ID token whose audience is the configured Firebase project, whose issuer is `https://securetoken.google.com/<project-id>`, and whose sign-in provider is Google. Customer API sessions remain separate, short-lived Deliveriano tokens; the Firebase token is not stored or used as an API bearer token.

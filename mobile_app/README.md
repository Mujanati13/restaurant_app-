# Vondo Vendor

Flutter mobile operations app for restaurant staff. It connects to the
TastyIgniter backend in the parent directory and supports:

- Staff sign-in with a secure, device-stored access token
- Location switching
- Daily sales, order, and reservation overview
- Order and reservation status updates
- Fast menu availability toggles

## Run locally

Start the backend from the repository root, then run the Flutter app from this
folder. On an Android emulator the default API address is already correct for
the Docker web server:

```powershell
flutter run --dart-define=VONDO_API_URL=http://10.0.2.2:8081/api
```

For a physical device, use your computer's LAN address instead. Production
builds must point to an HTTPS API:

```powershell
flutter run --dart-define=VONDO_API_URL=https://restaurant.example.com/api
```

Use a TastyIgniter staff account with at least one active location assigned
and grant its role the relevant `Admin.Orders`, `Admin.Reservations`, and
`Admin.Menus` permissions. The server-side vendor routes are under
`/api/vendor`; every request enforces the token ability, staff permission, and
assigned-location boundary.

TastyIgniter stores menu availability on the menu item itself, not on its
location pivot. An availability change therefore applies to every location
that uses that item; the app shows this warning before the menu list.

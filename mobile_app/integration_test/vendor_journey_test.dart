import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile_app/core/models.dart';
import 'package:mobile_app/core/session_controller.dart';
import 'package:mobile_app/core/vendor_api.dart';
import 'package:mobile_app/main.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('vendor signs in, switches tenant location, and signs out', (
    tester,
  ) async {
    final api = _JourneyApi();
    final controller = SessionController(api, secureStorage: _MapStorage());
    await tester.pumpWidget(
      VondoVendorApp(controller: controller, restoreSession: false),
    );

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Work email'),
      'staff@example.test',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Password'),
      'correct-password',
    );
    await tester.tap(find.text('Sign in to your restaurant'));
    await tester.pumpAndSettle();

    expect(find.text('Overview'), findsOneWidget);
    expect(find.text('Processed sales'), findsOneWidget);
    expect(api.lastLocationId, 1);

    await tester.tap(find.byTooltip('Switch location'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Harbor'));
    await tester.pumpAndSettle();
    expect(controller.selectedLocationId, 2);
    expect(api.lastLocationId, 2);

    await tester.tap(find.text('Orders').last);
    await tester.pumpAndSettle();
    expect(find.text('1001'), findsOneWidget);
    expect(find.textContaining('Integration Customer'), findsOneWidget);

    await tester.tap(find.text('More').last);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sign out'));
    await tester.pumpAndSettle();
    expect(find.text('Vondo Vendor'), findsOneWidget);
    expect(controller.isSignedIn, isFalse);
  });
}

class _JourneyApi extends VendorApi {
  _JourneyApi()
    : super(baseUrl: 'https://integration.example/api', restaurantKey: 'alpha');

  int? lastLocationId;

  @override
  Future<VendorSession> login({
    required String email,
    required String password,
  }) async => const VendorSession(
    accessToken: 'integration-access',
    refreshToken: 'integration-refresh',
  );

  @override
  Future<VendorBootstrap> bootstrap(String token) async =>
      const VendorBootstrap(
        staffName: 'Integration Staff',
        staffEmail: 'staff@example.test',
        locations: [
          VendorLocation(
            id: 1,
            name: 'Central',
            address: 'Main Street',
            isOpen: true,
          ),
          VendorLocation(
            id: 2,
            name: 'Harbor',
            address: 'Dock Road',
            isOpen: true,
          ),
        ],
        orderStatuses: [],
        reservationStatuses: [],
        canManageOrders: true,
        canManageReservations: false,
        canManageMenus: false,
        brand: VendorBrand(
          name: 'Integration Kitchen',
          primary: '#c95028',
          surface: '#ffffff',
          background: '#fffaf6',
          text: '#29231f',
        ),
      );

  @override
  Future<DashboardData> dashboard(String token, int locationId) async {
    lastLocationId = locationId;
    return const DashboardData(
      sales: 125,
      ordersToday: 1,
      ordersWaiting: 1,
      reservationsToday: 0,
      upcomingReservations: 0,
    );
  }

  @override
  Future<List<VendorOrder>> orders(String token, int locationId) async {
    lastLocationId = locationId;
    return const [
      VendorOrder(
        id: 1001,
        number: '#1001',
        customerName: 'Integration Customer',
        customerPhone: '+10000000000',
        type: 'delivery',
        statusId: 1,
        statusName: 'Received',
        total: 25,
        itemsCount: 1,
        items: ['1 x Margherita'],
      ),
    ];
  }

  @override
  Future<List<VendorReservation>> reservations(
    String token,
    int locationId,
  ) async => const [];

  @override
  Future<List<VendorMenuItem>> menus(String token, int locationId) async =>
      const [];

  @override
  Future<void> logout(String token) async {}
}

class _MapStorage extends FlutterSecureStorage {
  final Map<String, String> values = {};

  @override
  Future<String?> read({
    required String key,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async => values[key];

  @override
  Future<void> write({
    required String key,
    required String? value,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    if (value == null) {
      values.remove(key);
    } else {
      values[key] = value;
    }
  }

  @override
  Future<void> delete({
    required String key,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async {
    values.remove(key);
  }
}

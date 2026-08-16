import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/models.dart';
import 'package:mobile_app/core/session_controller.dart';
import 'package:mobile_app/core/vendor_api.dart';

void main() {
  test('normalizes a configured API base URL', () {
    final api = VendorApi(
      baseUrl: ' https://restaurant.test/api/// ',
      restaurantKey: 'north',
    );

    expect(api.baseUrl, 'https://restaurant.test/api');
    expect(api.restaurantKey, 'north');
  });

  test('parses staff capabilities from bootstrap response', () {
    final bootstrap = VendorBootstrap.fromJson({
      'staff': {'name': 'Sam', 'email': 'sam@example.com'},
      'locations': [
        {'id': 4, 'name': 'Central', 'address': '', 'is_open': true},
      ],
      'capabilities': {'orders': true, 'reservations': false, 'menus': true},
      'order_statuses': const [],
      'reservation_statuses': const [],
    });

    expect(bootstrap.canManageOrders, isTrue);
    expect(bootstrap.canManageReservations, isFalse);
    expect(bootstrap.canManageMenus, isTrue);
  });

  test('restores a valid saved staff session and notifies listeners', () async {
    final storage = _MemoryStorage('saved-token');
    final controller = SessionController(
      _FakeVendorApi(_bootstrapWithLocation()),
      secureStorage: storage,
    );
    var notifications = 0;
    controller.addListener(() => notifications++);

    await controller.restore();

    expect(controller.isSignedIn, isTrue);
    expect(controller.selectedLocationId, 4);
    expect(controller.restoring, isFalse);
    expect(notifications, greaterThanOrEqualTo(2));
  });

  test('does not sign in a staff account without a location', () async {
    final storage = _MemoryStorage('saved-token');
    final controller = SessionController(
      _FakeVendorApi(_bootstrapWithLocation(locations: const [])),
      secureStorage: storage,
    );

    await controller.restore();

    expect(controller.isSignedIn, isFalse);
    expect(controller.token, isNull);
    expect(storage.value, isNull);
  });

  test(
    'restores cached tenant bootstrap when the network is offline',
    () async {
      final storage = _MapStorage({
        'vondo_vendor_default_token': 'saved-token',
        'vondo_vendor_default_refresh_token': 'saved-refresh',
      });
      final online = SessionController(
        _FakeVendorApi(_bootstrapWithLocation()),
        secureStorage: storage,
      );
      await online.restore();
      expect(online.isSignedIn, isTrue);

      final offline = SessionController(
        _OfflineVendorApi(),
        secureStorage: storage,
      );
      await offline.restore();
      expect(offline.isSignedIn, isTrue);
      expect(offline.bootstrapData?.brand.name, 'Test Restaurant');
      expect(offline.error, contains('Offline'));
    },
  );
}

VendorBootstrap _bootstrapWithLocation({List<VendorLocation>? locations}) =>
    VendorBootstrap(
      staffName: 'Sam',
      staffEmail: 'sam@example.com',
      locations:
          locations ??
          const [
            VendorLocation(id: 4, name: 'Central', address: '', isOpen: true),
          ],
      orderStatuses: const [],
      reservationStatuses: const [],
      canManageOrders: true,
      canManageReservations: true,
      canManageMenus: true,
      brand: const VendorBrand(
        name: 'Test Restaurant',
        primary: '#c95028',
        surface: '#ffffff',
        background: '#fffbf7',
        text: '#29231f',
      ),
    );

class _FakeVendorApi extends VendorApi {
  _FakeVendorApi(this.result) : super(baseUrl: 'https://restaurant.test/api');

  final VendorBootstrap result;

  @override
  Future<VendorBootstrap> bootstrap(String token) async => result;
}

class _OfflineVendorApi extends VendorApi {
  _OfflineVendorApi() : super(baseUrl: 'https://restaurant.test/api');
  @override
  Future<VendorBootstrap> bootstrap(String token) async =>
      throw const VendorApiException('Network unavailable');
}

class _MapStorage extends FlutterSecureStorage {
  _MapStorage(this.values);
  final Map<String, String> values;
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

class _MemoryStorage extends FlutterSecureStorage {
  _MemoryStorage(this.value);

  String? value;

  @override
  Future<String?> read({
    required String key,
    IOSOptions? iOptions,
    AndroidOptions? aOptions,
    LinuxOptions? lOptions,
    WebOptions? webOptions,
    MacOsOptions? mOptions,
    WindowsOptions? wOptions,
  }) async => value;

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
    this.value = value;
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
    value = null;
  }
}

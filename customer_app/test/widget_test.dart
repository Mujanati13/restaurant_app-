import 'package:customer_app/core/app_controller.dart';
import 'package:customer_app/core/customer_api.dart';
import 'package:customer_app/core/models.dart';
import 'package:customer_app/main.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

void main() {
  testWidgets('shows tenant menu after bootstrap', (tester) async {
    final controller = AppController(_FakeApi(), storage: _MemoryStorage());
    await tester.pumpWidget(VondoCustomerApp(controller: controller));
    await tester.pumpAndSettle();
    expect(find.text('Test Kitchen'), findsOneWidget);
    expect(find.text('Pizza'), findsOneWidget);
  });

  test('restores cached tenant brand when bootstrap is offline', () async {
    final storage = _KeyedStorage();
    final online = AppController(_FakeApi(), storage: storage);
    await online.initialize();
    expect(online.brand?.name, 'Test Kitchen');
    final offline = AppController(_OfflineApi(), storage: storage);
    await offline.initialize();
    expect(offline.brand?.name, 'Test Kitchen');
    expect(offline.menus, isEmpty);
  });
}

class _KeyedStorage extends FlutterSecureStorage {
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

class _MemoryStorage extends FlutterSecureStorage {
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

class _FakeApi extends CustomerApi {
  _FakeApi()
    : super(baseUrl: 'https://example.test/api', restaurantKey: 'test');

  @override
  Future<TenantBrand> bootstrap() async => const TenantBrand(
    id: 'id',
    name: 'Test Kitchen',
    primary: '#c95028',
    background: '#fffaf6',
    surface: '#ffffff',
    text: '#29231f',
    currencySymbol: '\$',
  );

  @override
  Future<List<MenuItem>> menus() async => const [
    MenuItem(id: 1, name: 'Pizza', description: 'Fresh', price: 12),
  ];

  @override
  Future<List<RestaurantLocation>> locations() async => const [
    RestaurantLocation(id: 1, name: 'Main', address: 'Center'),
  ];
}

class _OfflineApi extends CustomerApi {
  _OfflineApi()
    : super(baseUrl: 'https://example.test/api', restaurantKey: 'test');
  @override
  Future<TenantBrand> bootstrap() async => throw Exception('offline');
  @override
  Future<List<MenuItem>> menus() async => throw Exception('offline');
  @override
  Future<List<RestaurantLocation>> locations() async =>
      throw Exception('offline');
}

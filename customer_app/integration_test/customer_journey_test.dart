import 'package:customer_app/core/app_controller.dart';
import 'package:customer_app/core/customer_api.dart';
import 'package:customer_app/core/models.dart';
import 'package:customer_app/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('customer configures an option and restores the tenant cart', (
    tester,
  ) async {
    final storage = _MapStorage();
    final api = _JourneyApi();
    final controller = AppController(api, storage: storage);
    await tester.pumpWidget(VondoCustomerApp(controller: controller));
    await tester.pumpAndSettle();

    expect(find.text('Integration Kitchen'), findsOneWidget);
    expect(find.text('Margherita'), findsOneWidget);
    await tester.tap(find.byTooltip('Add to cart'));
    await tester.pumpAndSettle();
    expect(find.text('Size *'), findsOneWidget);
    await tester.tap(find.text('Large (+\$2.00)'));
    await tester.pump();
    await tester.tap(find.widgetWithText(FilledButton, 'Add · \$14.00'));
    await tester.pumpAndSettle();

    expect(controller.cartCount, 1);
    expect(controller.total, 14);
    await tester.tap(find.text('Cart').last);
    await tester.pumpAndSettle();
    expect(find.textContaining('Size: Large'), findsOneWidget);
    expect(find.text('\$14.00'), findsWidgets);

    final restored = AppController(api, storage: storage);
    await restored.initialize();
    expect(restored.cartCount, 1);
    expect(restored.cart.single.options.single.label, 'Large');
    expect(restored.cart.single.total, 14);
  });
}

class _JourneyApi extends CustomerApi {
  _JourneyApi()
    : super(baseUrl: 'https://integration.example/api', restaurantKey: 'alpha');

  static const _menu = MenuItem(
    id: 7,
    name: 'Margherita',
    description: 'Tomato and mozzarella',
    price: 12,
    options: [
      MenuOptionGroup(
        id: 3,
        name: 'Size',
        displayType: 'radio',
        required: true,
        minSelected: 1,
        maxSelected: 1,
        values: [
          MenuOptionValue(id: 31, name: 'Regular', price: 0, isDefault: false),
          MenuOptionValue(id: 32, name: 'Large', price: 2, isDefault: false),
        ],
      ),
    ],
  );

  @override
  Future<TenantBrand> bootstrap() async => const TenantBrand(
    id: 'alpha-id',
    name: 'Integration Kitchen',
    primary: '#c95028',
    background: '#fffaf6',
    surface: '#ffffff',
    text: '#29231f',
    currencySymbol: '\$',
  );

  @override
  Future<List<MenuItem>> menus() async => const [
    MenuItem(
      id: 7,
      name: 'Margherita',
      description: 'Tomato and mozzarella',
      price: 12,
    ),
  ];

  @override
  Future<MenuItem> menu(int id) async => _menu;

  @override
  Future<List<RestaurantLocation>> locations() async => const [
    RestaurantLocation(id: 1, name: 'Main', address: 'Central'),
  ];
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

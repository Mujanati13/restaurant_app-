import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:vondo_shared/vondo_shared.dart';
import 'customer_api.dart';
import 'models.dart';

class AppController extends ChangeNotifier {
  AppController(this.api, {FlutterSecureStorage? storage})
    : storage = storage ?? const FlutterSecureStorage();
  final CustomerApi api;
  final FlutterSecureStorage storage;
  TenantBrand? brand;
  String? token;
  List<MenuItem> menus = [];
  List<RestaurantLocation> locations = [];
  final List<CartLine> cart = [];
  bool loading = true;
  String? error;
  String get tokenKey =>
      tenantStorageKey('customer', api.restaurantKey, 'token');
  String get refreshTokenKey =>
      tenantStorageKey('customer', api.restaurantKey, 'refresh_token');
  String get cartKey => tenantStorageKey('customer', api.restaurantKey, 'cart');
  String get bootstrapKey =>
      tenantStorageKey('customer', api.restaurantKey, 'bootstrap');
  bool get signedIn => token != null;
  double get total => cart.fold(0, (s, l) => s + l.total);
  int get cartCount => cart.fold(0, (s, l) => s + l.quantity);
  Future<void> initialize() async {
    loading = true;
    notifyListeners();
    try {
      try {
        brand = await api.bootstrap();
        await storage.write(
          key: bootstrapKey,
          value: jsonEncode(brand!.toCache()),
        );
      } catch (_) {
        final cached = await storage.read(key: bootstrapKey);
        if (cached == null) rethrow;
        brand = TenantBrand.fromCache(
          Map<String, dynamic>.from(jsonDecode(cached) as Map),
        );
      }
      try {
        token = await storage.read(key: tokenKey);
        final refreshToken = await storage.read(key: refreshTokenKey);
        if (token != null && refreshToken != null) {
          api.configureSession(
            CustomerSession(accessToken: token!, refreshToken: refreshToken),
            onChanged: _storeSession,
          );
        }
      } catch (_) {
        token = null;
      }
      try {
        final results = await Future.wait([api.menus(), api.locations()]);
        menus = results[0] as List<MenuItem>;
        locations = results[1] as List<RestaurantLocation>;
      } catch (_) {
        menus = const [];
        locations = const [];
      }
      await _restoreCart();
      error = null;
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    try {
      final session = await api.login(email.trim(), password);
      await _storeSession(session);
      api.configureSession(session, onChanged: _storeSession);
      error = null;
      notifyListeners();
      return true;
    } catch (e) {
      error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(
    String first,
    String last,
    String email,
    String phone,
    String password,
  ) async {
    try {
      final session = await api.register(
        firstName: first,
        lastName: last,
        email: email,
        telephone: phone,
        password: password,
      );
      await _storeSession(session);
      api.configureSession(session, onChanged: _storeSession);
      error = null;
      notifyListeners();
      return true;
    } catch (e) {
      error = e.toString();
      notifyListeners();
      return false;
    }
  }

  void add(MenuItem menu, [List<CartOptionSelection> options = const []]) {
    final pending = CartLine(menu: menu, quantity: 1, options: options);
    final index = cart.indexWhere(
      (line) => line.signature == pending.signature,
    );
    if (index < 0) {
      cart.add(pending);
    } else {
      cart[index].quantity++;
    }
    _saveCart();
    notifyListeners();
  }

  void quantity(CartLine line, int value) {
    if (value <= 0) {
      cart.remove(line);
    } else {
      line.quantity = value;
    }
    _saveCart();
    notifyListeners();
  }

  Future<void> clearCart() async {
    cart.clear();
    await storage.delete(key: cartKey);
    notifyListeners();
  }

  Future<void> logout() async {
    final old = token;
    token = null;
    await storage.delete(key: tokenKey);
    await storage.delete(key: refreshTokenKey);
    api.clearSession();
    notifyListeners();
    if (old != null) {
      try {
        await api.logout(old);
      } catch (_) {}
    }
  }

  Future<void> _saveCart() async => storage.write(
    key: cartKey,
    value: jsonEncode(
      cart
          .map(
            (l) => {
              'id': l.menu.id,
              'quantity': l.quantity,
              'options': l.options.map((option) => option.toRequest()).toList(),
            },
          )
          .toList(),
    ),
  );
  Future<void> _storeSession(TenantSession session) async {
    token = session.accessToken;
    await storage.write(key: tokenKey, value: session.accessToken);
    await storage.write(key: refreshTokenKey, value: session.refreshToken);
    notifyListeners();
  }

  Future<void> _restoreCart() async {
    String? raw;
    try {
      raw = await storage.read(key: cartKey);
    } catch (_) {
      return;
    }
    if (raw == null) return;
    try {
      for (final item in jsonDecode(raw) as List) {
        final data = Map<String, dynamic>.from(item as Map);
        final summary = menus.where((m) => m.id == data['id']).firstOrNull;
        if (summary != null) {
          final storedOptions = ((data['options'] as List?) ?? const []);
          final menu = storedOptions.isEmpty
              ? summary
              : await api.menu(summary.id);
          final selections = storedOptions.map((rawOption) {
            final option = Map<String, dynamic>.from(rawOption as Map);
            final group = menu.options.firstWhere(
              (value) => value.id == option['option_id'],
            );
            final quantities = <int, int>{};
            for (final rawValue in (option['values'] as List? ?? const [])) {
              final value = Map<String, dynamic>.from(rawValue as Map);
              quantities[(value['value_id'] as num).toInt()] =
                  (value['quantity'] as num? ?? 1).toInt();
            }
            return CartOptionSelection(group: group, quantities: quantities);
          }).toList();
          cart.add(
            CartLine(
              menu: menu,
              quantity: (data['quantity'] as num).toInt(),
              options: selections,
            ),
          );
        }
      }
    } catch (_) {
      await storage.delete(key: cartKey);
    }
  }
}

import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:vondo_shared/vondo_shared.dart';

import 'models.dart';
import 'vendor_api.dart';

class SessionController extends ChangeNotifier {
  SessionController(this.api, {FlutterSecureStorage? secureStorage})
    : _secureStorage = secureStorage ?? const FlutterSecureStorage();

  String get _tokenKey => tenantStorageKey('vendor', api.restaurantKey, 'token');
  String get _refreshTokenKey => tenantStorageKey('vendor', api.restaurantKey, 'refresh_token');
  String get _bootstrapKey => tenantStorageKey('vendor', api.restaurantKey, 'bootstrap');
  final VendorApi api;
  final FlutterSecureStorage _secureStorage;

  String? _token;
  VendorBootstrap? bootstrapData;
  int? selectedLocationId;
  bool loading = false;
  bool restoring = false;
  String? error;

  bool get isSignedIn =>
      _token != null && bootstrapData != null && selectedLocationId != null;
  String? get token => _token;
  VendorLocation? get selectedLocation {
    final locations = bootstrapData?.locations ?? const [];
    for (final location in locations) {
      if (location.id == selectedLocationId) return location;
    }
    return null;
  }

  Future<void> restore() async {
    restoring = true;
    notifyListeners();
    try {
      _token = await _secureStorage.read(key: _tokenKey);
      final refreshToken = await _secureStorage.read(key: _refreshTokenKey);
      if (_token != null) {
        if (refreshToken != null) {
          api.configureSession(
            VendorSession(accessToken: _token!, refreshToken: refreshToken),
            onChanged: _storeSession,
          );
        }
        await _loadBootstrap(clearInvalidToken: true);
        if (!isSignedIn && bootstrapData?.locations.isEmpty == true) {
          _token = null;
          await _secureStorage.delete(key: _tokenKey);
          await _secureStorage.delete(key: _refreshTokenKey);
        }
      }
    } finally {
      restoring = false;
      notifyListeners();
    }
  }

  Future<bool> signIn(String email, String password) async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final session = await api.login(email: email.trim(), password: password);
      await _storeSession(session);
      api.configureSession(session, onChanged: _storeSession);
      await _loadBootstrap(clearInvalidToken: false);
      if (!isSignedIn && _token != null) {
        final rejectedToken = _token!;
        _token = null;
        await _secureStorage.delete(key: _tokenKey);
        await _secureStorage.delete(key: _refreshTokenKey);
        api.clearSession();
        try {
          await api.logout(rejectedToken);
        } on VendorApiException {
          // The local session must still be cleared when revocation fails.
        }
      }
      return isSignedIn;
    } on VendorApiException catch (exception) {
      error = exception.message;
      return false;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> selectLocation(int locationId) async {
    if (selectedLocationId == locationId) return;
    selectedLocationId = locationId;
    notifyListeners();
  }

  Future<void> logout() async {
    final token = _token;
    _token = null;
    bootstrapData = null;
    selectedLocationId = null;
    await _secureStorage.delete(key: _tokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
    api.clearSession();
    notifyListeners();
    if (token != null) {
      try {
        await api.logout(token);
      } on VendorApiException {
        // Local logout remains correct when the device is offline.
      }
    }
  }

  Future<void> _loadBootstrap({required bool clearInvalidToken}) async {
    if (_token == null) return;
    try {
      bootstrapData = await api.bootstrap(_token!);
      await _secureStorage.write(key: _bootstrapKey, value: jsonEncode(bootstrapData!.toJson()));
      selectedLocationId = bootstrapData!.locations.isEmpty
          ? null
          : bootstrapData!.locations.first.id;
      error = bootstrapData!.locations.isEmpty
          ? 'This staff account has no active restaurant location.'
          : null;
    } on VendorApiException catch (exception) {
      error = exception.message;
      if (clearInvalidToken &&
          (exception.statusCode == 401 || exception.statusCode == 403)) {
        _token = null;
        await _secureStorage.delete(key: _tokenKey);
        await _secureStorage.delete(key: _refreshTokenKey);
        api.clearSession();
      } else {
        final cached = await _secureStorage.read(key: _bootstrapKey);
        if (cached != null) {
          bootstrapData = VendorBootstrap.fromJson(Map<String, dynamic>.from(jsonDecode(cached) as Map));
          selectedLocationId = bootstrapData!.locations.isEmpty ? null : bootstrapData!.locations.first.id;
          error = selectedLocationId == null ? exception.message : 'Offline: showing the last saved restaurant configuration.';
        }
      }
    }
  }

  Future<void> _storeSession(TenantSession session) async {
    _token = session.accessToken;
    await _secureStorage.write(key: _tokenKey, value: session.accessToken);
    await _secureStorage.write(
      key: _refreshTokenKey,
      value: session.refreshToken,
    );
    notifyListeners();
  }
}

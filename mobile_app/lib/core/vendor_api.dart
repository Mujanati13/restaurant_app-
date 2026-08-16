import 'package:vondo_shared/vondo_shared.dart';
import 'models.dart';

class VendorApiException extends TenantApiException {
  const VendorApiException(super.message, {super.statusCode});
}

class VendorSession extends TenantSession {
  const VendorSession({required super.accessToken, required super.refreshToken});

  factory VendorSession.fromJson(Map<String, dynamic> json) => VendorSession(
    accessToken: json['token'] as String,
    refreshToken: json['refresh_token'] as String,
  );
}

class VendorApi extends TenantApiClient {
  VendorApi({String? baseUrl, String? restaurantKey})
    : super(
        baseUrl: _normalizeBaseUrl(baseUrl ?? const String.fromEnvironment(
          'VONDO_API_URL', defaultValue: 'http://185.203.116.172:8081/api')),
        restaurantKey: restaurantKey ??
          const String.fromEnvironment(
            'VONDO_RESTAURANT',
            defaultValue: 'default',
          ),
      );

  @override
  String get refreshPath => '/v1/vendor/refresh';

  static String _normalizeBaseUrl(String value) =>
      value.trim().replaceFirst(RegExp(r'/+$'), '');

  Future<VendorSession> login({
    required String email,
    required String password,
  }) async {
    final response = await _request(
      'POST',
      '/v1/vendor/token',
      body: {
        'email': email,
        'password': password,
        'device_name': 'Vondo Vendor Mobile ($restaurantKey)',
      },
    );
    final session = VendorSession.fromJson(response);
    this.session = session;
    return session;
  }

  Future<VendorBootstrap> bootstrap(String token) async =>
      VendorBootstrap.fromJson(
        _data(await _request('GET', '/v1/vendor/bootstrap', token: token)),
      );

  Future<DashboardData> dashboard(String token, int locationId) async =>
      DashboardData.fromJson(
        _data(
          await _request(
            'GET',
            '/v1/vendor/dashboard',
            token: token,
            query: {'location_id': '$locationId'},
          ),
        ),
      );

  Future<List<VendorOrder>> orders(String token, int locationId) async {
    final response = await _request(
      'GET',
      '/v1/vendor/orders',
      token: token,
      query: {'location_id': '$locationId'},
    );
    return _list(response['data']).map(VendorOrder.fromJson).toList();
  }

  Future<void> updateOrderStatus(
    String token,
    int locationId,
    int orderId,
    int statusId,
  ) async {
    await _request(
      'PATCH',
      '/v1/vendor/orders/$orderId/status',
      token: token,
      body: {'location_id': locationId, 'status_id': statusId, 'notify': true},
    );
  }

  Future<List<VendorReservation>> reservations(
    String token,
    int locationId,
  ) async {
    final response = await _request(
      'GET',
      '/v1/vendor/reservations',
      token: token,
      query: {'location_id': '$locationId'},
    );
    return _list(response['data']).map(VendorReservation.fromJson).toList();
  }

  Future<void> updateReservationStatus(
    String token,
    int locationId,
    int reservationId,
    int statusId,
  ) async {
    await _request(
      'PATCH',
      '/v1/vendor/reservations/$reservationId/status',
      token: token,
      body: {'location_id': locationId, 'status_id': statusId, 'notify': true},
    );
  }

  Future<List<VendorMenuItem>> menus(String token, int locationId) async {
    final response = await _request(
      'GET',
      '/v1/vendor/menus',
      token: token,
      query: {'location_id': '$locationId'},
    );
    return _list(response['data']).map(VendorMenuItem.fromJson).toList();
  }

  Future<void> setMenuAvailability(
    String token,
    int locationId,
    int menuId,
    bool available,
  ) async {
    await _request(
      'PATCH',
      '/v1/vendor/menus/$menuId/availability',
      token: token,
      body: {'location_id': locationId, 'is_available': available},
    );
  }

  Future<void> logout(String token) async {
    await _request('DELETE', '/v1/vendor/session', token: token);
    clearSession();
  }

  Map<String, dynamic> _data(Map<String, dynamic> response) =>
      Map<String, dynamic>.from(response['data'] as Map);

  List<Map<String, dynamic>> _list(dynamic value) =>
      ((value as List?) ?? const [])
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList();

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    String? token,
    Map<String, String>? query,
    Map<String, dynamic>? body,
    bool retryAfterRefresh = true,
  }) async {
    try {
      return await requestJson(method, path, token: token, query: query, body: body,
        retryAfterRefresh: retryAfterRefresh);
    } on TenantApiException catch (error) {
      throw VendorApiException(error.message, statusCode: error.statusCode);
    }
  }
}

import 'package:vondo_shared/vondo_shared.dart';
import 'models.dart';

class ApiException extends TenantApiException {
  const ApiException(super.message, {int? status}) : super(statusCode: status);
  int? get status => statusCode;
}

class CustomerSession extends TenantSession {
  const CustomerSession({
    required super.accessToken,
    required super.refreshToken,
  });

  factory CustomerSession.fromJson(Map<String, dynamic> json) =>
      CustomerSession(
        accessToken: json['token'] as String,
        refreshToken: json['refresh_token'] as String,
      );
}

class CustomerApi extends TenantApiClient {
  CustomerApi({String? baseUrl, String? restaurantKey})
    : super(
        baseUrl: (baseUrl ??
                  const String.fromEnvironment(
                    'VONDO_API_URL',
                    defaultValue: 'http://185.203.116.172:8081/api',
                  ))
              .trim()
              .replaceFirst(RegExp(r'/+$'), ''),
        restaurantKey: restaurantKey ??
          const String.fromEnvironment(
            'VONDO_RESTAURANT',
            defaultValue: 'default',
          ),
      );

  @override
  String get refreshPath => '/v1/storefront/refresh';

  Future<TenantBrand> bootstrap() async => TenantBrand.fromJson(
    _data(await _request('GET', '/v1/storefront/bootstrap')),
  );
  Future<List<MenuItem>> menus() async => _list(
    (await _request('GET', '/v1/storefront/menus?limit=100'))['data'],
  ).map(MenuItem.fromJson).toList();
  Future<MenuItem> menu(int id) async => MenuItem.fromJson(
    _data(await _request('GET', '/v1/storefront/menus/$id')),
  );
  Future<List<RestaurantLocation>> locations() async => _list(
    (await _request('GET', '/v1/storefront/locations'))['data'],
  ).map(RestaurantLocation.fromJson).toList();
  Future<CustomerSession> login(String email, String password) async {
    final response = await _request(
      'POST',
      '/v1/storefront/token',
      body: {
        'email': email,
        'password': password,
        'device_name': 'Vondo Customer Mobile',
      },
    );
    final session = CustomerSession.fromJson(response);
    this.session = session;
    return session;
  }

  Future<CustomerSession> register({
    required String firstName,
    required String lastName,
    required String email,
    required String telephone,
    required String password,
  }) async {
    await _request(
      'POST',
      '/v1/storefront/register',
      body: {
        'first_name': firstName,
        'last_name': lastName,
        'email': email,
        'telephone': telephone,
        'password': password,
        'password_confirm': password,
      },
    );
    return login(email, password);
  }

  Future<List<CustomerOrder>> orders(String token) async => _list(
    (await _request('GET', '/v1/storefront/orders', token: token))['data'],
  ).map(CustomerOrder.fromJson).toList();
  Future<List<CustomerReservation>> reservations(String token) async => _list(
    (await _request(
      'GET',
      '/v1/storefront/reservations',
      token: token,
    ))['data'],
  ).map(CustomerReservation.fromJson).toList();
  Future<void> createOrder(
    String token, {
    required int locationId,
    required String firstName,
    required String lastName,
    required String phone,
    required List<CartLine> lines,
    String orderType = 'collection',
    Map<String, dynamic>? address,
  }) async {
    await _request(
      'POST',
      '/v1/storefront/orders',
      token: token,
      idempotent: true,
      body: {
        'location_id': locationId,
        'order_type': orderType,
        'first_name': firstName,
        'last_name': lastName,
        'telephone': phone,
        'items': lines
            .map(
              (l) => {
                'menu_id': l.menu.id,
                'quantity': l.quantity,
                'options': l.options
                    .map((option) => option.toRequest())
                    .toList(),
              },
            )
            .toList(),
        if (orderType == 'delivery') 'address': address,
      },
    );
  }

  Future<void> createReservation(
    String token, {
    required int locationId,
    required int guests,
    required String date,
    required String time,
    required String firstName,
    required String lastName,
    required String phone,
    String? comment,
  }) async {
    await _request(
      'POST',
      '/v1/storefront/reservations',
      token: token,
      idempotent: true,
      body: {
        'location_id': locationId,
        'guest_num': guests,
        'reserve_date': date,
        'reserve_time': time,
        'first_name': firstName,
        'last_name': lastName,
        'telephone': phone,
        'comment': comment,
      },
    );
  }

  Future<void> logout(String token) async {
    await _request('DELETE', '/v1/storefront/token', token: token);
    clearSession();
  }

  Map<String, dynamic> _data(Map<String, dynamic> r) =>
      Map<String, dynamic>.from(r['data'] as Map);
  List<Map<String, dynamic>> _list(dynamic v) => ((v as List?) ?? const [])
      .map((e) => Map<String, dynamic>.from(e as Map))
      .toList();
  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    String? token,
    Map<String, dynamic>? body,
    bool idempotent = false,
    bool retryAfterRefresh = true,
    String? idempotencyKey,
  }) async {
    try {
      return await requestJson(method, path, token: token, body: body, idempotent: idempotent,
        retryAfterRefresh: retryAfterRefresh, idempotencyKey: idempotencyKey);
    } on TenantApiException catch (error) {
      throw ApiException(error.message, status: error.statusCode);
    }
  }
}

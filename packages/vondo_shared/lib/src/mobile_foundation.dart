import 'dart:async';
import 'dart:convert';
import 'dart:io';

class TenantSession {
  const TenantSession({required this.accessToken, required this.refreshToken});
  final String accessToken;
  final String refreshToken;
  factory TenantSession.fromJson(Map<String, dynamic> json) => TenantSession(
    accessToken: json['token'] as String,
    refreshToken: json['refresh_token'] as String,
  );
}

class TenantApiException implements Exception {
  const TenantApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;
  @override String toString() => message;
}

abstract class TenantApiClient {
  TenantApiClient({required String baseUrl, required this.restaurantKey})
    : baseUrl = baseUrl.trim().replaceFirst(RegExp(r'/+$'), '');

  final String baseUrl;
  final String restaurantKey;
  TenantSession? session;
  Future<TenantSession>? _refreshing;
  Future<void> Function(TenantSession session)? onSessionChanged;
  String get refreshPath;

  void configureSession(TenantSession? value, {Future<void> Function(TenantSession session)? onChanged}) {
    session = value; onSessionChanged = onChanged;
  }
  void clearSession() { session = null; onSessionChanged = null; }

  Future<Map<String, dynamic>> requestJson(String method, String path, {String? token,
    Map<String, String>? query, Map<String, dynamic>? body, bool idempotent = false,
    bool retryAfterRefresh = true, String? idempotencyKey}) async {
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: query);
    final client = HttpClient();
    final requestId = idempotent ? (idempotencyKey ?? 'mobile-${DateTime.now().microsecondsSinceEpoch}') : null;
    try {
      final request = await client.openUrl(method, uri).timeout(const Duration(seconds: 15));
      request.headers.contentType = ContentType.json;
      request.headers.set(HttpHeaders.acceptHeader, 'application/json');
      request.headers.set('X-Vondo-Restaurant', restaurantKey);
      final effectiveToken = token == null ? null : (session?.accessToken ?? token);
      if (effectiveToken != null) request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $effectiveToken');
      if (requestId != null) request.headers.set('Idempotency-Key', requestId);
      if (body != null) request.write(jsonEncode(body));
      final response = await request.close().timeout(const Duration(seconds: 15));
      final raw = await utf8.decoder.bind(response).join();
      final decoded = raw.isEmpty ? <String, dynamic>{} : Map<String, dynamic>.from(jsonDecode(raw) as Map);
      if (response.statusCode == HttpStatus.unauthorized && token != null && retryAfterRefresh && session != null) {
        await _refreshSession();
        return requestJson(method, path, token: session!.accessToken, query: query, body: body,
          idempotent: idempotent, retryAfterRefresh: false, idempotencyKey: requestId);
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final errors = decoded['errors'];
        final message = errors is Map ? errors.values.expand((value) => value is List ? value : [value]).join(' ') : decoded['message'];
        throw TenantApiException((message ?? 'Request failed.').toString(), statusCode: response.statusCode);
      }
      return decoded;
    } on TimeoutException { throw const TenantApiException('The restaurant server took too long to respond.'); }
      on SocketException { throw const TenantApiException('Cannot reach the restaurant server. Check your connection.'); }
      on TlsException { throw const TenantApiException('A secure connection to the restaurant server could not be established.'); }
      on FormatException { throw const TenantApiException('The server returned an invalid response.'); }
    finally { client.close(force: true); }
  }

  Future<TenantSession> _refreshSession() async {
    final active = _refreshing; if (active != null) return active;
    final pending = requestJson('POST', refreshPath, body: {'refresh_token': session?.refreshToken}, retryAfterRefresh: false)
      .then(TenantSession.fromJson);
    _refreshing = pending;
    try { final updated = await pending; session = updated; await onSessionChanged?.call(updated); return updated; }
    finally { _refreshing = null; }
  }

  Future<void> registerPushToken({required String endpointPrefix, required String token, required String platform, List<String> topics = const []}) async {
    await requestJson('POST', '/v1/$endpointPrefix/push-subscriptions', token: session?.accessToken,
      body: {'token': token, 'platform': platform, 'topics': topics});
  }
}

class MobileFlavor {
  const MobileFlavor._();
  static const restaurant = String.fromEnvironment('VONDO_RESTAURANT', defaultValue: 'default');
  static const appName = String.fromEnvironment('VONDO_APP_NAME', defaultValue: 'Vondo');
  static const scheme = String.fromEnvironment('VONDO_URL_SCHEME', defaultValue: 'vondo');
  static const appHost = String.fromEnvironment('VONDO_APP_HOST');
  static const apiUrl = String.fromEnvironment('VONDO_API_URL', defaultValue: 'http://10.0.2.2:8081/api');
}

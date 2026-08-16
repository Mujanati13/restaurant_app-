import 'dart:async';
import 'dart:io';
import 'package:app_links/app_links.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'mobile_links.dart';
import 'mobile_foundation.dart';

class VondoMobileServices {
  VondoMobileServices({required this.tenant, required this.onLink, required this.onPushToken, Set<String>? allowedHosts})
    : allowedHosts = allowedHosts ?? (MobileFlavor.appHost.isEmpty ? const {} : {MobileFlavor.appHost.toLowerCase()});
  final String tenant;
  final void Function(VondoDeepLink link) onLink;
  final Future<void> Function(String token, String platform) onPushToken;
  final Set<String> allowedHosts;
  StreamSubscription<Uri>? _links;
  StreamSubscription<String>? _tokens;
  StreamSubscription<RemoteMessage>? _messages;

  Future<void> start() async {
    final appLinks = AppLinks();
    final initial = await appLinks.getInitialLink();
    if (initial != null) _handleUri(initial);
    _links = appLinks.uriLinkStream.listen(_handleUri);
    if (!_firebaseConfigured) return;
    await Firebase.initializeApp(options: _firebaseOptions);
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(alert: true, badge: true, sound: true);
    final token = await messaging.getToken();
    if (token != null) await onPushToken(token, _platform);
    _tokens = messaging.onTokenRefresh.listen((token) => onPushToken(token, _platform));
    final initialMessage = await messaging.getInitialMessage();
    if (initialMessage != null) _handleMessage(initialMessage);
    _messages = FirebaseMessaging.onMessageOpenedApp.listen(_handleMessage);
  }

  Future<void> syncPushToken() async {
    if (!_firebaseConfigured || Firebase.apps.isEmpty) return;
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) await onPushToken(token, _platform);
  }

  void _handleMessage(RemoteMessage message) {
    final raw = message.data['link']; if (raw is String) { final uri = Uri.tryParse(raw); if (uri != null) _handleUri(uri); }
  }
  void _handleUri(Uri uri) { final link = VondoDeepLink.parse(uri, expectedTenant: tenant, allowedHosts: allowedHosts); if (link != null) onLink(link); }
  Future<void> dispose() async { await _links?.cancel(); await _tokens?.cancel(); await _messages?.cancel(); }

  static String get _platform => Platform.isIOS ? 'ios' : 'android';
  static const _apiKey = String.fromEnvironment('FIREBASE_API_KEY');
  static const _appId = String.fromEnvironment('FIREBASE_APP_ID');
  static const _senderId = String.fromEnvironment('FIREBASE_SENDER_ID');
  static const _projectId = String.fromEnvironment('FIREBASE_PROJECT_ID');
  static bool get _firebaseConfigured => [_apiKey, _appId, _senderId, _projectId].every((value) => value.isNotEmpty);
  static FirebaseOptions get _firebaseOptions => const FirebaseOptions(apiKey: _apiKey, appId: _appId,
    messagingSenderId: _senderId, projectId: _projectId,
    iosBundleId: String.fromEnvironment('VONDO_IOS_BUNDLE_ID'),
    androidClientId: String.fromEnvironment('FIREBASE_ANDROID_CLIENT_ID'));
}

import 'dart:async';
import 'dart:io';
import 'package:app_links/app_links.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'mobile_links.dart';
import 'mobile_foundation.dart';

/// Shared Firebase setup for the mobile apps.
///
/// The generated builds provide these public Firebase identifiers with
/// `--dart-define`, which lets each restaurant build use its own Firebase app
/// without committing service configuration files to the repository.
class FirebaseAppConfiguration {
  FirebaseAppConfiguration._();

  static const _apiKey = String.fromEnvironment('FIREBASE_API_KEY');
  static const _appId = String.fromEnvironment('FIREBASE_APP_ID');
  static const _senderId = String.fromEnvironment('FIREBASE_SENDER_ID');
  static const _projectId = String.fromEnvironment('FIREBASE_PROJECT_ID');

  /// The OAuth web client used by Google Sign-In before Firebase exchanges
  /// the credential. The second value keeps existing build automation working
  /// while it moves to the Firebase name.
  static const googleServerClientId = String.fromEnvironment(
    'FIREBASE_WEB_CLIENT_ID',
    defaultValue: String.fromEnvironment('VONDO_GOOGLE_SERVER_CLIENT_ID'),
  );

  static Future<FirebaseApp>? _initializing;

  static bool get isConfigured => [
    _apiKey,
    _appId,
    _senderId,
    _projectId,
  ].every((value) => value.isNotEmpty);

  static FirebaseOptions get options => const FirebaseOptions(
    apiKey: _apiKey,
    appId: _appId,
    messagingSenderId: _senderId,
    projectId: _projectId,
    iosBundleId: String.fromEnvironment('VONDO_IOS_BUNDLE_ID'),
    androidClientId: String.fromEnvironment('FIREBASE_ANDROID_CLIENT_ID'),
  );

  /// Initializes Firebase at most once, even when push and authentication
  /// start at the same time.
  static Future<FirebaseApp> initialize() {
    if (Firebase.apps.isNotEmpty) return Future.value(Firebase.app());
    return _initializing ??= Firebase.initializeApp(options: options);
  }
}

class VondoMobileServices {
  VondoMobileServices({
    required this.tenant,
    required this.onLink,
    required this.onPushToken,
    Set<String>? allowedHosts,
  }) : allowedHosts =
           allowedHosts ??
           (MobileFlavor.appHost.isEmpty
               ? const {}
               : {MobileFlavor.appHost.toLowerCase()});
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
    if (!FirebaseAppConfiguration.isConfigured) return;
    await FirebaseAppConfiguration.initialize();
    final messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(alert: true, badge: true, sound: true);
    final token = await messaging.getToken();
    if (token != null) await onPushToken(token, _platform);
    _tokens = messaging.onTokenRefresh.listen(
      (token) => onPushToken(token, _platform),
    );
    final initialMessage = await messaging.getInitialMessage();
    if (initialMessage != null) _handleMessage(initialMessage);
    _messages = FirebaseMessaging.onMessageOpenedApp.listen(_handleMessage);
  }

  Future<void> syncPushToken() async {
    if (!FirebaseAppConfiguration.isConfigured || Firebase.apps.isEmpty) return;
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) await onPushToken(token, _platform);
  }

  void _handleMessage(RemoteMessage message) {
    final raw = message.data['link'];
    if (raw is String) {
      final uri = Uri.tryParse(raw);
      if (uri != null) _handleUri(uri);
    }
  }

  void _handleUri(Uri uri) {
    final link = VondoDeepLink.parse(
      uri,
      expectedTenant: tenant,
      allowedHosts: allowedHosts,
    );
    if (link != null) onLink(link);
  }

  Future<void> dispose() async {
    await _links?.cancel();
    await _tokens?.cancel();
    await _messages?.cancel();
  }

  static String get _platform => Platform.isIOS ? 'ios' : 'android';
}

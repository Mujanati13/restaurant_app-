import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:vondo_shared/vondo_shared.dart';

/// Signs a customer in with Google through Firebase Authentication.
///
/// The returned Firebase ID token is never used as a local app session. The
/// API validates it and returns the existing tenant-scoped session instead.
class FirebaseGoogleCustomerSignIn {
  FirebaseGoogleCustomerSignIn({GoogleSignIn? client, FirebaseAuth? auth})
    : _client =
          client ??
          GoogleSignIn(
            scopes: const ['email', 'openid', 'profile'],
            serverClientId: FirebaseAppConfiguration.googleServerClientId,
          ),
      _auth = auth;

  final GoogleSignIn _client;
  final FirebaseAuth? _auth;

  Future<String?> authenticate() async {
    if (!FirebaseAppConfiguration.isConfigured ||
        FirebaseAppConfiguration.googleServerClientId.isEmpty) {
      throw StateError(
        'Firebase Google sign-in is not configured for this app build.',
      );
    }

    await FirebaseAppConfiguration.initialize();

    final account = await _client.signIn();
    if (account == null) {
      return null;
    }
    final authentication = await account.authentication;
    if (authentication.idToken == null || authentication.idToken!.isEmpty) {
      throw StateError('Google did not return an identity token for Firebase.');
    }

    final credential = GoogleAuthProvider.credential(
      accessToken: authentication.accessToken,
      idToken: authentication.idToken,
    );
    final user = (await (_auth ?? FirebaseAuth.instance).signInWithCredential(
      credential,
    )).user;
    final firebaseIdToken = await user?.getIdToken();
    if (firebaseIdToken == null || firebaseIdToken.isEmpty) {
      throw StateError('Firebase did not return an identity token.');
    }

    return firebaseIdToken;
  }
}

import 'package:google_sign_in/google_sign_in.dart';

/// Starts an explicit Google sign-in and returns the verifiable ID token.
/// The token is never treated as a local session; Laravel verifies it first.
class GoogleCustomerSignIn {
  GoogleCustomerSignIn({GoogleSignIn? client})
    : _client =
          client ??
          GoogleSignIn(
            scopes: const ['email', 'openid', 'profile'],
            serverClientId: const String.fromEnvironment(
              'VONDO_GOOGLE_SERVER_CLIENT_ID',
            ),
          );

  final GoogleSignIn _client;

  Future<String?> authenticate() async {
    const serverClientId = String.fromEnvironment(
      'VONDO_GOOGLE_SERVER_CLIENT_ID',
    );
    if (serverClientId.isEmpty) {
      throw StateError('Google sign-in is not configured for this app build.');
    }

    final account = await _client.signIn();
    if (account == null) {
      return null;
    }
    final authentication = await account.authentication;
    final idToken = authentication.idToken;
    if (idToken == null || idToken.isEmpty) {
      throw StateError('Google did not return an identity token.');
    }

    return idToken;
  }
}

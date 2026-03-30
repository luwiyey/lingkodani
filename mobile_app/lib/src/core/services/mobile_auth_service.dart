import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../app_config.dart';
import '../models/mobile_models.dart';

class MobileAuthException implements Exception {
  const MobileAuthException(this.message);

  final String message;

  @override
  String toString() => message;
}

class MobileAuthService {
  static const _storagePrefix = 'lingkodani_mobile_auth_';

  Future<MobileSession?> restoreSession() async {
    final preferences = await SharedPreferences.getInstance();
    final values = <String, String>{};

    for (final key in ['idToken', 'refreshToken', 'localId', 'email', 'expiresAt']) {
      final value = preferences.getString('$_storagePrefix$key');
      if (value != null && value.isNotEmpty) {
        values[key] = value;
      }
    }

    if (values.length < 5) {
      return null;
    }

    final session = MobileSession.fromStorage(values);

    if (session.refreshToken.isEmpty) {
      await clearSession();
      return null;
    }

    if (!session.isNearExpiry) {
      return session;
    }

    try {
      final refreshed = await refreshSession(session.refreshToken);
      await persistSession(refreshed);
      return refreshed;
    } catch (_) {
      await clearSession();
      return null;
    }
  }

  Future<MobileSession> signIn({
    required String email,
    required String password,
  }) async {
    if (!AppConfig.hasFirebaseWebApiKey) {
      throw const MobileAuthException(
        'Missing FIREBASE_WEB_API_KEY configuration for the mobile app.',
      );
    }

    final response = await http.post(
      Uri.parse(
        'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${AppConfig.firebaseWebApiKey}',
      ),
      headers: const {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'returnSecureToken': true,
      }),
    );

    final payload = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw MobileAuthException(_extractFirebaseError(payload));
    }

    final session = _sessionFromSignInPayload(payload);
    await persistSession(session);
    return session;
  }

  Future<MobileSession> refreshSession(String refreshToken) async {
    final response = await http.post(
      Uri.parse(
        'https://securetoken.googleapis.com/v1/token?key=${AppConfig.firebaseWebApiKey}',
      ),
      headers: const {'Content-Type': 'application/x-www-form-urlencoded'},
      body: {
        'grant_type': 'refresh_token',
        'refresh_token': refreshToken,
      },
    );

    final payload = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw MobileAuthException(_extractFirebaseError(payload));
    }

    final expiresIn = int.tryParse('${payload['expires_in'] ?? '3600'}') ?? 3600;

    return MobileSession(
      idToken: '${payload['id_token'] ?? ''}',
      refreshToken: '${payload['refresh_token'] ?? refreshToken}',
      localId: '${payload['user_id'] ?? ''}',
      email: '${payload['user_id'] ?? ''}',
      expiresAt: DateTime.now().add(Duration(seconds: expiresIn)),
    );
  }

  Future<void> persistSession(MobileSession session) async {
    final preferences = await SharedPreferences.getInstance();

    for (final entry in session.toStorage().entries) {
      await preferences.setString('$_storagePrefix${entry.key}', entry.value);
    }
  }

  Future<void> clearSession() async {
    final preferences = await SharedPreferences.getInstance();

    for (final key in ['idToken', 'refreshToken', 'localId', 'email', 'expiresAt']) {
      await preferences.remove('$_storagePrefix$key');
    }
  }

  MobileSession _sessionFromSignInPayload(Map<String, dynamic> payload) {
    final expiresIn = int.tryParse('${payload['expiresIn'] ?? '3600'}') ?? 3600;

    return MobileSession(
      idToken: '${payload['idToken'] ?? ''}',
      refreshToken: '${payload['refreshToken'] ?? ''}',
      localId: '${payload['localId'] ?? ''}',
      email: '${payload['email'] ?? ''}',
      expiresAt: DateTime.now().add(Duration(seconds: expiresIn)),
    );
  }

  String _extractFirebaseError(Map<String, dynamic> payload) {
    final rawCode = '${(payload['error'] as Map<String, dynamic>? ?? const {})['message'] ?? ''}';

    switch (rawCode) {
      case 'EMAIL_NOT_FOUND':
      case 'INVALID_LOGIN_CREDENTIALS':
      case 'INVALID_PASSWORD':
        return 'Hindi tama ang email o password.';
      case 'USER_DISABLED':
        return 'Disabled ang account na ito.';
      case 'TOO_MANY_ATTEMPTS_TRY_LATER':
        return 'Masyadong maraming attempts. Pakisubukan muli mamaya.';
      default:
        return rawCode.isNotEmpty ? rawCode : 'Hindi makapag-sign in sa ngayon.';
    }
  }
}

import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../app_config.dart';
import '../mobile_firebase_options.dart';
import '../models/mobile_models.dart';
import 'lingkod_ani_api.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await PushNotificationsService.ensureFirebaseInitialized();
}

class PushNotificationsService {
  PushNotificationsService({
    LingkodAniApi? api,
    FirebaseMessaging? messaging,
    void Function(RemoteMessage message)? onForegroundMessage,
  }) : _api = api ?? const LingkodAniApi(),
       _messaging = messaging,
       _onForegroundMessage = onForegroundMessage;

  final LingkodAniApi _api;
  final FirebaseMessaging? _messaging;
  final void Function(RemoteMessage message)? _onForegroundMessage;

  StreamSubscription<String>? _tokenRefreshSubscription;
  StreamSubscription<RemoteMessage>? _foregroundMessageSubscription;
  String? _registeredToken;
  String? _registeredSessionUserId;

  static bool get isSupportedPlatform =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.android;
  static bool get isConfigured =>
      isSupportedPlatform && AppConfig.hasFirebaseMessagingConfig;

  static Future<bool> ensureFirebaseInitialized() async {
    if (!isConfigured) {
      return false;
    }

    if (Firebase.apps.isNotEmpty) {
      return true;
    }

    final options = MobileFirebaseOptions.android;

    if (options == null) {
      return false;
    }

    await Firebase.initializeApp(options: options);
    return true;
  }

  Future<bool> initializeForSession({
    required MobileSession session,
    required MobileProfile profile,
  }) async {
    final ready = await ensureFirebaseInitialized();

    if (!ready) {
      return false;
    }

    final messaging = _messaging ?? FirebaseMessaging.instance;
    await messaging.setAutoInitEnabled(true);
    final settings = await messaging.getNotificationSettings();

    if (!_isPermissionGranted(settings.authorizationStatus)) {
      return false;
    }

    await _startForegroundHandling(
      messaging: messaging,
      session: session,
      profile: profile,
    );

    return true;
  }

  Future<bool> requestPermissionAndInitialize({
    required MobileSession session,
    required MobileProfile profile,
  }) async {
    final ready = await ensureFirebaseInitialized();

    if (!ready) {
      return false;
    }

    final messaging = _messaging ?? FirebaseMessaging.instance;
    await messaging.setAutoInitEnabled(true);
    final settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      announcement: false,
      provisional: false,
    );

    if (!_isPermissionGranted(settings.authorizationStatus)) {
      return false;
    }

    await _startForegroundHandling(
      messaging: messaging,
      session: session,
      profile: profile,
    );

    return true;
  }

  Future<void> _startForegroundHandling({
    required FirebaseMessaging messaging,
    required MobileSession session,
    required MobileProfile profile,
  }) async {
    _foregroundMessageSubscription ??= FirebaseMessaging.onMessage.listen((
      message,
    ) {
      _onForegroundMessage?.call(message);
    });

    _tokenRefreshSubscription ??= messaging.onTokenRefresh.listen((
      token,
    ) async {
      await _registerToken(session: session, profile: profile, token: token);
    });

    final token = await messaging.getToken();

    if (token != null && token.trim().isNotEmpty) {
      await _registerToken(session: session, profile: profile, token: token);
    }
  }

  bool _isPermissionGranted(AuthorizationStatus status) {
    return status == AuthorizationStatus.authorized ||
        status == AuthorizationStatus.provisional;
  }

  Future<void> unregisterForSession(MobileSession? session) async {
    if (session == null) {
      await _clearSubscriptions();
      _registeredToken = null;
      _registeredSessionUserId = null;
      return;
    }

    final ready = await ensureFirebaseInitialized();

    if (!ready) {
      await _clearSubscriptions();
      _registeredToken = null;
      _registeredSessionUserId = null;
      return;
    }

    final messaging = _messaging ?? FirebaseMessaging.instance;
    final token = _registeredToken ?? await messaging.getToken();

    if (token != null && token.trim().isNotEmpty) {
      try {
        await _api.unregisterPushToken(session.idToken, token: token);
      } catch (_) {
        // Best-effort only; a failed unregister should not block sign-out.
      }
    }

    try {
      await messaging.deleteToken();
    } catch (_) {
      // Best-effort only; some devices may recreate the token later on sign-in.
    }

    await _clearSubscriptions();
    _registeredToken = null;
    _registeredSessionUserId = null;
  }

  Future<void> _registerToken({
    required MobileSession session,
    required MobileProfile profile,
    required String token,
  }) async {
    final normalizedToken = token.trim();

    if (normalizedToken.isEmpty) {
      return;
    }

    final isAlreadyRegistered =
        _registeredToken == normalizedToken &&
        _registeredSessionUserId == session.localId;

    if (isAlreadyRegistered) {
      return;
    }

    await _api.registerPushToken(
      session.idToken,
      token: normalizedToken,
      platform: 'android',
      deviceLabel: 'Lingkod-Ani Mobile',
    );

    _registeredToken = normalizedToken;
    _registeredSessionUserId = session.localId;
  }

  Future<void> _clearSubscriptions() async {
    await _tokenRefreshSubscription?.cancel();
    await _foregroundMessageSubscription?.cancel();
    _tokenRefreshSubscription = null;
    _foregroundMessageSubscription = null;
  }

  Future<void> dispose() async {
    await _clearSubscriptions();
  }
}

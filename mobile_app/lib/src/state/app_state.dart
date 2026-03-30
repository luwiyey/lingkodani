import 'package:flutter/foundation.dart';

import '../core/models/mobile_models.dart';
import '../core/services/lingkod_ani_api.dart';
import '../core/services/mobile_auth_service.dart';
import '../core/services/push_notifications_service.dart';

class AppState extends ChangeNotifier {
  AppState({
    MobileAuthService? authService,
    LingkodAniApi? api,
    PushNotificationsService? pushNotifications,
  })  : _authService = authService ?? MobileAuthService(),
        _api = api ?? const LingkodAniApi(),
        _pushNotifications =
            pushNotifications ?? PushNotificationsService();

  final MobileAuthService _authService;
  final LingkodAniApi _api;
  final PushNotificationsService _pushNotifications;

  bool _bootstrapping = true;
  bool _submitting = false;
  String? _errorMessage;
  MobileSession? _session;
  MobileProfile? _profile;

  bool get bootstrapping => _bootstrapping;
  bool get submitting => _submitting;
  bool get isAuthenticated => _session != null && _profile != null;
  String? get errorMessage => _errorMessage;
  MobileSession? get session => _session;
  MobileProfile? get profile => _profile;
  LingkodAniApi get api => _api;

  Future<void> bootstrap() async {
    _bootstrapping = true;
    notifyListeners();

    try {
      final restoredSession = await _authService.restoreSession();

      if (restoredSession == null) {
        _session = null;
        _profile = null;
        _errorMessage = null;
      } else {
        _session = restoredSession;
        _profile = await _api.fetchProfile(restoredSession.idToken);
        await _pushNotifications.initializeForSession(
          session: restoredSession,
          profile: _profile!,
        );
        _errorMessage = null;
      }
    } catch (error) {
      _session = null;
      _profile = null;
      _errorMessage = error.toString();
      await _authService.clearSession();
    } finally {
      _bootstrapping = false;
      notifyListeners();
    }
  }

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    _submitting = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final nextSession = await _authService.signIn(
        email: email,
        password: password,
      );
      final nextProfile = await _api.fetchProfile(nextSession.idToken);
      _session = nextSession;
      _profile = nextProfile;
      await _pushNotifications.initializeForSession(
        session: nextSession,
        profile: nextProfile,
      );
    } catch (error) {
      _errorMessage = error.toString().replaceFirst('Exception: ', '');
      rethrow;
    } finally {
      _submitting = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    final existingSession = _session;
    _session = null;
    _profile = null;
    _errorMessage = null;
    notifyListeners();
    await _pushNotifications.unregisterForSession(existingSession);
    await _authService.clearSession();
  }

  @override
  void dispose() {
    _pushNotifications.dispose();
    super.dispose();
  }
}

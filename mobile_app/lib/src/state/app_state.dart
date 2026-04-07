import 'package:flutter/foundation.dart';

import '../core/models/mobile_models.dart';
import '../core/services/lingkod_ani_api.dart';
import '../core/services/mobile_action_queue_service.dart';
import '../core/services/mobile_auth_service.dart';
import '../core/services/push_notifications_service.dart';

class AppState extends ChangeNotifier {
  AppState({
    MobileAuthService? authService,
    LingkodAniApi? api,
    MobileActionQueueService? actionQueueService,
    PushNotificationsService? pushNotifications,
  })  : _authService = authService ?? MobileAuthService(),
        _api = api ?? const LingkodAniApi(),
        _actionQueueService =
            actionQueueService ?? const MobileActionQueueService(),
        _pushNotifications =
            pushNotifications ?? PushNotificationsService();

  final MobileAuthService _authService;
  final LingkodAniApi _api;
  final MobileActionQueueService _actionQueueService;
  final PushNotificationsService _pushNotifications;

  bool _bootstrapping = true;
  bool _submitting = false;
  bool _syncingPendingActions = false;
  String? _errorMessage;
  String? _pendingSyncError;
  MobileSession? _session;
  MobileProfile? _profile;
  List<MobileQueuedAction> _pendingActions = const [];
  DateTime? _lastPendingSyncAt;

  bool get bootstrapping => _bootstrapping;
  bool get submitting => _submitting;
  bool get isAuthenticated => _session != null && _profile != null;
  String? get errorMessage => _errorMessage;
  MobileSession? get session => _session;
  MobileProfile? get profile => _profile;
  LingkodAniApi get api => _api;
  bool get syncingPendingActions => _syncingPendingActions;
  String? get pendingSyncError => _pendingSyncError;
  DateTime? get lastPendingSyncAt => _lastPendingSyncAt;
  List<MobileQueuedAction> get pendingActions =>
      List<MobileQueuedAction>.unmodifiable(_pendingActions);
  int get pendingActionCount => _pendingActions.length;
  int get retryNeededCount =>
      _pendingActions.where((action) => action.hasError).length;
  int get manualReviewCount =>
      _pendingActions.where((action) => action.needsManualReview).length;
  int get longPendingCount =>
      _pendingActions.where((action) => action.isLongPending).length;

  Duration? get timeSinceLastPendingSync => _lastPendingSyncAt == null
      ? null
      : DateTime.now().difference(_lastPendingSyncAt!);

  bool get dataMayBeStale {
    final age = timeSinceLastPendingSync;

    if (age == null) {
      return pendingActionCount > 0;
    }

    if (pendingActionCount > 0) {
      return age >= const Duration(minutes: 10);
    }

    return age >= const Duration(minutes: 30);
  }

  bool get queueNeedsAttention =>
      retryNeededCount > 0 || manualReviewCount > 0 || longPendingCount > 0;

  Future<void> bootstrap() async {
    _bootstrapping = true;
    notifyListeners();

    try {
      final restoredSession = await _authService.restoreSession();

      if (restoredSession == null) {
        _session = null;
        _profile = null;
        _errorMessage = null;
        _pendingActions = const [];
        _pendingSyncError = null;
      } else {
        _session = restoredSession;
        _profile = await _api.fetchProfile(restoredSession.idToken);
        _pendingActions =
            await _actionQueueService.readActions(restoredSession.localId);
        await _pushNotifications.initializeForSession(
          session: restoredSession,
          profile: _profile!,
        );
        await syncPendingActions(notify: false);
        _errorMessage = null;
      }
    } catch (error) {
      _session = null;
      _profile = null;
      _errorMessage = error.toString();
      _pendingActions = const [];
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
      _pendingActions = await _actionQueueService.readActions(nextSession.localId);
      await _pushNotifications.initializeForSession(
        session: nextSession,
        profile: nextProfile,
      );
      await syncPendingActions(notify: false);
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
    _pendingSyncError = null;
    _pendingActions = const [];
    notifyListeners();
    await _pushNotifications.unregisterForSession(existingSession);
    await _authService.clearSession();
  }

  List<MobileQueuedAction> pendingActionsForMessage(String messageId) {
    return _pendingActions
        .where((action) => action.messageId == messageId)
        .toList(growable: false);
  }

  List<MobileQueuedAction> pendingActionsForFieldVisit(String visitId) {
    return _pendingActions
        .where(
          (action) =>
              action.type == MobileQueuedActionType.fieldVisitStatus &&
              action.messageId == visitId,
        )
        .toList(growable: false);
  }

  bool hasPendingActionForMessage(String messageId) {
    return _pendingActions.any((action) => action.messageId == messageId);
  }

  List<MobileQueuedAction> pendingActionsForFarmer(String farmerId) {
    return _pendingActions
        .where(
          (action) =>
              action.type == MobileQueuedActionType.farmerNote &&
              action.messageId == farmerId,
        )
        .toList(growable: false);
  }

  Future<void> retryPendingAction(String actionId) async {
    final session = _requireSession();
    MobileQueuedAction? action;
    for (final entry in _pendingActions) {
      if (entry.id == actionId) {
        action = entry;
        break;
      }
    }

    if (action == null) {
      throw Exception('Hindi na mahanap ang pending action na ito.');
    }

    try {
      await _performQueuedAction(session, action);
      await dismissPendingAction(actionId);
      _lastPendingSyncAt = DateTime.now();
      _pendingSyncError = null;
      notifyListeners();
    } on LingkodAniApiException catch (error) {
      await _replacePendingAction(
        action.copyWith(
          attempts: action.attempts + 1,
          lastAttemptAt: DateTime.now(),
          lastError: error.message,
        ),
      );
      _pendingSyncError = error.message;
      notifyListeners();
      rethrow;
    } catch (error) {
      await _replacePendingAction(
        action.copyWith(
          attempts: action.attempts + 1,
          lastAttemptAt: DateTime.now(),
          lastError: error.toString(),
        ),
      );
      _pendingSyncError = error.toString();
      notifyListeners();
      rethrow;
    }
  }

  Future<void> dismissPendingAction(String actionId) async {
    final session = _requireSession();
    final remaining = _pendingActions
        .where((action) => action.id != actionId)
        .toList(growable: false);
    _pendingActions =
        await _actionQueueService.replaceForUser(session.localId, remaining);
    if (_pendingActions.isEmpty) {
      _pendingSyncError = null;
    }
    notifyListeners();
  }

  Future<MobileActionSubmissionResult> sendSmsReply({
    required String messageId,
    required String reply,
    required String status,
    String? parsedIntent,
    String? urgency,
    String? safetyFlag,
    String? tone,
  }) async {
    final session = _requireSession();
    final payload = <String, dynamic>{
      'reply': reply,
      'status': status,
      if (parsedIntent != null && parsedIntent.isNotEmpty)
        'parsedIntent': parsedIntent,
      if (urgency != null && urgency.isNotEmpty) 'urgency': urgency,
      if (safetyFlag != null && safetyFlag.isNotEmpty) 'safetyFlag': safetyFlag,
      if (tone != null && tone.isNotEmpty) 'tone': tone,
    };

    try {
      await _api.sendSmsReply(
        session.idToken,
        messageId: messageId,
        reply: reply,
        status: status,
        parsedIntent: parsedIntent,
        urgency: urgency,
        safetyFlag: safetyFlag,
        tone: tone,
      );
      await _removeQueuedAction(
        userId: session.localId,
        type: MobileQueuedActionType.smsReply,
        messageId: messageId,
      );

      return const MobileActionSubmissionResult(
        status: MobileActionSubmissionStatus.sent,
      );
    } on LingkodAniApiException {
      rethrow;
    } catch (error) {
      await _queueAction(
        userId: session.localId,
        type: MobileQueuedActionType.smsReply,
        messageId: messageId,
        payload: payload,
        error: error,
      );

      return const MobileActionSubmissionResult(
        status: MobileActionSubmissionStatus.queued,
        detail: 'Na-save offline ang SMS reply at isi-sync ito kapag may signal.',
      );
    }
  }

  Future<MobileActionSubmissionResult> requestResolutionConfirmation({
    required String messageId,
    String note = '',
  }) async {
    final session = _requireSession();
    final payload = <String, dynamic>{
      'note': note,
    };

    try {
      await _api.requestResolutionConfirmation(
        session.idToken,
        messageId: messageId,
        note: note,
      );
      await _removeQueuedAction(
        userId: session.localId,
        type: MobileQueuedActionType.resolutionConfirmation,
        messageId: messageId,
      );

      return const MobileActionSubmissionResult(
        status: MobileActionSubmissionStatus.sent,
      );
    } on LingkodAniApiException {
      rethrow;
    } catch (error) {
      await _queueAction(
        userId: session.localId,
        type: MobileQueuedActionType.resolutionConfirmation,
        messageId: messageId,
        payload: payload,
        error: error,
      );

      return const MobileActionSubmissionResult(
        status: MobileActionSubmissionStatus.queued,
        detail:
            'Na-save offline ang YES/NO confirmation request at isi-sync ito kapag may signal.',
      );
    }
  }

  Future<MobileActionSubmissionResult> assignSmsMessage({
    required String messageId,
  }) async {
    final session = _requireSession();

    try {
      await _api.assignSmsMessage(
        session.idToken,
        messageId: messageId,
      );
      await _removeQueuedAction(
        userId: session.localId,
        type: MobileQueuedActionType.assignMessage,
        messageId: messageId,
      );

      return const MobileActionSubmissionResult(
        status: MobileActionSubmissionStatus.sent,
      );
    } on LingkodAniApiException {
      rethrow;
    } catch (error) {
      await _queueAction(
        userId: session.localId,
        type: MobileQueuedActionType.assignMessage,
        messageId: messageId,
        payload: const {},
        error: error,
      );

      return const MobileActionSubmissionResult(
        status: MobileActionSubmissionStatus.queued,
        detail: 'Na-save offline ang case assignment at isi-sync ito kapag may signal.',
      );
    }
  }

  Future<MobileActionSubmissionResult> addFarmerNote({
    required String farmerId,
    required String note,
  }) async {
    final session = _requireSession();
    final trimmedNote = note.trim();
    final payload = <String, dynamic>{'note': trimmedNote};

    try {
      await _api.addFarmerNote(
        session.idToken,
        farmerId: farmerId,
        note: trimmedNote,
      );
      await _removeQueuedAction(
        userId: session.localId,
        type: MobileQueuedActionType.farmerNote,
        messageId: farmerId,
      );

      return const MobileActionSubmissionResult(
        status: MobileActionSubmissionStatus.sent,
      );
    } on LingkodAniApiException {
      rethrow;
    } catch (error) {
      await _queueAction(
        userId: session.localId,
        type: MobileQueuedActionType.farmerNote,
        messageId: farmerId,
        payload: payload,
        error: error,
      );

      return const MobileActionSubmissionResult(
        status: MobileActionSubmissionStatus.queued,
        detail: 'Na-save offline ang farmer note at isi-sync ito kapag may signal.',
      );
    }
  }

  Future<MobileActionSubmissionResult> updateFieldVisitStatus({
    required String visitId,
    required String status,
    String note = '',
    Map<String, dynamic>? verification,
  }) async {
    final session = _requireSession();
    final payload = <String, dynamic>{
      'status': status,
      if (note.trim().isNotEmpty) 'note': note.trim(),
    };
    if (verification != null) {
      payload['verification'] = verification;
    }

    try {
      await _api.updateFieldVisitStatus(
        session.idToken,
        visitId: visitId,
        status: status,
        note: note,
        verification: verification,
      );
      await _removeQueuedAction(
        userId: session.localId,
        type: MobileQueuedActionType.fieldVisitStatus,
        messageId: visitId,
      );

      return const MobileActionSubmissionResult(
        status: MobileActionSubmissionStatus.sent,
      );
    } on LingkodAniApiException {
      rethrow;
    } catch (error) {
      await _queueAction(
        userId: session.localId,
        type: MobileQueuedActionType.fieldVisitStatus,
        messageId: visitId,
        payload: payload,
        error: error,
      );

      return const MobileActionSubmissionResult(
        status: MobileActionSubmissionStatus.queued,
        detail:
            'Na-save offline ang field visit update at isi-sync ito kapag may signal.',
      );
    }
  }

  Future<void> syncPendingActions({bool notify = true}) async {
    final session = _session;

    if (session == null || _syncingPendingActions) {
      return;
    }

    _syncingPendingActions = true;
    _pendingSyncError = null;
    if (notify) {
      notifyListeners();
    }

    final queued = await _actionQueueService.readActions(session.localId);
    final remaining = <MobileQueuedAction>[];

    for (final action in queued) {
      try {
        await _performQueuedAction(session, action);
      } on LingkodAniApiException catch (error) {
        remaining.add(
          action.copyWith(
            attempts: action.attempts + 1,
            lastAttemptAt: DateTime.now(),
            lastError: error.message,
          ),
        );
        _pendingSyncError = error.message;
      } catch (error) {
        remaining.add(
          action.copyWith(
            attempts: action.attempts + 1,
            lastAttemptAt: DateTime.now(),
            lastError: error.toString(),
          ),
        );
        _pendingSyncError = error.toString();
      }
    }

    _lastPendingSyncAt = DateTime.now();
    _pendingActions =
        await _actionQueueService.replaceForUser(session.localId, remaining);
    _syncingPendingActions = false;
    notifyListeners();
  }

  MobileSession _requireSession() {
    final session = _session;

    if (session == null) {
      throw Exception('Wala pang active mobile session.');
    }

    return session;
  }

  Future<void> _performQueuedAction(
    MobileSession session,
    MobileQueuedAction action,
  ) async {
    switch (action.type) {
      case MobileQueuedActionType.smsReply:
        await _api.sendSmsReply(
          session.idToken,
          messageId: action.messageId,
          reply: '${action.payload['reply'] ?? ''}',
          status: '${action.payload['status'] ?? 'replied'}',
          parsedIntent: action.payload['parsedIntent']?.toString(),
          urgency: action.payload['urgency']?.toString(),
          safetyFlag: action.payload['safetyFlag']?.toString(),
          tone: action.payload['tone']?.toString(),
        );
        return;
      case MobileQueuedActionType.resolutionConfirmation:
        await _api.requestResolutionConfirmation(
          session.idToken,
          messageId: action.messageId,
          note: '${action.payload['note'] ?? ''}',
        );
        return;
      case MobileQueuedActionType.fieldVisitStatus:
        await _api.updateFieldVisitStatus(
          session.idToken,
          visitId: action.messageId,
          status: '${action.payload['status'] ?? 'in_progress'}',
          note: '${action.payload['note'] ?? ''}',
          verification: action.payload['verification'] as Map<String, dynamic>?,
        );
        return;
      case MobileQueuedActionType.assignMessage:
        await _api.assignSmsMessage(
          session.idToken,
          messageId: action.messageId,
        );
        return;
      case MobileQueuedActionType.farmerNote:
        await _api.addFarmerNote(
          session.idToken,
          farmerId: action.messageId,
          note: '${action.payload['note'] ?? ''}',
        );
        return;
    }
  }

  Future<void> _queueAction({
    required String userId,
    required MobileQueuedActionType type,
    required String messageId,
    required Map<String, dynamic> payload,
    required Object error,
  }) async {
    final nextAction = MobileQueuedAction(
      id: '${type.value}-$messageId-${DateTime.now().millisecondsSinceEpoch}',
      userId: userId,
      type: type,
      messageId: messageId,
      createdAt: DateTime.now(),
      payload: payload,
      attempts: 0,
      lastError: error.toString(),
    );

    _pendingActions = await _actionQueueService.queueAction(nextAction);
    _pendingSyncError = error.toString();
    notifyListeners();
  }

  Future<void> _replacePendingAction(MobileQueuedAction nextAction) async {
    final nextActions = _pendingActions
        .map((action) => action.id == nextAction.id ? nextAction : action)
        .toList(growable: false);
    _pendingActions = await _actionQueueService.replaceForUser(
      nextAction.userId,
      nextActions,
    );
  }

  Future<void> _removeQueuedAction({
    required String userId,
    required MobileQueuedActionType type,
    required String messageId,
  }) async {
    final remaining = _pendingActions
        .where(
          (action) =>
              !(action.userId == userId &&
                  action.type == type &&
                  action.messageId == messageId),
        )
        .toList(growable: false);
    _pendingActions =
        await _actionQueueService.replaceForUser(userId, remaining);
    notifyListeners();
  }

  @override
  void dispose() {
    _pushNotifications.dispose();
    super.dispose();
  }
}

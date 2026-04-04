import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/mobile_models.dart';

class MobileActionQueueService {
  const MobileActionQueueService();

  static const _storageKey = 'mobile-action-queue';

  Future<List<MobileQueuedAction>> readActions(String userId) async {
    final queue = await _readAll();
    return queue.where((action) => action.userId == userId).toList()
      ..sort((left, right) => left.createdAt.compareTo(right.createdAt));
  }

  Future<List<MobileQueuedAction>> queueAction(MobileQueuedAction nextAction) async {
    final queue = await _readAll();
    final nextQueue = [
      ...queue.where(
        (action) =>
            !(action.userId == nextAction.userId &&
                action.type == nextAction.type &&
                action.messageId == nextAction.messageId),
      ),
      nextAction,
    ]..sort((left, right) => left.createdAt.compareTo(right.createdAt));

    await _writeAll(nextQueue);
    return nextQueue.where((action) => action.userId == nextAction.userId).toList();
  }

  Future<List<MobileQueuedAction>> replaceForUser(
    String userId,
    List<MobileQueuedAction> nextActions,
  ) async {
    final queue = await _readAll();
    final merged = [
      ...queue.where((action) => action.userId != userId),
      ...nextActions,
    ]..sort((left, right) => left.createdAt.compareTo(right.createdAt));

    await _writeAll(merged);
    return nextActions;
  }

  Future<void> clearForUser(String userId) async {
    await replaceForUser(userId, const []);
  }

  Future<List<MobileQueuedAction>> _readAll() async {
    final preferences = await SharedPreferences.getInstance();
    final rawValue = preferences.getString(_storageKey);

    if (rawValue == null || rawValue.isEmpty) {
      return const [];
    }

    try {
      final decoded = jsonDecode(rawValue) as List<dynamic>;
      return decoded
          .whereType<Map>()
          .map((item) => MobileQueuedAction.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    } catch (_) {
      await preferences.remove(_storageKey);
      return const [];
    }
  }

  Future<void> _writeAll(List<MobileQueuedAction> queue) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(
      _storageKey,
      jsonEncode(queue.map((action) => action.toJson()).toList()),
    );
  }
}

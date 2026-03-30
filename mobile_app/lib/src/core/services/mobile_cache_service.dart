import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class MobileCacheService {
  const MobileCacheService();

  Future<void> writeJson(String key, Map<String, dynamic> payload) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(
      key,
      jsonEncode({
        'cachedAt': DateTime.now().toIso8601String(),
        'payload': payload,
      }),
    );
  }

  Future<Map<String, dynamic>?> readJson(String key) async {
    final preferences = await SharedPreferences.getInstance();
    final rawValue = preferences.getString(key);

    if (rawValue == null || rawValue.isEmpty) {
      return null;
    }

    try {
      final decoded = jsonDecode(rawValue) as Map<String, dynamic>;
      final payload = decoded['payload'];

      if (payload is Map<String, dynamic>) {
        return payload;
      }
    } catch (_) {
      await preferences.remove(key);
    }

    return null;
  }
}

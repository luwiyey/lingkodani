import 'dart:convert';

import 'package:http/http.dart' as http;

import '../app_config.dart';
import '../models/mobile_models.dart';
import 'mobile_cache_service.dart';

class LingkodAniApiException implements Exception {
  const LingkodAniApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

class LingkodAniApi {
  const LingkodAniApi({
    this.cache = const MobileCacheService(),
  });

  final MobileCacheService cache;

  Future<MobileProfile> fetchProfile(String idToken) async {
    final response = await _get('/api/auth/profile', idToken: idToken);
    return MobileProfile.fromJson(response);
  }

  Future<MobileOverview> fetchOverview(String idToken) async {
    final response = await _getWithCache(
      '/api/mobile/overview',
      idToken: idToken,
      cacheKey: 'mobile-overview',
    );
    return MobileOverview.fromJson(response);
  }

  Future<List<FarmerSummary>> fetchFarmers(
    String idToken, {
    String query = '',
  }) async {
    final encodedQuery = Uri.encodeQueryComponent(query);
    final response = await _getWithCache(
      '/api/mobile/farmers${query.isNotEmpty ? '?query=$encodedQuery' : ''}',
      idToken: idToken,
      cacheKey: 'mobile-farmers:${query.toLowerCase()}',
    );

    return (response['farmers'] as List<dynamic>? ?? const [])
        .map((item) => FarmerSummary.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<SmsFeedItem>> fetchSmsFeed(String idToken) async {
    final response = await _getWithCache(
      '/api/mobile/sms-feed',
      idToken: idToken,
      cacheKey: 'mobile-sms-feed',
    );

    return (response['messages'] as List<dynamic>? ?? const [])
        .map((item) => SmsFeedItem.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<FarmerDetail> fetchFarmerDetail(String idToken, String farmerId) async {
    final response = await _getWithCache(
      '/api/mobile/farmers/${Uri.encodeComponent(farmerId)}',
      idToken: idToken,
      cacheKey: 'mobile-farmer-detail:$farmerId',
    );

    return FarmerDetail.fromJson(response);
  }

  Future<MobileNotificationsFeed> fetchNotifications(String idToken) async {
    final response = await _getWithCache(
      '/api/mobile/notifications',
      idToken: idToken,
      cacheKey: 'mobile-notifications',
    );

    return MobileNotificationsFeed.fromJson(response);
  }

  Future<KnowledgeSearchResult> searchKnowledge(
    String idToken, {
    required String query,
    required bool includeWebGrounding,
  }) async {
    final cacheKey =
        'mobile-knowledge:${query.trim().toLowerCase()}:${includeWebGrounding ? 'web' : 'local'}';
    final body = {
      'query': query,
      'includeWebGrounding': includeWebGrounding,
    };
    Map<String, dynamic> response;

    try {
      response = await _post(
        '/api/knowledge/search',
        idToken: idToken,
        body: body,
      );
      await cache.writeJson(cacheKey, response);
    } catch (error) {
      final cached = await cache.readJson(cacheKey);

      if (cached == null) {
        rethrow;
      }

      response = cached;
    }

    return KnowledgeSearchResult.fromJson(response);
  }

  Future<SmsFeedItem> sendSmsReply(
    String idToken, {
    required String messageId,
    required String reply,
    required String status,
    String? parsedIntent,
    String? urgency,
    String? safetyFlag,
    String? tone,
  }) async {
    final response = await _post(
      '/api/mobile/sms-feed/${Uri.encodeComponent(messageId)}/reply',
      idToken: idToken,
      body: {
        'reply': reply,
        'status': status,
        if (parsedIntent != null && parsedIntent.isNotEmpty)
          'parsedIntent': parsedIntent,
        if (urgency != null && urgency.isNotEmpty) 'urgency': urgency,
        if (safetyFlag != null && safetyFlag.isNotEmpty)
          'safetyFlag': safetyFlag,
        if (tone != null && tone.isNotEmpty) 'tone': tone,
      },
    );

    return SmsFeedItem.fromJson(response['message'] as Map<String, dynamic>? ?? const {});
  }

  Future<SmsFeedItem> requestResolutionConfirmation(
    String idToken, {
    required String messageId,
    String note = '',
  }) async {
    final response = await _post(
      '/api/mobile/sms-feed/${Uri.encodeComponent(messageId)}/resolve',
      idToken: idToken,
      body: {
        'note': note,
      },
    );

    return SmsFeedItem.fromJson(response['message'] as Map<String, dynamic>? ?? const {});
  }

  Future<void> registerPushToken(
    String idToken, {
    required String token,
    required String platform,
    String? deviceLabel,
  }) async {
    await _post(
      '/api/mobile/push',
      idToken: idToken,
      body: {
        'token': token,
        'platform': platform,
        if (deviceLabel != null && deviceLabel.isNotEmpty)
          'deviceLabel': deviceLabel,
      },
    );
  }

  Future<void> unregisterPushToken(
    String idToken, {
    required String token,
  }) async {
    await _delete(
      '/api/mobile/push',
      idToken: idToken,
      body: {
        'token': token,
      },
    );
  }

  Future<Map<String, dynamic>> _getWithCache(
    String path, {
    required String idToken,
    required String cacheKey,
  }) async {
    try {
      final response = await _get(path, idToken: idToken);
      await cache.writeJson(cacheKey, response);
      return response;
    } catch (_) {
      final cached = await cache.readJson(cacheKey);

      if (cached != null) {
        return cached;
      }

      rethrow;
    }
  }

  Future<Map<String, dynamic>> _get(
    String path, {
    required String idToken,
  }) async {
    final response = await http.get(
      Uri.parse('${AppConfig.baseUrl}$path'),
      headers: {
        'Authorization': 'Bearer $idToken',
        'Accept': 'application/json',
      },
    );

    return _decodeResponse(response);
  }

  Future<Map<String, dynamic>> _post(
    String path, {
    required String idToken,
    required Map<String, dynamic> body,
  }) async {
    final response = await http.post(
      Uri.parse('${AppConfig.baseUrl}$path'),
      headers: {
        'Authorization': 'Bearer $idToken',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode(body),
    );

    return _decodeResponse(response);
  }

  Future<Map<String, dynamic>> _delete(
    String path, {
    required String idToken,
    required Map<String, dynamic> body,
  }) async {
    final request = http.Request(
      'DELETE',
      Uri.parse('${AppConfig.baseUrl}$path'),
    );
    request.headers.addAll({
      'Authorization': 'Bearer $idToken',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });
    request.body = jsonEncode(body);

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);

    return _decodeResponse(response);
  }

  Map<String, dynamic> _decodeResponse(http.Response response) {
    final payload = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      final error = '${payload['error'] ?? 'Hindi maiproseso ang request sa ngayon.'}';
      throw LingkodAniApiException(error);
    }

    return payload;
  }
}

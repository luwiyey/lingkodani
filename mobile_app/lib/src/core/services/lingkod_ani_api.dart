import 'dart:convert';

import 'package:http/http.dart' as http;

import '../app_config.dart';
import '../models/mobile_models.dart';

class LingkodAniApiException implements Exception {
  const LingkodAniApiException(this.message);

  final String message;

  @override
  String toString() => message;
}

class LingkodAniApi {
  const LingkodAniApi();

  Future<MobileProfile> fetchProfile(String idToken) async {
    final response = await _get('/api/auth/profile', idToken: idToken);
    return MobileProfile.fromJson(response);
  }

  Future<MobileOverview> fetchOverview(String idToken) async {
    final response = await _get('/api/mobile/overview', idToken: idToken);
    return MobileOverview.fromJson(response);
  }

  Future<List<FarmerSummary>> fetchFarmers(
    String idToken, {
    String query = '',
  }) async {
    final encodedQuery = Uri.encodeQueryComponent(query);
    final response = await _get(
      '/api/mobile/farmers${query.isNotEmpty ? '?query=$encodedQuery' : ''}',
      idToken: idToken,
    );

    return (response['farmers'] as List<dynamic>? ?? const [])
        .map((item) => FarmerSummary.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<SmsFeedItem>> fetchSmsFeed(String idToken) async {
    final response = await _get('/api/mobile/sms-feed', idToken: idToken);

    return (response['messages'] as List<dynamic>? ?? const [])
        .map((item) => SmsFeedItem.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<KnowledgeSearchResult> searchKnowledge(
    String idToken, {
    required String query,
    required bool includeWebGrounding,
  }) async {
    final response = await _post(
      '/api/knowledge/search',
      idToken: idToken,
      body: {
        'query': query,
        'includeWebGrounding': includeWebGrounding,
      },
    );

    return KnowledgeSearchResult.fromJson(response);
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

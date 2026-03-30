class MobileSession {
  const MobileSession({
    required this.idToken,
    required this.refreshToken,
    required this.localId,
    required this.email,
    required this.expiresAt,
  });

  final String idToken;
  final String refreshToken;
  final String localId;
  final String email;
  final DateTime expiresAt;

  bool get isNearExpiry =>
      expiresAt.isBefore(DateTime.now().add(const Duration(minutes: 5)));

  Map<String, String> toStorage() {
    return {
      'idToken': idToken,
      'refreshToken': refreshToken,
      'localId': localId,
      'email': email,
      'expiresAt': expiresAt.toIso8601String(),
    };
  }

  factory MobileSession.fromStorage(Map<String, String> values) {
    return MobileSession(
      idToken: values['idToken'] ?? '',
      refreshToken: values['refreshToken'] ?? '',
      localId: values['localId'] ?? '',
      email: values['email'] ?? '',
      expiresAt: DateTime.tryParse(values['expiresAt'] ?? '') ?? DateTime.fromMillisecondsSinceEpoch(0),
    );
  }
}

class MobileProfile {
  const MobileProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.title,
    required this.preferredWorkspace,
  });

  final String id;
  final String name;
  final String email;
  final String role;
  final String title;
  final String preferredWorkspace;

  factory MobileProfile.fromJson(Map<String, dynamic> json) {
    final profile = (json['profile'] as Map<String, dynamic>? ?? json);
    return MobileProfile(
      id: '${profile['id'] ?? ''}',
      name: '${profile['name'] ?? ''}',
      email: '${profile['email'] ?? ''}',
      role: '${profile['role'] ?? ''}',
      title: '${profile['title'] ?? ''}',
      preferredWorkspace: '${profile['preferredWorkspace'] ?? 'simple'}',
    );
  }
}

class OverviewSummary {
  const OverviewSummary({
    required this.farmerCount,
    required this.activeFarmerCount,
    required this.pendingFarmerCount,
    required this.openCaseCount,
    required this.highUrgencyCount,
    required this.awaitingApprovalCount,
  });

  final int farmerCount;
  final int activeFarmerCount;
  final int pendingFarmerCount;
  final int openCaseCount;
  final int highUrgencyCount;
  final int awaitingApprovalCount;

  factory OverviewSummary.fromJson(Map<String, dynamic> json) {
    int readInt(String key) => (json[key] as num?)?.toInt() ?? 0;

    return OverviewSummary(
      farmerCount: readInt('farmerCount'),
      activeFarmerCount: readInt('activeFarmerCount'),
      pendingFarmerCount: readInt('pendingFarmerCount'),
      openCaseCount: readInt('openCaseCount'),
      highUrgencyCount: readInt('highUrgencyCount'),
      awaitingApprovalCount: readInt('awaitingApprovalCount'),
    );
  }
}

class RecentMessage {
  const RecentMessage({
    required this.id,
    required this.farmerName,
    required this.phone,
    required this.message,
    required this.timestamp,
    required this.urgency,
    required this.caseStatus,
    required this.status,
  });

  final String id;
  final String farmerName;
  final String phone;
  final String message;
  final String timestamp;
  final String urgency;
  final String caseStatus;
  final String status;

  factory RecentMessage.fromJson(Map<String, dynamic> json) {
    return RecentMessage(
      id: '${json['id'] ?? ''}',
      farmerName: '${json['farmerName'] ?? 'Hindi kilala'}',
      phone: '${json['phone'] ?? ''}',
      message: '${json['message'] ?? ''}',
      timestamp: '${json['timestamp'] ?? ''}',
      urgency: '${json['urgency'] ?? 'low'}',
      caseStatus: '${json['caseStatus'] ?? 'open'}',
      status: '${json['status'] ?? 'pending_approval'}',
    );
  }
}

class MobileOverview {
  const MobileOverview({
    required this.profile,
    required this.summary,
    required this.recentMessages,
  });

  final MobileProfile profile;
  final OverviewSummary summary;
  final List<RecentMessage> recentMessages;

  factory MobileOverview.fromJson(Map<String, dynamic> json) {
    return MobileOverview(
      profile: MobileProfile.fromJson(json['profile'] as Map<String, dynamic>? ?? const {}),
      summary: OverviewSummary.fromJson(json['summary'] as Map<String, dynamic>? ?? const {}),
      recentMessages: (json['recentMessages'] as List<dynamic>? ?? const [])
          .map((item) => RecentMessage.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class FarmerSummary {
  const FarmerSummary({
    required this.id,
    required this.name,
    required this.phone,
    required this.barangay,
    required this.sitio,
    required this.status,
    required this.crops,
    required this.lastSmsActivity,
  });

  final String id;
  final String name;
  final String phone;
  final String barangay;
  final String sitio;
  final String status;
  final List<String> crops;
  final String lastSmsActivity;

  factory FarmerSummary.fromJson(Map<String, dynamic> json) {
    final crops = (json['crops'] as List<dynamic>? ?? const [])
        .map((item) => '$item')
        .where((item) => item.isNotEmpty)
        .toList();

    return FarmerSummary(
      id: '${json['id'] ?? ''}',
      name: '${json['name'] ?? ''}',
      phone: '${json['phone'] ?? ''}',
      barangay: '${json['barangay'] ?? ''}',
      sitio: '${json['sitio'] ?? ''}',
      status: '${json['status'] ?? 'inactive'}',
      crops: crops,
      lastSmsActivity: '${json['lastSmsActivity'] ?? json['registrationDate'] ?? ''}',
    );
  }
}

class SmsFeedItem {
  const SmsFeedItem({
    required this.id,
    required this.farmerName,
    required this.phone,
    required this.message,
    required this.timestamp,
    required this.urgency,
    required this.status,
    required this.caseStatus,
    required this.parsedIntent,
    required this.aiAdvice,
    required this.safetyFlag,
    required this.assignedTo,
    required this.officialReminderCount,
  });

  final String id;
  final String farmerName;
  final String phone;
  final String message;
  final String timestamp;
  final String urgency;
  final String status;
  final String caseStatus;
  final String parsedIntent;
  final String aiAdvice;
  final String safetyFlag;
  final String assignedTo;
  final int officialReminderCount;

  factory SmsFeedItem.fromJson(Map<String, dynamic> json) {
    return SmsFeedItem(
      id: '${json['id'] ?? ''}',
      farmerName: '${json['farmerName'] ?? 'Hindi kilala'}',
      phone: '${json['phone'] ?? ''}',
      message: '${json['message'] ?? ''}',
      timestamp: '${json['timestamp'] ?? ''}',
      urgency: '${json['urgency'] ?? 'low'}',
      status: '${json['status'] ?? 'pending_approval'}',
      caseStatus: '${json['caseStatus'] ?? 'open'}',
      parsedIntent: '${json['parsedIntent'] ?? 'GENERAL'}',
      aiAdvice: '${json['aiAdvice'] ?? ''}',
      safetyFlag: '${json['safetyFlag'] ?? 'safe'}',
      assignedTo: '${json['assignedTo'] ?? ''}',
      officialReminderCount: (json['officialReminderCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class KnowledgeSource {
  const KnowledgeSource({
    required this.title,
    required this.url,
    required this.kind,
  });

  final String title;
  final String url;
  final String kind;

  factory KnowledgeSource.fromJson(Map<String, dynamic> json, {required String kind}) {
    return KnowledgeSource(
      title: '${json['title'] ?? json['label'] ?? 'Source'}',
      url: '${json['url'] ?? ''}',
      kind: kind,
    );
  }
}

class KnowledgeSearchResult {
  const KnowledgeSearchResult({
    required this.directAnswer,
    required this.answerMode,
    required this.usedWebGrounding,
    required this.relevantArticleTitles,
    required this.sources,
  });

  final String directAnswer;
  final String answerMode;
  final bool usedWebGrounding;
  final List<String> relevantArticleTitles;
  final List<KnowledgeSource> sources;

  factory KnowledgeSearchResult.fromJson(Map<String, dynamic> json) {
    final localSources = (json['relevantArticles'] as List<dynamic>? ?? const [])
        .map((item) => item as Map<String, dynamic>)
        .map((item) => KnowledgeSource.fromJson(item, kind: 'local'))
        .toList();
    final webSources = (json['webSources'] as List<dynamic>? ?? const [])
        .map((item) => item as Map<String, dynamic>)
        .map((item) => KnowledgeSource.fromJson(item, kind: 'web'))
        .toList();

    return KnowledgeSearchResult(
      directAnswer: '${json['directAnswer'] ?? ''}',
      answerMode: '${json['answerMode'] ?? 'local_only'}',
      usedWebGrounding: json['usedWebGrounding'] == true,
      relevantArticleTitles: (json['relevantArticles'] as List<dynamic>? ?? const [])
          .map((item) => item as Map<String, dynamic>)
          .map((item) => '${item['title'] ?? 'Knowledge article'}')
          .toList(),
      sources: [...localSources, ...webSources],
    );
  }
}

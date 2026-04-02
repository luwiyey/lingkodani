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
    required this.registrationDate,
    required this.lastSmsActivity,
  });

  final String id;
  final String name;
  final String phone;
  final String barangay;
  final String sitio;
  final String status;
  final List<String> crops;
  final String registrationDate;
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
      registrationDate: '${json['registrationDate'] ?? ''}',
      lastSmsActivity: '${json['lastSmsActivity'] ?? json['registrationDate'] ?? ''}',
    );
  }
}

class SmsFeedItem {
  const SmsFeedItem({
    required this.id,
    required this.caseId,
    required this.farmerName,
    required this.farmerId,
    required this.phone,
    required this.message,
    required this.timestamp,
    required this.urgency,
    required this.status,
    required this.caseStatus,
    required this.parsedIntent,
    required this.aiAdvice,
    required this.safetyFlag,
    required this.tone,
    required this.assignedTo,
    required this.officialReminderCount,
    required this.caseOutcomeStatus,
    required this.caseOutcomeSummary,
    required this.resolutionConfirmationStatus,
  });

  final String id;
  final String caseId;
  final String farmerName;
  final String farmerId;
  final String phone;
  final String message;
  final String timestamp;
  final String urgency;
  final String status;
  final String caseStatus;
  final String parsedIntent;
  final String aiAdvice;
  final String safetyFlag;
  final String tone;
  final String assignedTo;
  final int officialReminderCount;
  final String caseOutcomeStatus;
  final String caseOutcomeSummary;
  final String resolutionConfirmationStatus;

  bool get canOpenFarmerDetail => farmerId.isNotEmpty;
  bool get isAwaitingFarmerConfirmation =>
      resolutionConfirmationStatus == 'awaiting_farmer';

  factory SmsFeedItem.fromJson(Map<String, dynamic> json) {
    return SmsFeedItem(
      id: '${json['id'] ?? ''}',
      caseId: '${json['caseId'] ?? ''}',
      farmerId: '${json['farmerId'] ?? ''}',
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
      tone: '${json['tone'] ?? 'Neutral'}',
      assignedTo: '${json['assignedTo'] ?? ''}',
      officialReminderCount: (json['officialReminderCount'] as num?)?.toInt() ?? 0,
      caseOutcomeStatus: '${json['caseOutcomeStatus'] ?? ''}',
      caseOutcomeSummary: '${json['caseOutcomeSummary'] ?? ''}',
      resolutionConfirmationStatus:
          '${json['resolutionConfirmationStatus'] ?? ''}',
    );
  }
}

class AssistanceRecordSummary {
  const AssistanceRecordSummary({
    required this.id,
    required this.type,
    required this.title,
    required this.details,
    required this.status,
    required this.quantity,
    required this.updatedAt,
    required this.providedBy,
  });

  final String id;
  final String type;
  final String title;
  final String details;
  final String status;
  final String quantity;
  final String updatedAt;
  final String providedBy;

  factory AssistanceRecordSummary.fromJson(Map<String, dynamic> json) {
    return AssistanceRecordSummary(
      id: '${json['id'] ?? ''}',
      type: '${json['type'] ?? 'Tulong'}',
      title: '${json['title'] ?? ''}',
      details: '${json['details'] ?? ''}',
      status: '${json['status'] ?? 'planned'}',
      quantity: '${json['quantity'] ?? ''}',
      updatedAt: '${json['updatedAt'] ?? json['createdAt'] ?? ''}',
      providedBy: '${json['providedBy'] ?? ''}',
    );
  }
}

class FieldVisitSummary {
  const FieldVisitSummary({
    required this.id,
    required this.title,
    required this.purpose,
    required this.scheduledFor,
    required this.assignedTo,
    required this.priority,
    required this.status,
    required this.notes,
    required this.startedAt,
    required this.completedAt,
    required this.verificationStatus,
    required this.verificationSource,
    required this.verificationCapturedAt,
    required this.verificationLat,
    required this.verificationLng,
    required this.verificationAccuracyMeters,
    required this.verificationNote,
  });

  final String id;
  final String title;
  final String purpose;
  final String scheduledFor;
  final String assignedTo;
  final String priority;
  final String status;
  final String notes;
  final String startedAt;
  final String completedAt;
  final String verificationStatus;
  final String verificationSource;
  final String verificationCapturedAt;
  final double? verificationLat;
  final double? verificationLng;
  final double? verificationAccuracyMeters;
  final String verificationNote;

  bool get gpsVerified => verificationStatus == 'gps_captured';
  bool get manualVerification => verificationStatus == 'manual_only';

  factory FieldVisitSummary.fromJson(Map<String, dynamic> json) {
    return FieldVisitSummary(
      id: '${json['id'] ?? ''}',
      title: '${json['title'] ?? ''}',
      purpose: '${json['purpose'] ?? ''}',
      scheduledFor: '${json['scheduledFor'] ?? ''}',
      assignedTo: '${json['assignedTo'] ?? ''}',
      priority: '${json['priority'] ?? 'medium'}',
      status: '${json['status'] ?? 'scheduled'}',
      notes: '${json['notes'] ?? ''}',
      startedAt: '${json['startedAt'] ?? ''}',
      completedAt: '${json['completedAt'] ?? ''}',
      verificationStatus: '${json['verificationStatus'] ?? 'unverified'}',
      verificationSource: '${json['verificationSource'] ?? ''}',
      verificationCapturedAt: '${json['verificationCapturedAt'] ?? ''}',
      verificationLat: (json['verificationLat'] as num?)?.toDouble(),
      verificationLng: (json['verificationLng'] as num?)?.toDouble(),
      verificationAccuracyMeters:
          (json['verificationAccuracyMeters'] as num?)?.toDouble(),
      verificationNote: '${json['verificationNote'] ?? ''}',
    );
  }
}

class FarmerDetail {
  const FarmerDetail({
    required this.farmer,
    required this.recentMessages,
    required this.assistanceRecords,
    required this.fieldVisitTasks,
  });

  final FarmerSummary farmer;
  final List<SmsFeedItem> recentMessages;
  final List<AssistanceRecordSummary> assistanceRecords;
  final List<FieldVisitSummary> fieldVisitTasks;

  factory FarmerDetail.fromJson(Map<String, dynamic> json) {
    return FarmerDetail(
      farmer: FarmerSummary.fromJson(json['farmer'] as Map<String, dynamic>? ?? const {}),
      recentMessages: (json['recentMessages'] as List<dynamic>? ?? const [])
          .map((item) => SmsFeedItem.fromJson(item as Map<String, dynamic>))
          .toList(),
      assistanceRecords:
          (json['assistanceRecords'] as List<dynamic>? ?? const [])
              .map(
                (item) => AssistanceRecordSummary.fromJson(
                  item as Map<String, dynamic>,
                ),
              )
              .toList(),
      fieldVisitTasks: (json['fieldVisitTasks'] as List<dynamic>? ?? const [])
          .map((item) => FieldVisitSummary.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}

class MobileNotificationSummary {
  const MobileNotificationSummary({
    required this.alertCount,
    required this.urgentCaseCount,
  });

  final int alertCount;
  final int urgentCaseCount;

  factory MobileNotificationSummary.fromJson(Map<String, dynamic> json) {
    return MobileNotificationSummary(
      alertCount: (json['alertCount'] as num?)?.toInt() ?? 0,
      urgentCaseCount: (json['urgentCaseCount'] as num?)?.toInt() ?? 0,
    );
  }
}

class MobileNotificationItem {
  const MobileNotificationItem({
    required this.id,
    required this.title,
    required this.timestamp,
    required this.kind,
    required this.severity,
    required this.subtitle,
    required this.detail,
    required this.farmerId,
    required this.messageId,
  });

  final String id;
  final String title;
  final String timestamp;
  final String kind;
  final String severity;
  final String subtitle;
  final String detail;
  final String farmerId;
  final String messageId;

  bool get hasFarmerTarget => farmerId.isNotEmpty;
  bool get hasMessageTarget => messageId.isNotEmpty;

  factory MobileNotificationItem.fromJson(Map<String, dynamic> json) {
    return MobileNotificationItem(
      id: '${json['id'] ?? ''}',
      title: '${json['title'] ?? 'Notification'}',
      timestamp: '${json['timestamp'] ?? ''}',
      kind: '${json['kind'] ?? 'alert'}',
      severity: '${json['severity'] ?? 'medium'}',
      subtitle: '${json['subtitle'] ?? ''}',
      detail: '${json['detail'] ?? ''}',
      farmerId: '${json['farmerId'] ?? ''}',
      messageId: '${json['messageId'] ?? ''}',
    );
  }
}

class MobileNotificationsFeed {
  const MobileNotificationsFeed({
    required this.summary,
    required this.notifications,
  });

  final MobileNotificationSummary summary;
  final List<MobileNotificationItem> notifications;

  factory MobileNotificationsFeed.fromJson(Map<String, dynamic> json) {
    return MobileNotificationsFeed(
      summary: MobileNotificationSummary.fromJson(
        json['summary'] as Map<String, dynamic>? ?? const {},
      ),
      notifications: (json['notifications'] as List<dynamic>? ?? const [])
          .map(
            (item) =>
                MobileNotificationItem.fromJson(item as Map<String, dynamic>),
          )
          .toList(),
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

enum MobileQueuedActionType {
  smsReply,
  resolutionConfirmation,
  fieldVisitStatus,
}

extension MobileQueuedActionTypeValue on MobileQueuedActionType {
  String get value {
    switch (this) {
      case MobileQueuedActionType.smsReply:
        return 'sms_reply';
      case MobileQueuedActionType.resolutionConfirmation:
        return 'resolution_confirmation';
      case MobileQueuedActionType.fieldVisitStatus:
        return 'field_visit_status';
    }
  }
}

MobileQueuedActionType mobileQueuedActionTypeFromValue(String value) {
  switch (value) {
    case 'field_visit_status':
      return MobileQueuedActionType.fieldVisitStatus;
    case 'resolution_confirmation':
      return MobileQueuedActionType.resolutionConfirmation;
    case 'sms_reply':
    default:
      return MobileQueuedActionType.smsReply;
  }
}

class MobileQueuedAction {
  const MobileQueuedAction({
    required this.id,
    required this.userId,
    required this.type,
    required this.messageId,
    required this.createdAt,
    required this.payload,
    this.attempts = 0,
    this.lastAttemptAt,
    this.lastError,
  });

  final String id;
  final String userId;
  final MobileQueuedActionType type;
  final String messageId;
  final DateTime createdAt;
  final Map<String, dynamic> payload;
  final int attempts;
  final DateTime? lastAttemptAt;
  final String? lastError;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'type': type.value,
      'messageId': messageId,
      'createdAt': createdAt.toIso8601String(),
      'payload': payload,
      'attempts': attempts,
      if (lastAttemptAt != null) 'lastAttemptAt': lastAttemptAt!.toIso8601String(),
      if (lastError != null) 'lastError': lastError,
    };
  }

  factory MobileQueuedAction.fromJson(Map<String, dynamic> json) {
    return MobileQueuedAction(
      id: '${json['id'] ?? ''}',
      userId: '${json['userId'] ?? ''}',
      type: mobileQueuedActionTypeFromValue('${json['type'] ?? 'sms_reply'}'),
      messageId: '${json['messageId'] ?? ''}',
      createdAt: DateTime.tryParse('${json['createdAt'] ?? ''}') ?? DateTime.fromMillisecondsSinceEpoch(0),
      payload: Map<String, dynamic>.from(json['payload'] as Map? ?? const {}),
      attempts: (json['attempts'] as num?)?.toInt() ?? 0,
      lastAttemptAt: DateTime.tryParse('${json['lastAttemptAt'] ?? ''}'),
      lastError: json['lastError'] == null ? null : '${json['lastError']}',
    );
  }

  MobileQueuedAction copyWith({
    int? attempts,
    DateTime? lastAttemptAt,
    String? lastError,
  }) {
    return MobileQueuedAction(
      id: id,
      userId: userId,
      type: type,
      messageId: messageId,
      createdAt: createdAt,
      payload: payload,
      attempts: attempts ?? this.attempts,
      lastAttemptAt: lastAttemptAt ?? this.lastAttemptAt,
      lastError: lastError ?? this.lastError,
    );
  }
}

enum MobileActionSubmissionStatus {
  sent,
  queued,
}

class MobileActionSubmissionResult {
  const MobileActionSubmissionResult({
    required this.status,
    this.detail = '',
  });

  final MobileActionSubmissionStatus status;
  final String detail;

  bool get queued => status == MobileActionSubmissionStatus.queued;
  bool get sent => status == MobileActionSubmissionStatus.sent;
}


import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  role?: 'barangay';
  subItems?: {
    title: string;
    href: string;
    label?: string;
  }[];
};

export type UserRole = 'barangay' | 'developer';
export type UserPermissions = {
  manageBarangaySettings?: boolean;
  manageAutomation?: boolean;
  manageSystemTeaching?: boolean;
  accessDataCenter?: boolean;
};
export type UserAvailabilityStatus = 'available' | 'busy' | 'off_shift';
export type UserAssignmentRole = 'recipient' | 'owner' | 'resolver' | 'supervisor';
export type InviteDeliveryStatus = 'emailed' | 'manual_link' | 'email_failed';
export type UserOnboardingStepId =
  | 'profile_details'
  | 'contact_number'
  | 'workspace'
  | 'privacy'
  | 'security';
export type UserOnboardingState = {
  version: number;
  completedStepIds: UserOnboardingStepId[];
  startedAt?: string;
  completedAt?: string;
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
};

export type UserStatus = 'active' | 'pending_setup' | 'disabled';
export type PreferredWorkspace = 'simple' | 'detailed';
export type SmsIntent =
  | 'REGISTER'
  | 'CROP_UPDATE'
  | 'HARVEST'
  | 'REQUEST'
  | 'PEST_DISEASE'
  | 'WEATHER_HELP'
  | 'PRICE_CHECK'
  | 'EMERGENCY'
  | 'UNKNOWN';
export type SafetyFlag = 'Low' | 'Medium' | 'High';
export type SmsUrgency = 'low' | 'medium' | 'high';
export type SmsTone = 'Neutral' | 'Nag-aalala' | 'Kritikal' | 'Positibo';
export type SmsSentiment = 'neutral' | 'concerned' | 'frustrated' | 'distressed';
export type SmsNormalizationKind =
  | 'shortcut'
  | 'local_term'
  | 'crop_alias'
  | 'pest_alias'
  | 'service_alias'
  | 'known_term'
  | 'unknown';
export type SmsNormalizationMatch = {
  from: string;
  to: string;
  kind: Exclude<SmsNormalizationKind, 'known_term' | 'unknown'>;
  confidence?: number;
};
export type SmsNormalizationToken = {
  raw: string;
  normalized: string;
  kind: SmsNormalizationKind;
  confidence: number;
};
export type SmsResolutionConfirmationStatus =
  | 'awaiting_farmer'
  | 'confirmed_by_farmer'
  | 'reopened';

export type User = {
  id?: string;
  uid?: string;
  email: string;
  name: string;
  role: UserRole;
  title?: string;
  phone?: string;
  barangay?: string;
  avatarUrl?: string;
  expertiseTags?: string[];
  assignedZones?: string[];
  assignmentRole?: UserAssignmentRole;
  availabilityStatus?: UserAvailabilityStatus;
  availabilityNote?: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  permissions?: UserPermissions;
  status?: UserStatus;
  preferredWorkspace?: PreferredWorkspace;
  inviteDeliveryStatus?: InviteDeliveryStatus;
  inviteSentAt?: string;
  inviteDeliveryError?: string;
  inviteDeliveryProvider?: string;
  inviteSetupLinkGeneratedAt?: string;
  inviteExpiresAt?: string;
  inviteAcceptedAt?: string;
  inviteRevokedAt?: string;
  inviteRevokedBy?: string;
  inviteRevocationReason?: string;
  inviteLastResentAt?: string;
  inviteResendCount?: number;
  phoneVerifiedAt?: string;
  privacyAcknowledgedAt?: string;
  securityReviewVerifiedAt?: string;
  onboarding?: UserOnboardingState;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

export type AccessRequestStatus =
  | 'pending_review'
  | 'reviewed'
  | 'provisioned'
  | 'dismissed';

export type AccessRequest = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  barangay?: string;
  title?: string;
  message?: string;
  source?: 'login' | 'reset_password' | 'public_page';
  normalizedPhone?: string;
  status: AccessRequestStatus;
  requestedAt: string;
  lastSubmittedAt?: string;
  submissionCount?: number;
  submissionSources?: Array<NonNullable<AccessRequest["source"]>>;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
};

export type RuntimeHealthStatus = 'ok' | 'warn' | 'error';

export type RuntimeHealthRecord = {
  id: string;
  label: string;
  status: RuntimeHealthStatus;
  updatedAt: string;
  lastRunAt?: string;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  lastError?: string;
  meta?: Record<string, unknown>;
};

export type MobileDeviceTokenPlatform = 'android' | 'ios' | 'web' | 'unknown';

export type MobileDeviceToken = {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  token: string;
  platform: MobileDeviceTokenPlatform;
  topic: string;
  deviceLabel?: string;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
};

export type SystemTemplateCategoryId =
  | 'confirmation'
  | 'investigation'
  | 'resolution'
  | 'emergency';

export type SystemTemplate = {
  id: string;
  text: string;
  keywords: string[];
};

export type SystemTemplateCategory = {
  id: SystemTemplateCategoryId;
  label: string;
  templates: SystemTemplate[];
};

export type ZoneDescription = {
  zone: string;
  description: string;
};

export type SmsLexiconRule = {
  id: string;
  phrase: string;
  intent: SmsIntent;
  urgency: SmsUrgency;
  safetyFlag: SafetyFlag;
  tone?: SmsTone;
  guidance: string;
  applicability?: string;
  enabled: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SystemSettings = {
  id: string;
  brgyDescription: string;
  zoneDescriptions: ZoneDescription[];
  replyStartTime: string;
  replyEndTime: string;
  adminPhone: string;
  notificationPolicy: {
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    urgentPushCooldownMinutes: number;
    maxConsecutivePushFailures: number;
    fallbackToStaffSms: boolean;
  };
  templateCategories: SystemTemplateCategory[];
  smsLexiconRules: SmsLexiconRule[];
  autoReplyEnabled: boolean;
  autoReplyTimeoutMinutes: number;
  retentionPolicy: {
    autoRedactionEnabled: boolean;
    auditLogRedactionDays: number;
    archivedFarmerRedactionDays: number;
  };
  updatedAt?: string;
  updatedBy?: string;
};

export type FarmerStatus =
  | 'pending_approval'
  | 'active'
  | 'inactive'
  | 'rejected'
  | 'archived';

export type FarmerIdentityTrustLevel = 'unknown' | 'probable' | 'verified';
export type FarmerDuplicateRiskLevel =
  | 'none'
  | 'shared_household'
  | 'possible_duplicate'
  | 'high_duplicate';
export type FarmerProfileRevisionSource =
  | 'sms_registration'
  | 'manual_registration'
  | 'approval_review'
  | 'profile_edit'
  | 'household_update'
  | 'merge'
  | 'system_reconciliation';

export type FarmerProfileSnapshot = {
  name: string;
  phone: string;
  barangay: string;
  sitio: string;
  crops: string[];
  farmSize: number;
  age: number;
  gender: string;
  status: FarmerStatus;
  householdId?: string;
  householdLabel?: string;
  sharedPhone?: boolean;
  sharedPhoneNotes?: string;
  identityTrustLevel?: FarmerIdentityTrustLevel;
  identityConfidenceScore?: number;
  duplicateRiskLevel?: FarmerDuplicateRiskLevel;
};

export type FarmerProfileRevision = {
  id: string;
  version: number;
  changedAt: string;
  changedBy: string;
  source: FarmerProfileRevisionSource;
  reason?: string;
  changedFields: string[];
  snapshot: FarmerProfileSnapshot;
};

export type Farmer = {
  id: string; // Corresponds to farmerId
  name: string;
  age: number;
  gender: string;
  phone: string;
  barangay: string;
  sitio: string;
  farmSize: number; // in hectares
  crops: string[];
  registrationDate: string;
  lastSmsActivity: string;
  avatarUrl?: string;
  status: FarmerStatus;
  phoneHistory?: string[];
  mergedFromFarmerIds?: string[];
  mergedIntoFarmerId?: string;
  householdId?: string;
  householdLabel?: string;
  sharedPhone?: boolean;
  sharedPhoneNotes?: string;
  profileSource?: 'sms_self_report' | 'staff_encoded' | 'field_verified' | 'imported';
  lastProfileReviewedAt?: string;
  vulnerabilityFlags?: string[];
  hardToReachArea?: boolean;
  seasonalCropHistory?: Array<{
    seasonLabel: string;
    crops: string[];
    updatedAt: string;
  }>;
  plots?: Array<{
    id: string;
    label: string;
    crop: string;
    sizeHectares?: number;
    sitio?: string;
    source?: 'sms_self_report' | 'staff_encoded' | 'field_verified';
  }>;
  identityTrustLevel?: FarmerIdentityTrustLevel;
  identityConfidenceScore?: number;
  identityConfidenceReasons?: string[];
  duplicateRiskLevel?: FarmerDuplicateRiskLevel;
  profileVersion?: number;
  profileHistory?: FarmerProfileRevision[];
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
  retentionRedactedAt?: string;
  retentionRedactionReason?: string;
};

export type FarmerEvidenceType = 'document' | 'field_photo' | 'audio';

export type FarmerEvidenceAttachment = {
  id: string;
  farmerId: string;
  type: FarmerEvidenceType;
  title: string;
  fileName: string;
  mimeType: string;
  url: string;
  storagePath?: string;
  uploadedAt: string;
  uploadedBy: string;
  notes?: string;
  relatedSmsId?: string;
  sizeBytes?: number;
  transcript?: string;
  transcriptSummary?: string;
  transcriptKeywords?: string[];
  detectedLanguage?: string;
};

export type SmsMessageStatus = 'pending_approval' | 'approved' | 'replied' | 'rejected';

export type SmsAnalysisSource = 'rules' | 'ai' | 'ai_fallback';
export type SmsDetectedLanguage = 'Filipino' | 'English' | 'Taglish' | 'Ilocano' | 'Ilocano mix' | 'Unknown';
export type SmsCropStage =
  | 'seedling'
  | 'vegetative'
  | 'flowering'
  | 'fruiting'
  | 'pre_harvest'
  | 'harvest_ready'
  | 'unknown';
export type SmsTriageField =
  | 'crop'
  | 'symptom'
  | 'severity'
  | 'location'
  | 'crop_stage'
  | 'timing'
  | 'resource'
  | 'identity';
export type SmsTriageUncertainty =
  | 'clear'
  | 'probable'
  | 'ambiguous'
  | 'needs_symptom_details'
  | 'needs_severity'
  | 'needs_location'
  | 'needs_crop_stage'
  | 'needs_identity'
  | 'insufficient_details';
export type SmsCaseStatus =
  | 'open'
  | 'awaiting_clarification'
  | 'awaiting_registration'
  | 'assigned'
  | 'monitoring'
  | 'escalated'
  | 'closed';
export type SmsCaseOutcomeStatus =
  | 'monitoring'
  | 'improving'
  | 'needs_follow_up'
  | 'referred'
  | 'resolved';
export type SmsSourceProvider = 'demo' | 'generic' | 'simulation' | 'twilio' | 'semaphore' | 'smsgate' | 'textbee' | 'unknown';

export type SmsMessage = {
  id: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  message: string;
  timestamp: string;
  sourceProvider?: SmsSourceProvider;
  externalId?: string;
  caseId?: string;
  caseStatus?: SmsCaseStatus;
  assignedTo?: string;
  assignedAt?: string;
  slaDueAt?: string;
  escalatedAt?: string;
  registrationRequired?: boolean;
  identityDetailsNeeded?: boolean;
  identityPrompt?: string;
  followUpDueAt?: string;
  followUpSentAt?: string;
  followUpAttemptCount?: number;
  followUpLastReminderAt?: string;
  followUpStopReason?: string;
  followUpOutcome?: 'resolved' | 'partly_improved' | 'worsened' | 'no_response' | 'new_issue';
  outcomeQualityScore?: number;
  closedAt?: string;
  resolutionNote?: string;
  resolutionConfirmationStatus?: SmsResolutionConfirmationStatus;
  resolutionConfirmationRequestedAt?: string;
  resolutionConfirmedAt?: string;
  resolutionConfirmedBy?: string;
  resolutionConfirmationNote?: string;
  possibleDuplicateOfCaseId?: string;
  possibleDuplicateReason?: string;
  threadConfidence?: number;
  threadReason?: string;
  threadReviewStatus?: 'pending' | 'confirmed' | 'split' | 'merged';
  threadReviewedAt?: string;
  threadReviewedBy?: string;
  threadReviewNote?: string;
  caseOutcomeStatus?: SmsCaseOutcomeStatus;
  caseOutcomeSummary?: string;
  caseOutcomeUpdatedAt?: string;
  caseOutcomeUpdatedBy?: string;
  autoReplyEligibleAt?: string;
  autoReplySentAt?: string;
  officialReminderRecipientName?: string;
  officialReminderRecipientPhone?: string;
  officialReminderDueAt?: string;
  officialReminderLastSentAt?: string;
  officialReminderCount?: number;
  urgentPushLastSentAt?: string;
  urgentPushLastStatus?:
    | 'sent'
    | 'skipped_duplicate'
    | 'skipped_quiet_hours'
    | 'skipped_not_urgent'
    | 'skipped_no_devices'
    | 'failed'
    | 'fallback_needed'
    | 'fallback_sms_sent';
  urgentPushLastError?: string;
  urgentPushFailureCount?: number;
  urgentPushFallbackSentAt?: string;
  urgentPushSuppressedUntil?: string;
  urgentPushLastProviderMessageId?: string;
  analysisSource?: SmsAnalysisSource;
  detectedLanguage?: SmsDetectedLanguage;
  normalizationMatches?: SmsNormalizationMatch[];
  normalizationTokens?: SmsNormalizationToken[];
  normalizationUnknownTokens?: string[];
  clarificationNeeded?: boolean;
  clarificationQuestion?: string;
  candidateIntents?: SmsIntent[];
  sentiment?: SmsSentiment;
  cropStage?: SmsCropStage;
  triageConfidence?: number;
  triageUncertainty?: SmsTriageUncertainty;
  triageMissingFields?: SmsTriageField[];
  triageNextQuestion?: string;
  multiConcernDetected?: boolean;
  multiConcernReason?: string;
  parsedIntent: SmsIntent;
  urgency: SmsUrgency;
  status: SmsMessageStatus;
  aiAdvice: string;
  aiConfidence: number;
  safetyFlag: SafetyFlag;
  respondedAt?: string;
  knowledgeBaseId?: string;
  tone?: SmsTone;
};

export type SmsLexiconLearningCandidate = {
  token: string;
  occurrences: number;
  detectedLanguages: SmsDetectedLanguage[];
  exampleMessages: string[];
  suggestedIntent?: SmsIntent;
};

export type ResourceCategory = 'Pataba' | 'Binhi' | 'Kagamitan' | 'Paggawa';
export type ResourceInventoryGroup =
  | 'Para sa Pananim'
  | 'Proteksyon ng Pananim'
  | 'Kagamitan at Makinarya'
  | 'Patubig at Tubig'
  | 'Serbisyo at Gawaing-Tao'
  | 'Pag-aani at Imbakan'
  | 'Pangkalahatang Suporta';
export type ResourceInventoryUse =
  | 'Pagtatanim'
  | 'Pagpapalago at Pagpapataba'
  | 'Pagkontrol ng Peste at Sakit'
  | 'Pagdidilig at Patubig'
  | 'Pag-aani at Pagproseso'
  | 'Serbisyo sa Bukid'
  | 'Pangkalahatang Suporta';

export type Resource = {
  id: string;
  name: string;
  category: ResourceCategory;
  inventoryGroup?: ResourceInventoryGroup;
  subcategory?: string;
  intendedUse?: ResourceInventoryUse;
  stock: number;
  unit: string;
  lastUpdated: string;
};

export type KnowledgeArticleType = 'article' | 'audio' | 'tip' | 'myth-buster';

export type KnowledgeArticle = {
  id: string;
  title: string;
  summary: string;
  content: string;
  keywords: string[];
  lastUpdated: string;
  author: string;
  type: KnowledgeArticleType;
  audioUrl?: string;
  reviewStatus?: 'needs_review' | 'approved' | 'archived';
  reviewNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  sourceLabel?: string;
  sourceType?: 'manual' | 'imported_file' | 'audio_upload';
  version?: number;
  supersedesArticleId?: string;
};

export type LogbookEntryType = 'SMS' | 'Payo' | 'Tala sa Bukid' | 'Insidente' | 'Tulong';

export type LogbookEntry = {
    id: string;
    farmerId: string;
    timestamp: string;
    type: LogbookEntryType;
    title: string;
    description: string;
    icon?: LucideIcon;
    data?: unknown;
};

export type AuditLog = {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    details: string;
    category?: 'security' | 'operations' | 'data' | 'settings' | 'automation';
    severity?: 'info' | 'warning' | 'critical';
    reasonRequired?: boolean;
    reasonProvided?: string;
    beforeSnapshot?: Record<string, unknown> | null;
    afterSnapshot?: Record<string, unknown> | null;
    securitySensitive?: boolean;
    retentionRedactedAt?: string;
    retentionRedactionReason?: string;
}

export type VoucherStatus = 'issued' | 'redeemed' | 'expired' | 'voided';

export type Voucher = {
    id: string;
    farmerId: string;
    resourceId: string;
    quantity: number;
    code: string;
    status: VoucherStatus;
    issueDate: string;
    redemptionDate?: string;
};

export type MarketPriceTrend = 'up' | 'down' | 'steady';

export type MarketPriceEntry = {
    id: string;
    crop: string;
    price: number;
    unit: string;
    source: string;
    trend: MarketPriceTrend;
    updatedAt: string;
};

export type AlertHistoryType = 'flood' | 'pest' | 'wind' | 'heat' | 'inventory';
export type AlertHistorySeverity = 'Warning' | 'Critical';
export type AlertHistorySource = 'ai' | 'risk_center' | 'manual';

export type AlertHistoryEntry = {
    id: string;
    title: string;
    timestamp: string;
    type: AlertHistoryType;
    severity: AlertHistorySeverity;
    validationState?: 'suspected' | 'confirmed' | 'dismissed';
    clusterKey?: string;
    triggerScore?: number;
    message: string;
    recommendation: string;
    source: AlertHistorySource;
    recipientFarmerIds: string[];
    sentCount: number;
    failedCount: number;
};

export type AssistanceType =
    | 'Binhi'
    | 'Pataba'
    | 'Pesticide'
    | 'Kagamitan'
    | 'Voucher'
    | 'Field Visit'
    | 'Referral'
    | 'Cash Relief'
    | 'Technical Advice';
export type AssistanceStatus = 'planned' | 'in_progress' | 'completed';

export type FarmerAssistanceRecord = {
    id: string;
    farmerId: string;
    relatedSmsId?: string;
    type: AssistanceType;
    title: string;
    details: string;
    quantity?: string;
    status: AssistanceStatus;
    providedBy: string;
    createdAt: string;
    updatedAt: string;
    fulfilledAt?: string;
    nextAction?: string;
    resourceId?: string;
    outcomeSummary?: string;
    attachmentCount?: number;
    sourceOfTruth?: 'sms_self_report' | 'staff_encoded' | 'field_verified';
};

export type FieldVisitPriority = 'high' | 'medium' | 'low';
export type FieldVisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type FieldVisitVerificationStatus = 'unverified' | 'gps_captured' | 'manual_only';
export type FieldVisitVerificationSource =
  | 'mobile_gps'
  | 'mobile_manual'
  | 'manual_dashboard';

export type FieldVisitTask = {
    id: string;
    farmerId: string;
    title: string;
    purpose: string;
    scheduledFor: string;
    assignedTo: string;
    priority: FieldVisitPriority;
    status: FieldVisitStatus;
    createdAt: string;
    updatedAt: string;
    notes?: string;
    relatedSmsId?: string;
    startedAt?: string;
    completedAt?: string;
    verificationStatus?: FieldVisitVerificationStatus;
    verificationSource?: FieldVisitVerificationSource;
    verificationCapturedAt?: string;
    verificationLat?: number;
    verificationLng?: number;
    verificationAccuracyMeters?: number;
    verificationNote?: string;
    observedIssue?: string;
    adviceGiven?: string;
    inputDistributed?: string;
    revisitNeeded?: boolean;
    outcomeSummary?: string;
    attachmentCount?: number;
};

export type OutboundMessageStatus = 'queued' | 'sent' | 'failed' | 'delivered' | 'retried';
export type OutboundMessageAudience = 'farmer' | 'official';
export type OutboundMessagePurpose =
    | 'manual_reply'
    | 'auto_reply'
    | 'follow_up'
    | 'resolution_confirmation'
    | 'official_reminder'
    | 'official_ack'
    | 'official_help'
    | 'other';

export type OutboundMessage = {
    id: string;
    smsMessageId: string;
    recipientPhone: string;
    audience?: OutboundMessageAudience;
    purpose?: OutboundMessagePurpose;
    queuePriority?: number;
    queuePriorityLabel?: 'critical' | 'high' | 'normal' | 'low';
    body: string;
    status: OutboundMessageStatus;
    provider: string;
    providerMessageId?: string;
    errorMessage?: string;
    createdAt: string;
    sentAt?: string;
    lastStatusAt?: string;
    deliveryReceivedAt?: string;
    retryOfOutboundId?: string;
    attempts?: number;
};

export type SmsReviewAction = 'approved_as_is' | 'approved_edited' | 'manual_reply' | 'rejected';

export type SmsTrainingExample = {
    id: string;
    smsMessageId: string;
    farmerId: string;
    farmerName: string;
    phone: string;
    message: string;
    inboundTimestamp: string;
    analysisSource: SmsAnalysisSource;
    originalAnalysis: {
        parsedIntent: SmsIntent;
        urgency: SmsMessage['urgency'];
        safetyFlag: SafetyFlag;
        tone?: SmsMessage['tone'];
        aiAdvice: string;
        aiConfidence: number;
    };
    finalReview: {
        action: SmsReviewAction;
        status: SmsMessageStatus;
        finalAdvice: string;
        finalAnalysis: {
            parsedIntent: SmsIntent;
            urgency: SmsMessage['urgency'];
            safetyFlag: SafetyFlag;
            tone?: SmsMessage['tone'];
        };
        reviewedBy: string;
        reviewedAt: string;
        wasAdviceEdited: boolean;
    };
    reviewStatus?: 'needs_review' | 'approved' | 'rejected';
    reviewNotes?: string;
    sourceLabel?: string;
    importedAt?: string;
};

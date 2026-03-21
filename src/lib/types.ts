
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
  permissions?: UserPermissions;
  status?: UserStatus;
  preferredWorkspace?: PreferredWorkspace;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
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
  templateCategories: SystemTemplateCategory[];
  smsLexiconRules: SmsLexiconRule[];
  autoReplyEnabled: boolean;
  autoReplyTimeoutMinutes: number;
  updatedAt?: string;
  updatedBy?: string;
};

export type FarmerStatus = 'pending_approval' | 'active' | 'inactive' | 'rejected';

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
export type SmsSourceProvider = 'demo' | 'generic' | 'twilio' | 'semaphore' | 'smsgate' | 'textbee' | 'unknown';

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
  followUpDueAt?: string;
  followUpSentAt?: string;
  closedAt?: string;
  resolutionNote?: string;
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
  analysisSource?: SmsAnalysisSource;
  clarificationNeeded?: boolean;
  clarificationQuestion?: string;
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

export type ResourceCategory = 'Pataba' | 'Binhi' | 'Kagamitan' | 'Paggawa';

export type Resource = {
  id: string;
  name: string;
  category: ResourceCategory;
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
    data?: any;
};

export type AuditLog = {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    details: string;
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
};

export type FieldVisitPriority = 'high' | 'medium' | 'low';
export type FieldVisitStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

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
};

export type OutboundMessageStatus = 'queued' | 'sent' | 'failed' | 'delivered' | 'retried';
export type OutboundMessageAudience = 'farmer' | 'official';
export type OutboundMessagePurpose =
    | 'manual_reply'
    | 'auto_reply'
    | 'follow_up'
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
};

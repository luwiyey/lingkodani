
"use client";

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Sparkles, MessageSquare, Send, Wrench, Sprout, FilePen, ShieldAlert, CloudCog, Tractor } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { SmsMessage, Resource, SmsIntent, Farmer, OutboundMessage } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { CaseOutcomeBadge } from '@/components/sms/case-outcome-badge';
import { CaseOutcomeDialog } from '@/components/sms/case-outcome-dialog';
import { useData } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';
import { isLiveMode } from '@/lib/config/app-mode';
import { canUseLiveSmsSimulation } from '@/lib/access-control';
import { useRuntimeCapabilities } from '@/hooks/use-runtime-capabilities';
import { findBestMatchingLexiconRule, findRelevantTrainingExamples } from '@/lib/sms-teaching';
import { FarmerAvatar } from '@/components/farmers/farmer-avatar';
import { cn } from '@/lib/utils';
import { findPotentialDuplicateCase, getPotentialDuplicateCases } from '@/lib/sms-case-linking';
import { isAwaitingFarmerConfirmation } from '@/lib/sms-case-outcomes';
import { getSmsCaseResolutionReadiness } from '@/lib/sms-case-quality';
import { createResourceOfferMessage } from '@/lib/resource-offers';
import { isDemoRuntimeActive, isLiveRuntimeActive } from '@/lib/runtime-mode';

type DialogState = {
  type: 'approve' | 'manual' | 'find' | null;
  message: SmsMessage | null;
}

type ReviewDraft = Pick<SmsMessage, 'aiAdvice' | 'parsedIntent' | 'urgency' | 'safetyFlag' | 'tone'>;
type KnowledgeReplyDraft = {
  text: string;
  sourceQuery?: string;
  answerMode?: string;
  articleTitles?: string[];
  createdAt?: string;
};
type SmsFeedView = 'actionable' | 'monitoring' | 'closed' | 'all';

const typeInfo: Record<SmsIntent, {label: string, icon: React.ElementType }> = {
    REGISTER: { label: 'Pagpaparehistro', icon: User },
    CROP_UPDATE: { label: 'Update sa Pananim', icon: FilePen },
    HARVEST: { label: 'Ulat ng Ani', icon: Sprout },
    REQUEST: { label: 'Tool Request', icon: Tractor },
    PEST_DISEASE: { label: 'Ulat ng Peste', icon: ShieldAlert },
    WEATHER_HELP: { label: 'Tulong sa Panahon', icon: CloudCog },
    PRICE_CHECK: { label: 'Tsek sa Presyo', icon: MessageSquare },
    EMERGENCY: { label: 'Emergency', icon: ShieldAlert },
    UNKNOWN: { label: 'Hindi Kilala', icon: MessageSquare },
}

const intentOptions = Object.keys(typeInfo) as SmsIntent[];
const urgencyOptions: SmsMessage['urgency'][] = ['low', 'medium', 'high'];
const safetyFlagOptions: SmsMessage['safetyFlag'][] = ['Low', 'Medium', 'High'];
const toneOptions: NonNullable<SmsMessage['tone']>[] = ['Neutral', 'Nag-aalala', 'Kritikal', 'Positibo'];
const cardActionButtonClassName = 'h-auto min-h-11 whitespace-normal break-words px-3 py-3 text-center leading-snug';
const neutralBadgeClassName = 'border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
const infoBadgeClassName = 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100';
const warningBadgeClassName = 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100';
const successBadgeClassName = 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100';
const destructiveBadgeClassName = 'border-red-200 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-100';

function getTriageUncertaintyLabel(value: SmsMessage['triageUncertainty']) {
  switch (value) {
    case 'clear':
      return 'Malinaw';
    case 'probable':
      return 'May kaunting duda';
    case 'ambiguous':
      return 'May halong concern';
    case 'needs_severity':
      return 'Kulang ang lawak';
    case 'needs_location':
      return 'Kulang ang lokasyon';
    case 'needs_crop_stage':
      return 'Kulang ang crop stage';
    case 'needs_symptom_details':
      return 'Kulang ang sintomas';
    case 'needs_identity':
      return 'Kulang ang identity';
    case 'insufficient_details':
      return 'Kulang ang detalye';
    default:
      return null;
  }
}

function getSentimentLabel(value: SmsMessage['sentiment']) {
  switch (value) {
    case 'distressed':
      return 'Matinding pag-aalala';
    case 'frustrated':
      return 'Mukhang frustrated';
    case 'concerned':
      return 'Nag-aalala';
    case 'neutral':
      return 'Neutral';
    default:
      return null;
  }
}

function getCropStageLabel(value: SmsMessage['cropStage']) {
  switch (value) {
    case 'seedling':
      return 'Punla';
    case 'vegetative':
      return 'Lumalagong halaman';
    case 'flowering':
      return 'Namumulaklak';
    case 'fruiting':
      return 'Nagbubunga';
    case 'pre_harvest':
      return 'Malapit anihin';
    case 'harvest_ready':
      return 'Handa nang anihin';
    default:
      return null;
  }
}

function getRiskBadgeClassName(flag: SmsMessage['safetyFlag']) {
  if (flag === 'High') {
    return destructiveBadgeClassName;
  }

  if (flag === 'Medium') {
    return warningBadgeClassName;
  }

  return successBadgeClassName;
}

function getAnalysisSourceLabel(analysisSource: SmsMessage["analysisSource"]) {
  if (!isLiveMode) {
    return "Demo";
  }

  if (analysisSource === "ai_fallback") {
    return "AI fallback";
  }

  if (analysisSource === "rules") {
    return "Rules";
  }

  return "AI";
}

function createReviewDraft(message: SmsMessage): ReviewDraft {
  return {
    aiAdvice: message.aiAdvice,
    parsedIntent: message.parsedIntent,
    urgency: message.urgency,
    safetyFlag: message.safetyFlag,
    tone: message.tone ?? 'Neutral',
  };
}

function matchesSmsFeedView(message: SmsMessage, view: SmsFeedView) {
  const isClosed = message.caseStatus === 'closed' || Boolean(message.closedAt);
  const isMonitoring =
    !isClosed &&
    (
      message.caseStatus === 'monitoring' ||
      message.caseOutcomeStatus === 'resolved' ||
      message.caseOutcomeStatus === 'improving' ||
      message.caseOutcomeStatus === 'needs_follow_up' ||
      isAwaitingFarmerConfirmation(message) ||
      message.status === 'approved' ||
      message.status === 'replied'
    );
  const isActionable =
    !isClosed &&
    !isMonitoring &&
    (
      message.status === 'pending_approval' ||
      message.caseStatus === 'open' ||
      message.caseStatus === 'awaiting_clarification' ||
      message.caseStatus === 'awaiting_registration' ||
      message.caseStatus === 'assigned' ||
      message.caseStatus === 'escalated' ||
      !message.caseStatus
    );

  if (view === 'all') {
    return true;
  }

  if (view === 'closed') {
    return isClosed;
  }

  if (view === 'monitoring') {
    return isMonitoring;
  }

  return isActionable;
}

function ReviewMetadataFields({
  draft,
  setDraft,
}: {
  draft: ReviewDraft;
  setDraft: React.Dispatch<React.SetStateAction<ReviewDraft | null>>;
}) {
  const updateField = <K extends keyof ReviewDraft>(field: K, value: ReviewDraft[K]) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label>Intent</Label>
        <Select value={draft.parsedIntent} onValueChange={(value) => updateField('parsedIntent', value as ReviewDraft['parsedIntent'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {intentOptions.map((intent) => (
              <SelectItem key={intent} value={intent}>
                {typeInfo[intent].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Urgency</Label>
        <Select value={draft.urgency} onValueChange={(value) => updateField('urgency', value as ReviewDraft['urgency'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {urgencyOptions.map((urgency) => (
              <SelectItem key={urgency} value={urgency}>
                {urgency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Risk Level</Label>
        <Select value={draft.safetyFlag} onValueChange={(value) => updateField('safetyFlag', value as ReviewDraft['safetyFlag'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {safetyFlagOptions.map((flag) => (
              <SelectItem key={flag} value={flag}>
                {flag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Tone</Label>
        <Select value={draft.tone ?? 'Neutral'} onValueChange={(value) => updateField('tone', value as ReviewDraft['tone'])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {toneOptions.map((tone) => (
              <SelectItem key={tone} value={tone}>
                {tone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function SmsMessageCard({
  message,
  onActionClick,
  onAssignToMe,
  onRecordOutcome,
  onRetrySend,
  latestOutboundStatus,
  farmers,
  cardId,
  isHighlighted = false,
  matchedTeachingPhrase,
  similarReviewedExamplesCount = 0,
  onConfirmResolution,
  onOpenThreadReview,
}: {
  message: SmsMessage;
  onActionClick: (type: DialogState['type'], message: SmsMessage) => void;
  onAssignToMe: (message: SmsMessage) => void;
  onRecordOutcome: (message: SmsMessage) => void;
  onRetrySend: (message: SmsMessage) => void;
  latestOutboundStatus?: string;
  farmers: Farmer[];
  cardId?: string;
  isHighlighted?: boolean;
  matchedTeachingPhrase?: string;
  similarReviewedExamplesCount?: number;
  onConfirmResolution: (message: SmsMessage, confirmed: boolean) => void;
  onOpenThreadReview: (message: SmsMessage) => void;
}) {
    const [isClient, setIsClient] = React.useState(false);
    React.useEffect(() => { setIsClient(true); }, []);

    const intentLabel = typeInfo[message.parsedIntent]?.label || 'Hindi Kilala';
    const IntentIcon = typeInfo[message.parsedIntent]?.icon || MessageSquare;

    const farmer = farmers.find(f => f.id === message.farmerId);
    const farmerName = farmer ? farmer.name : message.farmerName;
    const avatarUrl = farmer?.avatarUrl;
    const awaitingConfirmation = isAwaitingFarmerConfirmation(message);
    const confidenceLabel = Number.isFinite(message.aiConfidence)
      ? `${(message.aiConfidence * 100).toFixed(0)}%`
      : 'N/A';

    return (
        <Card
            id={cardId}
            className={cn(
              'flex h-full flex-col border-sidebar-border bg-sidebar text-sidebar-foreground',
              isHighlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg',
            )}
        >
            <CardContent className="p-4 space-y-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <FarmerAvatar
                          name={farmerName}
                          avatarUrl={avatarUrl}
                          className="h-10 w-10 border-2 border-background/50"
                          fallbackClassName="bg-background text-primary"
                        />
                         <div className="min-w-0">
                            <span className="font-semibold truncate block">{farmerName}</span>
                            <p className="text-xs text-sidebar-foreground/70">{message.phone}</p>
                         </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <time className="text-xs text-sidebar-foreground/70 block">
                            {isClient ? new Date(message.timestamp).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                            }) : ''}
                        </time>
                        <time className="text-xs text-sidebar-foreground/70 block">
                            {isClient ? new Date(message.timestamp).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                            }) : ''}
                        </time>
                    </div>
                </div>

                <p className="text-sm flex-grow">"{message.message}"</p>

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold">Pagsusuri ng AI</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                         <Badge variant="outline" className={neutralBadgeClassName}>
                            <IntentIcon className="w-3 h-3 mr-1.5"/>
                            {intentLabel}
                        </Badge>
                        <Badge variant="outline" className={getRiskBadgeClassName(message.safetyFlag)}>{message.safetyFlag} Risk</Badge>
                        <Badge variant="outline" className={neutralBadgeClassName}>Conf: {confidenceLabel}</Badge>
                        <Badge variant="outline" className={neutralBadgeClassName}>
                          Source: {getAnalysisSourceLabel(message.analysisSource)}
                        </Badge>
                        {message.sourceProvider === 'simulation' && (
                          <Badge variant="outline" className={infoBadgeClassName}>
                            Test SMS
                          </Badge>
                        )}
                        {message.caseStatus && <Badge variant="outline" className={neutralBadgeClassName}>Case: {message.caseStatus}</Badge>}
                        <CaseOutcomeBadge message={message} />
                        {message.assignedTo && <Badge variant="outline" className={neutralBadgeClassName}>Owner: {message.assignedTo}</Badge>}
                        {message.registrationRequired && (
                          <Badge variant="outline" className={infoBadgeClassName}>
                            Registration required
                          </Badge>
                        )}
                        {message.triageUncertainty && getTriageUncertaintyLabel(message.triageUncertainty) ? (
                          <Badge variant="outline" className={warningBadgeClassName}>
                            {getTriageUncertaintyLabel(message.triageUncertainty)}
                          </Badge>
                        ) : null}
                        {message.sentiment && getSentimentLabel(message.sentiment) ? (
                          <Badge variant="outline" className={neutralBadgeClassName}>
                            {getSentimentLabel(message.sentiment)}
                          </Badge>
                        ) : null}
                        {message.cropStage && getCropStageLabel(message.cropStage) ? (
                          <Badge variant="outline" className={neutralBadgeClassName}>
                            Stage: {getCropStageLabel(message.cropStage)}
                          </Badge>
                        ) : null}
                        {message.identityDetailsNeeded && !message.registrationRequired && (
                          <Badge variant="outline" className={infoBadgeClassName}>
                            Identity pending
                          </Badge>
                        )}
                        {message.tone && <Badge variant="outline" className={neutralBadgeClassName}>Tono: {message.tone}</Badge>}
                        {message.clarificationNeeded && (
                          <Badge variant="outline" className={warningBadgeClassName}>
                            Clarification needed
                          </Badge>
                        )}
                        {message.autoReplySentAt && (
                          <Badge variant="outline" className={warningBadgeClassName}>
                            Auto fallback sent
                          </Badge>
                        )}
                        {latestOutboundStatus === 'failed' && (
                          <Badge variant="outline" className={destructiveBadgeClassName}>
                            Last send failed
                          </Badge>
                        )}
                    </div>
                    {message.clarificationNeeded && message.clarificationQuestion ? (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-slate-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-50">
                        <p className="font-semibold text-amber-900 dark:text-amber-100">Suggested clarification</p>
                        <p className="mt-1 leading-relaxed">{message.clarificationQuestion}</p>
                      </div>
                    ) : null}
                    {message.triageNextQuestion && !message.clarificationNeeded ? (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-sidebar-foreground/85">
                        <p className="font-semibold text-primary">Best next question</p>
                        <p className="mt-1 leading-relaxed">{message.triageNextQuestion}</p>
                      </div>
                    ) : null}
                    {message.triageMissingFields && message.triageMissingFields.length > 0 ? (
                      <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                        <p className="font-semibold text-foreground">Kulang pang detalye</p>
                        <p className="mt-1">{message.triageMissingFields.join(", ")}</p>
                      </div>
                    ) : null}
                    {message.multiConcernDetected && message.multiConcernReason ? (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-50">
                        <p className="font-semibold">Mukhang may higit sa isang concern</p>
                        <p className="mt-1 leading-relaxed">{message.multiConcernReason}</p>
                      </div>
                    ) : null}
                    {message.normalizationUnknownTokens && message.normalizationUnknownTokens.length > 0 ? (
                      <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                        <p className="font-semibold text-foreground">Mga salitang kailangan pang ituro sa system</p>
                        <p className="mt-1">{message.normalizationUnknownTokens.join(", ")}</p>
                      </div>
                    ) : null}
                    {message.multiConcernDetected || message.possibleDuplicateOfCaseId || (typeof message.threadConfidence === 'number' && message.threadConfidence < 0.7) ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className={cardActionButtonClassName}
                          onClick={() => onOpenThreadReview(message)}
                        >
                          Review thread
                        </Button>
                      </div>
                    ) : null}
                    {message.analysisSource && message.analysisSource !== 'ai' ? (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-slate-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-50">
                        <p className="font-semibold text-amber-900 dark:text-amber-100">Review required</p>
                        <p className="mt-1">
                          Ang kasalukuyang analysis ay galing sa {message.analysisSource === 'ai_fallback' ? 'AI fallback' : 'rules-based'} path, kaya mas mahalaga ang human review bago magpadala ng final advisory.
                        </p>
                      </div>
                    ) : null}
                    {message.identityDetailsNeeded && message.identityPrompt ? (
                      <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-50">
                        <p className="font-semibold text-sky-900 dark:text-sky-100">Kulang pa ang identity details</p>
                        <p className="mt-1">
                          Hahawakan pa rin ng system ang concern na ito, pero kailangan pa ring makuha ang buong pangalan at sitio o barangay para maayos ang follow-up at farmer matching.
                        </p>
                      </div>
                    ) : null}
                    {matchedTeachingPhrase || similarReviewedExamplesCount > 0 ? (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-sidebar-foreground/85">
                        <p className="font-medium text-primary">Bakit ito ang analysis</p>
                        <div className="mt-1 space-y-1">
                          {matchedTeachingPhrase ? (
                            <p>May tugma ito sa lokal na cue phrase na <span className="font-medium">"{matchedTeachingPhrase}"</span>.</p>
                          ) : null}
                          {similarReviewedExamplesCount > 0 ? (
                            <p>May {similarReviewedExamplesCount} reviewed training example na kahawig ng mensaheng ito.</p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    {message.caseOutcomeSummary ? (
                      <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs text-sidebar-foreground/85">
                        <p className="font-medium text-primary">Latest outcome</p>
                        <p className="mt-1 leading-relaxed">{message.caseOutcomeSummary}</p>
                      </div>
                    ) : null}
                    {message.possibleDuplicateOfCaseId ? (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-50">
                        <p className="font-semibold text-amber-900 dark:text-amber-100">Possible duplicate</p>
                        <p className="mt-1">
                          Maaaring konektado ito sa {message.possibleDuplicateOfCaseId}. {message.possibleDuplicateReason ?? 'Suriin muna kung continuation lang ito ng naunang concern.'}
                        </p>
                      </div>
                    ) : null}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <div className="grid gap-2 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-2">
                        {!message.assignedTo && message.caseStatus !== 'closed' ? (
                          <Button variant="outline" size="sm" onClick={() => onAssignToMe(message)} className={`bg-sidebar-accent hover:bg-sidebar-accent/80 ${cardActionButtonClassName}`}>
                            I-assign sa akin
                          </Button>
                        ) : null}
                        {latestOutboundStatus === 'failed' ? (
                          <Button variant="outline" size="sm" onClick={() => onRetrySend(message)} className={`bg-sidebar-accent hover:bg-sidebar-accent/80 ${cardActionButtonClassName}`}>
                            Retry send
                          </Button>
                        ) : null}
                        {!message.closedAt ? (
                          <Button variant="outline" size="sm" onClick={() => onRecordOutcome(message)} className={`bg-sidebar-accent hover:bg-sidebar-accent/80 ${cardActionButtonClassName}`}>
                            <FilePen className="mr-2 h-4 w-4" />
                            Outcome
                          </Button>
                        ) : null}
                    </div>
                    {awaitingConfirmation ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button variant="outline" size="sm" onClick={() => onConfirmResolution(message, true)} className={`bg-sidebar-accent hover:bg-sidebar-accent/80 ${cardActionButtonClassName}`}>
                          Kinumpirma ng farmer
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onConfirmResolution(message, false)} className={`bg-sidebar-accent hover:bg-sidebar-accent/80 ${cardActionButtonClassName}`}>
                          Hindi pa pala okay
                        </Button>
                      </div>
                    ) : null}
                    <div className="grid gap-2 sm:grid-cols-2">
                        <HoverTooltip text="Suriin at i-edit ang tugon ng AI bago ipadala.">
                            <Button variant="outline" size="sm" onClick={() => onActionClick('approve', message)} className={`bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 hover:text-primary ${cardActionButtonClassName}`}>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Aprubahan
                            </Button>
                        </HoverTooltip>
                        <HoverTooltip text="Sumulat ng sarili mong tugon mula sa simula.">
                            <Button variant="outline" size="sm" onClick={() => onActionClick('manual', message)} className={`bg-sidebar-accent hover:bg-sidebar-accent/80 ${cardActionButtonClassName}`}>
                                <Send className="mr-2 h-4 w-4" />
                                Manwal
                            </Button>
                        </HoverTooltip>
                    </div>
                    {message.parsedIntent === 'REQUEST' && (
                        <HoverTooltip text="Tingnan kung may magagamit na kagamitan sa imbentaryo.">
                            <Button variant="outline" size="sm" onClick={() => onActionClick('find', message)} className={`w-full bg-sidebar-accent hover:bg-sidebar-accent/80 ${cardActionButtonClassName}`}>
                                <Wrench className="mr-2 h-4 w-4" />
                                Maghanap ng Kagamitan
                            </Button>
                        </HoverTooltip>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function SmsFeedPageContent() {
    const router = useRouter();
    const { smsMessages, outboundMessages, farmers, resources, systemSettings, smsTrainingExamples, assistanceRecords, fieldVisitTasks, addInboundSms, addSmsPreview, updateSmsMessage, assignSmsMessage, updateSmsCaseOutcome, confirmSmsCaseResolution, confirmSmsThread, splitSmsThread, mergeSmsThreads, retryOutboundMessage, webhookBridgeStatus } = useData();
    const { currentUser, currentUserProfile } = useAuth();
    const { capabilities } = useRuntimeCapabilities();
    const searchParams = useSearchParams();
    const [dialogState, setDialogState] = React.useState<DialogState>({ type: null, message: null });
    const [reviewDraft, setReviewDraft] = React.useState<ReviewDraft | null>(null);
    const [pendingKnowledgeReplyDraft, setPendingKnowledgeReplyDraft] = React.useState<KnowledgeReplyDraft | null>(null);
    const [outcomeMessage, setOutcomeMessage] = React.useState<SmsMessage | null>(null);
    const [threadReviewMessage, setThreadReviewMessage] = React.useState<SmsMessage | null>(null);
    const [simulatedPhone, setSimulatedPhone] = React.useState('+639171234567');
    const [simulatedMessage, setSimulatedMessage] = React.useState('Marami pong uod sa palay namin at mabilis dumami ngayong umaga.');
    const [feedView, setFeedView] = React.useState<SmsFeedView>('actionable');
    const { toast, dismiss } = useToast();
    const focusedSmsId = searchParams.get('sms');
    const activeOperatorName = currentUserProfile?.name?.trim() || 'Brgy. Admin';
    const usingDemoSandbox = isDemoRuntimeActive({ currentUser, currentUserProfile });
    const usingLiveData = isLiveRuntimeActive({ currentUser, currentUserProfile });
    const showSimulationTool = usingDemoSandbox || (capabilities.liveSmsTestModeEnabled && canUseLiveSmsSimulation(currentUserProfile));
    const liveSmsTestModeLocked = usingLiveData && canUseLiveSmsSimulation(currentUserProfile) && !capabilities.liveSmsTestModeEnabled;

    const latestOutboundByMessage = React.useMemo(() => {
      const map = new Map<string, OutboundMessage>();
      for (const record of outboundMessages) {
        if (record.audience === 'official') {
          continue;
        }

        if (!map.has(record.smsMessageId)) {
          map.set(record.smsMessageId, record);
        }
      }
      return map;
    }, [outboundMessages]);

    const matchedTeachingPhraseByMessage = React.useMemo(() => {
      const map = new Map<string, string>();
      for (const message of smsMessages) {
        const matchedRule = findBestMatchingLexiconRule(
          message.message,
          systemSettings.smsLexiconRules
        );
        if (matchedRule) {
          map.set(message.id, matchedRule.phrase);
        }
      }
      return map;
    }, [smsMessages, systemSettings.smsLexiconRules]);

    const reviewedExampleCountByMessage = React.useMemo(() => {
      const map = new Map<string, number>();
      for (const message of smsMessages) {
        const relatedExamples = findRelevantTrainingExamples(
          message.message,
          smsTrainingExamples
        );
        if (relatedExamples.length > 0) {
          map.set(message.id, relatedExamples.length);
        }
      }
      return map;
    }, [smsMessages, smsTrainingExamples]);
    const duplicateCaseByMessage = React.useMemo(() => {
      const map = new Map<string, SmsMessage | null>();
      for (const message of smsMessages) {
        map.set(message.id, findPotentialDuplicateCase(message, smsMessages));
      }
      return map;
    }, [smsMessages]);
    const threadReviewCandidates = React.useMemo(
      () =>
        threadReviewMessage
          ? getPotentialDuplicateCases(threadReviewMessage, smsMessages)
          : [],
      [smsMessages, threadReviewMessage]
    );
    const outcomeReadiness = React.useMemo(
      () =>
        outcomeMessage
          ? getSmsCaseResolutionReadiness({
              message: outcomeMessage,
              assistanceRecords,
              fieldVisitTasks,
            })
          : null,
      [assistanceRecords, fieldVisitTasks, outcomeMessage]
    );
    const feedViewOptions = React.useMemo(
      () => ([
        {
          id: 'actionable' as const,
          label: 'Kailangang Aksyunan',
          description: 'Mga bagong case, pending approvals, at mga concern na kailangan pang galawan ngayon.',
        },
        {
          id: 'monitoring' as const,
          label: 'Monitoring',
          description: 'Mga mensaheng may naibigay nang action pero bukas pa para sa follow-up o farmer confirmation.',
        },
        {
          id: 'closed' as const,
          label: 'Sarado',
          description: 'Mga kasong tuluyang naisara at napanatili para sa audit trail at reports.',
        },
        {
          id: 'all' as const,
          label: 'Lahat',
          description: 'Buong SMS history para sa review, verification, at troubleshooting.',
        },
      ]),
      []
    );
    const feedViewCounts = React.useMemo(
      () =>
        feedViewOptions.reduce<Record<SmsFeedView, number>>((accumulator, option) => {
          accumulator[option.id] = smsMessages.filter((message) => matchesSmsFeedView(message, option.id)).length;
          return accumulator;
        }, {
          actionable: 0,
          monitoring: 0,
          closed: 0,
          all: smsMessages.length,
        }),
      [feedViewOptions, smsMessages]
    );
    const visibleSmsMessages = React.useMemo(
      () => smsMessages.filter((message) => matchesSmsFeedView(message, feedView)),
      [feedView, smsMessages]
    );
    
    const openDialog = (type: DialogState['type'], message: SmsMessage) => {
        setDialogState({ type, message });
        if (type === 'approve' || type === 'manual') {
            const draft = createReviewDraft(message);
            if (pendingKnowledgeReplyDraft?.text) {
              setReviewDraft({
                ...draft,
                aiAdvice: pendingKnowledgeReplyDraft.text,
              });
              setPendingKnowledgeReplyDraft(null);
              toast({
                title: "Nailagay ang Knowledge draft",
                description: `Naipasok na ang sagot mula sa Knowledge search bilang panimulang reply para kay ${message.farmerName}.`,
              });
            } else {
              setReviewDraft(draft);
            }
        }
    };

    const closeDialog = () => {
        setDialogState({ type: null, message: null });
        setReviewDraft(null);
    };

    const handleOpenThreadReview = (message: SmsMessage) => {
      setThreadReviewMessage(message);
    };

    const handleConfirmThreadReview = async () => {
      if (!threadReviewMessage) {
        return;
      }

      const ok = await confirmSmsThread(threadReviewMessage.id);
      toast({
        title: ok ? 'Nakumpirma ang thread' : 'Hindi nakumpirma ang thread',
        description: ok
          ? `Minarkahang tama ang kasalukuyang thread para kay ${threadReviewMessage.farmerName}.`
          : 'Subukang muli pagkatapos ng ilang sandali.',
        variant: ok ? 'default' : 'destructive',
      });
      if (ok) {
        setThreadReviewMessage(null);
      }
    };

    const handleSplitThreadReview = async () => {
      if (!threadReviewMessage) {
        return;
      }

      const ok = await splitSmsThread(threadReviewMessage.id);
      toast({
        title: ok ? 'Nahiwalay ang thread' : 'Hindi nahiwalay ang thread',
        description: ok
          ? `Ginawan ng bagong case thread ang mensahe ni ${threadReviewMessage.farmerName}.`
          : 'Subukang muli pagkatapos ng ilang sandali.',
        variant: ok ? 'default' : 'destructive',
      });
      if (ok) {
        setThreadReviewMessage(null);
      }
    };

    const handleMergeThreadReview = async (targetMessageId: string) => {
      if (!threadReviewMessage) {
        return;
      }

      const ok = await mergeSmsThreads(threadReviewMessage.id, targetMessageId);
      toast({
        title: ok ? 'Na-merge ang thread' : 'Hindi na-merge ang thread',
        description: ok
          ? `Na-merge ang kasalukuyang thread sa piniling case para kay ${threadReviewMessage.farmerName}.`
          : 'Subukang muli pagkatapos ng ilang sandali.',
        variant: ok ? 'default' : 'destructive',
      });
      if (ok) {
        setThreadReviewMessage(null);
      }
    };
    
    const handleAction = (
      action: string,
      updates?: Partial<Pick<SmsMessage, 'status' | 'aiAdvice' | 'parsedIntent' | 'urgency' | 'safetyFlag' | 'tone'>>
    ) => {
        if (dialogState.message && updates) {
            updateSmsMessage(dialogState.message.id, reviewDraft ? { ...reviewDraft, ...updates } : updates);
        }
        toast({
            title: "Aksyon naisagawa!",
            description: `Ang mensahe ay matagumpay na ${action}.`,
        });
        closeDialog();
    }

    const handleSimulateInboundSms = async () => {
        if (!simulatedPhone.trim() || !simulatedMessage.trim()) {
            toast({
                title: "Kulang ang detalye",
                description: "Ilagay ang numero at mensahe bago magpatuloy.",
                variant: "destructive",
            });
            return;
        }

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (usingLiveData) {
            const idToken = await currentUser?.getIdToken();

            if (!idToken) {
                toast({
                    title: "Walang live superadmin session",
                    description: "Mag-sign in muna sa live superadmin account bago gumamit ng safe SMS test mode.",
                    variant: "destructive",
                });
                return;
            }

            headers.Authorization = `Bearer ${idToken}`;
        }

        const response = await fetch(usingLiveData ? '/api/system/test-inbound-sms' : '/api/mock/inbound-sms', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                phone: simulatedPhone.trim(),
                message: simulatedMessage.trim(),
            }),
        });

        const payload = await response.json().catch(() => ({}));

          if (!response.ok) {
              toast({
                  title: "Hindi naisagawa ang simulation",
                description: typeof payload.error === 'string'
                  ? payload.error
                  : "Nagkaroon ng problema sa SMS simulation request.",
                variant: "destructive",
              });
              return;
          }

          if (payload.ignored) {
              toast({
                  title: "Hindi ipinakita ang SMS",
                  description: typeof payload.reason === 'string'
                    ? payload.reason === 'carrier_promo'
                      ? "Na-detect ito bilang carrier o promo message kaya hindi isinama sa system."
                      : "Mukhang hindi valid na farmer sender ang numerong ito kaya hindi isinama sa system."
                    : "Na-detect ito bilang service o invalid sender message kaya hindi isinama sa system.",
              });

              setSimulatedMessage('');
              return;
          }

          if (usingLiveData) {
              if (!payload.message) {
                  toast({
                      title: "Walang nabuong preview",
                    description: "Subukang muli gamit ang ibang test number o mensahe.",
                    variant: "destructive",
                });
                return;
            }

            addSmsPreview(payload.message as SmsMessage);
            toast({
                title: "Naidagdag ang Test SMS",
                description: "Lumitaw ang live SMS preview sa kasalukuyang session lang. Hindi ito sine-save sa live records o nagpapadala ng totoong outbound SMS.",
            });

            setSimulatedMessage('');
            return;
        }

          const inbound = addInboundSms({
              phone: payload.phone,
              message: payload.message,
              analysis: payload.analysis,
              sourceProvider: 'simulation',
          });

          if (!inbound) {
            toast({
                title: "Hindi ipinakita ang SMS",
                description: "Na-detect ito bilang carrier o service message kaya hindi isinama sa app.",
            });

            setSimulatedMessage('');
            return;
        }

          toast({
              title: "Na-simulate ang SMS",
              description: `Naidagdag sa demo data ang sample report mula kay ${inbound.farmerName}. Makikita rin ito sa reports at iba pang demo views hanggang mag-logout ka.`,
          });

        setSimulatedMessage('');
    };

    const handleAssignToMe = (message: SmsMessage) => {
      assignSmsMessage(message.id, activeOperatorName);
      toast({
        title: "Na-assign ang case",
        description: `Itinalaga na kay ${activeOperatorName} ang mensahe ni ${message.farmerName}. I-click ang abisong ito para buksan ang Aking Queue.`,
        onClick: () => {
          dismiss();
          router.push('/dashboard/operations#aking-queue');
        },
        className: 'cursor-pointer border-primary/20 transition-colors hover:border-primary/40 hover:bg-primary/5',
      });
    };

    const handleSaveOutcome = (outcomeStatus: NonNullable<SmsMessage['caseOutcomeStatus']>, summary: string) => {
      if (!outcomeMessage) {
        return;
      }

      const updated = updateSmsCaseOutcome(outcomeMessage.id, outcomeStatus, summary);

      if (!updated) {
        toast({
          title: "Kulang pa ang closeout evidence",
          description:
            outcomeReadiness?.blockers[0] ??
            "Mag-log muna ng actual action taken o completed field visit bago i-resolve ang high-risk case.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Na-save ang outcome",
        description: `Na-update na ang case outcome ni ${outcomeMessage.farmerName}.`,
      });
      setOutcomeMessage(null);
    };

    const handleRetrySend = async (message: SmsMessage) => {
      const latest = latestOutboundByMessage.get(message.id);

      if (!latest) {
        return;
      }

      try {
        const retried = await retryOutboundMessage(latest.id);

        toast({
          title: retried ? "Retry sent" : "Retry failed",
          description: retried
            ? `Muling ipinadala ang huling outbound SMS para kay ${message.farmerName}.`
            : "Walang outbound record na mare-retry para sa mensaheng ito.",
          variant: retried ? "default" : "destructive",
        });
      } catch {
        toast({
          title: "Retry failed",
          description: "Hindi naipadala muli ang outbound SMS.",
          variant: "destructive",
        });
      }
    };

    const handleConfirmResolution = (message: SmsMessage, confirmed: boolean) => {
      confirmSmsCaseResolution(
        message.id,
        confirmed ? 'confirmed_by_farmer' : 'reopened',
        confirmed
          ? 'Kinumpirma ng barangay team na okay na ang concern batay sa feedback ng magsasaka.'
          : 'Ibinukas muli ang case dahil kailangan pa ng dagdag na follow-up o tulong.'
      );
      toast({
        title: confirmed ? "Kinumpirma ang resolution" : "Ibinalik sa follow-up",
        description: confirmed
          ? `Maaari nang tuluyang isara ang case ni ${message.farmerName}.`
          : `Naibalik sa active follow-up ang concern ni ${message.farmerName}.`,
      });
    };

    React.useEffect(() => {
      if (searchParams.get('draft') !== 'knowledge') {
        return;
      }

      if (typeof window === 'undefined') {
        return;
      }

      const rawDraft = sessionStorage.getItem('knowledgeReplyDraft');

      if (!rawDraft) {
        return;
      }

      try {
        const parsed = JSON.parse(rawDraft) as KnowledgeReplyDraft;
        if (parsed?.text?.trim()) {
          setPendingKnowledgeReplyDraft({
            ...parsed,
            text: parsed.text.trim(),
          });
          toast({
            title: "May Knowledge draft na handa",
            description: "Pumili ng SMS card at pindutin ang Aprubahan o Manwal upang gamitin ang sagot bilang panimulang draft.",
          });
        }
      } catch {
        toast({
          title: "Hindi mabasa ang draft mula sa Knowledge",
          description: "Subukang bumalik sa Knowledge page at ihanda muli ang sagot.",
          variant: "destructive",
        });
      } finally {
        sessionStorage.removeItem('knowledgeReplyDraft');
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete('draft');
      const nextRoute = nextParams.toString() ? `/dashboard/sms-feed?${nextParams.toString()}` : '/dashboard/sms-feed';
      router.replace(nextRoute);
    }, [router, searchParams, toast]);

    React.useEffect(() => {
      if (!focusedSmsId) {
        return;
      }

      const target = document.getElementById(`sms-card-${focusedSmsId}`);

      if (!target) {
        return;
      }

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, [focusedSmsId, smsMessages.length]);

  return (
    <>
      <div className="mb-6 space-y-1">
          <div className="flex items-center">
              <h1 className="text-2xl font-bold tracking-tight">Live na Feed ng SMS</h1>
              <HelpDialog title="Live na Feed ng SMS" tooltipText="Suriin at tumugon sa mga papasok na SMS.">
                <p>Ito ang iyong real-time na inbox para sa lahat ng mensahe mula sa mga magsasaka. Bawat card ay kumakatawan sa isang papasok na SMS na kailangan ng iyong atensyon.</p>
                <p><strong>Daloy ng Trabaho:</strong> Ang isang bagong SMS ay papasok at agad na susuriin ng AI. Ang AI ay magbibigay ng paunang pagsusuri sa layunin (intent), tono, at panganib ng mensahe, at magmumungkahi ng isang tugon. Ang iyong gawain ay suriin ang mungkahi ng AI at aprubahan o i-edit ito.</p>
                <p><strong>Auto fallback:</strong> Sa kasalukuyang deployed setup, araw-araw tumatakbo sa background ang overdue at follow-up batch checks. Kapag ang isang mensahe ay nanatiling <code>pending_approval</code> lampas sa configured timeout, magpapadala ang system ng ligtas na fallback template sa susunod na scheduled run o kapag mano-manong pinatakbo ang automation, habang nananatiling bukas ang case para sa human follow-up.</p>
                <p><strong>Mga Aksyon sa Card:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Aprubahan:</strong> Nagbubukas ito ng isang pop-up kung saan maaari mong suriin at i-edit ang tugon ng AI bago ito ipadala sa magsasaka. Ito ang pinakakaraniwang aksyon.</li>
                    <li><strong>Manwal:</strong> Kung ang mungkahi ng AI ay hindi angkop, pinapayagan ka nitong magsulat ng iyong sariling tugon mula sa simula.</li>
                    <li><strong>Maghanap ng Kagamitan:</strong> Isang shortcut na lilitaw lamang para sa mga mensahe na may layuning "REQUEST". Mabilis nitong hinahanap ang imbentaryo para sa mga magagamit na kagamitan.</li>
                </ul>
              </HelpDialog>
          </div>
          <p className="text-muted-foreground">Suriin, aprubahan, at tumugon sa mga papasok na SMS sa real-time.</p>
      </div>
      {pendingKnowledgeReplyDraft ? (
        <Card className="mb-6 border-primary/15 bg-primary/5">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">May handang draft mula sa Knowledge search</CardTitle>
            <CardDescription>
              Ang susunod na bubuksan mong <span className="font-medium">Aprubahan</span> o <span className="font-medium">Manwal</span> dialog ay mapupunan ng AI answer para mas mabilis mong maangkop sa magsasaka.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-primary/15 bg-background/80 p-3 text-sm text-foreground/90">
              <p className="line-clamp-4">{pendingKnowledgeReplyDraft.text}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {pendingKnowledgeReplyDraft.sourceQuery ? (
                <Badge variant="outline">Mula sa query: {pendingKnowledgeReplyDraft.sourceQuery}</Badge>
              ) : null}
              {pendingKnowledgeReplyDraft.answerMode ? (
                <Badge variant="outline">Mode: {pendingKnowledgeReplyDraft.answerMode}</Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPendingKnowledgeReplyDraft(null)}>
                I-clear ang draft
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      {liveSmsTestModeLocked ? (
        <Card className="mb-6 border-amber-300/40 bg-amber-50/70">
          <CardHeader>
            <CardTitle className="text-base">Naka-lock ang live SMS test mode</CardTitle>
            <CardDescription>
              Available ito para sa superadmin accounts, pero kailangan munang i-enable ang live test flag sa server bago lumabas ang safe preview tool.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
      {showSimulationTool ? (
        <Card className="mb-6 border-primary/15">
          <CardHeader className="border-b border-border/70 bg-[linear-gradient(180deg,#f8fbf8_0%,#ffffff_100%)]">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <CardTitle>Simulate Farmer SMS</CardTitle>
                  <CardDescription>
                    {usingLiveData
                      ? 'Developer-only safe preview ito para sa live SMS flow. Lalabas ito bilang Test SMS sa kasalukuyang session lang.'
                      : 'Gamitin ang tool na ito upang lumikha ng demo inbound SMS. Ang simulated messages ay mase-save sa demo data at makikita sa reports, queues, at iba pang demo views hanggang logout.'}
                  </CardDescription>
              </div>
            </div>
            {webhookBridgeStatus === 'syncing' ? (
              <p className="text-xs text-muted-foreground">
                Isinasagawa ang pag-sync ng SMS simulation tool.
              </p>
            ) : null}
            {webhookBridgeStatus === 'error' ? (
              <p className="text-xs text-destructive">
                Pansamantalang hindi available ang SMS simulation tool. Subukan muli pagkatapos ng ilang sandali.
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-6 p-6">
            <div className="grid gap-3">
              <Label htmlFor="simulated-phone" className="text-sm font-semibold">Numero ng Magsasaka</Label>
              <Input
                id="simulated-phone"
                value={simulatedPhone}
                onChange={(e) => setSimulatedPhone(e.target.value)}
                className="h-11"
                placeholder="+639171234567"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="simulated-message" className="text-sm font-semibold">Mensaheng SMS</Label>
              <Textarea
                id="simulated-message"
                value={simulatedMessage}
                onChange={(e) => setSimulatedMessage(e.target.value)}
                className="min-h-[110px] resize-y"
                placeholder="Marami pong uod sa palay namin at mabilis dumami ngayong umaga."
              />
              <p className="text-xs text-muted-foreground">
                Halimbawa: "May mga dilaw na dahon ang palay namin."
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSimulateInboundSms} className="min-w-[180px]">
                Simulate SMS
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
      <Card className="mb-6 border-border/80">
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">Ayos ng SMS feed</CardTitle>
          <CardDescription>
            Ang mga mensaheng may naaksyunan na ay hindi agad binubura. Inaalis sila sa default actionable queue at inililipat sa
            <span className="font-medium"> Monitoring</span> o <span className="font-medium">Sarado</span> para tuloy-tuloy ang audit trail, reports, at follow-up tracking.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {feedViewOptions.map((option) => {
              const isActive = feedView === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFeedView(option.id)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left transition-colors",
                    isActive
                      ? "border-primary/35 bg-primary/5 ring-1 ring-primary/10"
                      : "border-border/80 bg-background hover:border-primary/20 hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{option.label}</p>
                    <Badge variant="outline" className={isActive ? infoBadgeClassName : neutralBadgeClassName}>
                      {feedViewCounts[option.id]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{option.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleSmsMessages.map(message => (
              <SmsMessageCard
                key={message.id}
                message={{
                  ...message,
                  possibleDuplicateOfCaseId: duplicateCaseByMessage.get(message.id)?.caseId,
                  possibleDuplicateReason: duplicateCaseByMessage.get(message.id)
                    ? 'May kahawig na kamakailang concern mula sa parehong magsasaka o numero.'
                    : undefined,
                }}
                onActionClick={openDialog}
                onAssignToMe={handleAssignToMe}
                onRecordOutcome={setOutcomeMessage}
                onRetrySend={handleRetrySend}
                latestOutboundStatus={latestOutboundByMessage.get(message.id)?.status}
                farmers={farmers}
                cardId={`sms-card-${message.id}`}
                isHighlighted={focusedSmsId === message.id}
                matchedTeachingPhrase={matchedTeachingPhraseByMessage.get(message.id)}
                similarReviewedExamplesCount={reviewedExampleCountByMessage.get(message.id) ?? 0}
                onConfirmResolution={handleConfirmResolution}
                onOpenThreadReview={handleOpenThreadReview}
              />
          ))}
      </div>
      {visibleSmsMessages.length === 0 ? (
        <Card className="mt-4 border-dashed border-border/80">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Walang mensaheng tumutugma sa kasalukuyang feed view. Subukang lumipat sa ibang tab para makita ang monitoring o closed history.
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={dialogState.type === 'approve'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suriin at I-edit ang Tugon</DialogTitle>
            <DialogDescription>
              Maaari mong i-edit ang mensahe bago ipadala kay {dialogState.message?.farmerName}.
            </DialogDescription>
          </DialogHeader>
          {reviewDraft ? <ReviewMetadataFields draft={reviewDraft} setDraft={setReviewDraft} /> : null}
          <HoverTooltip text="I-edit dito ang iminungkahing tugon ng AI.">
            <Textarea 
                className="my-4"
                value={reviewDraft?.aiAdvice ?? ''}
                onChange={(e) => setReviewDraft((current) => current ? { ...current, aiAdvice: e.target.value } : current)}
                rows={5} 
            />
          </HoverTooltip>
          <DialogFooter>
            <HoverTooltip text="Isara at huwag ipadala ang tugon.">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Kanselahin</Button>
                </DialogClose>
            </HoverTooltip>
            <HoverTooltip text="I-save ang iyong mga pag-edit at ipadala ang tugon sa magsasaka.">
                <Button onClick={() => handleAction('na-edit at naipadala', { status: 'approved' })}>I-save at Ipadala</Button>
            </HoverTooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={dialogState.type === 'manual'} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manu-manong Tumugon kay {dialogState.message?.farmerName}</DialogTitle>
            <DialogDescription>
              Isulat ang iyong mensahe at itama ang classification kung kinakailangan.
            </DialogDescription>
          </DialogHeader>
          {reviewDraft ? <ReviewMetadataFields draft={reviewDraft} setDraft={setReviewDraft} /> : null}
          <HoverTooltip text="Isulat dito ang iyong custom na tugon.">
            <Textarea
              className="my-4"
              placeholder="Simulan ang pagsusulat dito..."
              rows={5}
              value={reviewDraft?.aiAdvice ?? ''}
              onChange={(e) => setReviewDraft((current) => current ? { ...current, aiAdvice: e.target.value } : current)}
            />
          </HoverTooltip>
          <DialogFooter>
             <HoverTooltip text="Isara at huwag magpadala ng mensahe.">
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Kanselahin</Button>
                </DialogClose>
            </HoverTooltip>
             <HoverTooltip text="Ipadala ang iyong isinulat na mensahe sa magsasaka.">
                <Button onClick={() => handleAction('naipadala', { status: 'replied' })}>Ipadala ang Mensahe</Button>
            </HoverTooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogState.type === 'find'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Maghanap ng Kagamitan sa Imbentaryo</DialogTitle>
            <DialogDescription>
              Narito ang mga kasalukuyang magagamit na kagamitan sa barangay.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="my-4 h-64">
            <div className="space-y-2 pr-4">
                {resources.filter(r => r.category === 'Kagamitan').map((tool: Resource) => (
                    <div key={tool.id} className="p-3 bg-muted rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{tool.name}</p>
                            <p className="text-sm text-muted-foreground">{tool.stock} yunit ang magagamit</p>
                        </div>
                        <HoverTooltip text={`Ipadala ang isang SMS na nag-aalok ng ${tool.name} sa magsasaka.`}>
                            <Button
                              size="sm"
                              onClick={() => handleAction(`inirekomenda ang ${tool.name}`, {
                                status: 'replied',
                                aiAdvice: createResourceOfferMessage(tool.name, tool.stock),
                              })}
                            >
                              Mag-alok
                            </Button>
                        </HoverTooltip>
                    </div>
                ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <HoverTooltip text="Isara ang window na ito.">
                <DialogClose asChild>
                <Button type="button" variant="secondary">Isara</Button>
                </DialogClose>
            </HoverTooltip>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(threadReviewMessage)} onOpenChange={(open) => {
        if (!open) {
          setThreadReviewMessage(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review ng SMS Thread</DialogTitle>
            <DialogDescription>
              Suriin kung continuation lang ba ito ng naunang case, dapat bang i-merge, o dapat manatiling hiwalay.
            </DialogDescription>
          </DialogHeader>
          {threadReviewMessage ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">{threadReviewMessage.farmerName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{threadReviewMessage.phone}</p>
                <p className="mt-3 text-sm leading-relaxed">{threadReviewMessage.message}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">Current case: {threadReviewMessage.caseId ?? threadReviewMessage.id}</Badge>
                  <Badge variant="outline">Intent: {threadReviewMessage.parsedIntent}</Badge>
                  {typeof threadReviewMessage.threadConfidence === 'number' ? (
                    <Badge variant="outline">Thread conf: {(threadReviewMessage.threadConfidence * 100).toFixed(0)}%</Badge>
                  ) : null}
                  {threadReviewMessage.multiConcernDetected ? (
                    <Badge variant="outline">May halong concern</Badge>
                  ) : null}
                </div>
                {threadReviewMessage.multiConcernReason ? (
                  <p className="mt-3 text-xs text-muted-foreground">{threadReviewMessage.multiConcernReason}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleConfirmThreadReview}>
                  Panatilihing hiwalay
                </Button>
                <Button variant="outline" onClick={handleSplitThreadReview}>
                  Gumawa ng bagong case
                </Button>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Suggested merge candidates</p>
                {threadReviewCandidates.length > 0 ? (
                  threadReviewCandidates.map((candidate) => (
                    <div key={candidate.message.id} className="rounded-lg border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{candidate.message.farmerName}</p>
                          <p className="text-xs text-muted-foreground">
                            Case {candidate.message.caseId ?? candidate.message.id} · score {(candidate.score * 100).toFixed(0)}%
                          </p>
                        </div>
                        <Button size="sm" onClick={() => void handleMergeThreadReview(candidate.message.id)}>
                          I-merge dito
                        </Button>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed">{candidate.message.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{candidate.reason}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Wala pang malinaw na merge candidate. Puwede mong panatilihing hiwalay ang case o hatiin ito sa bagong case ID.
                  </div>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Isara</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CaseOutcomeDialog
        open={Boolean(outcomeMessage)}
        onOpenChange={(open) => {
          if (!open) {
            setOutcomeMessage(null);
          }
        }}
        farmerName={outcomeMessage?.farmerName}
        initialStatus={outcomeMessage?.caseOutcomeStatus}
        initialSummary={outcomeMessage?.caseOutcomeSummary}
        resolutionReady={outcomeReadiness?.ready ?? true}
        resolutionBlockers={outcomeReadiness?.blockers ?? []}
        resolutionEvidenceSummary={
          outcomeReadiness
            ? `Assistance: ${outcomeReadiness.assistanceCount}, completed field visits: ${outcomeReadiness.completedVisitCount}`
            : undefined
        }
        onSubmit={handleSaveOutcome}
      />
    </>
  );
}

export default function SmsFeedPage() {
  return (
    <React.Suspense fallback={<div className="flex flex-col gap-6" />}>
      <SmsFeedPageContent />
    </React.Suspense>
  );
}

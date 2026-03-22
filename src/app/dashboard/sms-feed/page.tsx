
"use client";

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Sparkles, MessageSquare, Send, Wrench, Sprout, FilePen, ShieldAlert, CloudCog, Tractor } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { findBestMatchingLexiconRule, findRelevantTrainingExamples } from '@/lib/sms-teaching';
import { cn } from '@/lib/utils';

type DialogState = {
  type: 'approve' | 'manual' | 'find' | null;
  message: SmsMessage | null;
}

type ReviewDraft = Pick<SmsMessage, 'aiAdvice' | 'parsedIntent' | 'urgency' | 'safetyFlag' | 'tone'>;

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

function getRiskBadgeClassName(flag: SmsMessage['safetyFlag']) {
  if (flag === 'High') {
    return destructiveBadgeClassName;
  }

  if (flag === 'Medium') {
    return warningBadgeClassName;
  }

  return successBadgeClassName;
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
}) {
    const [isClient, setIsClient] = React.useState(false);
    React.useEffect(() => { setIsClient(true); }, []);

    const intentLabel = typeInfo[message.parsedIntent]?.label || 'Hindi Kilala';
    const IntentIcon = typeInfo[message.parsedIntent]?.icon || MessageSquare;

    const farmer = farmers.find(f => f.id === message.farmerId);
    const farmerName = farmer ? farmer.name : message.farmerName;
    const avatarUrl = farmer?.avatarUrl;

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
                        <Avatar className="w-10 h-10 border-2 border-background/50 flex-shrink-0">
                             <AvatarImage src={avatarUrl} alt={farmerName} />
                             <AvatarFallback>{farmerName ? farmerName.charAt(0) : '?'}</AvatarFallback>
                         </Avatar>
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
                        <Badge variant="outline" className={neutralBadgeClassName}>Conf: {(message.aiConfidence * 100).toFixed(0)}%</Badge>
                        <Badge variant="outline" className={neutralBadgeClassName}>
                          Source: {message.analysisSource === 'ai_fallback' ? 'AI fallback' : message.analysisSource === 'rules' ? 'Rules' : 'AI'}
                        </Badge>
                        {message.caseStatus && <Badge variant="outline" className={neutralBadgeClassName}>Case: {message.caseStatus}</Badge>}
                        <CaseOutcomeBadge message={message} />
                        {message.assignedTo && <Badge variant="outline" className={neutralBadgeClassName}>Owner: {message.assignedTo}</Badge>}
                        {message.registrationRequired && (
                          <Badge variant="outline" className={infoBadgeClassName}>
                            Registration required
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
                    {message.analysisSource && message.analysisSource !== 'ai' ? (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-slate-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-50">
                        <p className="font-semibold text-amber-900 dark:text-amber-100">Review required</p>
                        <p className="mt-1">
                          Ang kasalukuyang analysis ay galing sa {message.analysisSource === 'ai_fallback' ? 'AI fallback' : 'rules-based'} path, kaya mas mahalaga ang human review bago magpadala ng final advisory.
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
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <div className="grid gap-2 sm:grid-cols-2">
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
    const { smsMessages, outboundMessages, farmers, resources, systemSettings, smsTrainingExamples, addInboundSms, updateSmsMessage, assignSmsMessage, updateSmsCaseOutcome, retryOutboundMessage, webhookBridgeStatus } = useData();
    const { currentUserProfile } = useAuth();
    const searchParams = useSearchParams();
    const [dialogState, setDialogState] = React.useState<DialogState>({ type: null, message: null });
    const [reviewDraft, setReviewDraft] = React.useState<ReviewDraft | null>(null);
    const [outcomeMessage, setOutcomeMessage] = React.useState<SmsMessage | null>(null);
    const [simulatedPhone, setSimulatedPhone] = React.useState('+639171234567');
    const [simulatedMessage, setSimulatedMessage] = React.useState('Marami pong uod sa palay namin at mabilis dumami ngayong umaga.');
    const { toast, dismiss } = useToast();
    const focusedSmsId = searchParams.get('sms');
    const activeOperatorName = currentUserProfile?.name?.trim() || 'Brgy. Admin';
    const showSimulationTool = !isLiveMode || canUseLiveSmsSimulation(currentUserProfile);

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
    
    const openDialog = (type: DialogState['type'], message: SmsMessage) => {
        setDialogState({ type, message });
        if (type === 'approve' || type === 'manual') {
            setReviewDraft(createReviewDraft(message));
        }
    };

    const closeDialog = () => {
        setDialogState({ type: null, message: null });
        setReviewDraft(null);
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

        const response = await fetch('/api/mock/inbound-sms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: simulatedPhone.trim(),
                message: simulatedMessage.trim(),
            }),
        });

        if (!response.ok) {
            toast({
                title: "Hindi naisagawa ang simulation",
                description: "Nagkaroon ng problema sa SMS simulation request.",
                variant: "destructive",
            });
            return;
        }

        const payload = await response.json();
        const inbound = addInboundSms({
            phone: payload.phone,
            message: payload.message,
            analysis: payload.analysis,
        });

        toast({
            title: "Na-simulate ang SMS",
            description: `Naidagdag sa feed ang sample report mula kay ${inbound.farmerName}.`,
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

      updateSmsCaseOutcome(outcomeMessage.id, outcomeStatus, summary);
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
                  Gamitin ang tool na ito upang subukan ang pagpasok ng SMS report mula sa magsasaka.
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {smsMessages.map(message => (
              <SmsMessageCard
                key={message.id}
                message={message}
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
              />
          ))}
      </div>

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
                            <Button size="sm" onClick={() => handleAction(`inirekomenda ang ${tool.name}`, { status: 'replied' })}>Mag-alok</Button>
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

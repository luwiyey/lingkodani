'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { BellRing, CheckCircle2, ClipboardList, MessageSquareWarning, RefreshCcw, UserPlus2 } from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import type { OutboundMessage, SmsMessage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpDialog } from '@/components/ui/help-dialog';
import { CaseOutcomeBadge } from '@/components/sms/case-outcome-badge';
import { CaseOutcomeDialog } from '@/components/sms/case-outcome-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/use-analytics';
import { getSmsCaseExceptionFlags } from '@/lib/sms-case-exceptions';
import { findPotentialDuplicateCase } from '@/lib/sms-case-linking';
import { isAwaitingFarmerConfirmation } from '@/lib/sms-case-outcomes';
import { getSmsCaseResolutionReadiness } from '@/lib/sms-case-quality';
import { buildAssignmentSuggestions, getNextBestAction, getSlaAgingMeta, type AssignmentSuggestion } from '@/lib/assignment-routing';
import { getPreferredWorkspace } from '@/lib/user-workspace';
import { isSmsAssignedToUser } from '@/lib/sms-assignment';

const actionButtonClassName = 'h-auto min-h-12 w-full whitespace-normal break-words px-4 py-3 text-center leading-snug';

function getTriageLabel(value: SmsMessage['triageUncertainty']) {
  switch (value) {
    case 'ambiguous':
      return 'May halong concern';
    case 'needs_severity':
      return 'Kulang ang lawak';
    case 'needs_location':
      return 'Kulang ang lokasyon';
    case 'needs_crop_stage':
      return 'Kulang ang stage';
    case 'needs_symptom_details':
      return 'Kulang ang sintomas';
    case 'insufficient_details':
      return 'Kulang ang detalye';
    case 'probable':
      return 'May kaunting duda';
    default:
      return null;
  }
}

function TaskCard({
  href,
  title,
  description,
  count,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  count: number;
  icon: React.ElementType;
}) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full border-primary/20 transition-colors hover:bg-accent/30">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Icon className="h-6 w-6" />
            </div>
          </div>
          <div className="text-3xl font-bold">{count}</div>
        </CardHeader>
      </Card>
    </Link>
  );
}

function QuickResultCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border bg-background/90 p-4">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
    </div>
  );
}

function MessageTaskRow({
  message,
  latestOutbound,
  onAssign,
  onRetry,
  onRecordOutcome,
  onConfirmResolution,
  exceptionFlags = [],
  assignmentSuggestion,
  isSimpleLanguage = false,
}: {
  message: SmsMessage;
  latestOutbound?: OutboundMessage;
  onAssign: (message: SmsMessage) => void;
  onRetry: (message: SmsMessage) => void;
  onRecordOutcome: (message: SmsMessage) => void;
  onConfirmResolution: (message: SmsMessage, confirmed: boolean) => void;
  exceptionFlags?: ReturnType<typeof getSmsCaseExceptionFlags>;
  assignmentSuggestion?: AssignmentSuggestion | null;
  isSimpleLanguage?: boolean;
}) {
  const router = useRouter();
  const awaitingConfirmation = isAwaitingFarmerConfirmation(message);
  const slaMeta = getSlaAgingMeta(message);
  const nextBestAction = getNextBestAction(message);
  const timingSummary = isSimpleLanguage
    ? `${slaMeta.ageHours.toFixed(1)} oras na mula nang gumalaw ito${slaMeta.overdue ? " | Dapat nang silipin" : " | Nasa oras pa"}`
    : `SLA age: ${slaMeta.ageHours.toFixed(1)}h${slaMeta.overdue ? " | overdue" : " | on track"}`;

  return (
    <div
      className="cursor-pointer rounded-2xl border bg-background p-4 shadow-sm transition-colors hover:bg-accent/30"
      onClick={() => router.push(`/dashboard/sms-feed?sms=${encodeURIComponent(message.id)}`)}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold">{message.farmerName}</p>
            <Badge variant="outline">{message.urgency}</Badge>
            {message.caseStatus ? <Badge variant="outline">{message.caseStatus}</Badge> : null}
            <CaseOutcomeBadge message={message} />
            {message.assignedTo ? (
              <Badge variant="outline">
                {isSimpleLanguage ? `May hawak: ${message.assignedTo}` : `Owner: ${message.assignedTo}`}
              </Badge>
            ) : null}
            {message.registrationRequired ? (
              <Badge variant="outline">{isSimpleLanguage ? "Kulang ang rehistro" : "Need registration"}</Badge>
            ) : null}
            {message.clarificationNeeded ? (
              <Badge variant="outline">{isSimpleLanguage ? "Kulang ang paliwanag" : "Need clarification"}</Badge>
            ) : null}
            {message.triageUncertainty && getTriageLabel(message.triageUncertainty) ? (
              <Badge variant="outline">{getTriageLabel(message.triageUncertainty)}</Badge>
            ) : null}
            {latestOutbound?.status === 'failed' ? (
              <Badge variant="destructive">{isSimpleLanguage ? "Hindi naipadala" : "Send failed"}</Badge>
            ) : null}
            {exceptionFlags.length > 0 ? (
              <Badge variant={exceptionFlags.some((flag) => flag.severity === 'high') ? 'destructive' : 'outline'}>
                {exceptionFlags.length}{" "}
                {isSimpleLanguage ? "paalala para sa lead" : `supervisor flag${exceptionFlags.length > 1 ? 's' : ''}`}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">{message.phone}</p>
          <p className="break-words text-sm leading-relaxed">{message.message}</p>
          {message.caseOutcomeSummary ? (
            <div className="rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {isSimpleLanguage ? "Pinakahuling resulta" : "Latest outcome"}
              </p>
              <p className="mt-1 leading-relaxed">{message.caseOutcomeSummary}</p>
            </div>
          ) : null}
          <div className="rounded-xl border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{isSimpleLanguage ? "Sunod na gawin" : "Next best action"}</p>
            <p className="mt-1 leading-relaxed">{nextBestAction}</p>
            <p className="mt-2 text-xs">{timingSummary}</p>
          </div>
          {assignmentSuggestion ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100">
              <p className="font-medium">{isSimpleLanguage ? "Mas bagay na taga-asikaso" : "Suggested owner"}</p>
              <p className="mt-1 leading-relaxed">
                {assignmentSuggestion.name}
                {assignmentSuggestion.title ? ` | ${assignmentSuggestion.title}` : ''}
              </p>
              <p className="mt-1 text-xs">
                {isSimpleLanguage
                  ? `Bakit siya ang bagay: ${assignmentSuggestion.reasons.slice(0, 2).join(', ')}`
                  : `Score ${assignmentSuggestion.score} | ${assignmentSuggestion.reasons.slice(0, 2).join(' | ')}`}
              </p>
            </div>
          ) : null}
          {message.possibleDuplicateOfCaseId ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              <p className="font-medium">Posibleng kaparehong case</p>
              <p className="mt-1 leading-relaxed">
                Maaaring kaugnay ito ng {message.possibleDuplicateOfCaseId}. {message.possibleDuplicateReason ?? 'Suriin muna kung kailangan ba ng bagong case o pagpapatuloy lang ng naunang concern.'}
              </p>
            </div>
          ) : null}
          {message.multiConcernDetected && message.multiConcernReason ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              <p className="font-medium">May posibleng halong concern</p>
              <p className="mt-1 leading-relaxed">{message.multiConcernReason}</p>
            </div>
          ) : null}
          {exceptionFlags.length > 0 ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100">
              <p className="font-medium">{isSimpleLanguage ? "Ipa-check sa lead" : "Supervisor review needed"}</p>
              <p className="mt-1 leading-relaxed">{exceptionFlags[0]?.reason}</p>
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-2 lg:max-w-[220px] lg:shrink-0">
          {!message.assignedTo && !message.closedAt ? (
            <Button
              className={actionButtonClassName}
              onClick={(event) => {
                event.stopPropagation();
                onAssign(message);
              }}
            >
              I-assign sa akin
            </Button>
          ) : null}

          {latestOutbound?.status === 'failed' ? (
            <Button
              variant="outline"
              className={actionButtonClassName}
              onClick={(event) => {
                event.stopPropagation();
                onRetry(message);
              }}
            >
              {isSimpleLanguage ? "Subukang ipadala ulit" : "Retry send"}
            </Button>
          ) : null}

          {!message.closedAt ? (
            <Button
              variant="outline"
              className={actionButtonClassName}
              onClick={(event) => {
                event.stopPropagation();
                onRecordOutcome(message);
              }}
            >
              {isSimpleLanguage ? "Itala ang naging resulta" : "I-record ang outcome"}
            </Button>
          ) : null}
          {awaitingConfirmation ? (
            <>
              <Button
                variant="outline"
                className={actionButtonClassName}
                onClick={(event) => {
                  event.stopPropagation();
                onConfirmResolution(message, true);
              }}
            >
                {isSimpleLanguage ? "Okay na ayon sa magsasaka" : "Kinumpirma ng farmer"}
              </Button>
              <Button
                variant="outline"
                className={actionButtonClassName}
                onClick={(event) => {
                  event.stopPropagation();
                  onConfirmResolution(message, false);
                }}
              >
                {isSimpleLanguage ? "Hindi pa pala ayos" : "Hindi pa pala okay"}
              </Button>
            </>
          ) : null}

          <Button
            variant="secondary"
            className={actionButtonClassName}
            onClick={(event) => {
              event.stopPropagation();
              router.push(`/dashboard/sms-feed?sms=${encodeURIComponent(message.id)}`);
            }}
          >
            {isSimpleLanguage ? "Buksan ang buong usapan" : "Buksan sa SMS Feed"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OperationsPage() {
  const router = useRouter();
  const { currentUserProfile } = useAuth();
  const { smsMessages, outboundMessages, assignSmsMessage, updateSmsCaseOutcome, confirmSmsCaseResolution, retryOutboundMessage, farmers, assistanceRecords, fieldVisitTasks, users } = useData();
  const { toast, dismiss } = useToast();
  const isSimpleWorkspace = getPreferredWorkspace(currentUserProfile) === 'simple';
  const {
    reportingReadyCases,
    farmerConfirmedResolutionCount,
    highRiskCount,
    supervisorReviewCases,
    topInquiriesData,
    geographicHotspotData,
    outbreakWatchSummary,
    liveContextUpdatedAt,
  } = useAnalytics();
  const activeOperatorName = currentUserProfile?.name?.trim() || 'Brgy. Admin';
  const [outcomeMessage, setOutcomeMessage] = React.useState<SmsMessage | null>(null);
  const topInquiry = topInquiriesData[0] ?? null;
  const topHotspot = geographicHotspotData[0] ?? null;

  const openMyQueue = React.useCallback(() => {
    dismiss();
    const queueElement = document.getElementById('aking-queue');
    if (queueElement) {
      window.history.replaceState(null, '', '/dashboard/operations#aking-queue');
      queueElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    router.push('/dashboard/operations#aking-queue');
  }, [dismiss, router]);

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

  const duplicateCaseByMessage = React.useMemo(() => {
    const map = new Map<string, SmsMessage | null>();
    for (const message of smsMessages) {
      map.set(message.id, findPotentialDuplicateCase(message, smsMessages));
    }
    return map;
  }, [smsMessages]);
  const exceptionFlagsByMessage = React.useMemo(() => {
    const now = new Date().toISOString();
    const map = new Map<string, ReturnType<typeof getSmsCaseExceptionFlags>>();

    for (const message of smsMessages) {
      map.set(
        message.id,
        getSmsCaseExceptionFlags({
          message,
          assistanceRecords,
          fieldVisitTasks,
          outboundMessages,
          now,
        })
      );
    }

    return map;
  }, [assistanceRecords, fieldVisitTasks, outboundMessages, smsMessages]);
  const assignmentSuggestions = React.useMemo(() => {
    const map = new Map<string, AssignmentSuggestion | null>();

    for (const message of smsMessages) {
      map.set(
        message.id,
        buildAssignmentSuggestions({
          message,
          users,
          farmers,
          smsMessages,
        })[0] ?? null
      );
    }

    return map;
  }, [farmers, smsMessages, users]);
  const workloadSummary = React.useMemo(() => {
    return users
      .filter((user) => user.role === 'barangay' && user.status !== 'disabled')
      .map((user) => ({
        user,
        openCases: smsMessages.filter(
          (message) =>
            !message.closedAt &&
            isSmsAssignedToUser(message, user)
        ).length,
      }))
      .sort((left, right) => left.openCases - right.openCases);
  }, [smsMessages, users]);
  const overdueSlaCount = React.useMemo(
    () =>
      smsMessages.filter((message) => {
        const slaMeta = getSlaAgingMeta(message);
        return slaMeta.overdue;
      }).length,
    [smsMessages]
  );

  const urgentQueue = React.useMemo(
    () => smsMessages.filter((message) => message.status === 'pending_approval' && message.urgency === 'high' && !message.closedAt && !message.assignedTo),
    [smsMessages]
  );
  const registrationQueue = React.useMemo(
    () => smsMessages.filter((message) => !message.closedAt && !message.assignedTo && (message.registrationRequired || message.caseStatus === 'awaiting_registration')),
    [smsMessages]
  );
  const clarificationQueue = React.useMemo(
    () => smsMessages.filter((message) => !message.closedAt && !message.assignedTo && message.clarificationNeeded && message.status === 'pending_approval'),
    [smsMessages]
  );
  const followUpQueue = React.useMemo(
    () => smsMessages.filter((message) => !message.closedAt && !message.assignedTo && !!message.followUpDueAt && !message.followUpStopReason),
    [smsMessages]
  );
  const failedSendQueue = React.useMemo(
    () => smsMessages.filter((message) => !message.closedAt && !message.assignedTo && latestOutboundByMessage.get(message.id)?.status === 'failed'),
    [latestOutboundByMessage, smsMessages]
  );
  const myQueue = React.useMemo(
    () => smsMessages.filter((message) => !message.closedAt && isSmsAssignedToUser(message, currentUserProfile)),
    [currentUserProfile, smsMessages]
  );
  const supervisorReviewQueue = React.useMemo(
    () =>
      smsMessages.filter((message) => {
        const flags = exceptionFlagsByMessage.get(message.id) ?? [];
        return flags.some(
          (flag) =>
            flag.severity === 'high' ||
            flag.id === 'reporting_incomplete' ||
            flag.id === 'lexicon_review_needed' ||
            flag.id === 'thread_review_blocked'
        );
      }),
    [exceptionFlagsByMessage, smsMessages]
  );
  const pendingApprovals = React.useMemo(
    () => farmers.filter((farmer) => farmer.status === 'pending_approval'),
    [farmers]
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

  const handleAssign = (message: SmsMessage) => {
    assignSmsMessage(message.id, activeOperatorName);
    toast({
      title: 'Na-assign ang task',
      description: `Itinalaga na kay ${activeOperatorName} ang mensahe ni ${message.farmerName}. Nasa "Aking Queue" na ito ngayon. I-click ang abisong ito para buksan ang queue.`,
      onClick: openMyQueue,
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
        title: 'Kulang pa ang closeout evidence',
        description:
          outcomeReadiness?.blockers[0] ??
          'Mag-log muna ng actual action taken bago markahang resolved ang high-risk case.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Na-save ang outcome',
      description: `Na-update na ang case outcome ni ${outcomeMessage.farmerName}.`,
    });
    setOutcomeMessage(null);
  };

  const handleRetry = async (message: SmsMessage) => {
    const latest = latestOutboundByMessage.get(message.id);

    if (!latest) {
      toast({
        title: 'Retry failed',
        description: 'Walang outbound record na mare-retry para sa mensaheng ito.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const retried = await retryOutboundMessage(latest.id);
      toast({
        title: retried ? 'Retry sent' : 'Retry failed',
        description: retried
          ? `Muling ipinadala ang huling outbound SMS para kay ${message.farmerName}.`
          : 'Hindi naipadala muli ang outbound SMS.',
        variant: retried ? 'default' : 'destructive',
      });
    } catch {
      toast({
        title: 'Retry failed',
        description: 'Hindi naipadala muli ang outbound SMS.',
        variant: 'destructive',
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
      title: confirmed ? 'Kinumpirma ang resolution' : 'Ibinalik sa follow-up',
      description: confirmed
        ? `Maaari nang tuluyang isara ang case ni ${message.farmerName}.`
        : `Naibalik sa active follow-up ang concern ni ${message.farmerName}.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {isSimpleWorkspace ? 'Mga Dapat Unahin Ngayon' : 'Operations Center'}
          </h1>
          <HelpDialog
            title={isSimpleWorkspace ? 'Mga Dapat Unahin Ngayon' : 'Operations Center'}
            tooltipText={isSimpleWorkspace ? 'Tingnan ang mga dapat unahin ng barangay team ngayon.' : 'Tingnan ang mga agarang gawain ng barangay team.'}
          >
            <p>
              {isSimpleWorkspace
                ? 'Dito nakalista ang mga unang dapat buksan, sagutin, at balikan para sa mga magsasaka.'
                : 'Dito nakaayos ang mga pangunahing gawain para sa pang-araw-araw na farmer support, approvals, at follow-up work.'}
            </p>
            <p>
              {isSimpleWorkspace
                ? 'Basahin lang ang nasa itaas pababa. Kapag may hindi malinaw, buksan ang buong usapan.'
                : 'Mas simple ang page na ito at diretso na ang punta sa mga pinakaimportanteng susunod na hakbang.'}
            </p>
          </HelpDialog>
        </div>
        <p className="text-base text-muted-foreground">
          {isSimpleWorkspace
            ? 'Ito ang pinakamadaling listahan ng mga kailangan ninyong unahin ngayon.'
            : 'Mga dapat unahin ngayon para sa barangay agriculture team.'}
        </p>
      </div>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="p-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">{isSimpleWorkspace ? 'Unahin ang tatlong ito' : 'Gawin ang tatlong ito'}</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground sm:text-base">
              <span>1. {isSimpleWorkspace ? 'Basahin ang bagong mensahe at piliin kung sino ang sasagot.' : 'Basahin at i-assign ang mga bagong ulat.'}</span>
              <span>2. {isSimpleWorkspace ? 'Ayusin ang hindi naipadala at sagutin ang kulang pa.' : 'Sagutin o i-retry ang may problema.'}</span>
              <span>3. {isSimpleWorkspace ? 'Balikan ang mga naunang kaso at itala kung ano ang nangyari.' : 'Mag-follow up at isara ang natapos na case.'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TaskCard href="/dashboard/sms-feed" title={isSimpleWorkspace ? "Mga dapat sagutin agad" : "Urgent na SMS"} description={isSimpleWorkspace ? "Unahin ang mga ito ngayon." : "Mga dapat sagutin agad."} count={urgentQueue.length} icon={MessageSquareWarning} />
        <TaskCard href="/dashboard/farmers/approvals" title={isSimpleWorkspace ? "Mga kailangang irehistro" : "Need Registration"} description={isSimpleWorkspace ? "Mga sender na wala pang kumpletong tala." : "Mga sender na kailangan munang marehistro."} count={registrationQueue.length + pendingApprovals.length} icon={UserPlus2} />
        <TaskCard href="/dashboard/sms-feed" title={isSimpleWorkspace ? "Mga kailangang linawin" : "Need Clarification"} description={isSimpleWorkspace ? "Mga mensaheng kulang pa ang paliwanag." : "Mga mensaheng kulang ang detalye."} count={clarificationQueue.length} icon={ClipboardList} />
        <TaskCard href="/dashboard/sms-feed" title={isSimpleWorkspace ? "Mga hindi naipadala" : "Failed Sends"} description={isSimpleWorkspace ? "Subukang ipadala ulit ang mga ito." : "Mga SMS na kailangang i-retry."} count={failedSendQueue.length} icon={RefreshCcw} />
        <TaskCard href="/dashboard/follow-up" title={isSimpleWorkspace ? "Mga dapat balikan" : "Due Follow-up"} description={isSimpleWorkspace ? "Mga magsasakang kailangang kamustahin ulit." : "Mga dapat balikan sa magsasaka."} count={followUpQueue.length} icon={BellRing} />
        <TaskCard href="/dashboard/sms-feed" title="Aking Queue" description={isSimpleWorkspace ? "Mga naka-assign sa iyo." : "Mga task na naka-assign sa iyo."} count={myQueue.length} icon={CheckCircle2} />
        <TaskCard href="/dashboard/reports" title={isSimpleWorkspace ? "Mga dapat ipa-check sa lead" : "Supervisor Review"} description={isSimpleWorkspace ? "Mga kasong kailangan ng mas maingat na tingin." : "Mga case na may hidden risk o kulang na closeout."} count={supervisorReviewQueue.length} icon={ClipboardList} />
      </div>

      {isSimpleWorkspace ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-xl">Mahahalagang Resulta</CardTitle>
              <CardDescription>
                Simpleng buod ito ng pinakamahalagang bilang at napapansing pattern sa kasalukuyang data.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/reports">Buksan ang Buong Ulat</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <QuickResultCard
                label="Maayos na handa para sa ulat"
                value={String(reportingReadyCases)}
                detail="Ito ang mga kasong may sapat na detalye para masama sa mas maaasahang ulat."
              />
              <QuickResultCard
                label="Kumpirmadong okay na"
                value={String(farmerConfirmedResolutionCount)}
                detail="Ito ang mga kasong nagsabing maayos na ayon mismo sa magsasaka."
              />
              <QuickResultCard
                label="Mataas ang prayoridad"
                value={String(highRiskCount)}
                detail="Ito ang bilang ng mga kasong dapat unahin dahil mataas ang panganib o bigat ng concern."
              />
              <QuickResultCard
                label="Dapat ipa-check sa lead"
                value={String(supervisorReviewCases)}
                detail="Ito ang mga kasong may kulang, may conflict, o kailangang mas maingat na tingnan."
              />
              <QuickResultCard
                label="Pinakakaraniwang concern"
                value={topInquiry?.question ?? 'Wala pa'}
                detail={
                  topInquiry
                    ? `${topInquiry.count} ulat ang pinakamaraming pumasok sa concern na ito.`
                    : 'Kulang pa ang kasalukuyang records para makita ang pinakamadalas na concern.'
                }
              />
              <QuickResultCard
                label="Lugar na may pinakamaraming ulat"
                value={topHotspot?.zone ?? 'Wala pa'}
                detail={
                  topHotspot
                    ? `${topHotspot.issues} ulat ang naitala rito kaya puwede itong unahin sa pagtingin o pagbisita.`
                    : 'Kulang pa ang location-linked reports para makakita ng malinaw na hotspot.'
                }
              />
            </div>
            <div className="rounded-2xl border border-dashed bg-background/80 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Mabilis na basa</p>
              <p className="mt-2 leading-relaxed">
                {outbreakWatchSummary.risingClusters > 0
                  ? `May ${outbreakWatchSummary.risingClusters} tumataas na magkakaparehong ulat na dapat bantayan para hindi lumaki ang problema.`
                  : 'Wala pang malinaw na tumataas na pattern ng magkakaparehong ulat sa ngayon.'}
              </p>
              <p className="mt-2 leading-relaxed">
                Huling basehan ng buod na ito: {liveContextUpdatedAt.slice(0, 19).replace('T', ' ')} UTC
              </p>
              <p className="mt-2 leading-relaxed">
                Kung gusto mong makita ang buong charts at mas detalyadong paliwanag, pindutin ang <strong>Buksan ang Buong Ulat</strong>.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{isSimpleWorkspace ? 'Mga matagal nang walang galaw' : 'SLA at Aging Watch'}</CardTitle>
            <CardDescription>
              {isSimpleWorkspace
                ? 'Kapag nasa listahang ito ang kaso, matagal na itong hindi naaasikaso at dapat nang silipin.'
                : 'Mga case na matagal nang walang aksyon o lampas na sa inaasahang response window.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={overdueSlaCount > 0 ? 'destructive' : 'outline'}>
                {overdueSlaCount} {isSimpleWorkspace ? 'matagal nang walang galaw' : 'overdue SLA'}
              </Badge>
              <Badge variant="outline">{supervisorReviewQueue.length} {isSimpleWorkspace ? 'ipa-check sa lead' : 'supervisor review'}</Badge>
            </div>
            {smsMessages
              .filter((message) => getSlaAgingMeta(message).overdue)
              .slice(0, 4)
              .map((message) => (
                <div key={message.id} className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">{message.farmerName}</p>
                  <p className="mt-1 text-muted-foreground">{getNextBestAction(message)}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {isSimpleWorkspace ? 'Tagal nang walang galaw' : 'Age'}: {getSlaAgingMeta(message).ageHours.toFixed(1)}h
                  </p>
                </div>
              ))}
            {overdueSlaCount === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isSimpleWorkspace ? 'Wala pang kasong matagal nang nakatengga ngayon.' : 'Walang lampas sa SLA sa kasalukuyang queue.'}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{isSimpleWorkspace ? 'Sino ang puwedeng sumagot' : 'Workload Balance'}</CardTitle>
            <CardDescription>
              {isSimpleWorkspace
                ? 'Tinutulungan kayo nitong makita kung sino pa ang may puwedeng asikasuhin.'
                : 'Makikita rito kung sino ang mas may kapasidad humawak ng susunod na urgent cases.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workloadSummary.slice(0, 5).map(({ user, openCases }) => (
              <div key={user.id ?? user.email} className="rounded-xl border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-muted-foreground">{user.title ?? 'Barangay staff'}</p>
                  </div>
                  <Badge variant="outline">{openCases} {isSimpleWorkspace ? 'hawak na kaso' : 'open'}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Status: {user.availabilityStatus ?? 'available'}
                  {user.expertiseTags?.length ? ` • expertise: ${user.expertiseTags.join(', ')}` : ''}
                </p>
                {isSimpleWorkspace ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {user.expertiseTags?.length
                      ? `Sanay sa: ${user.expertiseTags.join(', ')}`
                      : 'Wala pang nakalagay na espesyalisasyon.'}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">1. Mga urgent at pending ngayon</CardTitle>
          <CardDescription>
            {isSimpleWorkspace
              ? 'Ito ang unang buksan. Piliin mo kung ikaw ang sasagot.'
              : 'Basahin muna ang mga ito. I-assign sa sarili kung ikaw ang sasagot.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {urgentQueue.length > 0 ? urgentQueue.slice(0, 6).map((message) => (
            <MessageTaskRow
              key={message.id}
              message={{
                ...message,
                possibleDuplicateOfCaseId: duplicateCaseByMessage.get(message.id)?.caseId,
                possibleDuplicateReason: duplicateCaseByMessage.get(message.id)
                  ? 'May kahawig na kamakailang concern mula sa parehong magsasaka o numero.'
                  : undefined,
              }}
              latestOutbound={latestOutboundByMessage.get(message.id)}
              onAssign={handleAssign}
              onRetry={handleRetry}
              onRecordOutcome={setOutcomeMessage}
              onConfirmResolution={handleConfirmResolution}
              exceptionFlags={exceptionFlagsByMessage.get(message.id)}
              assignmentSuggestion={assignmentSuggestions.get(message.id)}
              isSimpleLanguage={isSimpleWorkspace}
            />
          )) : <p className="text-sm text-muted-foreground">{isSimpleWorkspace ? 'Wala pang dapat sagutin agad sa ngayon.' : 'Walang urgent na pending SMS sa ngayon.'}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">2. Mga kailangang linawin o irehistro</CardTitle>
            <CardDescription>
              {isSimpleWorkspace
                ? 'Ayusin muna ito para hindi mali ang sagot sa magsasaka.'
                : 'Mahalaga ito para hindi mali ang maibigay na payo.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...registrationQueue, ...clarificationQueue].slice(0, 6).map((message) => (
              <MessageTaskRow
                key={message.id}
                message={{
                  ...message,
                  possibleDuplicateOfCaseId: duplicateCaseByMessage.get(message.id)?.caseId,
                  possibleDuplicateReason: duplicateCaseByMessage.get(message.id)
                    ? 'May kahawig na kamakailang concern mula sa parehong magsasaka o numero.'
                    : undefined,
                }}
                latestOutbound={latestOutboundByMessage.get(message.id)}
                onAssign={handleAssign}
                onRetry={handleRetry}
                onRecordOutcome={setOutcomeMessage}
                onConfirmResolution={handleConfirmResolution}
                exceptionFlags={exceptionFlagsByMessage.get(message.id)}
                assignmentSuggestion={assignmentSuggestions.get(message.id)}
                isSimpleLanguage={isSimpleWorkspace}
              />
            ))}
            {registrationQueue.length + clarificationQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isSimpleWorkspace ? 'Wala pang kulang sa rehistro o paliwanag sa ngayon.' : 'Walang registration o clarification queue sa ngayon.'}
              </p>
            ) : null}
            {pendingApprovals.length > 0 ? (
              <Link href="/dashboard/farmers/approvals" className="block">
                <div className="rounded-2xl border border-dashed p-4 transition-colors hover:bg-accent/30">
                  <p className="font-medium">
                    {pendingApprovals.length} {isSimpleWorkspace ? 'bagong magsasakang naghihintay' : 'pending farmer approval'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isSimpleWorkspace ? 'May mga bagong tala na kailangan munang aprubahan.' : 'May mga bagong farmer record na naghihintay ng pag-apruba.'}
                  </p>
                </div>
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">3. Mga kailangang balikan</CardTitle>
            <CardDescription>
              {isSimpleWorkspace
                ? 'Balikan ang hindi naipadala at ang mga kasong dapat kamustahin ulit.'
                : 'I-retry ang failed send at i-follow up ang mga naunang natulungan.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...failedSendQueue, ...followUpQueue].slice(0, 6).map((message) => (
              <MessageTaskRow
                key={`${message.id}-${latestOutboundByMessage.get(message.id)?.id ?? 'task'}`}
                message={{
                  ...message,
                  possibleDuplicateOfCaseId: duplicateCaseByMessage.get(message.id)?.caseId,
                  possibleDuplicateReason: duplicateCaseByMessage.get(message.id)
                    ? 'May kahawig na kamakailang concern mula sa parehong magsasaka o numero.'
                    : undefined,
                }}
                latestOutbound={latestOutboundByMessage.get(message.id)}
                onAssign={handleAssign}
                onRetry={handleRetry}
                onRecordOutcome={setOutcomeMessage}
                onConfirmResolution={handleConfirmResolution}
                exceptionFlags={exceptionFlagsByMessage.get(message.id)}
                assignmentSuggestion={assignmentSuggestions.get(message.id)}
                isSimpleLanguage={isSimpleWorkspace}
              />
            ))}
            {failedSendQueue.length + followUpQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {isSimpleWorkspace ? 'Wala pang kailangang ipadala ulit o balikan sa ngayon.' : 'Walang retry o follow-up queue sa ngayon.'}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card id="aking-queue">
        <CardHeader>
          <CardTitle className="text-xl">4. Aking mga naka-assign na task</CardTitle>
          <CardDescription>
            {isSimpleWorkspace ? 'Ito ang mga kasong ikaw mismo ang may hawak ngayon.' : 'Mga case na ikaw ang may hawak ngayon.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {myQueue.length > 0 ? myQueue.slice(0, 8).map((message) => (
            <MessageTaskRow
              key={message.id}
              message={{
                ...message,
                possibleDuplicateOfCaseId: duplicateCaseByMessage.get(message.id)?.caseId,
                possibleDuplicateReason: duplicateCaseByMessage.get(message.id)
                  ? 'May kahawig na kamakailang concern mula sa parehong magsasaka o numero.'
                  : undefined,
              }}
              latestOutbound={latestOutboundByMessage.get(message.id)}
              onAssign={handleAssign}
              onRetry={handleRetry}
              onRecordOutcome={setOutcomeMessage}
              onConfirmResolution={handleConfirmResolution}
              exceptionFlags={exceptionFlagsByMessage.get(message.id)}
              assignmentSuggestion={assignmentSuggestions.get(message.id)}
              isSimpleLanguage={isSimpleWorkspace}
            />
          )) : (
            <p className="text-sm text-muted-foreground">
              {isSimpleWorkspace
                ? 'Wala pang nakatalaga sa iyo. Puwede kang pumili mula sa mga nasa itaas.'
                : 'Wala pang task na naka-assign sa iyo. Puwede kang mag-assign mula sa mga urgent at pending na ulat sa itaas.'}
            </p>
          )}
        </CardContent>
      </Card>

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
            ? `${isSimpleWorkspace ? 'Na-log na tulong' : 'Assistance'}: ${outcomeReadiness.assistanceCount}, ${isSimpleWorkspace ? 'natapos na field visit' : 'completed field visits'}: ${outcomeReadiness.completedVisitCount}`
            : undefined
        }
        onSubmit={handleSaveOutcome}
      />
    </div>
  );
}


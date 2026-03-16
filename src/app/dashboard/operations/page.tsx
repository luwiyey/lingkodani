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
import { useToast } from '@/hooks/use-toast';

const actionButtonClassName = 'h-auto min-h-12 w-full whitespace-normal break-words px-4 py-3 text-center leading-snug';

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

function MessageTaskRow({
  message,
  latestOutbound,
  onAssign,
  onRetry,
  onClose,
}: {
  message: SmsMessage;
  latestOutbound?: OutboundMessage;
  onAssign: (message: SmsMessage) => void;
  onRetry: (message: SmsMessage) => void;
  onClose: (message: SmsMessage) => void;
}) {
  const router = useRouter();

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
            {message.assignedTo ? <Badge variant="outline">Owner: {message.assignedTo}</Badge> : null}
            {message.registrationRequired ? <Badge variant="outline">Need registration</Badge> : null}
            {message.clarificationNeeded ? <Badge variant="outline">Need clarification</Badge> : null}
            {latestOutbound?.status === 'failed' ? <Badge variant="destructive">Send failed</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">{message.phone}</p>
          <p className="break-words text-sm leading-relaxed">{message.message}</p>
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
              Retry send
            </Button>
          ) : null}

          {message.respondedAt && !message.closedAt ? (
            <Button
              variant="outline"
              className={actionButtonClassName}
              onClick={(event) => {
                event.stopPropagation();
                onClose(message);
              }}
            >
              Isara ang case
            </Button>
          ) : null}

          <Button
            variant="secondary"
            className={actionButtonClassName}
            onClick={(event) => {
              event.stopPropagation();
              router.push(`/dashboard/sms-feed?sms=${encodeURIComponent(message.id)}`);
            }}
          >
            Buksan sa SMS Feed
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OperationsPage() {
  const { currentUserProfile } = useAuth();
  const { smsMessages, outboundMessages, assignSmsMessage, closeSmsCase, retryOutboundMessage, farmers } = useData();
  const { toast } = useToast();
  const activeOperatorName = currentUserProfile?.name?.trim() || 'Brgy. Admin';

  const latestOutboundByMessage = React.useMemo(() => {
    const map = new Map<string, OutboundMessage>();
    for (const record of outboundMessages) {
      if (!map.has(record.smsMessageId)) {
        map.set(record.smsMessageId, record);
      }
    }
    return map;
  }, [outboundMessages]);

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
    () => smsMessages.filter((message) => !message.closedAt && !message.assignedTo && !!message.followUpDueAt && !message.followUpSentAt),
    [smsMessages]
  );
  const failedSendQueue = React.useMemo(
    () => smsMessages.filter((message) => !message.closedAt && !message.assignedTo && latestOutboundByMessage.get(message.id)?.status === 'failed'),
    [latestOutboundByMessage, smsMessages]
  );
  const myQueue = React.useMemo(
    () => smsMessages.filter((message) => !message.closedAt && message.assignedTo === activeOperatorName),
    [activeOperatorName, smsMessages]
  );
  const pendingApprovals = React.useMemo(
    () => farmers.filter((farmer) => farmer.status === 'pending_approval'),
    [farmers]
  );

  const handleAssign = (message: SmsMessage) => {
    assignSmsMessage(message.id, activeOperatorName);
    toast({
      title: 'Na-assign ang task',
      description: `Itinalaga na kay ${activeOperatorName} ang mensahe ni ${message.farmerName}. Nasa "Aking Queue" na ito ngayon.`,
    });
  };

  const handleClose = (message: SmsMessage) => {
    closeSmsCase(message.id, 'Tinapos mula sa Operations Center');
    toast({
      title: 'Case closed',
      description: `Isinara na ang case ni ${message.farmerName}.`,
    });
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

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Operations Center</h1>
          <HelpDialog title="Operations Center" tooltipText="Tingnan ang mga agarang gawain ng barangay team.">
            <p>Dito nakaayos ang mga pangunahing gawain para sa pang-araw-araw na farmer support, approvals, at follow-up work.</p>
            <p>Mas simple ang page na ito at diretso na ang punta sa mga pinakaimportanteng susunod na hakbang.</p>
          </HelpDialog>
        </div>
        <p className="text-base text-muted-foreground">
          Mga dapat unahin ngayon para sa barangay agriculture team.
        </p>
      </div>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="p-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold">Gawin ang tatlong ito</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground sm:text-base">
              <span>1. Basahin at i-assign ang mga bagong ulat.</span>
              <span>2. Sagutin o i-retry ang may problema.</span>
              <span>3. Mag-follow up at isara ang natapos na case.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <TaskCard href="/dashboard/sms-feed" title="Urgent na SMS" description="Mga dapat sagutin agad." count={urgentQueue.length} icon={MessageSquareWarning} />
        <TaskCard href="/dashboard/farmers/approvals" title="Need Registration" description="Mga sender na kailangan munang marehistro." count={registrationQueue.length + pendingApprovals.length} icon={UserPlus2} />
        <TaskCard href="/dashboard/sms-feed" title="Need Clarification" description="Mga mensaheng kulang ang detalye." count={clarificationQueue.length} icon={ClipboardList} />
        <TaskCard href="/dashboard/sms-feed" title="Failed Sends" description="Mga SMS na kailangang i-retry." count={failedSendQueue.length} icon={RefreshCcw} />
        <TaskCard href="/dashboard/follow-up" title="Due Follow-up" description="Mga dapat balikan sa magsasaka." count={followUpQueue.length} icon={BellRing} />
        <TaskCard href="/dashboard/sms-feed" title="Aking Queue" description="Mga task na naka-assign sa iyo." count={myQueue.length} icon={CheckCircle2} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">1. Mga urgent at pending ngayon</CardTitle>
          <CardDescription>Basahin muna ang mga ito. I-assign sa sarili kung ikaw ang sasagot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {urgentQueue.length > 0 ? urgentQueue.slice(0, 6).map((message) => (
            <MessageTaskRow
              key={message.id}
              message={message}
              latestOutbound={latestOutboundByMessage.get(message.id)}
              onAssign={handleAssign}
              onRetry={handleRetry}
              onClose={handleClose}
            />
          )) : <p className="text-sm text-muted-foreground">Walang urgent na pending SMS sa ngayon.</p>}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">2. Mga kailangang linawin o irehistro</CardTitle>
            <CardDescription>Mahalaga ito para hindi mali ang maibigay na payo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...registrationQueue, ...clarificationQueue].slice(0, 6).map((message) => (
              <MessageTaskRow
                key={message.id}
                message={message}
                latestOutbound={latestOutboundByMessage.get(message.id)}
                onAssign={handleAssign}
                onRetry={handleRetry}
                onClose={handleClose}
              />
            ))}
            {registrationQueue.length + clarificationQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">Walang registration o clarification queue sa ngayon.</p>
            ) : null}
            {pendingApprovals.length > 0 ? (
              <Link href="/dashboard/farmers/approvals" className="block">
                <div className="rounded-2xl border border-dashed p-4 transition-colors hover:bg-accent/30">
                  <p className="font-medium">{pendingApprovals.length} pending farmer approval</p>
                  <p className="mt-1 text-sm text-muted-foreground">May mga bagong farmer record na naghihintay ng pag-apruba.</p>
                </div>
              </Link>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">3. Mga kailangang balikan</CardTitle>
            <CardDescription>I-retry ang failed send at i-follow up ang mga naunang natulungan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...failedSendQueue, ...followUpQueue].slice(0, 6).map((message) => (
              <MessageTaskRow
                key={`${message.id}-${latestOutboundByMessage.get(message.id)?.id ?? 'task'}`}
                message={message}
                latestOutbound={latestOutboundByMessage.get(message.id)}
                onAssign={handleAssign}
                onRetry={handleRetry}
                onClose={handleClose}
              />
            ))}
            {failedSendQueue.length + followUpQueue.length === 0 ? (
              <p className="text-sm text-muted-foreground">Walang retry o follow-up queue sa ngayon.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">4. Aking mga naka-assign na task</CardTitle>
          <CardDescription>Mga case na ikaw ang may hawak ngayon.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {myQueue.length > 0 ? myQueue.slice(0, 8).map((message) => (
            <MessageTaskRow
              key={message.id}
              message={message}
              latestOutbound={latestOutboundByMessage.get(message.id)}
              onAssign={handleAssign}
              onRetry={handleRetry}
              onClose={handleClose}
            />
          )) : (
            <p className="text-sm text-muted-foreground">Wala pang task na naka-assign sa iyo. Puwede kang mag-assign mula sa mga urgent at pending na ulat sa itaas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

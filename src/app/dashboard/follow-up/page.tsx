'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpDialog } from '@/components/ui/help-dialog';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-context';
import type { FarmerAssistanceRecord, FieldVisitTask, SmsMessage } from '@/lib/types';

const actionButtonClassName = 'h-auto min-h-12 w-full whitespace-normal break-words px-4 py-3 text-center leading-snug';

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Hindi tukoy';
  }

  return date.toLocaleString();
}

function isOverdue(value: string) {
  const timestamp = new Date(value).getTime();
  return !Number.isNaN(timestamp) && timestamp < Date.now();
}

function getStatusVariant(status: string) {
  if (status === 'completed') return 'secondary' as const;
  if (status === 'in_progress') return 'default' as const;
  if (status === 'planned' || status === 'scheduled') return 'outline' as const;
  return 'destructive' as const;
}

function AssistanceCard({
  record,
  farmerName,
  highlighted,
  onAdvance,
}: {
  record: FarmerAssistanceRecord;
  farmerName: string;
  highlighted: boolean;
  onAdvance: (record: FarmerAssistanceRecord) => void;
}) {
  return (
    <div id={`assistance-${record.id}`} className={`rounded-2xl border p-4 shadow-sm ${highlighted ? 'border-primary bg-primary/5' : 'bg-background'}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="break-words font-semibold">{record.title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{record.type}</Badge>
            <Badge variant={getStatusVariant(record.status)}>{record.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{farmerName}</p>
          <p className="break-words text-sm">{record.details}</p>
          {record.quantity ? <p className="text-sm text-muted-foreground">Dami: {record.quantity}</p> : null}
          {record.nextAction ? <p className="text-sm text-muted-foreground">Next action: {record.nextAction}</p> : null}
        </div>
        <div className="flex w-full flex-col gap-2 lg:max-w-[220px] lg:shrink-0">
          {record.status !== 'completed' ? (
            <Button onClick={() => onAdvance(record)} className={actionButtonClassName}>
              {record.status === 'planned' ? 'Simulan ang tulong' : 'Markahang tapos'}
            </Button>
          ) : null}
          <Button variant="outline" asChild className={actionButtonClassName}>
            <Link href={`/dashboard/farmers/${record.farmerId}`}>Buksan ang profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function VisitCard({
  task,
  farmerName,
  highlighted,
  onAdvance,
}: {
  task: FieldVisitTask;
  farmerName: string;
  highlighted: boolean;
  onAdvance: (task: FieldVisitTask) => void;
}) {
  const overdue = task.status !== 'completed' && task.status !== 'cancelled' && isOverdue(task.scheduledFor);

  return (
    <div id={`visit-${task.id}`} className={`rounded-2xl border p-4 shadow-sm ${highlighted ? 'border-primary bg-primary/5' : 'bg-background'}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="break-words font-semibold">{task.title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{task.priority} priority</Badge>
            <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
            {overdue ? <Badge variant="destructive">Overdue</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">{farmerName}</p>
          <p className="break-words text-sm">{task.purpose}</p>
          <p className="text-sm text-muted-foreground">Schedule: {formatDateTime(task.scheduledFor)}</p>
          <p className="text-sm text-muted-foreground">Assigned to: {task.assignedTo}</p>
        </div>
        <div className="flex w-full flex-col gap-2 lg:max-w-[220px] lg:shrink-0">
          {task.status !== 'completed' && task.status !== 'cancelled' ? (
            <Button onClick={() => onAdvance(task)} className={actionButtonClassName}>
              {task.status === 'scheduled' ? 'Simulan ang visit' : 'Markahang tapos'}
            </Button>
          ) : null}
          <Button variant="outline" asChild className={actionButtonClassName}>
            <Link href={`/dashboard/farmers/${task.farmerId}`}>Buksan ang profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function SmsFollowUpCard({ message }: { message: SmsMessage }) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="break-words font-semibold">{message.farmerName}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{message.parsedIntent}</Badge>
            {message.followUpDueAt && isOverdue(message.followUpDueAt) ? <Badge variant="destructive">Overdue</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">{message.phone}</p>
          <p className="break-words text-sm">{message.message}</p>
          <p className="text-sm text-muted-foreground">Due: {formatDateTime(message.followUpDueAt as string)}</p>
        </div>
        <div className="flex w-full flex-col gap-2 lg:max-w-[220px] lg:shrink-0">
          <Button variant="outline" asChild className={actionButtonClassName}>
            <Link href={`/dashboard/sms-feed?sms=${encodeURIComponent(message.id)}`}>Buksan sa SMS Feed</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function FollowUpPageContent() {
  const searchParams = useSearchParams();
  const highlightedVisitId = searchParams.get('visit');
  const highlightedAssistanceId = searchParams.get('assistance');
  const { toast } = useToast();
  const {
    farmers,
    smsMessages,
    assistanceRecords,
    updateAssistanceRecordStatus,
    fieldVisitTasks,
    updateFieldVisitTaskStatus,
  } = useData();

  useEffect(() => {
    const targetId = highlightedVisitId
      ? `visit-${highlightedVisitId}`
      : highlightedAssistanceId
        ? `assistance-${highlightedAssistanceId}`
        : null;

    if (!targetId) {
      return;
    }

    document.getElementById(targetId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [highlightedAssistanceId, highlightedVisitId]);

  const farmerNameById = useMemo(() => (
    new Map(farmers.map((farmer) => [farmer.id, farmer.name]))
  ), [farmers]);

  const visitQueue = useMemo(() => (
    [...fieldVisitTasks]
      .filter((task) => task.status !== 'completed' && task.status !== 'cancelled')
      .sort((left, right) => new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime())
  ), [fieldVisitTasks]);

  const assistanceQueue = useMemo(() => (
    [...assistanceRecords]
      .filter((record) => record.status !== 'completed')
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  ), [assistanceRecords]);

  const smsFollowUpQueue = useMemo(() => (
    [...smsMessages]
      .filter((message) => !message.closedAt && !!message.followUpDueAt && !message.followUpSentAt)
      .sort((left, right) => new Date(left.followUpDueAt as string).getTime() - new Date(right.followUpDueAt as string).getTime())
  ), [smsMessages]);

  const overdueCount = visitQueue.filter((task) => isOverdue(task.scheduledFor)).length
    + assistanceQueue.filter((record) => record.status === 'in_progress').length
    + smsFollowUpQueue.filter((message) => isOverdue(message.followUpDueAt as string)).length;

  const handleAdvanceAssistance = (record: FarmerAssistanceRecord) => {
    const nextStatus = record.status === 'planned' ? 'in_progress' : 'completed';
    updateAssistanceRecordStatus(record.id, nextStatus);
    toast({
      title: 'Na-update ang tulong',
      description: `${record.title} ay naka-${nextStatus}.`,
    });
  };

  const handleAdvanceVisit = (task: FieldVisitTask) => {
    const nextStatus = task.status === 'scheduled' ? 'in_progress' : 'completed';
    updateFieldVisitTaskStatus(task.id, nextStatus);
    toast({
      title: 'Na-update ang field visit',
      description: `${task.title} ay naka-${nextStatus}.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold tracking-tight">Follow-up Queue</h1>
          <HelpDialog title="Follow-up Queue" tooltipText="Isang workboard para sa visits, assistance, at SMS follow-ups.">
            <p>Dito makikita ang buong intervention loop ng barangay: sino ang bibisitahin, sino ang may nakabinbing tulong, at aling SMS cases ang kailangan pang balikan.</p>
            <p>Mas madali nitong maipakita sa demo na hindi natatapos sa pagtanggap ng report ang system.</p>
          </HelpDialog>
        </div>
        <p className="text-muted-foreground">Pinag-isang queue para sa field visits, assistance release, at SMS follow-ups ng mga magsasaka.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Field Visits</CardTitle>
            <CardDescription>Mga nakaiskedyul o ongoing na pagbisita.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{visitQueue.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Open Assistance</CardTitle>
            <CardDescription>Mga tulong na hindi pa tapos o hindi pa nare-release.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{assistanceQueue.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">SMS Follow-ups</CardTitle>
            <CardDescription>Mga message case na may due follow-up.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{smsFollowUpQueue.length}</p>
          </CardContent>
        </Card>
        <Card className={overdueCount > 0 ? 'border-destructive/40' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Overdue Items</CardTitle>
            <CardDescription>Mga kailangang aksyunan agad.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overdueCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mga Nakaiskedyul na Pagbisita</CardTitle>
            <CardDescription>Field validation, onsite advice, at delivery coordination.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {visitQueue.length > 0 ? visitQueue.map((task) => (
              <VisitCard
                key={task.id}
                task={task}
                farmerName={farmerNameById.get(task.farmerId) ?? task.farmerId}
                highlighted={highlightedVisitId === task.id}
                onAdvance={handleAdvanceVisit}
              />
            )) : (
              <p className="text-sm text-muted-foreground">Wala pang nakaiskedyul na field visits.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mga Tulong na Kailangang Subaybayan</CardTitle>
            <CardDescription>Release status, technical support, at barangay intervention tracking.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assistanceQueue.length > 0 ? assistanceQueue.map((record) => (
              <AssistanceCard
                key={record.id}
                record={record}
                farmerName={farmerNameById.get(record.farmerId) ?? record.farmerId}
                highlighted={highlightedAssistanceId === record.id}
                onAdvance={handleAdvanceAssistance}
              />
            )) : (
              <p className="text-sm text-muted-foreground">Wala pang assistance records na kailangang balikan.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SMS Follow-up Queue</CardTitle>
          <CardDescription>Mga naunang nasagot na case na may nakatakdang follow-up message.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {smsFollowUpQueue.length > 0 ? smsFollowUpQueue.map((message) => (
            <SmsFollowUpCard key={message.id} message={message} />
          )) : (
            <p className="text-sm text-muted-foreground">Walang due SMS follow-up sa ngayon.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function FollowUpPage() {
  return (
    <Suspense fallback={<div className="flex flex-col gap-6" />}>
      <FollowUpPageContent />
    </Suspense>
  );
}

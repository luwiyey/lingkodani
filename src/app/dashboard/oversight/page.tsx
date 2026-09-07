'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPinned,
  MessageSquareText,
  PackageSearch,
  Radio,
  Sprout,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpDialog } from '@/components/ui/help-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { isLiveMode } from '@/lib/config/app-mode';
import { isDemoRuntimeActive } from '@/lib/runtime-mode';
import { countStaleMarketPrices } from '@/lib/services/price-watch-service';
import type { SmsIntent, SmsMessage } from '@/lib/types';

const CONCERN_LABELS: Partial<Record<SmsIntent, string>> = {
  PEST_DISEASE: 'Peste o sakit sa pananim',
  WEATHER_HELP: 'Panahon o sakuna',
  PRICE_CHECK: 'Presyo sa merkado',
  REQUEST: 'Binhi, pataba, kagamitan, o tulong',
  CROP_UPDATE: 'Kalagayan ng pananim',
  HARVEST: 'Ani o anihan',
  EMERGENCY: 'Agarang sakuna o panganib',
  REGISTER: 'Pagpaparehistro',
  UNKNOWN: 'Iba pang concern',
};

function toDateInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function startOfDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function endOfDate(value: string) {
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinRange(timestamp: string | undefined, from: Date, to: Date) {
  if (!timestamp) return false;
  const value = new Date(timestamp).getTime();
  return !Number.isNaN(value) && value >= from.getTime() && value <= to.getTime();
}

function isOpenCase(message: SmsMessage) {
  return !message.closedAt && message.caseStatus !== 'closed';
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('fil-PH').format(value);
}

function formatMinutes(value: number) {
  if (value <= 0) return 'Wala pang sukatan';
  if (value < 60) return `${Math.round(value)} minuto`;
  const hours = value / 60;
  return `${hours < 10 ? hours.toFixed(1) : Math.round(hours)} oras`;
}

function MetricCard({
  title,
  value,
  explanation,
  icon: Icon,
  tone = 'normal',
}: {
  title: string;
  value: string;
  explanation: string;
  icon: typeof Users;
  tone?: 'normal' | 'warning' | 'good';
}) {
  const toneClass =
    tone === 'warning'
      ? 'border-amber-300 bg-amber-50/70'
      : tone === 'good'
        ? 'border-emerald-200 bg-emerald-50/60'
        : 'bg-card';

  return (
    <Card className={toneClass}>
      <CardContent className="flex min-h-36 items-start gap-4 p-5 sm:p-6">
        <div className="rounded-xl border bg-background p-3 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          <p className="text-sm leading-6 text-muted-foreground">{explanation}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OversightPage() {
  const { currentUser, currentUserProfile } = useAuth();
  const {
    farmers,
    smsMessages,
    resources,
    marketPrices,
    assistanceRecords,
    fieldVisitTasks,
    outboundMessages,
    liveDataReady,
  } = useData();
  const usingDemoSandbox = isDemoRuntimeActive({ currentUser, currentUserProfile });
  const [initialRange] = useState(() => {
    const recordDates = [
      ...smsMessages.map((message) => new Date(message.timestamp).getTime()),
      ...farmers.map((farmer) => new Date(farmer.lastSmsActivity || farmer.registrationDate).getTime()),
    ].filter((value) => !Number.isNaN(value));
    const end = usingDemoSandbox && recordDates.length > 0
      ? new Date(Math.max(...recordDates))
      : new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 29);
    return { from: toDateInputValue(start), to: toDateInputValue(end) };
  });
  const [fromDate, setFromDate] = useState(initialRange.from);
  const [toDate, setToDate] = useState(initialRange.to);

  const analytics = useMemo(() => {
    const now = new Date();
    const fallbackFrom = new Date(now);
    fallbackFrom.setDate(fallbackFrom.getDate() - 29);
    const from = startOfDate(fromDate) ?? fallbackFrom;
    const to = endOfDate(toDate) ?? now;
    const filteredMessages = smsMessages.filter((message) => isWithinRange(message.timestamp, from, to));
    const filteredRegistrations = farmers.filter((farmer) => isWithinRange(farmer.registrationDate, from, to));
    const openCases = filteredMessages.filter(isOpenCase);
    const urgentCases = openCases.filter((message) => message.urgency === 'high');
    const resolvedCases = filteredMessages.filter((message) => !isOpenCase(message));
    const dueFollowUps = openCases.filter((message) => {
      if (!message.followUpDueAt || message.followUpStopReason) return false;
      return new Date(message.followUpDueAt).getTime() <= now.getTime();
    });
    const responseDurations = filteredMessages
      .filter((message) => message.respondedAt)
      .map((message) => (
        new Date(message.respondedAt as string).getTime() - new Date(message.timestamp).getTime()
      ) / 60_000)
      .filter((duration) => duration >= 0);
    const averageResponseMinutes = responseDurations.length > 0
      ? responseDurations.reduce((total, duration) => total + duration, 0) / responseDurations.length
      : 0;
    const activeFarmers = farmers.filter((farmer) => farmer.status === 'active');
    const farmersById = new Map(farmers.map((farmer) => [farmer.id, farmer]));
    const zones = new Map<string, {
      farmerIds: Set<string>;
      open: number;
      urgent: number;
      resolved: number;
    }>();

    for (const farmer of activeFarmers) {
      const zone = farmer.sitio?.trim() || 'Hindi nakatala';
      const current = zones.get(zone) ?? { farmerIds: new Set<string>(), open: 0, urgent: 0, resolved: 0 };
      current.farmerIds.add(farmer.id);
      zones.set(zone, current);
    }

    for (const message of filteredMessages) {
      const zone = farmersById.get(message.farmerId)?.sitio?.trim() || 'Hindi nakatala';
      const current = zones.get(zone) ?? { farmerIds: new Set<string>(), open: 0, urgent: 0, resolved: 0 };
      if (isOpenCase(message)) {
        current.open += 1;
        if (message.urgency === 'high') current.urgent += 1;
      } else {
        current.resolved += 1;
      }
      zones.set(zone, current);
    }

    const zoneRows = [...zones.entries()]
      .map(([name, counts]) => ({
        name,
        farmerCount: counts.farmerIds.size,
        open: counts.open,
        urgent: counts.urgent,
        resolved: counts.resolved,
      }))
      .sort((left, right) => right.urgent - left.urgent || right.open - left.open || left.name.localeCompare(right.name));

    const concernCounts = new Map<string, number>();
    for (const message of filteredMessages) {
      const label = CONCERN_LABELS[message.parsedIntent] ?? 'Iba pang concern';
      concernCounts.set(label, (concernCounts.get(label) ?? 0) + 1);
    }
    const topConcerns = [...concernCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }));
    const highestConcernCount = topConcerns[0]?.count ?? 1;

    const genderCounts = new Map<string, number>();
    const cropCounts = new Map<string, number>();
    for (const farmer of activeFarmers) {
      const gender = farmer.gender?.trim() || 'Hindi nakatala';
      genderCounts.set(gender, (genderCounts.get(gender) ?? 0) + 1);
      for (const crop of farmer.crops) {
        cropCounts.set(crop, (cropCounts.get(crop) ?? 0) + 1);
      }
    }
    const topCrops = [...cropCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5);
    const genderRows = [...genderCounts.entries()].sort((left, right) => right[1] - left[1]);
    const lowStock = resources.filter((resource) => resource.stock <= 10);
    const failedOutbound = outboundMessages.filter((message) => message.status === 'failed');
    const activeAssistance = assistanceRecords.filter((record) => record.status !== 'completed');
    const pendingVisits = fieldVisitTasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled');
    const latestTimestamp = [
      ...smsMessages.map((message) => message.timestamp),
      ...farmers.map((farmer) => farmer.lastSmsActivity || farmer.registrationDate),
    ]
      .map((value) => new Date(value).getTime())
      .filter((value) => !Number.isNaN(value))
      .sort((left, right) => right - left)[0];

    return {
      filteredMessages,
      filteredRegistrations,
      openCases,
      urgentCases,
      resolvedCases,
      dueFollowUps,
      averageResponseMinutes,
      activeFarmers,
      zoneRows,
      topConcerns,
      highestConcernCount,
      topCrops,
      genderRows,
      lowStock,
      failedOutbound,
      activeAssistance,
      pendingVisits,
      stalePriceCount: countStaleMarketPrices(marketPrices, now),
      latestTimestamp,
    };
  }, [
    assistanceRecords,
    farmers,
    fieldVisitTasks,
    fromDate,
    marketPrices,
    outboundMessages,
    resources,
    smsMessages,
    toDate,
  ]);

  const applyPreset = (days: number) => {
    const end = usingDemoSandbox && analytics.latestTimestamp
      ? new Date(analytics.latestTimestamp)
      : new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    setFromDate(toDateInputValue(start));
    setToDate(toDateInputValue(end));
  };

  const actionItems = [
    {
      label: 'Mataas na prayoridad na concern',
      count: analytics.urgentCases.length,
      advice: 'Buksan ang Operations Center at italaga agad sa available na staff o AEW.',
      href: '/dashboard/operations',
    },
    {
      label: 'Follow-up na dapat nang gawin',
      count: analytics.dueFollowUps.length,
      advice: 'Tawagan o i-text ang magsasaka upang malaman kung bumuti o lumala ang sitwasyon.',
      href: '/dashboard/follow-up',
    },
    {
      label: 'Rekursong 10 yunit o mas mababa',
      count: analytics.lowStock.length,
      advice: 'Suriin ang imbentaryo bago mangako ng tulong o voucher.',
      href: '/dashboard/inventory',
    },
    {
      label: 'Hindi naipadalang mensahe',
      count: analytics.failedOutbound.length,
      advice: 'Suriin ang signal at SMS gateway, pagkatapos ay subukang ipadala muli.',
      href: '/dashboard/sms-feed',
    },
    {
      label: 'Presyong kailangang i-update',
      count: analytics.stalePriceCount,
      advice: 'Kumpirmahin ang kasalukuyang presyo sa lokal na merkado.',
      href: '/dashboard/price-watch',
    },
  ].sort((left, right) => right.count - left.count);

  const resolvedRate = analytics.filteredMessages.length > 0
    ? Math.round((analytics.resolvedCases.length / analytics.filteredMessages.length) * 100)
    : 0;

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
      <header className="space-y-2 border-b pb-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
          <MapPinned className="h-7 w-7 text-primary" aria-hidden="true" />
          <h1 className="min-w-0 text-2xl font-bold tracking-tight sm:text-3xl">Pagsusuri ng Agrikultura sa Barangay</h1>
          <HelpDialog title="Paano basahin ang analytics" tooltipText="Maikling gabay sa mga bilang at rekomendasyon.">
            <p>Ang bawat bilang ay galing sa kasalukuyang farmer, SMS, tulong, field visit, imbentaryo, at price watch records ng Lingkod-Ani.</p>
            <p>Piliin muna ang petsa. Basahin ang “Dapat tutukan ngayon” bago tingnan ang mas detalyadong breakdown ng zone at concern.</p>
            <p>Ang analytics ay gabay sa pagpapasya. Kailangan pa ring beripikahin ng barangay staff o AEW ang aktwal na sitwasyon sa magsasaka.</p>
          </HelpDialog>
        </div>
        <p className="max-w-4xl text-base leading-7 text-muted-foreground">
          Madaling basahing buod para sa barangay officials: ano ang nangyayari, saang lugar kailangan ng pansin, at ano ang susunod na dapat gawin.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={!usingDemoSandbox && isLiveMode && liveDataReady ? 'default' : 'secondary'} className="gap-1.5">
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            {usingDemoSandbox
              ? 'Demo data'
              : isLiveMode
                ? (liveDataReady ? 'Live data' : 'Inihahanda ang live data')
                : 'Demo data'}
          </Badge>
          <span className="text-muted-foreground">
            Huling aktibidad:{' '}
            {analytics.latestTimestamp
              ? new Date(analytics.latestTimestamp).toLocaleString('fil-PH', { dateStyle: 'medium', timeStyle: 'short' })
              : 'Wala pang nakatalang aktibidad'}
          </span>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            Saklaw ng petsa
          </CardTitle>
          <CardDescription>Parehong petsa ang ginagamit sa lahat ng bilang, zone, concern, at rekomendasyon sa pahinang ito.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div className="space-y-2">
            <Label htmlFor="analytics-from">Mula</Label>
            <Input id="analytics-from" type="date" value={fromDate} max={toDate} onChange={(event) => setFromDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="analytics-to">Hanggang</Label>
            <Input id="analytics-to" type="date" value={toDate} min={fromDate} onChange={(event) => setToDate(event.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => applyPreset(1)}>Ngayong araw</Button>
            <Button variant="outline" onClick={() => applyPreset(7)}>7 araw</Button>
            <Button variant="outline" onClick={() => applyPreset(30)}>30 araw</Button>
            <Button variant="outline" onClick={() => applyPreset(365)}>1 taon</Button>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="barangay-summary-heading" className="space-y-3">
        <div>
          <h2 id="barangay-summary-heading" className="text-xl font-bold">Mabilis na buod</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Mga pangunahing bilang para sa napiling petsa.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Aktibong magsasaka" value={formatNumber(analytics.activeFarmers.length)} explanation="Aprubadong farmer profiles sa kasalukuyang database." icon={Users} />
          <MetricCard title="Bagong ulat sa SMS" value={formatNumber(analytics.filteredMessages.length)} explanation="Lahat ng concern na natanggap sa napiling petsa." icon={MessageSquareText} />
          <MetricCard title="Bukas na concern" value={formatNumber(analytics.openCases.length)} explanation="Mga kasong kailangan pa ng aksyon, sagot, o follow-up." icon={Clock3} tone={analytics.openCases.length > 0 ? 'warning' : 'good'} />
          <MetricCard title="Nalutas na concern" value={`${resolvedRate}%`} explanation={`${formatNumber(analytics.resolvedCases.length)} sa ${formatNumber(analytics.filteredMessages.length)} concern ang sarado na.`} icon={CheckCircle2} tone="good" />
          <MetricCard title="Mataas na prayoridad" value={formatNumber(analytics.urgentCases.length)} explanation="Bukas na concern na dapat unahin at beripikahin." icon={AlertTriangle} tone={analytics.urgentCases.length > 0 ? 'warning' : 'good'} />
          <MetricCard title="Karaniwang oras ng tugon" value={formatMinutes(analytics.averageResponseMinutes)} explanation="Oras mula pagtanggap ng SMS hanggang sa naitalang tugon." icon={Clock3} />
          <MetricCard title="Bagong rehistrasyon" value={formatNumber(analytics.filteredRegistrations.length)} explanation="Farmer profiles na naitala sa napiling petsa." icon={Sprout} />
          <MetricCard title="Tulong na kasalukuyang inaasikaso" value={formatNumber(analytics.activeAssistance.length)} explanation={`${analytics.pendingVisits.length} field visit ang naka-iskedyul o hindi pa tapos.`} icon={PackageSearch} />
        </div>
      </section>

      <section aria-labelledby="action-heading" className="space-y-3">
        <div>
          <h2 id="action-heading" className="text-xl font-bold">Dapat tutukan ngayon</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Nakaayos ayon sa dami ng kailangang aksyon. Pindutin ang “Buksan” para makita ang kaugnay na records.</p>
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="divide-y">
              {actionItems.map((item) => (
                <div key={item.label} className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
                  <div className="flex items-start gap-4">
                    <span className={`inline-flex min-w-12 justify-center rounded-lg px-3 py-2 text-lg font-bold ${item.count > 0 ? 'bg-amber-100 text-amber-950' : 'bg-emerald-100 text-emerald-900'}`}>
                      {item.count}
                    </span>
                    <div>
                      <h3 className="font-semibold">{item.label}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.advice}</p>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={item.href}>Buksan ang records</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section aria-labelledby="zone-heading" className="space-y-3">
          <div>
            <h2 id="zone-heading" className="text-xl font-bold">Kalagayan bawat sitio o zone</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Unang nakalista ang lugar na may mataas na prayoridad o maraming bukas na concern.</p>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sitio o zone</TableHead>
                    <TableHead className="text-center">Magsasaka</TableHead>
                    <TableHead className="text-center">Bukas</TableHead>
                    <TableHead className="text-center">Mataas</TableHead>
                    <TableHead>Kalagayan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.zoneRows.length > 0 ? analytics.zoneRows.map((zone) => (
                    <TableRow key={zone.name}>
                      <TableCell className="font-semibold">{zone.name}</TableCell>
                      <TableCell className="text-center">{zone.farmerCount}</TableCell>
                      <TableCell className="text-center">{zone.open}</TableCell>
                      <TableCell className="text-center">{zone.urgent}</TableCell>
                      <TableCell>
                        <Badge variant={zone.urgent > 0 ? 'destructive' : zone.open > 0 ? 'secondary' : 'outline'}>
                          {zone.urgent > 0 ? 'Unahin' : zone.open > 0 ? 'Bantayan' : 'Maayos'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Wala pang sapat na location-linked records sa napiling petsa.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="concern-heading" className="space-y-3">
          <div>
            <h2 id="concern-heading" className="text-xl font-bold">Madalas na concern</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Mga uri ng tanong o problemang pinakamadalas i-report.</p>
          </div>
          <Card>
            <CardContent className="space-y-5 pt-6">
              {analytics.topConcerns.length > 0 ? analytics.topConcerns.map((concern) => (
                <div key={concern.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{concern.label}</span>
                    <span className="font-bold">{concern.count}</span>
                  </div>
                  <Progress value={(concern.count / analytics.highestConcernCount) * 100} aria-label={`${concern.label}: ${concern.count}`} />
                </div>
              )) : (
                <p className="py-8 text-center text-sm text-muted-foreground">Wala pang SMS concern sa napiling petsa.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <section aria-labelledby="profile-heading" className="space-y-3">
        <div>
          <h2 id="profile-heading" className="text-xl font-bold">Profile ng mga magsasaka</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Batay sa lahat ng aktibong farmer profiles. Gamitin ito sa pagpaplano ng orientation, ayuda, at crop support.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Karaniwang pananim</CardTitle>
              <CardDescription>Bilang ng aktibong magsasaka kada pananim.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.topCrops.length > 0 ? analytics.topCrops.map(([crop, count]) => (
                <div key={crop} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <span className="font-medium">{crop}</span>
                  <span className="font-bold">{count}</span>
                </div>
              )) : <p className="text-sm text-muted-foreground">Wala pang crop profile data.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Kasarian sa farmer records</CardTitle>
              <CardDescription>Buod lamang ng nakatalang impormasyon; hindi ito ginagamit upang limitahan ang serbisyo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.genderRows.length > 0 ? analytics.genderRows.map(([gender, count]) => (
                <div key={gender} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <span className="font-medium">{gender}</span>
                  <span className="font-bold">{count}</span>
                </div>
              )) : <p className="text-sm text-muted-foreground">Wala pang demographic data.</p>}
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="rounded-xl border bg-muted/35 px-5 py-4 text-sm leading-6 text-muted-foreground">
        Ang mga bilang sa pahinang ito ay awtomatikong nagbabago kapag may bagong live record. Para sa opisyal na dokumento, gamitin ang <Link href="/dashboard/reports" className="font-semibold text-primary underline-offset-4 hover:underline">Mga Ulat</Link> at piliin ang eksaktong petsa bago mag-download.
      </footer>
    </div>
  );
}

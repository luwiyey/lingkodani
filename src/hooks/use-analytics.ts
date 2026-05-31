'use client';

import { useMemo } from 'react';

import { useData } from '@/context/data-context';
import {
  useReportsTimeframe,
  type ReportsResolvedWindow,
  type ReportsTimeframePreset,
} from '@/context/reports-timeframe-context';
import type { Resource, SmsMessage } from '@/lib/types';
import { getSmsCaseExceptionFlags } from '@/lib/sms-case-exceptions';
import { getSmsCaseReportingCompleteness } from '@/lib/sms-case-quality';
import { getEffectiveSmsCaseOutcome, isAwaitingFarmerConfirmation, isFarmerConfirmedResolution } from '@/lib/sms-case-outcomes';
import { buildInterventionEffectiveness, buildOutbreakSeries, getCaseOperationalConfidence, inferOutbreakClusters, summarizeOutbreakClusters } from '@/lib/case-intelligence';
import { getLatestFarmerCropStage } from '@/lib/crop-stage';
import { countStaleMarketPrices } from '@/lib/services/price-watch-service';
import { normalizeSmsMessage } from '@/lib/sms-normalization';

type Tone = 'Neutral' | 'Nag-aalala' | 'Kritikal' | 'Positibo';
type RiskAlertSeverity = 'Kritikal' | 'Babala';
type RiskAlertKind = 'flood' | 'pest' | 'inventory';

export type RiskAlert = {
  id: string;
  kind: RiskAlertKind;
  title: string;
  description: string;
  severity: RiskAlertSeverity;
  affected: number;
};

const DAY_NAMES = ['Lin', 'Lun', 'Mar', 'Miy', 'Huw', 'Biy', 'Sab'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STOP_WORDS = new Set([
  'ang', 'ng', 'sa', 'at', 'po', 'ko', 'ako', 'namin', 'kami', 'si', 'ni', 'may', 'na', 'para', 'mga',
  'ito', 'iyan', 'din', 'kasi', 'lang', 'nang', 'ba', 'daw', 'kayo', 'paano', 'ano', 'mayroon', 'wala', 'yung',
  'siya', 'sila', 'ako', 'this', 'that', 'with', 'from', 'for', 'the', 'and', 'to',
]);

const RISK_WORDS = ['peste', 'lason', 'emergency', 'sira', 'daga', 'bagyo', 'baha'];
const PEST_WORDS = ['peste', 'leafminer', 'borer', 'daga', 'bugs', 'bug'];
const DISEASE_WORDS = ['sakit', 'blight', 'dilaw', 'fungal', 'leaf', 'spot'];
const WATER_WORDS = ['patubig', 'patubigan', 'water', 'tubig', 'irrigation', 'ulan', 'baha'];

const COLOR_1 = 'hsl(var(--chart-1))';
const COLOR_2 = 'hsl(var(--chart-2))';
const COLOR_3 = 'hsl(var(--chart-3))';
const COLOR_4 = 'hsl(var(--chart-4))';
const COLOR_5 = 'hsl(var(--chart-5))';
const COLOR_DESTRUCTIVE = 'hsl(var(--destructive))';

function asDate(value: string): Date {
  return new Date(value);
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(23, 59, 59, 999);
  return next;
}

type TimeBucket = {
  label: string;
  start: Date;
  end: Date;
};

function buildTimeBuckets(anchor: Date, timeframe: ReportsTimeframePreset): TimeBucket[] {
  if (timeframe === 'Ngayong Araw') {
    const dayStart = startOfDay(anchor);
    return Array.from({ length: 6 }, (_, index) => {
      const start = new Date(dayStart);
      start.setHours(index * 4, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 3, 59, 59, 999);
      return {
        label: start.toLocaleTimeString('en-PH', { hour: 'numeric' }),
        start,
        end,
      };
    });
  }

  if (timeframe === 'Lingguhan') {
    const rangeStart = getRangeStart(anchor, timeframe);
    return Array.from({ length: 7 }, (_, index) => {
      const start = new Date(rangeStart);
      start.setDate(rangeStart.getDate() + index);
      return {
        label: DAY_NAMES[start.getDay()],
        start,
        end: endOfDay(start),
      };
    });
  }

  if (timeframe === 'Monthly') {
    const rangeStart = getRangeStart(anchor, timeframe);
    return Array.from({ length: 4 }, (_, index) => {
      const start = new Date(rangeStart);
      start.setDate(rangeStart.getDate() + index * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return {
        label: `Linggo ${index + 1}`,
        start,
        end: endOfDay(end),
      };
    });
  }

  if (timeframe === 'Quarterly') {
    return Array.from({ length: 3 }, (_, index) => {
      const start = new Date(anchor.getFullYear(), anchor.getMonth() - (2 - index), 1);
      const end = endOfDay(new Date(anchor.getFullYear(), anchor.getMonth() - (1 - index), 0));
      return {
        label: MONTH_NAMES[start.getMonth()],
        start,
        end,
      };
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const start = new Date(anchor.getFullYear(), index, 1);
    const end = endOfDay(new Date(anchor.getFullYear(), index + 1, 0));
    return {
      label: MONTH_NAMES[start.getMonth()],
      start,
      end,
    };
  });
}

function isWithinBucket(timestamp: string, bucket: TimeBucket) {
  const value = asDate(timestamp).getTime();
  return value >= bucket.start.getTime() && value <= bucket.end.getTime();
}

function getRangeStart(anchor: Date, timeframe: ReportsTimeframePreset) {
  const start = startOfDay(anchor);

  if (timeframe === 'Ngayong Araw') return start;
  if (timeframe === 'Lingguhan') {
    start.setDate(start.getDate() - 6);
    return start;
  }
  if (timeframe === 'Monthly') {
    start.setDate(start.getDate() - 29);
    return start;
  }
  if (timeframe === 'Quarterly') {
    start.setDate(start.getDate() - 89);
    return start;
  }

  start.setDate(start.getDate() - 364);
  return start;
}

function filterByTimeframe<T>(items: T[], getTimestamp: (item: T) => string, timeframe: ReportsTimeframePreset, anchor: Date) {
  const rangeStart = getRangeStart(anchor, timeframe).getTime();
  const rangeEnd = anchor.getTime();

  return items.filter((item) => {
    const ts = asDate(getTimestamp(item)).getTime();
    return !Number.isNaN(ts) && ts >= rangeStart && ts <= rangeEnd;
  });
}

function tokensFromMessages(messages: SmsMessage[]): string[] {
  return messages
    .flatMap((message) =>
      normalizeSmsMessage(message.message)
        .normalizedMessage
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
    )
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
}

function bucketByTwoHour(hour: number): string {
  if (hour < 10) return '8-10am';
  if (hour < 12) return '10-12pm';
  if (hour < 14) return '12-2pm';
  if (hour < 16) return '2-4pm';
  if (hour < 18) return '4-6pm';
  return '6-8pm';
}

function inferToneCounts(messages: SmsMessage[]) {
  const base: Record<Tone, number> = {
    Neutral: 0,
    'Nag-aalala': 0,
    Kritikal: 0,
    Positibo: 0,
  };

  for (const m of messages) {
    const tone = m.tone ?? 'Neutral';
    base[tone] += 1;
  }

  return base;
}

function inferLanguage(message: SmsMessage) {
  if (message.detectedLanguage) {
    return message.detectedLanguage;
  }

  const lower = message.message.toLowerCase();
  const englishHints = ['the', 'is', 'how', 'what', 'please', 'help', 'damage', 'leaf', 'borer', 'sprayer'];
  const englishHits = englishHints.filter((w) => lower.includes(w)).length;
  return englishHits >= 2 ? 'Taglish' : 'Filipino';
}

function countUniqueFarmers(messages: SmsMessage[]) {
  return new Set(messages.map((m) => m.farmerId)).size;
}

function issueBreakdown(messages: SmsMessage[]) {
  let pests = 0;
  let sakit = 0;
  let patubig = 0;

  for (const m of messages) {
    const lower = normalizeSmsMessage(m.message).normalizedMessage.toLowerCase();
    const isPest = m.parsedIntent === 'PEST_DISEASE' || PEST_WORDS.some((w) => lower.includes(w));
    const isSakit = DISEASE_WORDS.some((w) => lower.includes(w));
    const isPatubig = m.parsedIntent === 'WEATHER_HELP' || WATER_WORDS.some((w) => lower.includes(w));
    if (isPest) pests += 1;
    if (isSakit) sakit += 1;
    if (isPatubig) patubig += 1;
  }

  return { pests, sakit, patubig };
}

function getInquiryCategory(message: SmsMessage) {
  switch (message.parsedIntent) {
    case 'PEST_DISEASE':
      return 'Peste o sakit sa pananim';
    case 'HARVEST':
      return 'Ani at post-harvest';
    case 'REQUEST':
      return 'Hiling na tulong o rekurso';
    case 'EMERGENCY':
      return 'Agarang sakuna o pinsala';
    case 'WEATHER_HELP':
      return 'Panahon at patubig';
    case 'PRICE_CHECK':
      return 'Presyo sa merkado';
    case 'REGISTER':
      return 'Pagpaparehistro ng magsasaka';
    case 'CROP_UPDATE':
      return 'Update sa taniman';
    default:
      return 'Iba pang concern';
  }
}

function isMessageResolved(message: SmsMessage) {
  return getEffectiveSmsCaseOutcome(message) === 'resolved' && isFarmerConfirmedResolution(message);
}

function formatInterventionPeriodLabel(date: Date, useDailyLabel: boolean) {
  if (useDailyLabel) {
    return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
  }

  return MONTH_NAMES[date.getMonth()];
}

function formatBucketDateLabel(date: Date) {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

function getRangeSpanDays(start: Date, end: Date) {
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function buildCustomRangeBuckets(window: ReportsResolvedWindow): TimeBucket[] {
  const spanDays = getRangeSpanDays(window.start, window.end);

  if (spanDays <= 1) {
    const dayStart = startOfDay(window.start);
    return Array.from({ length: 6 }, (_, index) => {
      const start = new Date(dayStart);
      start.setHours(index * 4, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 3, 59, 59, 999);
      return {
        label: start.toLocaleTimeString('en-PH', { hour: 'numeric' }),
        start,
        end,
      };
    });
  }

  if (spanDays <= 14) {
    const buckets: TimeBucket[] = [];
    const cursor = startOfDay(window.start);

    while (cursor.getTime() <= window.end.getTime()) {
      const start = new Date(cursor);
      const end = endOfDay(cursor);
      buckets.push({
        label: formatBucketDateLabel(start),
        start,
        end,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return buckets;
  }

  if (spanDays <= 62) {
    const buckets: TimeBucket[] = [];
    const cursor = startOfDay(window.start);

    while (cursor.getTime() <= window.end.getTime()) {
      const start = new Date(cursor);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      if (end.getTime() > window.end.getTime()) {
        end.setTime(window.end.getTime());
      }
      buckets.push({
        label: `${formatBucketDateLabel(start)}-${formatBucketDateLabel(end)}`,
        start,
        end,
      });
      cursor.setDate(cursor.getDate() + 7);
    }

    return buckets;
  }

  if (spanDays <= 370) {
    const buckets: TimeBucket[] = [];
    const cursor = new Date(window.start.getFullYear(), window.start.getMonth(), 1);

    while (cursor.getTime() <= window.end.getTime()) {
      const start = new Date(cursor);
      const end = endOfDay(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));
      buckets.push({
        label: MONTH_NAMES[start.getMonth()],
        start,
        end: end.getTime() > window.end.getTime() ? new Date(window.end) : end,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return buckets;
  }

  const buckets: TimeBucket[] = [];
  const quarterCursor = new Date(window.start.getFullYear(), Math.floor(window.start.getMonth() / 3) * 3, 1);

  while (quarterCursor.getTime() <= window.end.getTime()) {
    const start = new Date(quarterCursor);
    const end = endOfDay(new Date(start.getFullYear(), start.getMonth() + 3, 0));
    buckets.push({
      label: `Q${Math.floor(start.getMonth() / 3) + 1} ${start.getFullYear()}`,
      start,
      end: end.getTime() > window.end.getTime() ? new Date(window.end) : end,
    });
    quarterCursor.setMonth(quarterCursor.getMonth() + 3);
  }

  return buckets;
}

function filterByResolvedWindow<T>(
  items: T[],
  getTimestamp: (item: T) => string,
  window: ReportsResolvedWindow
) {
  const start = window.start.getTime();
  const end = window.end.getTime();

  return items.filter((item) => {
    const timestamp = asDate(getTimestamp(item)).getTime();
    return !Number.isNaN(timestamp) && timestamp >= start && timestamp <= end;
  });
}

function normalizeGenderLabel(value?: string) {
  const normalized = value?.trim().toLowerCase() ?? '';

  if (normalized.startsWith('f') || normalized.includes('babae') || normalized.includes('female')) {
    return 'Babae';
  }

  if (normalized.startsWith('m') || normalized.includes('lalaki') || normalized.includes('male')) {
    return 'Lalaki';
  }

  if (normalized.includes('non') || normalized.includes('other') || normalized.includes('iba')) {
    return 'Iba';
  }

  return 'Hindi tukoy';
}

function getAgeGroupLabel(age: number) {
  if (!Number.isFinite(age) || age <= 0) return 'Hindi tukoy';
  if (age <= 29) return '18-29';
  if (age <= 44) return '30-44';
  if (age <= 59) return '45-59';
  return '60+';
}

function getFarmSizeBandLabel(size: number) {
  if (!Number.isFinite(size) || size <= 0) return 'Hindi tukoy';
  if (size < 1) return 'Below 1 ha';
  if (size < 3) return '1-2.9 ha';
  if (size < 5) return '3-4.9 ha';
  return '5 ha and up';
}

function buildRiskAlerts(messages: SmsMessage[], resources: Resource[]): RiskAlert[] {
  const emergency = messages.filter((m) => m.parsedIntent === 'EMERGENCY' || m.message.toLowerCase().includes('baha'));
  const pest = messages.filter((m) => m.parsedIntent === 'PEST_DISEASE');
  const lowStock = resources.filter((r) => r.stock < 10);
  const alerts: RiskAlert[] = [];

  if (emergency.length > 0) {
    alerts.push({
      id: 'risk-emergency',
      kind: 'flood',
      title: 'Panganib ng Baha (72 Oras)',
      description: `May ${emergency.length} emergency report na may kaugnayan sa pinsala sa panahon.`,
      severity: 'Kritikal',
      affected: countUniqueFarmers(emergency),
    });
  }

  if (pest.length > 0) {
    alerts.push({
      id: 'risk-pest',
      kind: 'pest',
      title: 'Pagdami ng Peste',
      description: `May ${pest.length} ulat ng peste mula sa mga magsasaka na kailangan ng agarang inspeksyon.`,
      severity: pest.length >= 3 ? 'Kritikal' : 'Babala',
      affected: countUniqueFarmers(pest),
    });
  }

  if (lowStock.length > 0) {
    alerts.push({
      id: 'risk-stock',
      kind: 'inventory',
      title: 'Mababang Imbentaryo',
      description: `${lowStock.length} resource item ang mababa ang stock sa imbentaryo.`,
      severity: lowStock.length >= 3 ? 'Kritikal' : 'Babala',
      affected: lowStock.length,
    });
  }

  return alerts;
}

function percentile90(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.9) - 1);
  return sorted[index];
}

export function useAnalytics() {
  const {
    smsMessages,
    outboundMessages,
    farmers,
    resources,
    vouchers,
    auditLogs,
    fieldVisitTasks,
    assistanceRecords,
    alertHistory,
    marketPrices,
  } = useData();
  const { timeframe, resolvedWindow } = useReportsTimeframe();

  return useMemo(() => {
    const allTimes: number[] = [
      ...smsMessages.map((m) => asDate(m.timestamp).getTime()),
      ...farmers.map((f) => asDate(f.lastSmsActivity).getTime()),
      ...farmers.map((f) => asDate(f.registrationDate).getTime()),
      ...resources.map((r) => asDate(r.lastUpdated).getTime()),
      ...vouchers.map((v) => asDate(v.issueDate).getTime()),
      ...vouchers.filter((v) => !!v.redemptionDate).map((v) => asDate(v.redemptionDate as string).getTime()),
      ...auditLogs.map((l) => asDate(l.timestamp).getTime()),
      ...outboundMessages
        .filter((message) => message.audience !== 'official')
        .map((o) => asDate(o.createdAt).getTime()),
      ...fieldVisitTasks.map((task) => asDate(task.scheduledFor).getTime()),
      ...fieldVisitTasks.map((task) => asDate(task.updatedAt).getTime()),
      ...assistanceRecords.map((record) => asDate(record.updatedAt).getTime()),
      ...alertHistory.map((entry) => asDate(entry.timestamp).getTime()),
      ...marketPrices.map((entry) => asDate(entry.updatedAt).getTime()),
    ].filter((value) => !Number.isNaN(value));
    const isCustomRange = timeframe === 'Custom Range';
    const presetTimeframe = isCustomRange ? 'Lingguhan' : timeframe;
    const anchorDate = isCustomRange
      ? new Date(resolvedWindow.end)
      : new Date(Math.max(...allTimes, Date.now()));

    const filterItems = <T,>(items: T[], getTimestamp: (item: T) => string) =>
      isCustomRange
        ? filterByResolvedWindow(items, getTimestamp, resolvedWindow)
        : filterByTimeframe(items, getTimestamp, presetTimeframe, anchorDate);

    const filteredSms = filterItems(smsMessages, (m) => m.timestamp);
    const filteredAuditLogs = filterItems(auditLogs, (l) => l.timestamp);
    const filteredOutboundMessages = filterItems(
      outboundMessages.filter((message) => message.audience !== 'official'),
      (o) => o.createdAt
    );
    const filteredFieldVisitTasks = filterItems(fieldVisitTasks, (task) => task.updatedAt);
    const filteredAssistanceRecords = filterItems(assistanceRecords, (record) => record.updatedAt);
    const filteredAlertHistory = filterItems(alertHistory, (entry) => entry.timestamp);
    const sortedByTime = [...filteredSms].sort((a, b) => asDate(a.timestamp).getTime() - asDate(b.timestamp).getTime());
    const latestDate = sortedByTime.length > 0 ? asDate(sortedByTime[sortedByTime.length - 1].timestamp) : anchorDate;
    const timeBuckets = isCustomRange
      ? buildCustomRangeBuckets(resolvedWindow)
      : buildTimeBuckets(latestDate, presetTimeframe);

    const smsVolumeData = timeBuckets.map((bucket) => ({
      name: bucket.label,
      total: sortedByTime.filter((message) => isWithinBucket(message.timestamp, bucket)).length,
    }));

    const smsPeakHoursCounter: Record<string, number> = {
      '8-10am': 0,
      '10-12pm': 0,
      '12-2pm': 0,
      '2-4pm': 0,
      '4-6pm': 0,
      '6-8pm': 0,
    };
    for (const msg of sortedByTime) {
      smsPeakHoursCounter[bucketByTwoHour(asDate(msg.timestamp).getHours())] += 1;
    }
    const smsPeakHoursData = Object.entries(smsPeakHoursCounter).map(([hour, messages]) => ({ hour, messages }));

    const toneCounts = inferToneCounts(sortedByTime);
    const messageToneData = [
      { tone: 'Neutral', count: toneCounts.Neutral, fill: COLOR_1 },
      { tone: 'Nag-aalala', count: toneCounts['Nag-aalala'], fill: COLOR_2 },
      { tone: 'Kritikal', count: toneCounts.Kritikal, fill: COLOR_DESTRUCTIVE },
      { tone: 'Positibo', count: toneCounts.Positibo, fill: COLOR_3 },
    ];

    const languageCounts = new Map<string, number>();
    for (const msg of sortedByTime) {
      const language = inferLanguage(msg);
      languageCounts.set(language, (languageCounts.get(language) ?? 0) + 1);
    }
    const languagePalette = [COLOR_1, COLOR_2, COLOR_3, COLOR_4, COLOR_5, COLOR_DESTRUCTIVE];
    const languageUsageData = Array.from(languageCounts.entries()).map(([language, value], index) => ({
      language,
      value,
      fill: languagePalette[index % languagePalette.length],
    }));

    const messageLengthData = [
      { range: '1-20', count: 0 },
      { range: '21-80', count: 0 },
      { range: '81-160', count: 0 },
    ];
    for (const msg of sortedByTime) {
      const len = msg.message.length;
      if (len <= 20) messageLengthData[0].count += 1;
      else if (len <= 80) messageLengthData[1].count += 1;
      else messageLengthData[2].count += 1;
    }

    const keywordCounter = new Map<string, number>();
    for (const token of tokensFromMessages(sortedByTime)) {
      keywordCounter.set(token, (keywordCounter.get(token) ?? 0) + 1);
    }
    const topKeywordsData = [...keywordCounter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 9)
      .map(([word, count]) => ({ word, count }));
    const inquiryCounter = new Map<string, number>();
    for (const msg of sortedByTime) {
      const key = getInquiryCategory(msg);
      inquiryCounter.set(key, (inquiryCounter.get(key) ?? 0) + 1);
    }
    const topInquiriesData = [...inquiryCounter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([question, count]) => ({ question, count }));
    const highRiskKeywordData = RISK_WORDS.map((word) => ({
      word,
      count: sortedByTime.filter((message) => normalizeSmsMessage(message.message).normalizedMessage.toLowerCase().includes(word)).length,
    })).filter((item) => item.count > 0);

    const zoneCounter = new Map<string, number>();
    for (const msg of sortedByTime) {
      const farmer = farmers.find((f) => f.id === msg.farmerId);
      const zone = farmer?.sitio ?? 'Hindi tukoy';
      zoneCounter.set(zone, (zoneCounter.get(zone) ?? 0) + 1);
    }
    const geographicHotspotData = [...zoneCounter.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([zone, issues]) => ({ zone, issues }));
    const seasonalMap = new Map<number, number>();
    for (const msg of sortedByTime) {
      seasonalMap.set(asDate(msg.timestamp).getMonth(), (seasonalMap.get(asDate(msg.timestamp).getMonth()) ?? 0) + 1);
    }
    const seasonalTrendData = MONTH_NAMES.map((month, idx) => ({
      month,
      reports: seasonalMap.get(idx) ?? 0,
    }));

    const issueTrendsData = timeBuckets.map((bucket) => {
      const bucketMessages = sortedByTime.filter((message) => isWithinBucket(message.timestamp, bucket));
      const breakdown = issueBreakdown(bucketMessages);
      return {
        date: bucket.label,
        MgaPeste: breakdown.pests,
        Sakit: breakdown.sakit,
        Patubig: breakdown.patubig,
      };
    });

    const outbreakAlertData = buildOutbreakSeries({
      messages: sortedByTime,
      farmers,
    });

    const urgencyByCategory = {
      Peste: { mild: 0, moderate: 0, severe: 0 },
      Sakit: { mild: 0, moderate: 0, severe: 0 },
      Panahon: { mild: 0, moderate: 0, severe: 0 },
    };
    for (const msg of sortedByTime) {
      const lower = msg.message.toLowerCase();
      const severityKey = msg.urgency === 'low' ? 'mild' : msg.urgency === 'medium' ? 'moderate' : 'severe';
      if (msg.parsedIntent === 'PEST_DISEASE' || PEST_WORDS.some((w) => lower.includes(w))) urgencyByCategory.Peste[severityKey] += 1;
      if (DISEASE_WORDS.some((w) => lower.includes(w))) urgencyByCategory.Sakit[severityKey] += 1;
      if (msg.parsedIntent === 'WEATHER_HELP' || msg.parsedIntent === 'EMERGENCY' || WATER_WORDS.some((w) => lower.includes(w))) urgencyByCategory.Panahon[severityKey] += 1;
    }
    const severityIndexData = [
      { name: 'Peste', ...urgencyByCategory.Peste },
      { name: 'Sakit', ...urgencyByCategory.Sakit },
      { name: 'Panahon', ...urgencyByCategory.Panahon },
    ];

    const sentCount = filteredOutboundMessages.filter((record) => record.status === 'sent' || record.status === 'delivered').length;
    const failedCount = filteredOutboundMessages.filter((record) => record.status === 'failed').length;
    const smsDeliveryStatusData = [
      { name: 'Napadala', value: sentCount, fill: COLOR_1 },
      { name: 'Nabigo', value: failedCount, fill: COLOR_DESTRUCTIVE },
    ];

    const approvedCount = filteredAuditLogs.filter((l) => l.action === 'APPROVE_AI_REPLY').length;
    const revisedCount = filteredAuditLogs.filter((l) => l.action === 'EDITED_REPLY_SENT' || l.action === 'MANUAL_REPLY_SENT').length;
    const rejectedCount = filteredAuditLogs.filter((l) => l.action === 'REJECT_AI_REPLY').length;
    const adviceSuccessData = [
      { status: 'Inaprubahan', value: approvedCount, fill: COLOR_1 },
      { status: 'In-edit', value: revisedCount, fill: COLOR_2 },
      { status: 'Tinanggihan', value: rejectedCount, fill: COLOR_DESTRUCTIVE },
    ];
    const aiAgreementData = [
      { name: 'Approved As-is', value: approvedCount, fill: COLOR_1 },
      { name: 'Revised', value: revisedCount, fill: COLOR_2 },
      { name: 'Rejected', value: rejectedCount, fill: COLOR_DESTRUCTIVE },
    ];

    const aiConfidenceTrendData = timeBuckets.map((bucket) => {
      const window = sortedByTime.filter((message) => isWithinBucket(message.timestamp, bucket));
      const avg = window.length > 0 ? window.reduce((acc, message) => acc + message.aiConfidence, 0) / window.length : 0;
      return {
        date: bucket.label,
        confidence: Math.round(avg * 100),
      };
    });

    const lowConfidenceCount = sortedByTime.filter((m) => m.clarificationNeeded || m.aiConfidence < 0.8).length;
    const clarificationNeededData = [
      { name: 'Nangailangan ng Clarification', value: lowConfidenceCount, fill: COLOR_2 },
      { name: 'Hindi Kinailangan', value: sortedByTime.length - lowConfidenceCount, fill: COLOR_1 },
    ];

    const correctionLogData = [
      { type: 'Intent', count: filteredAuditLogs.filter((l) => l.action.includes('INTENT')).length },
      { type: 'Entity', count: filteredAuditLogs.filter((l) => l.action.includes('UPDATE') || l.action.includes('REGISTER')).length },
      { type: 'Advice', count: filteredAuditLogs.filter((l) => l.action.includes('APPROVE') || l.action.includes('REJECT') || l.action.includes('EDITED')).length },
    ];

    const recommendationTypeCounter = new Map<string, number>([
      ['Pag-iwas', 0],
      ['Paggamot', 0],
      ['Pagsubaybay', 0],
      ['Referral', 0],
    ]);
    for (const msg of sortedByTime) {
      const advice = msg.aiAdvice.toLowerCase();
      if (advice.includes('iwas') || advice.includes('monitor')) recommendationTypeCounter.set('Pag-iwas', (recommendationTypeCounter.get('Pag-iwas') ?? 0) + 1);
      if (advice.includes('gamit') || advice.includes('spray') || advice.includes('pesticide')) recommendationTypeCounter.set('Paggamot', (recommendationTypeCounter.get('Paggamot') ?? 0) + 1);
      if (advice.includes('subaybay') || advice.includes('tingnan')) recommendationTypeCounter.set('Pagsubaybay', (recommendationTypeCounter.get('Pagsubaybay') ?? 0) + 1);
      if (advice.includes('ugnayan') || advice.includes('tanggapan')) recommendationTypeCounter.set('Referral', (recommendationTypeCounter.get('Referral') ?? 0) + 1);
    }
    const recommendationTypeData = [...recommendationTypeCounter.entries()].map(([name, count]) => ({ name, count }));

    const cropStageCounts = new Map<string, number>([
      ['Pagtatanim', 0],
      ['Paglago', 0],
      ['Pamumulaklak', 0],
      ['Pag-aani', 0],
      ['Hindi pa naitatala', 0],
    ]);
    const cropStageSourceMessages = smsMessages.filter((message) => asDate(message.timestamp).getTime() <= latestDate.getTime());
    for (const farmer of farmers.filter((entry) => entry.status === 'active' && !entry.mergedIntoFarmerId)) {
      const stage = getLatestFarmerCropStage(farmer, cropStageSourceMessages);
      cropStageCounts.set(stage, (cropStageCounts.get(stage) ?? 0) + 1);
    }
    const cropStageColors = new Map<string, string>([
      ['Pagtatanim', COLOR_1],
      ['Paglago', COLOR_2],
      ['Pamumulaklak', COLOR_3],
      ['Pag-aani', COLOR_4],
      ['Hindi pa naitatala', COLOR_5],
    ]);
    const cropStageData = [...cropStageCounts.entries()]
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        fill: cropStageColors.get(name) ?? COLOR_5,
      }));

    const activeRosterFarmers = farmers.filter((entry) => entry.status === 'active' && !entry.mergedIntoFarmerId);
    const demographicFarmerMap = new Map<string, (typeof activeRosterFarmers)[number]>();
    const scopeFarmerIds = new Set(sortedByTime.map((message) => message.farmerId));
    const recentFarmerActivity = filterItems(activeRosterFarmers, (farmer) => farmer.lastSmsActivity);
    const registeredFarmersInScope = filterItems(activeRosterFarmers, (farmer) => farmer.registrationDate);

    for (const farmer of activeRosterFarmers) {
      if (scopeFarmerIds.has(farmer.id)) {
        demographicFarmerMap.set(farmer.id, farmer);
      }
    }
    for (const farmer of recentFarmerActivity) {
      demographicFarmerMap.set(farmer.id, farmer);
    }
    for (const farmer of registeredFarmersInScope) {
      demographicFarmerMap.set(farmer.id, farmer);
    }

    const demographicFarmers = [...demographicFarmerMap.values()];
    const totalDemographicFarmers = demographicFarmers.length;
    const farmersWithAge = demographicFarmers.filter((farmer) => Number.isFinite(farmer.age) && farmer.age > 0);
    const farmersWithFarmSize = demographicFarmers.filter((farmer) => Number.isFinite(farmer.farmSize) && farmer.farmSize > 0);
    const averageFarmerAge =
      farmersWithAge.length > 0
        ? Number(
            (
              farmersWithAge.reduce((acc, farmer) => acc + farmer.age, 0) /
              farmersWithAge.length
            ).toFixed(1)
          )
        : 0;
    const averageFarmSizeHectares =
      farmersWithFarmSize.length > 0
        ? Number(
            (
              farmersWithFarmSize.reduce((acc, farmer) => acc + farmer.farmSize, 0) /
              farmersWithFarmSize.length
            ).toFixed(1)
          )
        : 0;

    const genderCounter = new Map<string, number>();
    const ageGroupCounter = new Map<string, number>([
      ['18-29', 0],
      ['30-44', 0],
      ['45-59', 0],
      ['60+', 0],
      ['Hindi tukoy', 0],
    ]);
    const farmSizeCounter = new Map<string, number>([
      ['Below 1 ha', 0],
      ['1-2.9 ha', 0],
      ['3-4.9 ha', 0],
      ['5 ha and up', 0],
      ['Hindi tukoy', 0],
    ]);
    const cropCounter = new Map<string, number>();

    for (const farmer of demographicFarmers) {
      const genderLabel = normalizeGenderLabel(farmer.gender);
      genderCounter.set(genderLabel, (genderCounter.get(genderLabel) ?? 0) + 1);

      const ageGroup = getAgeGroupLabel(farmer.age);
      ageGroupCounter.set(ageGroup, (ageGroupCounter.get(ageGroup) ?? 0) + 1);

      const farmSizeBand = getFarmSizeBandLabel(farmer.farmSize);
      farmSizeCounter.set(farmSizeBand, (farmSizeCounter.get(farmSizeBand) ?? 0) + 1);

      for (const crop of farmer.crops) {
        const normalizedCrop = crop.trim();
        if (!normalizedCrop) {
          continue;
        }
        cropCounter.set(normalizedCrop, (cropCounter.get(normalizedCrop) ?? 0) + 1);
      }
    }

    const demographicPalette = [COLOR_1, COLOR_2, COLOR_3, COLOR_4, COLOR_5, COLOR_DESTRUCTIVE];
    const genderDistributionData = [...genderCounter.entries()].map(([name, value], index) => ({
      name,
      value,
      fill: demographicPalette[index % demographicPalette.length],
    }));
    const farmerAgeGroupData = [...ageGroupCounter.entries()].map(([group, count], index) => ({
      group,
      count,
      fill: demographicPalette[index % demographicPalette.length],
    }));
    const farmSizeDistributionData = [...farmSizeCounter.entries()].map(([band, count], index) => ({
      band,
      count,
      fill: demographicPalette[index % demographicPalette.length],
    }));
    const farmerCropProfileData = [...cropCounter.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([crop, count], index) => ({
        crop,
        count,
        fill: demographicPalette[index % demographicPalette.length],
      }));
    const topCropProfile = farmerCropProfileData[0] ?? null;
    const dominantGenderEntry = genderDistributionData.reduce(
      (best, current) => (!best || current.value > best.value ? current : best),
      genderDistributionData[0] ?? null
    );
    const topSitioByFarmerCount = [...demographicFarmers]
      .reduce((counter, farmer) => {
        const sitio = farmer.sitio?.trim() || 'Hindi tukoy';
        counter.set(sitio, (counter.get(sitio) ?? 0) + 1);
        return counter;
      }, new Map<string, number>())
      .entries();
    const topFarmerLocation = [...topSitioByFarmerCount]
      .sort((left, right) => right[1] - left[1])[0] ?? null;

    const interventionUsesDailyLabel = isCustomRange
      ? getRangeSpanDays(resolvedWindow.start, resolvedWindow.end) <= 14
      : presetTimeframe === 'Ngayong Araw' || presetTimeframe === 'Lingguhan';

    const interventionEventPeriods = new Map<string, { visits: number; sortTime: number }>();
    for (const task of filteredFieldVisitTasks) {
      const taskDate = asDate(task.scheduledFor);
      const period = formatInterventionPeriodLabel(taskDate, interventionUsesDailyLabel);
      const sortTime =
        interventionUsesDailyLabel
          ? startOfDay(taskDate).getTime()
          : new Date(taskDate.getFullYear(), taskDate.getMonth(), 1).getTime();
      const current = interventionEventPeriods.get(period);
      interventionEventPeriods.set(period, {
        visits: (current?.visits ?? 0) + 1,
        sortTime,
      });
    }
    for (const record of filteredAssistanceRecords) {
      const recordDate = asDate(record.updatedAt);
      const period = formatInterventionPeriodLabel(recordDate, interventionUsesDailyLabel);
      const sortTime =
        interventionUsesDailyLabel
          ? startOfDay(recordDate).getTime()
          : new Date(recordDate.getFullYear(), recordDate.getMonth(), 1).getTime();
      const current = interventionEventPeriods.get(period);
      interventionEventPeriods.set(period, {
        visits: (current?.visits ?? 0) + 1,
        sortTime,
      });
    }
    const interventionSupportData = [...interventionEventPeriods.entries()]
      .map(([period, details]) => ({ period, visits: details.visits, sortTime: details.sortTime }))
      .sort((left, right) => left.sortTime - right.sortTime)
      .map(({ period, visits }) => ({ period, visits }));

    const unresolvedSmsCount = sortedByTime.filter((message) => !isMessageResolved(message)).length;
    const validationQueueData = [
      { name: 'Nakabinbin', value: unresolvedSmsCount, fill: COLOR_2 },
      { name: 'Nalutas', value: Math.max(sortedByTime.length - unresolvedSmsCount, 0), fill: COLOR_1 },
    ];

    const caseOutcomeCounter = {
      'Walang outcome': 0,
      'Hintay kumpirmasyon': 0,
      'Mino-monitor': 0,
      'May pagbuti': 0,
      'Kailangan ng follow-up': 0,
      'Na-refer': 0,
      Nalutas: 0,
    };

    for (const message of sortedByTime) {
      const outcome = getEffectiveSmsCaseOutcome(message);
      if (isAwaitingFarmerConfirmation(message)) {
        caseOutcomeCounter['Hintay kumpirmasyon'] += 1;
        continue;
      }
      if (!outcome) {
        caseOutcomeCounter['Walang outcome'] += 1;
        continue;
      }

      if (outcome === 'monitoring') caseOutcomeCounter['Mino-monitor'] += 1;
      if (outcome === 'improving') caseOutcomeCounter['May pagbuti'] += 1;
      if (outcome === 'needs_follow_up') caseOutcomeCounter['Kailangan ng follow-up'] += 1;
      if (outcome === 'referred') caseOutcomeCounter['Na-refer'] += 1;
      if (outcome === 'resolved') caseOutcomeCounter.Nalutas += 1;
    }

    const caseOutcomeData = [
      { name: 'Walang outcome', value: caseOutcomeCounter['Walang outcome'], fill: COLOR_4 },
      { name: 'Hintay kumpirmasyon', value: caseOutcomeCounter['Hintay kumpirmasyon'], fill: '#f59e0b' },
      { name: 'Mino-monitor', value: caseOutcomeCounter['Mino-monitor'], fill: COLOR_2 },
      { name: 'May pagbuti', value: caseOutcomeCounter['May pagbuti'], fill: COLOR_1 },
      { name: 'Kailangan ng follow-up', value: caseOutcomeCounter['Kailangan ng follow-up'], fill: '#d97706' },
      { name: 'Na-refer', value: caseOutcomeCounter['Na-refer'], fill: '#0284c7' },
      { name: 'Nalutas', value: caseOutcomeCounter.Nalutas, fill: '#16a34a' },
    ];

    const aiDraftedCases = sortedByTime.filter((message) => message.analysisSource === 'ai' || message.analysisSource === 'ai_fallback').length;
    const humanReviewedCases = sortedByTime.filter((message) => message.status !== 'pending_approval').length;
    const farmerConfirmedResolutionCount = sortedByTime.filter((message) => isFarmerConfirmedResolution(message)).length;
    const awaitingFarmerConfirmationCount = sortedByTime.filter((message) => isAwaitingFarmerConfirmation(message)).length;
    const reportingCompleteness = sortedByTime.map((message) => getSmsCaseReportingCompleteness(message));
    const operationalConfidenceEntries = sortedByTime.map((message) => ({
      message,
      confidence: getCaseOperationalConfidence({
        message,
        assistanceRecords: filteredAssistanceRecords,
        fieldVisitTasks: filteredFieldVisitTasks,
        now: anchorDate.toISOString(),
      }),
    }));
    const averageOperationalConfidence =
      operationalConfidenceEntries.length > 0
        ? Number(
            (
              operationalConfidenceEntries.reduce((acc, entry) => acc + entry.confidence.score, 0) /
              operationalConfidenceEntries.length
            ).toFixed(2)
          )
        : 0;
    const trustedCaseCount = operationalConfidenceEntries.filter((entry) => entry.confidence.score >= 0.75).length;
    const lowTrustCaseCount = operationalConfidenceEntries.filter((entry) => entry.confidence.score < 0.5).length;
    const weightedResolvedCount = Number(
      operationalConfidenceEntries
        .filter((entry) => getEffectiveSmsCaseOutcome(entry.message) === 'resolved')
        .reduce((acc, entry) => {
          const completeness = getSmsCaseReportingCompleteness(entry.message).score / 100;
          return acc + entry.confidence.score * completeness;
        }, 0)
        .toFixed(1)
    );
    const outbreakClusters = inferOutbreakClusters({
      messages: sortedByTime,
      farmers,
      alertHistory: filteredAlertHistory,
      now: anchorDate.toISOString(),
    });
    const outbreakWatchSummary = summarizeOutbreakClusters(outbreakClusters);
    const interventionEffectivenessData = buildInterventionEffectiveness({
      messages: sortedByTime,
      assistanceRecords: filteredAssistanceRecords,
      fieldVisitTasks: filteredFieldVisitTasks,
      now: anchorDate.toISOString(),
    });
    const topInterventionEffectiveness = interventionEffectivenessData[0] ?? null;
    const reportingReadyCases = reportingCompleteness.filter((entry) => entry.readyForReports).length;
    const reportingPartialCases = reportingCompleteness.filter((entry) => entry.tier === 'partial').length;
    const reportingLowConfidenceCases = reportingCompleteness.filter((entry) => entry.tier === 'low_confidence').length;
    const messageExceptionEntries = sortedByTime.map((message) => ({
      message,
      flags: getSmsCaseExceptionFlags({
        message,
        assistanceRecords: filteredAssistanceRecords,
        fieldVisitTasks: filteredFieldVisitTasks,
        outboundMessages: filteredOutboundMessages,
        now: anchorDate.toISOString(),
      }),
    }));
    const exceptionCases = messageExceptionEntries.filter((entry) => entry.flags.length > 0).length;
    const criticalExceptionCases = messageExceptionEntries.filter((entry) =>
      entry.flags.some((flag) => flag.severity === 'high')
    ).length;
    const supervisorReviewCases = messageExceptionEntries.filter((entry) =>
      entry.flags.some((flag) => flag.severity === 'high' || flag.id === 'reporting_incomplete')
    ).length;
    const caseExceptionCounter = new Map<string, { count: number; severity: 'low' | 'medium' | 'high' }>();
    for (const entry of messageExceptionEntries) {
      for (const flag of entry.flags) {
        const existing = caseExceptionCounter.get(flag.title);
        caseExceptionCounter.set(flag.title, {
          count: (existing?.count ?? 0) + 1,
          severity:
            existing?.severity === 'high' || flag.severity === 'high'
              ? 'high'
              : existing?.severity === 'medium' || flag.severity === 'medium'
                ? 'medium'
                : 'low',
        });
      }
    }
    const caseExceptionData = [...caseExceptionCounter.entries()]
      .sort((left, right) => right[1].count - left[1].count)
      .slice(0, 6)
      .map(([title, details]) => ({
        title,
        count: details.count,
        severity: details.severity,
      }));

    const advisoryDeliveryData = [
      { name: 'Tagumpay', value: sentCount, fill: COLOR_1 },
      { name: 'Nabigo', value: failedCount, fill: COLOR_DESTRUCTIVE },
    ];

    const smsPerFarmer = new Map<string, number>();
    for (const msg of sortedByTime) {
      smsPerFarmer.set(msg.farmerId, (smsPerFarmer.get(msg.farmerId) ?? 0) + 1);
    }
    const withFollowUp = [...smsPerFarmer.values()].filter((count) => count > 1).length;
    const noFollowUp = Math.max(0, smsPerFarmer.size - withFollowUp);
    const followUpRateData = [
      { name: 'May Follow-up', value: withFollowUp, fill: COLOR_1 },
      { name: 'Walang Follow-up', value: noFollowUp, fill: COLOR_2 },
    ];

    const farmerEngagementData = [
      { type: 'First-time', count: [...smsPerFarmer.values()].filter((c) => c === 1).length },
      { type: 'Repeat', count: [...smsPerFarmer.values()].filter((c) => c >= 2 && c <= 3).length },
      { type: 'Frequent', count: [...smsPerFarmer.values()].filter((c) => c >= 4).length },
    ];

    const responseDurations = sortedByTime
      .filter((m) => !!m.respondedAt)
      .map((m) => (asDate(m.respondedAt as string).getTime() - asDate(m.timestamp).getTime()) / 60000)
      .filter((value) => value >= 0);
    const averageResponse = responseDurations.length > 0
      ? Number((responseDurations.reduce((acc, value) => acc + value, 0) / responseDurations.length).toFixed(1))
      : 0;
    const responseTimeData = [
      { name: 'Average', time: averageResponse },
      { name: '90th Percentile', time: Number(percentile90(responseDurations).toFixed(1)) },
    ];

    const riskAlerts = buildRiskAlerts(sortedByTime, resources);
    const liveContextUpdatedAt = anchorDate.toISOString();
    const highRiskCount = sortedByTime.filter((m) => m.urgency === 'high').length;
    const completedFieldVisits = filteredFieldVisitTasks.filter((task) => task.status === 'completed').length;
    const scheduledFieldVisits = filteredFieldVisitTasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled').length;
    const completedAssistance = filteredAssistanceRecords.filter((record) => record.status === 'completed').length;
    const openAssistance = filteredAssistanceRecords.filter((record) => record.status !== 'completed').length;
    const broadcastRecipients = filteredAlertHistory.reduce((acc, entry) => acc + entry.sentCount, 0);
    const failedBroadcastRecipients = filteredAlertHistory.reduce((acc, entry) => acc + entry.failedCount, 0);
    const stalePriceCount = countStaleMarketPrices(marketPrices, anchorDate);

    return {
      highRiskCount,
      aiDraftedCases,
      humanReviewedCases,
      farmerConfirmedResolutionCount,
      awaitingFarmerConfirmationCount,
      averageOperationalConfidence,
      trustedCaseCount,
      lowTrustCaseCount,
      weightedResolvedCount,
      outbreakClusters,
      outbreakWatchSummary,
      interventionEffectivenessData,
      topInterventionEffectiveness,
      reportingReadyCases,
      reportingPartialCases,
      reportingLowConfidenceCases,
      exceptionCases,
      criticalExceptionCases,
      supervisorReviewCases,
      caseExceptionData,
      liveContextUpdatedAt,
      riskAlerts,
      completedFieldVisits,
      scheduledFieldVisits,
      completedAssistance,
      openAssistance,
      totalAlertBroadcasts: filteredAlertHistory.length,
      broadcastRecipients,
      failedBroadcastRecipients,
      trackedMarketPrices: marketPrices.length,
      stalePriceCount,
      totalDemographicFarmers,
      newRegisteredFarmers: registeredFarmersInScope.length,
      averageFarmerAge,
      averageFarmSizeHectares,
      dominantGenderLabel: dominantGenderEntry?.name ?? 'N/A',
      dominantGenderCount: dominantGenderEntry?.value ?? 0,
      topFarmerLocationLabel: topFarmerLocation?.[0] ?? 'N/A',
      topFarmerLocationCount: topFarmerLocation?.[1] ?? 0,
      topCropProfile,
      genderDistributionData,
      farmerAgeGroupData,
      farmSizeDistributionData,
      farmerCropProfileData,
      smsVolumeData,
      issueTrendsData,
      adviceSuccessData,
      cropStageData,
      topKeywordsData,
      languageUsageData,
      smsPeakHoursData,
      interventionSupportData,
      validationQueueData,
      caseOutcomeData,
      advisoryDeliveryData,
      followUpRateData,
      aiConfidenceTrendData,
      correctionLogData,
      aiAgreementData,
      highRiskKeywordData,
      outbreakAlertData,
      severityIndexData,
      recommendationTypeData,
      messageLengthData,
      clarificationNeededData,
      topInquiriesData,
      seasonalTrendData,
      farmerEngagementData,
      geographicHotspotData,
      smsDeliveryStatusData,
      messageToneData,
      responseTimeData,
    };
  }, [alertHistory, assistanceRecords, auditLogs, farmers, fieldVisitTasks, marketPrices, outboundMessages, resolvedWindow, resources, smsMessages, timeframe, vouchers]);
}

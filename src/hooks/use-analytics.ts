'use client';

import { useMemo } from 'react';

import { useData } from '@/context/data-context';
import { useReportsTimeframe, type ReportsTimeframe } from '@/context/reports-timeframe-context';
import { isLiveMode } from '@/lib/config/app-mode';
import type { Resource, SmsMessage } from '@/lib/types';
import { countStaleMarketPrices } from '@/lib/services/price-watch-service';

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
const COLOR_DESTRUCTIVE = 'hsl(var(--destructive))';

function asDate(value: string): Date {
  return new Date(value);
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getRangeStart(anchor: Date, timeframe: ReportsTimeframe) {
  const start = startOfDay(anchor);

  if (timeframe === 'Ngayong Araw') return start;
  if (timeframe === 'Lingguhan') {
    start.setDate(start.getDate() - 6);
    return start;
  }
  if (timeframe === 'Buwanan') {
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

function filterByTimeframe<T>(items: T[], getTimestamp: (item: T) => string, timeframe: ReportsTimeframe, anchor: Date) {
  const rangeStart = getRangeStart(anchor, timeframe).getTime();
  const rangeEnd = anchor.getTime();

  return items.filter((item) => {
    const ts = asDate(getTimestamp(item)).getTime();
    return !Number.isNaN(ts) && ts >= rangeStart && ts <= rangeEnd;
  });
}

function tokensFromMessages(messages: SmsMessage[]): string[] {
  return messages
    .flatMap((m) => m.message.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/))
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

function inferLanguage(message: string): 'Tagalog' | 'Taglish' {
  const lower = message.toLowerCase();
  const englishHints = ['the', 'is', 'how', 'what', 'please', 'help', 'damage', 'leaf', 'borer', 'sprayer'];
  const englishHits = englishHints.filter((w) => lower.includes(w)).length;
  return englishHits >= 2 ? 'Taglish' : 'Tagalog';
}

function countUniqueFarmers(messages: SmsMessage[]) {
  return new Set(messages.map((m) => m.farmerId)).size;
}

function issueBreakdown(messages: SmsMessage[]) {
  let pests = 0;
  let sakit = 0;
  let patubig = 0;

  for (const m of messages) {
    const lower = m.message.toLowerCase();
    const isPest = m.parsedIntent === 'PEST_DISEASE' || PEST_WORDS.some((w) => lower.includes(w));
    const isSakit = DISEASE_WORDS.some((w) => lower.includes(w));
    const isPatubig = m.parsedIntent === 'WEATHER_HELP' || WATER_WORDS.some((w) => lower.includes(w));
    if (isPest) pests += 1;
    if (isSakit) sakit += 1;
    if (isPatubig) patubig += 1;
  }

  return { pests, sakit, patubig };
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
  const { timeframe } = useReportsTimeframe();

  return useMemo(() => {
    const allTimes: number[] = [
      ...smsMessages.map((m) => asDate(m.timestamp).getTime()),
      ...farmers.map((f) => asDate(f.lastSmsActivity).getTime()),
      ...farmers.map((f) => asDate(f.registrationDate).getTime()),
      ...resources.map((r) => asDate(r.lastUpdated).getTime()),
      ...vouchers.map((v) => asDate(v.issueDate).getTime()),
      ...vouchers.filter((v) => !!v.redemptionDate).map((v) => asDate(v.redemptionDate as string).getTime()),
      ...auditLogs.map((l) => asDate(l.timestamp).getTime()),
      ...outboundMessages.map((o) => asDate(o.createdAt).getTime()),
      ...fieldVisitTasks.map((task) => asDate(task.scheduledFor).getTime()),
      ...fieldVisitTasks.map((task) => asDate(task.updatedAt).getTime()),
      ...assistanceRecords.map((record) => asDate(record.updatedAt).getTime()),
      ...alertHistory.map((entry) => asDate(entry.timestamp).getTime()),
      ...marketPrices.map((entry) => asDate(entry.updatedAt).getTime()),
    ].filter((value) => !Number.isNaN(value));
    const anchorDate = new Date(Math.max(...allTimes, Date.now()));

    const filteredSms = filterByTimeframe(smsMessages, (m) => m.timestamp, timeframe, anchorDate);
    const filteredAuditLogs = filterByTimeframe(auditLogs, (l) => l.timestamp, timeframe, anchorDate);
    const filteredVouchers = filterByTimeframe(vouchers, (v) => v.issueDate, timeframe, anchorDate);
    const filteredOutboundMessages = filterByTimeframe(outboundMessages, (o) => o.createdAt, timeframe, anchorDate);
    const filteredFieldVisitTasks = filterByTimeframe(fieldVisitTasks, (task) => task.updatedAt, timeframe, anchorDate);
    const filteredAssistanceRecords = filterByTimeframe(assistanceRecords, (record) => record.updatedAt, timeframe, anchorDate);
    const filteredAlertHistory = filterByTimeframe(alertHistory, (entry) => entry.timestamp, timeframe, anchorDate);
    const sortedByTime = [...filteredSms].sort((a, b) => asDate(a.timestamp).getTime() - asDate(b.timestamp).getTime());
    const latestDate = sortedByTime.length > 0 ? asDate(sortedByTime[sortedByTime.length - 1].timestamp) : anchorDate;

    const dayBuckets = new Map<string, number>();
    for (const msg of sortedByTime) {
      const key = dateKey(asDate(msg.timestamp));
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
    }

    const smsVolumeData = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(latestDate);
      d.setDate(latestDate.getDate() - (6 - idx));
      return {
        name: DAY_NAMES[d.getDay()],
        total: dayBuckets.get(dateKey(d)) ?? 0,
      };
    });

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

    const languageCounts = { Tagalog: 0, Taglish: 0 };
    for (const msg of sortedByTime) {
      languageCounts[inferLanguage(msg.message)] += 1;
    }
    const languageUsageData = [
      { language: 'Tagalog', value: languageCounts.Tagalog, fill: COLOR_1 },
      { language: 'Taglish', value: languageCounts.Taglish, fill: COLOR_2 },
    ];

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
    const safeTopKeywordsData =
      topKeywordsData.length > 0 ? topKeywordsData : isLiveMode ? [] : [{ word: 'wala', count: 0 }];

    const inquiryCounter = new Map<string, number>();
    for (const msg of sortedByTime) {
      const key =
        msg.parsedIntent === 'PEST_DISEASE' ? 'Gamot sa peste?' :
        msg.parsedIntent === 'HARVEST' ? 'Paano mag-ani?' :
        msg.parsedIntent === 'REQUEST' ? 'Sira ang gamit' :
        msg.parsedIntent === 'EMERGENCY' ? 'Pinsala ng bagyo' :
        'Bakit dilaw ang dahon?';
      inquiryCounter.set(key, (inquiryCounter.get(key) ?? 0) + 1);
    }
    const topInquiriesData = [...inquiryCounter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([question, count]) => ({ question, count }));
    const safeTopInquiriesData =
      topInquiriesData.length > 0
        ? topInquiriesData
        : isLiveMode
          ? []
          : [{ question: 'Walang inquiry', count: 0 }];

    const highRiskKeywordData = RISK_WORDS.map((word) => ({
      word,
      count: sortedByTime.filter((m) => m.message.toLowerCase().includes(word)).length,
    })).filter((item) => item.count > 0);
    const safeHighRiskKeywordData =
      highRiskKeywordData.length > 0 ? highRiskKeywordData : isLiveMode ? [] : [{ word: 'wala', count: 0 }];

    const zoneCounter = new Map<string, number>();
    for (const msg of sortedByTime) {
      const farmer = farmers.find((f) => f.id === msg.farmerId);
      const zone = farmer?.sitio ?? 'Hindi tukoy';
      zoneCounter.set(zone, (zoneCounter.get(zone) ?? 0) + 1);
    }
    const geographicHotspotData = [...zoneCounter.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([zone, issues]) => ({ zone, issues }));
    const safeGeographicHotspotData =
      geographicHotspotData.length > 0
        ? geographicHotspotData
        : isLiveMode
          ? []
          : [{ zone: 'Walang zone', issues: 0 }];

    const seasonalMap = new Map<number, number>();
    for (const msg of sortedByTime) {
      seasonalMap.set(asDate(msg.timestamp).getMonth(), (seasonalMap.get(asDate(msg.timestamp).getMonth()) ?? 0) + 1);
    }
    const seasonalTrendData = MONTH_NAMES.map((month, idx) => ({
      month,
      reports: seasonalMap.get(idx) ?? 0,
    }));

    const issueTrendsData = Array.from({ length: 4 }, (_, idx) => {
      const d = new Date(latestDate);
      d.setDate(latestDate.getDate() - ((3 - idx) * 2));
      const key = dateKey(d);
      const dayMessages = sortedByTime.filter((m) => dateKey(asDate(m.timestamp)) <= key);
      const breakdown = issueBreakdown(dayMessages);
      return {
        date: `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`,
        MgaPeste: breakdown.pests,
        Sakit: breakdown.sakit,
        Patubig: breakdown.patubig,
      };
    });

    const outbreakAlertData = issueTrendsData.map((d) => ({ date: d.date, ulat: d.MgaPeste }));

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

    const aiConfidenceTrendData = Array.from({ length: 4 }, (_, idx) => {
      const start = new Date(latestDate);
      start.setDate(latestDate.getDate() - ((3 - idx) * 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const window = sortedByTime.filter((m) => {
        const ts = asDate(m.timestamp).getTime();
        return ts >= start.getTime() && ts <= end.getTime();
      });
      const avg = window.length > 0 ? window.reduce((acc, m) => acc + m.aiConfidence, 0) / window.length : 0;
      return {
        date: `${MONTH_NAMES[end.getMonth()]} ${String(end.getDate()).padStart(2, '0')}`,
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

    const cropStageData = isLiveMode
      ? []
      : [
          { name: 'Pagtatanim', value: farmers.filter((f) => f.status === 'pending_approval').length, fill: COLOR_1 },
          { name: 'Paglago', value: farmers.filter((f) => f.status === 'active').length, fill: COLOR_2 },
          { name: 'Pamumulaklak', value: Math.max(0, Math.floor(farmers.length * 0.25)), fill: COLOR_3 },
          { name: 'Pag-aani', value: sortedByTime.filter((m) => m.parsedIntent === 'HARVEST').length, fill: COLOR_4 },
        ];

    const interventionEventMonths = new Map<number, number>();
    for (const task of filteredFieldVisitTasks) {
      const month = asDate(task.scheduledFor).getMonth();
      interventionEventMonths.set(month, (interventionEventMonths.get(month) ?? 0) + 1);
    }
    for (const record of filteredAssistanceRecords) {
      const month = asDate(record.updatedAt).getMonth();
      interventionEventMonths.set(month, (interventionEventMonths.get(month) ?? 0) + 1);
    }
    const interventionSupportData = MONTH_NAMES.slice(0, 5).map((month, idx) => ({
      month,
      visits: interventionEventMonths.get(idx) ?? 0,
    }));

    const validationQueueData = [
      { name: 'Nakabinbin', value: sortedByTime.filter((m) => m.status === 'pending_approval').length, fill: COLOR_2 },
      { name: 'Nalutas', value: sortedByTime.filter((m) => m.status !== 'pending_approval').length, fill: COLOR_1 },
    ];

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
      smsVolumeData,
      issueTrendsData,
      adviceSuccessData,
      cropStageData,
      topKeywordsData: safeTopKeywordsData,
      languageUsageData,
      smsPeakHoursData,
      interventionSupportData,
      validationQueueData,
      advisoryDeliveryData,
      followUpRateData,
      aiConfidenceTrendData,
      correctionLogData,
      aiAgreementData,
      highRiskKeywordData: safeHighRiskKeywordData,
      outbreakAlertData,
      severityIndexData,
      recommendationTypeData,
      messageLengthData,
      clarificationNeededData,
      topInquiriesData: safeTopInquiriesData,
      seasonalTrendData,
      farmerEngagementData,
      geographicHotspotData: safeGeographicHotspotData,
      smsDeliveryStatusData,
      messageToneData,
      responseTimeData,
    };
  }, [alertHistory, assistanceRecords, auditLogs, farmers, fieldVisitTasks, marketPrices, outboundMessages, resources, smsMessages, timeframe, vouchers]);
}

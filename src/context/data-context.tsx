
'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import type {
  AlertHistoryEntry,
  AlertHistorySeverity,
  AlertHistorySource,
  AlertHistoryType,
  AssistanceStatus,
  AuditLog,
  Farmer,
  FarmerAssistanceRecord,
  FieldVisitPriority,
  FieldVisitStatus,
  FieldVisitTask,
  KnowledgeArticle,
  KnowledgeArticleType,
  LogbookEntry,
  MarketPriceEntry,
  OutboundMessage,
  Resource,
  SmsCaseOutcomeStatus,
  SmsMessage,
  SmsTrainingExample,
  SystemSettings,
  User,
  Voucher,
  VoucherStatus,
} from '@/lib/types';
import { 
    alertHistory as initialAlertHistory,
    assistanceRecords as initialAssistanceRecords,
    farmers as initialFarmers, 
    fieldVisitTasks as initialFieldVisitTasks,
    outboundMessages as initialOutboundMessages,
    smsMessages as initialSmsMessages,
    smsTrainingExamples as initialSmsTrainingExamples,
    marketPrices as initialMarketPrices,
    resources as initialResources,
    knowledgeArticles as initialKnowledgeArticles,
    farmerLogbookEntries as initialLogbookEntries,
    auditLogs as initialAuditLogs,
    registeredUsers as initialUsers,
    vouchers as initialVouchers
} from '@/lib/data';
import type { FarmerRegistrationValues, UserManagementValues } from '@/lib/schemas';
import type { InboundSmsAnalysis } from '@/lib/sms-simulator';
import { isDemoMode, isLiveMode } from '@/lib/config/app-mode';
import { useAuth } from '@/context/auth-context';
import { getClientFirestore } from '@/lib/firebase/client';
import { firebaseCollections } from '@/lib/firebase/collections';
import { smsProvider } from '@/lib/providers/sms';
import { alertHistoryRepository, assistanceRepository, auditRepository, farmerRepository, fieldVisitRepository, knowledgeRepository, logbookRepository, marketPriceRepository, outboundMessageRepository, resourceRepository, smsRepository, smsTrainingRepository, systemSettingsRepository, userRepository, voucherRepository } from '@/lib/repositories';
import type { PortableAppBackup, PortableAppDataBundle } from '@/lib/data-portability';
import { isAutoReplyOverdue } from '@/lib/services/auto-reply-service';
import { processDueFollowUpMessage, isFollowUpDue } from '@/lib/services/follow-up-service';
import { processOverdueSmsMessage } from '@/lib/services/overdue-sms-service';
import { sendOutboundMessage } from '@/lib/services/outbound-sms-service';
import { applyPriceWatchAdvice } from '@/lib/services/price-watch-service';
import { createSmsTrainingExample } from '@/lib/services/sms-training-service';
import { applySmsStatusUpdate, processInboundSms } from '@/lib/services/sms-workflow-service';
import { getCaseStatusForOutcome, getSmsCaseOutcomeMeta } from '@/lib/sms-case-outcomes';
import {
  appendOfflineMutation,
  createOfflineMutationId,
  readOfflineMutations,
  sanitizeLogbookEntry,
  writeOfflineMutations,
  type OfflineMutation,
} from '@/lib/offline-outbox';
import { defaultSystemSettings, mergeSystemSettings, SYSTEM_SETTINGS_DOCUMENT_ID } from '@/lib/system-settings';
import { getUserRecordId } from '@/lib/user-record';

type NewResourceData = {
  name: string;
  category: Resource['category'];
  stock: number;
  unit: string;
};

type NewMarketPriceData = {
  crop: string;
  price: number;
  unit: string;
  source: string;
  trend: MarketPriceEntry['trend'];
};

type NewAlertBroadcastData = {
  title: string;
  type: AlertHistoryType;
  severity: AlertHistorySeverity;
  message: string;
  recommendation: string;
  source: AlertHistorySource;
  recipientFarmerIds?: string[];
};

type NewAssistanceRecordData = {
  farmerId: string;
  type: FarmerAssistanceRecord['type'];
  title: string;
  details: string;
  quantity?: string;
  nextAction?: string;
  resourceId?: string;
  providedBy?: string;
};

type NewFieldVisitTaskData = {
  farmerId: string;
  title: string;
  purpose: string;
  scheduledFor: string;
  assignedTo?: string;
  priority: FieldVisitPriority;
  notes?: string;
  relatedSmsId?: string;
};

export type NewKnowledgeArticleData = {
  title: string;
  summary: string;
  keywords: string[];
  type: KnowledgeArticleType;
  content: string;
  audioUrl?: string;
};

export type NewInboundSmsData = {
  phone: string;
  message: string;
  analysis?: InboundSmsAnalysis;
};

interface DataContextType {
  farmers: Farmer[];
  setFarmers: React.Dispatch<React.SetStateAction<Farmer[]>>;
  updateFarmerRecord: (farmerId: string, updates: Partial<Farmer>) => void;
  updateFarmerStatus: (farmerId: string, status: Farmer['status']) => void;
  updateManyFarmerStatuses: (farmerIds: string[], status: Farmer['status']) => number;
  deleteFarmerRecord: (farmerId: string) => void;
  smsMessages: SmsMessage[];
  outboundMessages: OutboundMessage[];
  addInboundSms: (data: NewInboundSmsData) => SmsMessage;
  webhookBridgeStatus: 'idle' | 'syncing' | 'error';
  updateSmsMessage: (
    messageId: string,
    updates: Partial<Pick<SmsMessage, 'status' | 'aiAdvice' | 'parsedIntent' | 'urgency' | 'safetyFlag' | 'tone'>>
  ) => void;
  assignSmsMessage: (messageId: string, assigneeName?: string) => void;
  updateSmsCaseOutcome: (messageId: string, outcomeStatus: SmsCaseOutcomeStatus, summary: string) => void;
  closeSmsCase: (messageId: string, resolutionNote?: string) => void;
  resources: Resource[];
  addResource: (data: NewResourceData) => void;
  updateResource: (resourceId: string, data: Partial<Omit<Resource, 'id' | 'lastUpdated'>>) => void;
  deleteResource: (resourceId: string) => void;
  marketPrices: MarketPriceEntry[];
  addMarketPriceEntry: (data: NewMarketPriceData) => void;
  updateMarketPriceEntry: (entryId: string, data: NewMarketPriceData) => void;
  deleteMarketPriceEntry: (entryId: string) => void;
  knowledgeArticles: KnowledgeArticle[];
  addKnowledgeArticle: (data: NewKnowledgeArticleData) => void;
  setKnowledgeArticles: React.Dispatch<React.SetStateAction<KnowledgeArticle[]>>;
  logbook: LogbookEntry[];
  addLogbookEntry: (entry: Omit<LogbookEntry, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  setLogbook: React.Dispatch<React.SetStateAction<LogbookEntry[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  alertHistory: AlertHistoryEntry[];
  broadcastAlert: (data: NewAlertBroadcastData) => Promise<AlertHistoryEntry>;
  assistanceRecords: FarmerAssistanceRecord[];
  addAssistanceRecord: (data: NewAssistanceRecordData) => FarmerAssistanceRecord;
  updateAssistanceRecordStatus: (recordId: string, status: AssistanceStatus) => void;
  fieldVisitTasks: FieldVisitTask[];
  scheduleFieldVisit: (data: NewFieldVisitTaskData) => FieldVisitTask;
  updateFieldVisitTaskStatus: (taskId: string, status: FieldVisitStatus) => void;
  smsTrainingExamples: SmsTrainingExample[];
  exportPortableBackup: () => PortableAppBackup;
  importPortableBackup: (backup: PortableAppBackup) => Promise<{ importedCollections: string[]; importedRecords: number }>;
  importSmsTrainingExamples: (examples: SmsTrainingExample[]) => Promise<number>;
  importKnowledgeArticles: (articles: KnowledgeArticle[]) => Promise<number>;
  systemSettings: SystemSettings;
  saveSystemSettings: (settings: SystemSettings) => Promise<void>;
  users: User[];
  addUser: (user: UserManagementValues) => void;
  updateUser: (userId: string, updatedUser: User) => void;
  deleteUser: (userId: string) => void;
  addPendingFarmer: (farmerData: FarmerRegistrationValues) => void;
  vouchers: Voucher[];
  addVoucher: (voucher: Omit<Voucher, 'id' | 'code' | 'status' | 'issueDate'>) => void;
  updateVoucherStatus: (voucherId: string, status: VoucherStatus) => void;
  retryOutboundMessage: (outboundId: string) => Promise<OutboundMessage | null>;
  offlineMode: boolean;
  offlineSyncing: boolean;
  offlineOutboxCount: number;
  syncOfflineChanges: () => Promise<{ processedCount: number; remainingCount: number }>;
  resetDemoData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function createEntityId(prefix: string) {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function mergeById<T extends { id: string }>(currentItems: T[], importedItems: T[]) {
  const merged = new Map<string, T>();

  for (const item of currentItems) {
    merged.set(item.id, item);
  }

  let importedRecords = 0;

  for (const item of importedItems) {
    merged.set(item.id, item);
    importedRecords += 1;
  }

  return {
    items: Array.from(merged.values()),
    importedRecords,
  };
}

function sortByDateDescending<T>(items: T[], getDateValue: (item: T) => string) {
  return [...items].sort((left, right) => normalizeTimestamp(getDateValue(right)) - normalizeTimestamp(getDateValue(left)));
}

function sortByDateAscending<T>(items: T[], getDateValue: (item: T) => string) {
  return [...items].sort((left, right) => normalizeTimestamp(getDateValue(left)) - normalizeTimestamp(getDateValue(right)));
}

function canUseBrowserStorage() {
  return typeof window !== 'undefined' ? window.localStorage : null;
}

function isLikelyOfflinePersistenceError(error: unknown) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('offline') ||
    message.includes('failed to fetch') ||
    message.includes('unavailable') ||
    message.includes('timeout')
  );
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { authLoading, currentUser, currentUserProfile } = useAuth();
  const autoReplyInFlight = React.useRef<Set<string>>(new Set());
  const followUpInFlight = React.useRef<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  
  const [farmers, setFarmers] = useState<Farmer[]>(initialFarmers);
  const [smsMessages, setSmsMessages] = useState<SmsMessage[]>(initialSmsMessages);
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [marketPrices, setMarketPrices] = useState<MarketPriceEntry[]>(initialMarketPrices);
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>(initialKnowledgeArticles);
  const [logbook, setLogbook] = useState<LogbookEntry[]>(initialLogbookEntries);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryEntry[]>(initialAlertHistory);
  const [assistanceRecords, setAssistanceRecords] = useState<FarmerAssistanceRecord[]>(initialAssistanceRecords);
  const [fieldVisitTasks, setFieldVisitTasks] = useState<FieldVisitTask[]>(initialFieldVisitTasks);
  const [smsTrainingExamples, setSmsTrainingExamples] = useState<SmsTrainingExample[]>(initialSmsTrainingExamples);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(defaultSystemSettings);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [outboundMessages, setOutboundMessages] = useState<OutboundMessage[]>(initialOutboundMessages);
  const [webhookBridgeStatus, setWebhookBridgeStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [offlineMode, setOfflineMode] = useState(false);
  const [offlineSyncing, setOfflineSyncing] = useState(false);
  const [offlineOutboxCount, setOfflineOutboxCount] = useState(0);

  const queueOfflineMutation = useCallback((mutation: OfflineMutation) => {
    const storage = canUseBrowserStorage();
    const next = appendOfflineMutation(mutation, storage);
    setOfflineOutboxCount(next.length);
  }, []);

  const persistOfflineOutbox = useCallback((mutations: OfflineMutation[]) => {
    writeOfflineMutations(mutations, canUseBrowserStorage());
    setOfflineOutboxCount(mutations.length);
  }, []);

  const shouldQueueLiveMutation = useCallback((error?: unknown) => {
    if (!isLiveMode) {
      return false;
    }

    return offlineMode || isLikelyOfflinePersistenceError(error);
  }, [offlineMode]);

  const processOfflineMutation = useCallback(async (mutation: OfflineMutation) => {
    switch (mutation.type) {
      case 'save-system-settings':
        await systemSettingsRepository.saveSettings(mutation.payload.settings);
        return;
      case 'update-farmer-record':
        await Promise.all([
          farmerRepository.updateFarmer(mutation.payload.farmerId, mutation.payload.updates),
          auditRepository.createAuditLog(mutation.payload.auditLog),
        ]);
        return;
      case 'create-logbook-entry':
        await logbookRepository.createEntry(mutation.payload.entry);
        return;
      case 'create-assistance-activity':
        await Promise.all([
          assistanceRepository.createAssistanceRecord(mutation.payload.record),
          logbookRepository.createEntry(mutation.payload.logbookEntry),
          auditRepository.createAuditLog(mutation.payload.auditLog),
        ]);
        return;
      case 'update-assistance-status':
        await Promise.all([
          assistanceRepository.updateAssistanceRecord(mutation.payload.recordId, mutation.payload.updates),
          logbookRepository.createEntry(mutation.payload.logbookEntry),
          auditRepository.createAuditLog(mutation.payload.auditLog),
        ]);
        return;
      case 'schedule-field-visit':
        await Promise.all([
          fieldVisitRepository.createFieldVisitTask(mutation.payload.task),
          logbookRepository.createEntry(mutation.payload.logbookEntry),
          auditRepository.createAuditLog(mutation.payload.auditLog),
        ]);
        return;
      case 'update-field-visit-status':
        await Promise.all([
          fieldVisitRepository.updateFieldVisitTask(mutation.payload.taskId, mutation.payload.updates),
          logbookRepository.createEntry(mutation.payload.logbookEntry),
          auditRepository.createAuditLog(mutation.payload.auditLog),
        ]);
        return;
      case 'update-sms-message': {
        await smsRepository.updateMessage(mutation.payload.messageId, mutation.payload.updates);

        if (mutation.payload.auditLog) {
          await auditRepository.createAuditLog(mutation.payload.auditLog);
        }

        if (mutation.payload.responseLogbookEntry) {
          await logbookRepository.createEntry(mutation.payload.responseLogbookEntry);
        }

        if (mutation.payload.trainingExample) {
          await smsTrainingRepository.createTrainingExample(mutation.payload.trainingExample);
        }

        if (mutation.payload.outboundReply) {
          const outboundRecord = await sendOutboundMessage({
            sourceMessage: mutation.payload.outboundReply.sourceMessage,
            body: mutation.payload.outboundReply.body,
            provider: smsProvider,
            providerName: mutation.payload.outboundReply.providerName,
          });
          setOutboundMessages((records) => [outboundRecord, ...records]);
          await outboundMessageRepository.createOutboundMessage(outboundRecord);
        }
        return;
      }
      case 'assign-sms-message':
        await Promise.all([
          smsRepository.updateMessage(mutation.payload.messageId, mutation.payload.updates),
          auditRepository.createAuditLog(mutation.payload.auditLog),
        ]);
        return;
      case 'update-sms-case-outcome':
        await Promise.all([
          smsRepository.updateMessage(mutation.payload.messageId, mutation.payload.updates),
          auditRepository.createAuditLog(mutation.payload.auditLog),
          logbookRepository.createEntry(mutation.payload.logbookEntry),
        ]);
        return;
      case 'close-sms-case':
        await Promise.all([
          smsRepository.updateMessage(mutation.payload.messageId, mutation.payload.updates),
          auditRepository.createAuditLog(mutation.payload.auditLog),
          logbookRepository.createEntry(mutation.payload.logbookEntry),
        ]);
        return;
      case 'create-knowledge-article':
        await knowledgeRepository.createKnowledgeArticle(mutation.payload.article);
        return;
      default:
        return;
    }
  }, []);

  const syncOfflineChanges = useCallback(async () => {
    const storage = canUseBrowserStorage();
    const pending = readOfflineMutations(storage);

    if (!isLiveMode || offlineSyncing || pending.length === 0) {
      return {
        processedCount: 0,
        remainingCount: pending.length,
      };
    }

    setOfflineSyncing(true);
    const remaining: OfflineMutation[] = [];
    let processedCount = 0;

    for (const mutation of pending) {
      try {
        await processOfflineMutation(mutation);
        processedCount += 1;
      } catch (error) {
        remaining.push({
          ...mutation,
          attempts: (mutation.attempts ?? 0) + 1,
          lastError: error instanceof Error ? error.message : 'Unknown sync failure',
        });
      }
    }

    persistOfflineOutbox(remaining);
    setOfflineSyncing(false);

    return {
      processedCount,
      remainingCount: remaining.length,
    };
  }, [offlineSyncing, persistOfflineOutbox, processOfflineMutation]);

  useEffect(() => {
    if (!isDemoMode) return;

    try {
      const storedFarmers = localStorage.getItem('farmers');
      if (storedFarmers) setFarmers(JSON.parse(storedFarmers));

      const storedSms = localStorage.getItem('smsMessages');
      if (storedSms) setSmsMessages(JSON.parse(storedSms));

      const storedResources = localStorage.getItem('resources');
      if (storedResources) setResources(JSON.parse(storedResources));

      const storedMarketPrices = localStorage.getItem('marketPrices');
      if (storedMarketPrices) setMarketPrices(JSON.parse(storedMarketPrices));

      const storedKnowledge = localStorage.getItem('knowledgeArticles');
      if (storedKnowledge) setKnowledgeArticles(JSON.parse(storedKnowledge));
      
      const storedLogbook = localStorage.getItem('logbook');
      if (storedLogbook) setLogbook(JSON.parse(storedLogbook));

      const storedAudit = localStorage.getItem('auditLogs');
      if (storedAudit) setAuditLogs(JSON.parse(storedAudit));

      const storedAlertHistory = localStorage.getItem('alertHistory');
      if (storedAlertHistory) setAlertHistory(JSON.parse(storedAlertHistory));

      const storedAssistanceRecords = localStorage.getItem('assistanceRecords');
      if (storedAssistanceRecords) setAssistanceRecords(JSON.parse(storedAssistanceRecords));

      const storedFieldVisitTasks = localStorage.getItem('fieldVisitTasks');
      if (storedFieldVisitTasks) setFieldVisitTasks(JSON.parse(storedFieldVisitTasks));

      const storedTrainingExamples = localStorage.getItem('smsTrainingExamples');
      if (storedTrainingExamples) setSmsTrainingExamples(JSON.parse(storedTrainingExamples));

      const storedSystemSettings = localStorage.getItem('systemSettings');
      if (storedSystemSettings) setSystemSettings(mergeSystemSettings(JSON.parse(storedSystemSettings)));

      const storedUsers = localStorage.getItem('users');
      if (storedUsers) setUsers(JSON.parse(storedUsers));
      
      const storedVouchers = localStorage.getItem('vouchers');
      if (storedVouchers) setVouchers(JSON.parse(storedVouchers));

      const storedOutbound = localStorage.getItem('outboundMessages');
      if (storedOutbound) setOutboundMessages(JSON.parse(storedOutbound));

    } catch (error) {
      console.error("Error loading data from localStorage", error);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!isLiveMode || typeof window === 'undefined') {
      return;
    }

    setOfflineMode(!navigator.onLine);
    const pendingMutations = readOfflineMutations(window.localStorage);
    setOfflineOutboxCount(pendingMutations.length);
    if (navigator.onLine && pendingMutations.length > 0) {
      void syncOfflineChanges();
    }

    const handleOnline = () => {
      setOfflineMode(false);
      void syncOfflineChanges();
    };
    const handleOffline = () => {
      setOfflineMode(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineChanges]);

  useEffect(() => {
    if (!isLiveMode) return;
    if (authLoading) return;

    if (!currentUser) {
      setHydrated(true);
      return;
    }

    try {
      const db = getClientFirestore();
      const unsubscribers = [
        onSnapshot(doc(db, firebaseCollections.systemSettings, SYSTEM_SETTINGS_DOCUMENT_ID), (snapshot) => {
          setSystemSettings(mergeSystemSettings(snapshot.exists() ? (snapshot.data() as Partial<SystemSettings>) : null));
        }),
        onSnapshot(query(collection(db, firebaseCollections.resources), orderBy('lastUpdated', 'desc')), (snapshot) => {
          setResources(snapshot.docs.map((item) => item.data() as Resource));
          setWebhookBridgeStatus('idle');
        }),
        onSnapshot(query(collection(db, firebaseCollections.marketPrices), orderBy('updatedAt', 'desc')), (snapshot) => {
          setMarketPrices(snapshot.docs.map((item) => item.data() as MarketPriceEntry));
        }),
        onSnapshot(query(collection(db, firebaseCollections.alertHistory), orderBy('timestamp', 'desc')), (snapshot) => {
          setAlertHistory(snapshot.docs.map((item) => item.data() as AlertHistoryEntry));
        }),
        onSnapshot(query(collection(db, firebaseCollections.assistanceRecords), orderBy('updatedAt', 'desc')), (snapshot) => {
          setAssistanceRecords(snapshot.docs.map((item) => item.data() as FarmerAssistanceRecord));
        }),
        onSnapshot(query(collection(db, firebaseCollections.fieldVisitTasks), orderBy('scheduledFor', 'asc')), (snapshot) => {
          setFieldVisitTasks(snapshot.docs.map((item) => item.data() as FieldVisitTask));
        }),
        onSnapshot(query(collection(db, firebaseCollections.knowledgeArticles), orderBy('lastUpdated', 'desc')), (snapshot) => {
          setKnowledgeArticles(snapshot.docs.map((item) => item.data() as KnowledgeArticle));
        }),
        onSnapshot(query(collection(db, firebaseCollections.vouchers), orderBy('issueDate', 'desc')), (snapshot) => {
          setVouchers(snapshot.docs.map((item) => item.data() as Voucher));
        }),
        onSnapshot(query(collection(db, firebaseCollections.farmers), orderBy('registrationDate', 'desc')), (snapshot) => {
          setFarmers(snapshot.docs.map((item) => item.data() as Farmer));
        }),
        onSnapshot(query(collection(db, firebaseCollections.smsMessages), orderBy('timestamp', 'desc')), (snapshot) => {
          setSmsMessages(snapshot.docs.map((item) => item.data() as SmsMessage));
        }),
        onSnapshot(query(collection(db, firebaseCollections.auditLogs), orderBy('timestamp', 'desc')), (snapshot) => {
          setAuditLogs(snapshot.docs.map((item) => item.data() as AuditLog));
        }),
        onSnapshot(query(collection(db, firebaseCollections.outboundMessages), orderBy('createdAt', 'desc')), (snapshot) => {
          setOutboundMessages(snapshot.docs.map((item) => item.data() as OutboundMessage));
        }),
        onSnapshot(query(collection(db, firebaseCollections.logbookEntries), orderBy('timestamp', 'desc')), (snapshot) => {
          setLogbook(snapshot.docs.map((item) => item.data() as LogbookEntry));
        }),
        onSnapshot(query(collection(db, firebaseCollections.smsTrainingExamples), orderBy('finalReview.reviewedAt', 'desc')), (snapshot) => {
          setSmsTrainingExamples(snapshot.docs.map((item) => item.data() as SmsTrainingExample));
        }),
      ];

      if (currentUserProfile?.role === 'developer') {
        unsubscribers.push(
          onSnapshot(query(collection(db, firebaseCollections.users), orderBy('name', 'asc')), (snapshot) => {
            setUsers(snapshot.docs.map((item) => ({
              id: item.id,
              ...(item.data() as User),
            })));
          })
        );
      } else {
        setUsers(currentUserProfile ? [currentUserProfile] : []);
      }

      setHydrated(true);

      return () => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
      };
    } catch (error) {
      console.error("Error attaching live listeners", error);
      setWebhookBridgeStatus('error');
      setHydrated(true);
    }
  }, [authLoading, currentUser, currentUserProfile]);

  useEffect(() => { if (hydrated && isDemoMode) localStorage.setItem('farmers', JSON.stringify(farmers)); }, [farmers, hydrated]);
  useEffect(() => { if (hydrated && isDemoMode) localStorage.setItem('smsMessages', JSON.stringify(smsMessages)); }, [smsMessages, hydrated]);
  useEffect(() => { if (hydrated && isDemoMode) localStorage.setItem('resources', JSON.stringify(resources)); }, [resources, hydrated]);
  useEffect(() => { if (hydrated && isDemoMode) localStorage.setItem('marketPrices', JSON.stringify(marketPrices)); }, [marketPrices, hydrated]);
  useEffect(() => { if (hydrated && isDemoMode) localStorage.setItem('knowledgeArticles', JSON.stringify(knowledgeArticles)); }, [knowledgeArticles, hydrated]);
  useEffect(() => { if (hydrated && isDemoMode) localStorage.setItem('logbook', JSON.stringify(logbook)); }, [logbook, hydrated]);
  useEffect(() => { if (hydrated && isDemoMode) localStorage.setItem('auditLogs', JSON.stringify(auditLogs)); }, [auditLogs, hydrated]);
  useEffect(() => { if (hydrated && isDemoMode) localStorage.setItem('alertHistory', JSON.stringify(alertHistory)); }, [alertHistory, hydrated]);
  useEffect(() => { if (hydrated && isDemoMode) localStorage.setItem('assistanceRecords', JSON.stringify(assistanceRecords)); }, [assistanceRecords, hydrated]);
  useEffect(() => { if (hydrated && isDemoMode) localStorage.setItem('fieldVisitTasks', JSON.stringify(fieldVisitTasks)); }, [fieldVisitTasks, hydrated]);
  useEffect(() => { if (hydrated && isDemoMode) localStorage.setItem('smsTrainingExamples', JSON.stringify(smsTrainingExamples)); }, [smsTrainingExamples, hydrated]);
  useEffect(() => { if (hydrated && isDemoMode) localStorage.setItem('systemSettings', JSON.stringify(systemSettings)); }, [systemSettings, hydrated]);
  useEffect(() => {
    if (hydrated && isDemoMode) {
      localStorage.setItem('users', JSON.stringify(users));
      window.dispatchEvent(new Event('demo-session-change'));
    }
  }, [users, hydrated]);
  useEffect(() => { if (hydrated && isDemoMode) localStorage.setItem('vouchers', JSON.stringify(vouchers)); }, [vouchers, hydrated]);
  useEffect(() => { if (hydrated && isDemoMode) localStorage.setItem('outboundMessages', JSON.stringify(outboundMessages)); }, [outboundMessages, hydrated]);

  useEffect(() => {
    if (!hydrated || isLiveMode) return;

    let active = true;

    const syncWebhookQueue = async () => {
      try {
        setWebhookBridgeStatus('syncing');
        const response = await fetch('/api/webhooks/inbound-sms/consume', {
          method: 'POST',
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Webhook bridge failed');
        }

        const payload = await response.json();
        const items = Array.isArray(payload.items) ? payload.items : [];

        if (!active) return;

        for (const item of items) {
          const timestamp = new Date().toISOString();
          const workflow = processInboundSms({
            phone: item.phone,
            message: item.message,
            farmers,
            analysis: item.analysis,
            settings: systemSettings,
            timestamp,
            id: `SMS${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            sourceProvider: item.provider,
            externalId: item.externalId,
          });
          const newMessage = applyPriceWatchAdvice(workflow.message, marketPrices);

          setSmsMessages(prev => [newMessage, ...prev]);
          setAuditLogs(prev => [
            {
              ...workflow.auditLog,
              details: `Tumanggap ng bagong SMS mula sa ${newMessage.farmerName} (${item.phone}) sa webhook bridge.`,
            },
            ...prev,
          ]);

          if (workflow.farmerUpdates.length > 0) {
            setFarmers(prev => prev.map(entry => {
              const update = workflow.farmerUpdates.find(itemUpdate => itemUpdate.farmerId === entry.id);
              return update ? { ...entry, ...update.updates } : entry;
            }));
          }

          if (workflow.newFarmer) {
            setFarmers(prev => [workflow.newFarmer as Farmer, ...prev]);
          }
        }

        setWebhookBridgeStatus('idle');
      } catch {
        if (active) {
          setWebhookBridgeStatus('error');
        }
      }
    };

    void syncWebhookQueue();
    const interval = window.setInterval(() => {
      void syncWebhookQueue();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [farmers, hydrated, marketPrices, systemSettings]);

  useEffect(() => {
    if (!hydrated) return;
    if (isLiveMode && (authLoading || !currentUser)) return;

    let active = true;

    const processOverdueMessages = async () => {
      const overdueMessages = smsMessages.filter((message) => (
        isAutoReplyOverdue(message, undefined, systemSettings) && !autoReplyInFlight.current.has(message.id)
      ));

      for (const message of overdueMessages) {
        autoReplyInFlight.current.add(message.id);

        try {
          const result = await processOverdueSmsMessage({
            message,
            settings: systemSettings,
            provider: smsProvider,
            providerName: isDemoMode ? 'mock-sms-provider' : 'live-sms-provider',
            actorName: 'system',
          });

          if (!result) {
            continue;
          }

          if (!active) return;

          setSmsMessages(prev => prev.map((item) => (
            item.id === message.id ? result.updatedMessage : item
          )));
          setAuditLogs(prev => [result.auditLog, ...prev]);
          setLogbook(prev => [result.logbookEntry, ...prev]);
          setOutboundMessages(prev => [result.outboundRecord, ...prev]);

          await Promise.all([
            smsRepository.updateMessage(message.id, {
              autoReplyEligibleAt: result.updatedMessage.autoReplyEligibleAt,
              autoReplySentAt: result.updatedMessage.autoReplySentAt,
              respondedAt: result.updatedMessage.respondedAt,
              escalatedAt: result.updatedMessage.escalatedAt,
              caseStatus: result.updatedMessage.caseStatus,
            }),
            auditRepository.createAuditLog(result.auditLog),
            logbookRepository.createEntry(result.logbookEntry),
            outboundMessageRepository.createOutboundMessage(result.outboundRecord),
          ]);
        } catch (error) {
          console.error("Failed to process overdue SMS auto reply", error);
        } finally {
          autoReplyInFlight.current.delete(message.id);
        }
      }
    };

    void processOverdueMessages();
    const interval = window.setInterval(() => {
      void processOverdueMessages();
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authLoading, currentUser, currentUserProfile, hydrated, smsMessages, systemSettings]);

  useEffect(() => {
    if (!hydrated || isLiveMode) return;

    let active = true;

    const processFollowUps = async () => {
      const dueMessages = smsMessages.filter((message) => (
        isFollowUpDue(message) && !followUpInFlight.current.has(message.id)
      ));

      for (const message of dueMessages) {
        followUpInFlight.current.add(message.id);

        try {
          const result = await processDueFollowUpMessage({
            message,
            provider: smsProvider,
            providerName: 'mock-sms-provider',
            actorName: 'system',
          });

          if (!result || !active) {
            continue;
          }

          setSmsMessages(prev => prev.map((item) => (
            item.id === message.id ? result.updatedMessage : item
          )));
          setAuditLogs(prev => [result.auditLog, ...prev]);
          setLogbook(prev => [result.logbookEntry, ...prev]);
          setOutboundMessages(prev => [result.outboundRecord, ...prev]);

          await Promise.all([
            smsRepository.updateMessage(message.id, {
              followUpSentAt: result.updatedMessage.followUpSentAt,
            }),
            auditRepository.createAuditLog(result.auditLog),
            logbookRepository.createEntry(result.logbookEntry),
            outboundMessageRepository.createOutboundMessage(result.outboundRecord),
          ]);
        } catch (error) {
          console.error("Failed to process due follow-up SMS", error);
        } finally {
          followUpInFlight.current.delete(message.id);
        }
      }
    };

    void processFollowUps();
    const interval = window.setInterval(() => {
      void processFollowUps();
    }, 60000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [hydrated, smsMessages]);


  const addUser = (userData: UserManagementValues) => {
    const timestamp = new Date().toISOString();
    const actorName = currentUserProfile?.name ?? 'Developer';
    const newUser: User = {
        id: userData.email,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        title: userData.title,
        barangay: 'Batakil',
        phone: userData.phone,
        status: userData.status,
        preferredWorkspace: userData.preferredWorkspace,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'CREATE_USER_ACCESS',
      details: `${newUser.name} (${newUser.email}) - ${newUser.role}, ${newUser.status}, ${newUser.preferredWorkspace}`,
    };
    setUsers(prev => [...prev, newUser].sort((a, b) => a.name.localeCompare(b.name)));
    setAuditLogs(prev => [auditLog, ...prev]);
    void userRepository.createUser(newUser).catch((error) => {
      console.error("Failed to persist user", error);
    });
    void auditRepository.createAuditLog(auditLog).catch((error) => {
      console.error("Failed to persist user creation audit log", error);
    });
  };

  const saveSystemSettings = async (settings: SystemSettings) => {
    const nextSettings = mergeSystemSettings({
      ...settings,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserProfile?.name ?? settings.updatedBy ?? 'Brgy. Admin',
    });
    setSystemSettings(nextSettings);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('settings'),
        type: 'save-system-settings',
        createdAt: new Date().toISOString(),
        payload: { settings: nextSettings },
      });
      return;
    }

    try {
      await systemSettingsRepository.saveSettings(nextSettings);
    } catch (error) {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('settings'),
          type: 'save-system-settings',
          createdAt: new Date().toISOString(),
          payload: { settings: nextSettings },
        });
        return;
      }

      console.error("Failed to persist system settings", error);
    }
  };

  const updateUser = (userId: string, updatedUser: User) => {
    const nextUser: User = {
      ...updatedUser,
      id: updatedUser.id ?? updatedUser.uid ?? userId,
      uid: updatedUser.uid ?? updatedUser.id ?? userId,
      updatedAt: new Date().toISOString(),
    };
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp: nextUser.updatedAt ?? new Date().toISOString(),
      user: actorName,
      action: 'UPDATE_USER_RECORD',
      details: `${nextUser.name} (${nextUser.email}) - ${nextUser.role}, ${nextUser.status ?? 'active'}, ${nextUser.preferredWorkspace ?? 'simple'}`,
    };
    setUsers(prev => prev.map(u => (getUserRecordId(u) === userId ? nextUser : u)).sort((a, b) => a.name.localeCompare(b.name)));
    setAuditLogs(prev => [auditLog, ...prev]);
    void userRepository.updateUser(userId, nextUser).catch((error) => {
      console.error("Failed to persist user update", error);
    });
    void auditRepository.createAuditLog(auditLog).catch((error) => {
      console.error("Failed to persist user update audit log", error);
    });
  };

  const deleteUser = (userId: string) => {
    const actorName = currentUserProfile?.name ?? 'Developer';
    const userToDelete = users.find((user) => getUserRecordId(user) === userId);
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp: new Date().toISOString(),
      user: actorName,
      action: 'DELETE_USER_ACCESS',
      details: userToDelete
        ? `${userToDelete.name} (${userToDelete.email})`
        : userId,
    };
    setUsers(prev => prev.filter(u => getUserRecordId(u) !== userId));
    setAuditLogs(prev => [auditLog, ...prev]);
    void userRepository.deleteUser(userId).catch((error) => {
      console.error("Failed to delete user", error);
    });
    void auditRepository.createAuditLog(auditLog).catch((error) => {
      console.error("Failed to persist user delete audit log", error);
    });
  };

  const exportPortableBackup = (): PortableAppBackup => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    exportedBy: currentUserProfile?.name ?? currentUserProfile?.email ?? 'Lingkod-Ani User',
    data: {
      farmers,
      smsMessages,
      outboundMessages,
      resources,
      marketPrices,
      knowledgeArticles,
      logbookEntries: logbook,
      auditLogs,
      alertHistory,
      assistanceRecords,
      fieldVisitTasks,
      smsTrainingExamples,
      systemSettings,
      vouchers,
    } satisfies PortableAppDataBundle,
  });

  const importSmsTrainingExamples = async (examples: SmsTrainingExample[]) => {
    if (examples.length === 0) {
      return 0;
    }

    const mergedExamples = mergeById(smsTrainingExamples, examples);
    const nextExamples = sortByDateDescending(
      mergedExamples.items,
      (example) => example.finalReview.reviewedAt
    );
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp: new Date().toISOString(),
      user: actorName,
      action: 'IMPORT_SMS_TRAINING_DATA',
      details: `${examples.length} SMS training examples ang in-import.`,
    };

    setSmsTrainingExamples(nextExamples);
    setAuditLogs((prev) => sortByDateDescending([auditLog, ...prev], (entry) => entry.timestamp));

    if (isLiveMode) {
      await Promise.all([
        ...examples.map((example) => smsTrainingRepository.createTrainingExample(example)),
        auditRepository.createAuditLog(auditLog),
      ]);
    }

    return mergedExamples.importedRecords;
  };

  const importKnowledgeArticles = async (articles: KnowledgeArticle[]) => {
    if (articles.length === 0) {
      return 0;
    }

    const mergedArticles = mergeById(knowledgeArticles, articles);
    const nextArticles = sortByDateDescending(
      mergedArticles.items,
      (article) => article.lastUpdated
    );
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp: new Date().toISOString(),
      user: actorName,
      action: 'IMPORT_KNOWLEDGE_ARTICLES',
      details: `${articles.length} knowledge articles ang in-import.`,
    };

    setKnowledgeArticles(nextArticles);
    setAuditLogs((prev) => sortByDateDescending([auditLog, ...prev], (entry) => entry.timestamp));

    if (isLiveMode) {
      await Promise.all([
        knowledgeRepository.updateKnowledgeArticles(nextArticles),
        auditRepository.createAuditLog(auditLog),
      ]);
    }

    return mergedArticles.importedRecords;
  };

  const importPortableBackup = async (backup: PortableAppBackup) => {
    const mergedFarmers = mergeById(farmers, backup.data.farmers);
    const mergedSmsMessages = mergeById(smsMessages, backup.data.smsMessages);
    const mergedOutboundMessages = mergeById(outboundMessages, backup.data.outboundMessages);
    const mergedResources = mergeById(resources, backup.data.resources);
    const mergedMarketPrices = mergeById(marketPrices, backup.data.marketPrices);
    const mergedKnowledgeArticles = mergeById(knowledgeArticles, backup.data.knowledgeArticles);
    const mergedLogbook = mergeById(logbook, backup.data.logbookEntries);
    const mergedAuditLogs = mergeById(auditLogs, backup.data.auditLogs);
    const mergedAlertHistory = mergeById(alertHistory, backup.data.alertHistory);
    const mergedAssistanceRecords = mergeById(assistanceRecords, backup.data.assistanceRecords);
    const mergedFieldVisitTasks = mergeById(fieldVisitTasks, backup.data.fieldVisitTasks);
    const mergedTrainingExamples = mergeById(smsTrainingExamples, backup.data.smsTrainingExamples);
    const mergedVouchers = mergeById(vouchers, backup.data.vouchers);
    const nextSystemSettings = mergeSystemSettings(backup.data.systemSettings);
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const importedCollections = Object.entries({
      farmers: backup.data.farmers.length,
      smsMessages: backup.data.smsMessages.length,
      outboundMessages: backup.data.outboundMessages.length,
      resources: backup.data.resources.length,
      marketPrices: backup.data.marketPrices.length,
      knowledgeArticles: backup.data.knowledgeArticles.length,
      logbookEntries: backup.data.logbookEntries.length,
      auditLogs: backup.data.auditLogs.length,
      alertHistory: backup.data.alertHistory.length,
      assistanceRecords: backup.data.assistanceRecords.length,
      fieldVisitTasks: backup.data.fieldVisitTasks.length,
      smsTrainingExamples: backup.data.smsTrainingExamples.length,
      vouchers: backup.data.vouchers.length,
      systemSettings: 1,
    })
      .filter(([, count]) => count > 0)
      .map(([collectionName]) => collectionName);
    const importedRecords =
      backup.data.farmers.length +
      backup.data.smsMessages.length +
      backup.data.outboundMessages.length +
      backup.data.resources.length +
      backup.data.marketPrices.length +
      backup.data.knowledgeArticles.length +
      backup.data.logbookEntries.length +
      backup.data.auditLogs.length +
      backup.data.alertHistory.length +
      backup.data.assistanceRecords.length +
      backup.data.fieldVisitTasks.length +
      backup.data.smsTrainingExamples.length +
      backup.data.vouchers.length;
    const importAuditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp: new Date().toISOString(),
      user: actorName,
      action: 'IMPORT_APP_BACKUP',
      details: `Nag-import ng backup para sa ${importedCollections.join(', ') || 'walang collection'} (${importedRecords} records).`,
    };

    setFarmers(sortByDateDescending(mergedFarmers.items, (item) => item.registrationDate));
    setSmsMessages(sortByDateDescending(mergedSmsMessages.items, (item) => item.timestamp));
    setOutboundMessages(sortByDateDescending(mergedOutboundMessages.items, (item) => item.createdAt));
    setResources(sortByDateDescending(mergedResources.items, (item) => item.lastUpdated));
    setMarketPrices(sortByDateDescending(mergedMarketPrices.items, (item) => item.updatedAt));
    setKnowledgeArticles(sortByDateDescending(mergedKnowledgeArticles.items, (item) => item.lastUpdated));
    setLogbook(sortByDateDescending(mergedLogbook.items, (item) => item.timestamp));
    setAlertHistory(sortByDateDescending(mergedAlertHistory.items, (item) => item.timestamp));
    setAssistanceRecords(sortByDateDescending(mergedAssistanceRecords.items, (item) => item.updatedAt));
    setFieldVisitTasks(sortByDateAscending(mergedFieldVisitTasks.items, (item) => item.scheduledFor));
    setSmsTrainingExamples(sortByDateDescending(mergedTrainingExamples.items, (item) => item.finalReview.reviewedAt));
    setVouchers(sortByDateDescending(mergedVouchers.items, (item) => item.issueDate));
    setSystemSettings(nextSystemSettings);
    setAuditLogs(sortByDateDescending([...mergedAuditLogs.items, importAuditLog], (item) => item.timestamp));

    if (isLiveMode) {
      await Promise.all([
        ...backup.data.farmers.map((item) => farmerRepository.createFarmer(item)),
        ...backup.data.smsMessages.map((item) => smsRepository.createInboundMessage(item)),
        ...backup.data.outboundMessages.map((item) => outboundMessageRepository.createOutboundMessage(item)),
        ...backup.data.resources.map((item) => resourceRepository.createResource(item)),
        ...backup.data.marketPrices.map((item) => marketPriceRepository.createMarketPriceEntry(item)),
        ...backup.data.logbookEntries.map((item) => logbookRepository.createEntry(item)),
        ...backup.data.auditLogs.map((item) => auditRepository.createAuditLog(item)),
        ...backup.data.alertHistory.map((item) => alertHistoryRepository.createAlertHistoryEntry(item)),
        ...backup.data.assistanceRecords.map((item) => assistanceRepository.createAssistanceRecord(item)),
        ...backup.data.fieldVisitTasks.map((item) => fieldVisitRepository.createFieldVisitTask(item)),
        ...backup.data.smsTrainingExamples.map((item) => smsTrainingRepository.createTrainingExample(item)),
        ...backup.data.vouchers.map((item) => voucherRepository.createVoucher(item)),
        knowledgeRepository.updateKnowledgeArticles(mergedKnowledgeArticles.items),
        systemSettingsRepository.saveSettings(nextSystemSettings),
        auditRepository.createAuditLog(importAuditLog),
      ]);
    }

    return {
      importedCollections,
      importedRecords,
    };
  };

  const updateFarmerRecord = (farmerId: string, updates: Partial<Farmer>) => {
    const currentFarmer = farmers.find((farmer) => farmer.id === farmerId);

    if (!currentFarmer) {
      return;
    }

    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const nextFarmer = {
      ...currentFarmer,
      ...updates,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'UPDATE_FARMER',
      details: `${nextFarmer.name} (${nextFarmer.id})`,
    };

    setFarmers(prev => prev.map((farmer) => farmer.id === farmerId ? nextFarmer : farmer));
    setAuditLogs(prev => [auditLog, ...prev]);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('farmer'),
        type: 'update-farmer-record',
        createdAt: timestamp,
        payload: {
          farmerId,
          updates,
          auditLog,
        },
      });
      return;
    }

    void Promise.all([
      farmerRepository.updateFarmer(farmerId, updates),
      auditRepository.createAuditLog(auditLog),
    ]).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('farmer'),
          type: 'update-farmer-record',
          createdAt: timestamp,
          payload: {
            farmerId,
            updates,
            auditLog,
          },
        });
        return;
      }
      console.error("Failed to persist farmer update", error);
    });
  };

  const updateFarmerStatus = (farmerId: string, status: Farmer['status']) => {
    const currentFarmer = farmers.find((farmer) => farmer.id === farmerId);

    if (!currentFarmer || currentFarmer.status === status) {
      return;
    }

    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const action =
      status === 'active' && currentFarmer.status === 'pending_approval'
        ? 'APPROVE_FARMER_REGISTRATION'
        : status === 'rejected'
          ? 'REJECT_FARMER_REGISTRATION'
          : 'UPDATE_FARMER_STATUS';
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action,
      details: `${currentFarmer.name} (${currentFarmer.id}) -> ${status}`,
    };

    setFarmers(prev => prev.map((farmer) => (
      farmer.id === farmerId
        ? { ...farmer, status }
        : farmer
    )));
    setAuditLogs(prev => [auditLog, ...prev]);

    void Promise.all([
      farmerRepository.updateFarmer(farmerId, { status }),
      auditRepository.createAuditLog(auditLog),
    ]).catch((error) => {
      console.error("Failed to persist farmer status update", error);
    });
  };

  const updateManyFarmerStatuses = (farmerIds: string[], status: Farmer['status']) => {
    const normalizedIds = Array.from(new Set(farmerIds));
    const targetFarmers = farmers.filter((farmer) => normalizedIds.includes(farmer.id) && farmer.status !== status);

    if (targetFarmers.length === 0) {
      return 0;
    }

    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'BULK_UPDATE_FARMER_STATUS',
      details: `${targetFarmers.length} magsasaka -> ${status}`,
    };

    setFarmers(prev => prev.map((farmer) => (
      normalizedIds.includes(farmer.id)
        ? { ...farmer, status }
        : farmer
    )));
    setAuditLogs(prev => [auditLog, ...prev]);

    void Promise.all([
      ...targetFarmers.map((farmer) => farmerRepository.updateFarmer(farmer.id, { status })),
      auditRepository.createAuditLog(auditLog),
    ]).catch((error) => {
      console.error("Failed to persist bulk farmer status update", error);
    });

    return targetFarmers.length;
  };

  const deleteFarmerRecord = (farmerId: string) => {
    const currentFarmer = farmers.find((farmer) => farmer.id === farmerId);

    if (!currentFarmer) {
      return;
    }

    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'DELETE_FARMER',
      details: `${currentFarmer.name} (${currentFarmer.id})`,
    };

    setFarmers(prev => prev.filter((farmer) => farmer.id !== farmerId));
    setAuditLogs(prev => [auditLog, ...prev]);

    void Promise.all([
      farmerRepository.deleteFarmer(farmerId),
      auditRepository.createAuditLog(auditLog),
    ]).catch((error) => {
      console.error("Failed to persist farmer deletion", error);
    });
  };

  const addPendingFarmer = (farmerData: FarmerRegistrationValues) => {
    const newFarmer: Farmer = {
        id: `FARM${Date.now()}`,
        name: farmerData.name,
        phone: farmerData.phone,
        barangay: farmerData.barangay,
        sitio: farmerData.sitio,
        crops: farmerData.crops ? farmerData.crops.split(',').map(c => c.trim()) : [],
        farmSize: farmerData.farmSize || 0,
        age: farmerData.age || 0,
        gender: farmerData.gender || 'Hindi natukoy',
        registrationDate: new Date().toISOString(),
        lastSmsActivity: new Date().toISOString(),
        avatarUrl: `https://picsum.photos/seed/${Math.random()}/200/200`,
        status: 'pending_approval'
    };
    setFarmers(prev => [...prev, newFarmer]);
    void farmerRepository.createFarmer(newFarmer).catch((error) => {
      console.error("Failed to persist pending farmer", error);
    });
  };
  
  const addKnowledgeArticle = (data: NewKnowledgeArticleData) => {
    const newArticle: KnowledgeArticle = {
        id: `KB${Date.now()}`,
        title: data.title,
        summary: data.summary,
        content: data.content,
        keywords: data.keywords,
        type: data.type,
        author: 'Admin',
        lastUpdated: new Date().toISOString(),
        audioUrl: data.type === 'audio' ? data.audioUrl : undefined,
    };
    setKnowledgeArticles(prev => [newArticle, ...prev]);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('knowledge'),
        type: 'create-knowledge-article',
        createdAt: newArticle.lastUpdated,
        payload: { article: newArticle },
      });
      return;
    }

    void knowledgeRepository.createKnowledgeArticle(newArticle).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('knowledge'),
          type: 'create-knowledge-article',
          createdAt: newArticle.lastUpdated,
          payload: { article: newArticle },
        });
        return;
      }
      console.error("Failed to persist knowledge article", error);
    });
  };
  
  const addVoucher = (voucherData: Omit<Voucher, 'id' | 'code' | 'status' | 'issueDate'>) => {
    const newVoucher: Voucher = {
      ...voucherData,
      id: `VOUCH${Date.now()}`,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      status: 'issued',
      issueDate: new Date().toISOString(),
    };
    setVouchers(prev => [newVoucher, ...prev]);
    void voucherRepository.createVoucher(newVoucher).catch((error) => {
      console.error("Failed to persist voucher", error);
    });
  };

  const updateVoucherStatus = (voucherId: string, status: VoucherStatus) => {
    const nextRedemptionDate = status === 'redeemed' ? new Date().toISOString() : undefined;
    setVouchers(prev =>
      prev.map(v =>
        v.id === voucherId
          ? { ...v, status, redemptionDate: nextRedemptionDate ?? v.redemptionDate }
          : v
      )
    );
    void voucherRepository.updateVoucher(voucherId, {
      status,
      redemptionDate: nextRedemptionDate,
    }).catch((error) => {
      console.error("Failed to persist voucher update", error);
    });
  };
  
  const addResource = (data: NewResourceData) => {
    const newResource: Resource = {
      ...data,
      id: `RES${Date.now()}`,
      lastUpdated: new Date().toISOString(),
    };
    setResources(prev => [newResource, ...prev]);
    void resourceRepository.createResource(newResource).catch((error) => {
      console.error("Failed to persist resource", error);
    });
  };

  const updateResource = (resourceId: string, data: Partial<Omit<Resource, 'id' | 'lastUpdated'>>) => {
    const nextUpdatedAt = new Date().toISOString();
    setResources(prev =>
      prev.map(r =>
        r.id === resourceId ? { ...r, ...data, lastUpdated: nextUpdatedAt } : r
      )
    );
    void resourceRepository.updateResource(resourceId, {
      ...data,
      lastUpdated: nextUpdatedAt,
    }).catch((error) => {
      console.error("Failed to persist resource update", error);
    });
  };
  
  const deleteResource = (resourceId: string) => {
    setResources(prev => prev.filter(r => r.id !== resourceId));
    void resourceRepository.deleteResource(resourceId).catch((error) => {
      console.error("Failed to persist resource deletion", error);
    });
  };

  const addMarketPriceEntry = (data: NewMarketPriceData) => {
    const nextEntry: MarketPriceEntry = {
      ...data,
      id: createEntityId('PRICE'),
      updatedAt: new Date().toISOString(),
    };

    setMarketPrices(prev => [nextEntry, ...prev]);
    void marketPriceRepository.createMarketPriceEntry(nextEntry).catch((error) => {
      console.error("Failed to persist market price entry", error);
    });
  };

  const updateMarketPriceEntry = (entryId: string, data: NewMarketPriceData) => {
    const nextUpdatedAt = new Date().toISOString();
    setMarketPrices(prev => prev.map((entry) => (
      entry.id === entryId
        ? {
            ...entry,
            ...data,
            updatedAt: nextUpdatedAt,
          }
        : entry
    )));
    void marketPriceRepository.updateMarketPriceEntry(entryId, {
      ...data,
      updatedAt: nextUpdatedAt,
    }).catch((error) => {
      console.error("Failed to persist market price update", error);
    });
  };

  const deleteMarketPriceEntry = (entryId: string) => {
    setMarketPrices(prev => prev.filter((entry) => entry.id !== entryId));
    void marketPriceRepository.deleteMarketPriceEntry(entryId).catch((error) => {
      console.error("Failed to delete market price entry", error);
    });
  };

  const broadcastAlert = async (data: NewAlertBroadcastData) => {
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const targetFarmerIds = (
      data.recipientFarmerIds?.length
        ? data.recipientFarmerIds
        : farmers
            .filter((farmer) => farmer.status === 'active' || farmer.status === 'inactive')
            .map((farmer) => farmer.id)
    );
    const recipientFarmers = targetFarmerIds
      .map((farmerId) => farmers.find((farmer) => farmer.id === farmerId))
      .filter((farmer): farmer is Farmer & { phone: string } => Boolean(farmer?.phone));

    const sendResults = await Promise.allSettled(
      recipientFarmers.map((farmer) => smsProvider.sendMessage({
        to: farmer.phone,
        body: `${data.message} ${data.recommendation}`.trim(),
      }))
    );
    const sentCount = sendResults.filter((result) => result.status === 'fulfilled' && result.value.status !== 'failed').length;
    const failedCount = recipientFarmers.length - sentCount;
    const nextEntry: AlertHistoryEntry = {
      id: createEntityId('ALH'),
      title: data.title,
      timestamp,
      type: data.type,
      severity: data.severity,
      message: data.message,
      recommendation: data.recommendation,
      source: data.source,
      recipientFarmerIds: recipientFarmers.map((farmer) => farmer.id),
      sentCount,
      failedCount,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'SEND_ALERT_BROADCAST',
      details: `${data.title}: ipinadala sa ${sentCount}/${recipientFarmers.length} na magsasaka.`,
    };
    const logEntries: LogbookEntry[] = recipientFarmers.map((farmer) => ({
      id: createEntityId('LOG'),
      farmerId: farmer.id,
      timestamp,
      type: 'Insidente',
      title: `Nakatanggap ng alerto: ${data.title}`,
      description: `${data.message} ${data.recommendation}`.trim(),
    }));

    setAlertHistory(prev => [nextEntry, ...prev]);
    setAuditLogs(prev => [auditLog, ...prev]);
    if (logEntries.length > 0) {
      setLogbook(prev => [...logEntries, ...prev]);
    }

    void alertHistoryRepository.createAlertHistoryEntry(nextEntry).catch((error) => {
      console.error("Failed to persist alert history entry", error);
    });
    void auditRepository.createAuditLog(auditLog).catch((error) => {
      console.error("Failed to persist alert broadcast audit log", error);
    });
    void Promise.all(logEntries.map((entry) => logbookRepository.createEntry(entry))).catch((error) => {
      console.error("Failed to persist alert broadcast logbook entries", error);
    });

    return nextEntry;
  };

  const addAssistanceRecord = (data: NewAssistanceRecordData) => {
    const actorName = data.providedBy ?? currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const nextRecord: FarmerAssistanceRecord = {
      id: createEntityId('AST'),
      farmerId: data.farmerId,
      type: data.type,
      title: data.title,
      details: data.details,
      quantity: data.quantity,
      status: 'planned',
      providedBy: actorName,
      createdAt: timestamp,
      updatedAt: timestamp,
      nextAction: data.nextAction,
      resourceId: data.resourceId,
    };
    const farmer = farmers.find((entry) => entry.id === data.farmerId);
    const logbookEntry: LogbookEntry = {
      id: createEntityId('LOG'),
      farmerId: data.farmerId,
      timestamp,
      type: 'Tulong',
      title: `Bagong tulong: ${data.title}`,
      description: `${data.type} - ${data.details}`,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'CREATE_ASSISTANCE_RECORD',
      details: `${farmer?.name ?? data.farmerId}: ${data.title}`,
    };

    setAssistanceRecords(prev => [nextRecord, ...prev]);
    setLogbook(prev => [logbookEntry, ...prev]);
    setAuditLogs(prev => [auditLog, ...prev]);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('assistance'),
        type: 'create-assistance-activity',
        createdAt: timestamp,
        payload: {
          record: nextRecord,
          logbookEntry: sanitizeLogbookEntry(logbookEntry),
          auditLog,
        },
      });
      return nextRecord;
    }

    void Promise.all([
      assistanceRepository.createAssistanceRecord(nextRecord),
      logbookRepository.createEntry(logbookEntry),
      auditRepository.createAuditLog(auditLog),
    ]).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('assistance'),
          type: 'create-assistance-activity',
          createdAt: timestamp,
          payload: {
            record: nextRecord,
            logbookEntry: sanitizeLogbookEntry(logbookEntry),
            auditLog,
          },
        });
        return;
      }
      console.error("Failed to persist assistance activity", error);
    });

    return nextRecord;
  };

  const updateAssistanceRecordStatus = (recordId: string, status: AssistanceStatus) => {
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const currentRecord = assistanceRecords.find((record) => record.id === recordId);

    if (!currentRecord || currentRecord.status === status) {
      return;
    }

    const nextRecord: FarmerAssistanceRecord = {
      ...currentRecord,
      status,
      updatedAt: timestamp,
      fulfilledAt: status === 'completed' ? timestamp : currentRecord.fulfilledAt,
    };
    const farmer = farmers.find((entry) => entry.id === currentRecord.farmerId);
    const logbookEntry: LogbookEntry = {
      id: createEntityId('LOG'),
      farmerId: currentRecord.farmerId,
      timestamp,
      type: 'Tulong',
      title: `Na-update ang tulong: ${currentRecord.title}`,
      description: `Status: ${status}`,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'UPDATE_ASSISTANCE_STATUS',
      details: `${farmer?.name ?? currentRecord.farmerId}: ${currentRecord.title} -> ${status}`,
    };

    setAssistanceRecords(prev => prev.map((record) => record.id === recordId ? nextRecord : record));
    setLogbook(prev => [logbookEntry, ...prev]);
    setAuditLogs(prev => [auditLog, ...prev]);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('assistance-status'),
        type: 'update-assistance-status',
        createdAt: timestamp,
        payload: {
          recordId,
          updates: {
            status: nextRecord.status,
            updatedAt: nextRecord.updatedAt,
            fulfilledAt: nextRecord.fulfilledAt,
          },
          logbookEntry: sanitizeLogbookEntry(logbookEntry),
          auditLog,
        },
      });
      return;
    }

    void Promise.all([
      assistanceRepository.updateAssistanceRecord(recordId, {
        status: nextRecord.status,
        updatedAt: nextRecord.updatedAt,
        fulfilledAt: nextRecord.fulfilledAt,
      }),
      logbookRepository.createEntry(logbookEntry),
      auditRepository.createAuditLog(auditLog),
    ]).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('assistance-status'),
          type: 'update-assistance-status',
          createdAt: timestamp,
          payload: {
            recordId,
            updates: {
              status: nextRecord.status,
              updatedAt: nextRecord.updatedAt,
              fulfilledAt: nextRecord.fulfilledAt,
            },
            logbookEntry: sanitizeLogbookEntry(logbookEntry),
            auditLog,
          },
        });
        return;
      }
      console.error("Failed to persist assistance status", error);
    });
  };

  const scheduleFieldVisit = (data: NewFieldVisitTaskData) => {
    const actorName = data.assignedTo ?? currentUserProfile?.name ?? 'AEW Jose Rizal';
    const timestamp = new Date().toISOString();
    const nextTask: FieldVisitTask = {
      id: createEntityId('VISIT'),
      farmerId: data.farmerId,
      title: data.title,
      purpose: data.purpose,
      scheduledFor: data.scheduledFor,
      assignedTo: actorName,
      priority: data.priority,
      status: 'scheduled',
      createdAt: timestamp,
      updatedAt: timestamp,
      notes: data.notes,
      relatedSmsId: data.relatedSmsId,
    };
    const farmer = farmers.find((entry) => entry.id === data.farmerId);
    const logbookEntry: LogbookEntry = {
      id: createEntityId('LOG'),
      farmerId: data.farmerId,
      timestamp,
      type: 'Tala sa Bukid',
      title: `Nakaiskedyul na pagbisita: ${data.title}`,
      description: `${data.purpose} (${new Date(data.scheduledFor).toLocaleString()})`,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'SCHEDULE_FIELD_VISIT',
      details: `${farmer?.name ?? data.farmerId}: ${data.title}`,
    };

    setFieldVisitTasks(prev => [nextTask, ...prev].sort((left, right) => normalizeTimestamp(left.scheduledFor) - normalizeTimestamp(right.scheduledFor)));
    setLogbook(prev => [logbookEntry, ...prev]);
    setAuditLogs(prev => [auditLog, ...prev]);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('visit'),
        type: 'schedule-field-visit',
        createdAt: timestamp,
        payload: {
          task: nextTask,
          logbookEntry: sanitizeLogbookEntry(logbookEntry),
          auditLog,
        },
      });
      return nextTask;
    }

    void Promise.all([
      fieldVisitRepository.createFieldVisitTask(nextTask),
      logbookRepository.createEntry(logbookEntry),
      auditRepository.createAuditLog(auditLog),
    ]).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('visit'),
          type: 'schedule-field-visit',
          createdAt: timestamp,
          payload: {
            task: nextTask,
            logbookEntry: sanitizeLogbookEntry(logbookEntry),
            auditLog,
          },
        });
        return;
      }
      console.error("Failed to persist field visit schedule", error);
    });

    return nextTask;
  };

  const updateFieldVisitTaskStatus = (taskId: string, status: FieldVisitStatus) => {
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const timestamp = new Date().toISOString();
    const currentTask = fieldVisitTasks.find((task) => task.id === taskId);

    if (!currentTask || currentTask.status === status) {
      return;
    }

    const nextTask: FieldVisitTask = {
      ...currentTask,
      status,
      updatedAt: timestamp,
    };
    const farmer = farmers.find((entry) => entry.id === currentTask.farmerId);
    const logbookEntry: LogbookEntry = {
      id: createEntityId('LOG'),
      farmerId: currentTask.farmerId,
      timestamp,
      type: 'Tala sa Bukid',
      title: `Na-update ang field visit: ${currentTask.title}`,
      description: `Status: ${status}`,
    };
    const auditLog: AuditLog = {
      id: createEntityId('AUD'),
      timestamp,
      user: actorName,
      action: 'UPDATE_FIELD_VISIT_STATUS',
      details: `${farmer?.name ?? currentTask.farmerId}: ${currentTask.title} -> ${status}`,
    };

    setFieldVisitTasks(prev => prev.map((task) => task.id === taskId ? nextTask : task));
    setLogbook(prev => [logbookEntry, ...prev]);
    setAuditLogs(prev => [auditLog, ...prev]);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('visit-status'),
        type: 'update-field-visit-status',
        createdAt: timestamp,
        payload: {
          taskId,
          updates: {
            status: nextTask.status,
            updatedAt: nextTask.updatedAt,
          },
          logbookEntry: sanitizeLogbookEntry(logbookEntry),
          auditLog,
        },
      });
      return;
    }

    void Promise.all([
      fieldVisitRepository.updateFieldVisitTask(taskId, {
        status: nextTask.status,
        updatedAt: nextTask.updatedAt,
      }),
      logbookRepository.createEntry(logbookEntry),
      auditRepository.createAuditLog(auditLog),
    ]).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('visit-status'),
          type: 'update-field-visit-status',
          createdAt: timestamp,
          payload: {
            taskId,
            updates: {
              status: nextTask.status,
              updatedAt: nextTask.updatedAt,
            },
            logbookEntry: sanitizeLogbookEntry(logbookEntry),
            auditLog,
          },
        });
        return;
      }
      console.error("Failed to persist field visit status", error);
    });
  };

  const addInboundSms = (data: NewInboundSmsData) => {
    const workflow = processInboundSms({
      phone: data.phone,
      message: data.message,
      farmers,
      analysis: data.analysis,
      settings: systemSettings,
      sourceProvider: 'demo',
    });
    const newMessage = applyPriceWatchAdvice(workflow.message, marketPrices);

    setSmsMessages(prev => [newMessage, ...prev]);
    setAuditLogs(prev => [workflow.auditLog, ...prev]);
    const logbookEntry: LogbookEntry = {
      id: `LOG${Date.now()}`,
      farmerId: newMessage.farmerId,
      timestamp: newMessage.timestamp,
      type: 'SMS',
      title: 'Bagong ulat sa SMS',
      description: `${newMessage.farmerName}: ${newMessage.message}`,
    };
    setLogbook(prev => [logbookEntry, ...prev]);
    void smsRepository.createInboundMessage(newMessage).catch((error) => {
      console.error("Failed to persist inbound SMS", error);
    });
    void auditRepository.createAuditLog(workflow.auditLog).catch((error) => {
      console.error("Failed to persist inbound SMS audit log", error);
    });
    void logbookRepository.createEntry(logbookEntry).catch((error) => {
      console.error("Failed to persist inbound SMS logbook entry", error);
    });

    if (workflow.newFarmer) {
      setFarmers(prev => [workflow.newFarmer as Farmer, ...prev]);
      void farmerRepository.createFarmer(workflow.newFarmer).catch((error) => {
        console.error("Failed to persist inbound registration farmer", error);
      });
    }

    if (workflow.farmerUpdates.length > 0) {
      setFarmers(prev => prev.map(item => {
        const update = workflow.farmerUpdates.find(farmerUpdate => farmerUpdate.farmerId === item.id);
        return update ? { ...item, ...update.updates } : item;
      }));
      for (const update of workflow.farmerUpdates) {
        void farmerRepository.updateFarmer(update.farmerId, update.updates).catch((error) => {
          console.error("Failed to persist farmer update", error);
        });
      }
    }

    return newMessage;
  };

  const updateSmsMessage = (
    messageId: string,
    updates: Partial<Pick<SmsMessage, 'status' | 'aiAdvice' | 'parsedIntent' | 'urgency' | 'safetyFlag' | 'tone'>>
  ) => {
    const current = smsMessages.find((message) => message.id === messageId);
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const workflow = applySmsStatusUpdate({
      currentMessage: current ?? null,
      updates,
      actorName,
    });

    if (!workflow.nextMessage) {
      return;
    }

    const nextMessage = workflow.nextMessage;
    const isFarmerFacingReply = nextMessage.status === 'approved' || nextMessage.status === 'replied';

    setSmsMessages((prev) => prev.map((message) => (
      message.id === messageId ? nextMessage : message
    )));

    const responseLogbookEntry: LogbookEntry | null = isFarmerFacingReply
      ? {
          id: `LOG${Date.now()}-${nextMessage.id}`,
          farmerId: nextMessage.farmerId,
          timestamp: nextMessage.respondedAt ?? new Date().toISOString(),
          type: 'Payo',
          title: 'Naglabas ng tugon',
          description: `${actorName}: ${nextMessage.aiAdvice}`,
        }
      : null;
    const trainingExample = current && nextMessage.status !== 'pending_approval'
      ? createSmsTrainingExample({
          previousMessage: current,
          nextMessage,
          actorName,
        })
      : null;
    const messageUpdates = {
      status: nextMessage.status,
      aiAdvice: nextMessage.aiAdvice,
      respondedAt: nextMessage.respondedAt,
      assignedTo: nextMessage.assignedTo,
      assignedAt: nextMessage.assignedAt,
      caseStatus: nextMessage.caseStatus,
      followUpDueAt: nextMessage.followUpDueAt,
      followUpSentAt: nextMessage.followUpSentAt,
      closedAt: nextMessage.closedAt,
      resolutionNote: nextMessage.resolutionNote,
      parsedIntent: nextMessage.parsedIntent,
      urgency: nextMessage.urgency,
      safetyFlag: nextMessage.safetyFlag,
      tone: nextMessage.tone,
    };

    if (workflow.auditLog) {
      setAuditLogs((logs) => [workflow.auditLog as AuditLog, ...logs]);
    }

    if (responseLogbookEntry) {
      setLogbook((entries) => [responseLogbookEntry, ...entries]);
    }

    if (trainingExample) {
      setSmsTrainingExamples((examples) => [trainingExample, ...examples]);
    }

    const outboundReply =
      isFarmerFacingReply && nextMessage.aiAdvice.trim().length > 0
        ? {
            sourceMessage: nextMessage,
            body: nextMessage.aiAdvice,
            providerName: isDemoMode ? 'mock-sms-provider' : 'live-sms-provider',
          }
        : undefined;

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('sms-update'),
        type: 'update-sms-message',
        createdAt: new Date().toISOString(),
        payload: {
          messageId,
          updates: messageUpdates,
          auditLog: workflow.auditLog ?? undefined,
          responseLogbookEntry: responseLogbookEntry ? sanitizeLogbookEntry(responseLogbookEntry) : undefined,
          trainingExample: trainingExample ?? undefined,
          outboundReply,
        },
      });
      return;
    }

    const persistMessageUpdate = async () => {
      await smsRepository.updateMessage(messageId, messageUpdates);

      if (workflow.auditLog) {
        await auditRepository.createAuditLog(workflow.auditLog as AuditLog);
      }

      if (responseLogbookEntry) {
        await logbookRepository.createEntry(responseLogbookEntry);
      }

      if (trainingExample) {
        await smsTrainingRepository.createTrainingExample(trainingExample);
      }

      if (outboundReply) {
        const record = await sendOutboundMessage({
          sourceMessage: outboundReply.sourceMessage,
          body: outboundReply.body,
          provider: smsProvider,
          providerName: outboundReply.providerName,
        });
        setOutboundMessages((records) => [record, ...records]);
        await outboundMessageRepository.createOutboundMessage(record);
      }
    };

    void persistMessageUpdate().catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('sms-update'),
          type: 'update-sms-message',
          createdAt: new Date().toISOString(),
          payload: {
            messageId,
            updates: messageUpdates,
            auditLog: workflow.auditLog ?? undefined,
            responseLogbookEntry: responseLogbookEntry ? sanitizeLogbookEntry(responseLogbookEntry) : undefined,
            trainingExample: trainingExample ?? undefined,
            outboundReply,
          },
        });
        return;
      }

      console.error("Failed to persist SMS status update", error);
    });
  };

  const assignSmsMessage = (messageId: string, assigneeName?: string) => {
    const assignedAt = new Date().toISOString();
    const actorName = assigneeName ?? currentUserProfile?.name ?? 'Brgy. Admin';

    setSmsMessages(prev => prev.map((message) => (
      message.id === messageId
        ? {
            ...message,
            assignedTo: actorName,
            assignedAt,
            caseStatus: message.caseStatus === 'closed' ? 'closed' : 'assigned',
          }
        : message
    )));

    const auditLog: AuditLog = {
      id: `AUD${Date.now()}`,
      timestamp: assignedAt,
      user: actorName,
      action: 'ASSIGN_SMS_CASE',
      details: `${messageId}: itinalaga kay ${actorName}`,
    };
    setAuditLogs(prev => [auditLog, ...prev]);

    const assignmentUpdates = {
      assignedTo: actorName,
      assignedAt,
      caseStatus: 'assigned' as const,
    };

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('sms-assign'),
        type: 'assign-sms-message',
        createdAt: assignedAt,
        payload: {
          messageId,
          updates: assignmentUpdates,
          auditLog,
        },
      });
      return;
    }

    void Promise.all([
      smsRepository.updateMessage(messageId, assignmentUpdates),
      auditRepository.createAuditLog(auditLog),
    ]).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('sms-assign'),
          type: 'assign-sms-message',
          createdAt: assignedAt,
          payload: {
            messageId,
            updates: assignmentUpdates,
            auditLog,
          },
        });
        return;
      }
      console.error("Failed to assign SMS message", error);
    });
  };

  const updateSmsCaseOutcome = (
    messageId: string,
    outcomeStatus: SmsCaseOutcomeStatus,
    summary: string
  ) => {
    const timestamp = new Date().toISOString();
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const trimmedSummary = summary.trim();
    const outcomeMeta = getSmsCaseOutcomeMeta(outcomeStatus);
    const currentMessage = smsMessages.find((message) => message.id === messageId);

    if (!currentMessage) {
      return;
    }

    const updatedMessage: SmsMessage = {
      ...currentMessage,
      caseStatus: getCaseStatusForOutcome(outcomeStatus),
      caseOutcomeStatus: outcomeStatus,
      caseOutcomeSummary: trimmedSummary,
      caseOutcomeUpdatedAt: timestamp,
      caseOutcomeUpdatedBy: actorName,
      closedAt: outcomeStatus === 'resolved' ? timestamp : currentMessage.closedAt,
      resolutionNote:
        outcomeStatus === 'resolved'
          ? (trimmedSummary || currentMessage.resolutionNote)
          : currentMessage.resolutionNote,
    };

    setSmsMessages((prev) => prev.map((message) => (
      message.id === messageId ? updatedMessage : message
    )));

    const auditLog: AuditLog = {
      id: `AUD${Date.now()}`,
      timestamp,
      user: actorName,
      action: 'UPDATE_SMS_CASE_OUTCOME',
      details: `${messageId}: ${outcomeMeta?.label ?? outcomeStatus}${trimmedSummary ? ` - ${trimmedSummary}` : ''}`,
    };

    const outcomeLogbookEntry: LogbookEntry = {
      id: `LOG${Date.now()}-${messageId}`,
      farmerId: updatedMessage.farmerId,
      timestamp,
      type: 'Tulong',
      title: `Case outcome: ${outcomeMeta?.label ?? outcomeStatus}`,
      description: trimmedSummary || outcomeMeta?.helper || 'Na-update ang case outcome.',
    };

    setAuditLogs((prev) => [auditLog, ...prev]);
    setLogbook((prev) => [outcomeLogbookEntry, ...prev]);

    const outcomeUpdates = {
      caseStatus: updatedMessage.caseStatus,
      caseOutcomeStatus: updatedMessage.caseOutcomeStatus,
      caseOutcomeSummary: updatedMessage.caseOutcomeSummary,
      caseOutcomeUpdatedAt: updatedMessage.caseOutcomeUpdatedAt,
      caseOutcomeUpdatedBy: updatedMessage.caseOutcomeUpdatedBy,
      closedAt: updatedMessage.closedAt,
      resolutionNote: updatedMessage.resolutionNote,
    };

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('sms-outcome'),
        type: 'update-sms-case-outcome',
        createdAt: timestamp,
        payload: {
          messageId,
          updates: outcomeUpdates,
          auditLog,
          logbookEntry: sanitizeLogbookEntry(outcomeLogbookEntry),
        },
      });
      return;
    }

    void Promise.all([
      smsRepository.updateMessage(messageId, outcomeUpdates),
      auditRepository.createAuditLog(auditLog),
      logbookRepository.createEntry(outcomeLogbookEntry),
    ]).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('sms-outcome'),
          type: 'update-sms-case-outcome',
          createdAt: timestamp,
          payload: {
            messageId,
            updates: outcomeUpdates,
            auditLog,
            logbookEntry: sanitizeLogbookEntry(outcomeLogbookEntry),
          },
        });
        return;
      }
      console.error("Failed to persist SMS case outcome update", error);
    });
  };

  const closeSmsCase = (messageId: string, resolutionNote?: string) => {
    const timestamp = new Date().toISOString();
    const actorName = currentUserProfile?.name ?? 'Brgy. Admin';
    const trimmedResolutionNote = resolutionNote?.trim();
    const resolutionSummary = trimmedResolutionNote || 'Minarkahang resolved ng barangay team.';
    const currentMessage = smsMessages.find((message) => message.id === messageId);

    if (!currentMessage) {
      return;
    }

    const updatedMessage: SmsMessage = {
      ...currentMessage,
      caseStatus: 'closed',
      closedAt: timestamp,
      resolutionNote: resolutionSummary,
      caseOutcomeStatus: 'resolved',
      caseOutcomeSummary: resolutionSummary,
      caseOutcomeUpdatedAt: timestamp,
      caseOutcomeUpdatedBy: actorName,
    };

    setSmsMessages(prev => prev.map((message) => (
      message.id === messageId ? updatedMessage : message
    )));

    const auditLog: AuditLog = {
      id: `AUD${Date.now()}`,
      timestamp,
      user: actorName,
      action: 'CLOSE_SMS_CASE',
      details: `${messageId}: isinara ang case - ${resolutionSummary}`,
    };
    const outcomeLogbookEntry: LogbookEntry = {
      id: `LOG${Date.now()}-${messageId}`,
      farmerId: updatedMessage.farmerId,
      timestamp,
      type: 'Tulong',
      title: 'Case resolved',
      description: resolutionSummary,
    };
    setAuditLogs(prev => [auditLog, ...prev]);
    setLogbook(prev => [outcomeLogbookEntry, ...prev]);

    const closeUpdates = {
      caseStatus: 'closed' as const,
      closedAt: timestamp,
      resolutionNote: resolutionSummary,
      caseOutcomeStatus: 'resolved' as const,
      caseOutcomeSummary: resolutionSummary,
      caseOutcomeUpdatedAt: timestamp,
      caseOutcomeUpdatedBy: actorName,
    };

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('sms-close'),
        type: 'close-sms-case',
        createdAt: timestamp,
        payload: {
          messageId,
          updates: closeUpdates,
          auditLog,
          logbookEntry: sanitizeLogbookEntry(outcomeLogbookEntry),
        },
      });
      return;
    }

    void Promise.all([
      smsRepository.updateMessage(messageId, closeUpdates),
      auditRepository.createAuditLog(auditLog),
      logbookRepository.createEntry(outcomeLogbookEntry),
    ]).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('sms-close'),
          type: 'close-sms-case',
          createdAt: timestamp,
          payload: {
            messageId,
            updates: closeUpdates,
            auditLog,
            logbookEntry: sanitizeLogbookEntry(outcomeLogbookEntry),
          },
        });
        return;
      }
      console.error("Failed to close SMS case", error);
    });
  };

  const retryOutboundMessage = async (outboundId: string) => {
    const currentRecord = outboundMessages.find((record) => record.id === outboundId);

    if (!currentRecord) {
      return null;
    }

    const sourceMessage = smsMessages.find((message) => message.id === currentRecord.smsMessageId);

    if (!sourceMessage) {
      return null;
    }

    const nextTimestamp = new Date().toISOString();
    const retriedRecord: OutboundMessage = {
      ...currentRecord,
      status: 'retried',
      lastStatusAt: nextTimestamp,
    };
    const resendRecord = await sendOutboundMessage({
      sourceMessage,
      body: currentRecord.body,
      provider: smsProvider,
      providerName: isDemoMode ? 'mock-sms-provider' : 'live-sms-provider',
    });
    const retryRecord: OutboundMessage = {
      ...resendRecord,
      retryOfOutboundId: currentRecord.id,
      attempts: (currentRecord.attempts ?? 1) + 1,
    };

    setOutboundMessages(prev => [
      retryRecord,
      ...prev.map((record) => (record.id === outboundId ? retriedRecord : record)),
    ]);

    await Promise.all([
      outboundMessageRepository.updateOutboundMessage(outboundId, {
        status: retriedRecord.status,
        lastStatusAt: retriedRecord.lastStatusAt,
      }),
      outboundMessageRepository.createOutboundMessage(retryRecord),
    ]);

    return retryRecord;
  };

  const addLogbookEntry = (entry: Omit<LogbookEntry, 'id' | 'timestamp'> & { timestamp?: string }) => {
    const nextEntry: LogbookEntry = {
      ...entry,
      id: `LOG${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: entry.timestamp ?? new Date().toISOString(),
    };

    setLogbook(prev => [nextEntry, ...prev]);

    if (shouldQueueLiveMutation()) {
      queueOfflineMutation({
        id: createOfflineMutationId('logbook'),
        type: 'create-logbook-entry',
        createdAt: nextEntry.timestamp,
        payload: {
          entry: sanitizeLogbookEntry(nextEntry),
        },
      });
      return;
    }

    void logbookRepository.createEntry(nextEntry).catch((error) => {
      if (shouldQueueLiveMutation(error)) {
        queueOfflineMutation({
          id: createOfflineMutationId('logbook'),
          type: 'create-logbook-entry',
          createdAt: nextEntry.timestamp,
          payload: {
            entry: sanitizeLogbookEntry(nextEntry),
          },
        });
        return;
      }
      console.error("Failed to persist logbook entry", error);
    });
  };

  const resetDemoData = () => {
    setFarmers(initialFarmers);
    setSmsMessages(initialSmsMessages);
    setResources(initialResources);
    setMarketPrices(initialMarketPrices);
    setKnowledgeArticles(initialKnowledgeArticles);
    setLogbook(initialLogbookEntries);
    setAuditLogs(initialAuditLogs);
    setAlertHistory(initialAlertHistory);
    setAssistanceRecords(initialAssistanceRecords);
    setFieldVisitTasks(initialFieldVisitTasks);
      setSmsTrainingExamples(initialSmsTrainingExamples);
      setSystemSettings(defaultSystemSettings);
      setUsers(initialUsers);
      setVouchers(initialVouchers);
      setOutboundMessages(initialOutboundMessages);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('farmers');
      localStorage.removeItem('smsMessages');
      localStorage.removeItem('resources');
      localStorage.removeItem('marketPrices');
      localStorage.removeItem('knowledgeArticles');
      localStorage.removeItem('logbook');
      localStorage.removeItem('auditLogs');
      localStorage.removeItem('alertHistory');
      localStorage.removeItem('assistanceRecords');
      localStorage.removeItem('fieldVisitTasks');
      localStorage.removeItem('smsTrainingExamples');
      localStorage.removeItem('systemSettings');
      localStorage.removeItem('users');
      localStorage.removeItem('vouchers');
      localStorage.removeItem('outboundMessages');
    }
  };


  const value = {
    farmers,
    setFarmers,
    updateFarmerRecord,
    updateFarmerStatus,
    updateManyFarmerStatuses,
    deleteFarmerRecord,
    smsMessages,
    outboundMessages,
    addInboundSms,
    webhookBridgeStatus,
    updateSmsMessage,
    assignSmsMessage,
    updateSmsCaseOutcome,
    closeSmsCase,
    resources,
    addResource,
    updateResource,
    deleteResource,
    marketPrices,
    addMarketPriceEntry,
    updateMarketPriceEntry,
    deleteMarketPriceEntry,
    knowledgeArticles,
    setKnowledgeArticles,
    addKnowledgeArticle,
    logbook,
    addLogbookEntry,
    setLogbook,
    auditLogs,
    setAuditLogs,
    alertHistory,
    broadcastAlert,
    assistanceRecords,
    addAssistanceRecord,
    updateAssistanceRecordStatus,
    fieldVisitTasks,
    scheduleFieldVisit,
    updateFieldVisitTaskStatus,
    smsTrainingExamples,
    exportPortableBackup,
    importPortableBackup,
    importSmsTrainingExamples,
    importKnowledgeArticles,
    systemSettings,
    saveSystemSettings,
    users,
    addUser,
    updateUser,
    deleteUser,
    addPendingFarmer,
    vouchers,
    addVoucher,
    updateVoucherStatus,
    retryOutboundMessage,
    offlineMode,
    offlineSyncing,
    offlineOutboxCount,
    syncOfflineChanges,
    resetDemoData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

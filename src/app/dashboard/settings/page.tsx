
'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Download, FilePen, PlusCircle, RefreshCcw, Trash2, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { canAccessBarangaySettingsWorkspace, canAccessDataCenter } from '@/lib/access-control';
import { isLiveMode } from '@/lib/config/app-mode';
import {
  extractSmsTrainingExamplesFromJson,
  formatSmsTrainingExamplesAsCsv,
  parseSmsTrainingExamplesCsv,
} from '@/lib/data-portability';
import { getClientAuth } from '@/lib/firebase/auth-client';
import {
  extractSmsLexiconRulesFromJson,
  formatSmsLexiconRulesAsCsv,
  parseSmsLexiconRulesCsv,
} from '@/lib/sms-lexicon-portability';
import { buildSmsLexiconLearningQueue } from '@/lib/sms-lexicon-learning';
import { summarizeTeachingCoverage } from '@/lib/sms-teaching';
import { isSpreadsheetExtension, readSpreadsheetAsCsv } from '@/lib/spreadsheet-import';
import type { SmsLexiconRule, SmsTone, SystemTemplate, SystemTemplateCategory } from '@/lib/types';
import { defaultSystemSettings } from '@/lib/system-settings';
import { useRuntimeCapabilities } from '@/hooks/use-runtime-capabilities';
import { useRuntimeHealth } from '@/hooks/use-runtime-health';

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getFileExtension(filename: string) {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function formatRuntimeTimestamp(value?: string | null) {
  if (!value) {
    return 'Wala pa';
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatDeliveryState(value?: string | null) {
  switch (value) {
    case 'delivered':
      return 'Delivered';
    case 'failed':
      return 'Failed';
    case 'awaiting_receipt':
      return 'Awaiting receipt';
    case 'queued':
      return 'Queued';
    case 'sent':
      return 'Sent';
    default:
      return value ?? 'Unknown';
  }
}

function createEmptyLexiconRule(): SmsLexiconRule {
  return {
    id: `LEX-${Date.now()}`,
    phrase: '',
    intent: 'UNKNOWN',
    urgency: 'medium',
    safetyFlag: 'Low',
    tone: undefined,
    guidance: '',
    enabled: true,
    notes: '',
  };
}

function buildLexiconRuleKey(rule: Pick<SmsLexiconRule, 'phrase' | 'intent'>) {
  return `${rule.phrase.trim().toLowerCase()}::${rule.intent}`;
}

export default function BarangaySettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const {
      auditLogs,
      farmers,
      systemSettings,
      saveSystemSettings,
      runDataRetentionSweep,
      smsMessages,
      smsTrainingExamples,
      knowledgeArticles,
      importSmsTrainingExamples,
      reviewSmsTrainingExample,
      reviewKnowledgeArticle,
    } = useData();
    const { currentUser, currentUserProfile } = useAuth();
    const { capabilities } = useRuntimeCapabilities();
    const { runtimeHealth, runtimeHealthLoading } = useRuntimeHealth();
    const lexiconImportRef = useRef<HTMLInputElement>(null);
    const trainingImportRef = useRef<HTMLInputElement>(null);
    const [brgyDescription, setBrgyDescription] = useState(defaultSystemSettings.brgyDescription);
    const [zoneDescriptions, setZoneDescriptions] = useState(defaultSystemSettings.zoneDescriptions);
    const [replyStartTime, setReplyStartTime] = useState(defaultSystemSettings.replyStartTime);
    const [replyEndTime, setReplyEndTime] = useState(defaultSystemSettings.replyEndTime);
    const [adminPhone, setAdminPhone] = useState(defaultSystemSettings.adminPhone);
    
    const [templateCategories, setTemplateCategories] = useState<SystemTemplateCategory[]>(defaultSystemSettings.templateCategories);
    const [smsLexiconRules, setSmsLexiconRules] = useState<SmsLexiconRule[]>(defaultSystemSettings.smsLexiconRules);
    
    // State for Dialogs
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<{ categoryId: string; template: SystemTemplate } | null>(null);
    const [deletingTemplate, setDeletingTemplate] = useState<{ categoryId: string; templateId: string } | null>(null);
    const [isLexiconDialogOpen, setLexiconDialogOpen] = useState(false);
    const [editingLexiconRule, setEditingLexiconRule] = useState<SmsLexiconRule | null>(null);
    const [deletingLexiconRule, setDeletingLexiconRule] = useState<SmsLexiconRule | null>(null);

    // State for controlled components in dialogs
    const [newTemplateText, setNewTemplateText] = useState('');
    const [newTemplateKeywords, setNewTemplateKeywords] = useState('');
    const [newTemplateCategory, setNewTemplateCategory] = useState('');
    
    const [editedTemplateText, setEditedTemplateText] = useState('');
    const [editedTemplateKeywords, setEditedTemplateKeywords] = useState('');
    const [rulePhrase, setRulePhrase] = useState('');
    const [ruleIntent, setRuleIntent] = useState<SmsLexiconRule['intent']>('UNKNOWN');
    const [ruleUrgency, setRuleUrgency] = useState<SmsLexiconRule['urgency']>('medium');
    const [ruleSafetyFlag, setRuleSafetyFlag] = useState<SmsLexiconRule['safetyFlag']>('Low');
    const [ruleTone, setRuleTone] = useState<SmsTone | 'none'>('none');
    const [ruleGuidance, setRuleGuidance] = useState('');
    const [ruleApplicability, setRuleApplicability] = useState('');
    const [ruleNotes, setRuleNotes] = useState('');
    const [ruleEnabled, setRuleEnabled] = useState(true);


    const [autoReplyEnabled, setAutoReplyEnabled] = useState(defaultSystemSettings.autoReplyEnabled);
    const [autoReplyTimeout, setAutoReplyTimeout] = useState(defaultSystemSettings.autoReplyTimeoutMinutes);
    const [retentionEnabled, setRetentionEnabled] = useState(defaultSystemSettings.retentionPolicy.autoRedactionEnabled);
    const [auditLogRedactionDays, setAuditLogRedactionDays] = useState(defaultSystemSettings.retentionPolicy.auditLogRedactionDays);
    const [archivedFarmerRedactionDays, setArchivedFarmerRedactionDays] = useState(defaultSystemSettings.retentionPolicy.archivedFarmerRedactionDays);
    const [runningAutomation, setRunningAutomation] = useState<null | 'overdue' | 'followup' | 'retention'>(null);
    const [isImportingLexicon, setIsImportingLexicon] = useState(false);
    const [isImportingTraining, setIsImportingTraining] = useState(false);
    const canAccessSettingsWorkspace = canAccessBarangaySettingsWorkspace(currentUserProfile);
    const canOpenDataCenter = canAccessDataCenter(currentUserProfile);
    const teachingCoverage = summarizeTeachingCoverage(smsLexiconRules, smsTrainingExamples);
    const learningQueue = buildSmsLexiconLearningQueue(smsMessages);
    const pendingTrainingExamples = smsTrainingExamples.filter((example) => example.reviewStatus === 'needs_review').slice(0, 5);
    const pendingKnowledgeArticles = knowledgeArticles.filter((article) => article.reviewStatus === 'needs_review').slice(0, 5);
    const overdueHealth = runtimeHealth.records.find((record) => record.id === 'automation_overdue');
    const followUpHealth = runtimeHealth.records.find((record) => record.id === 'automation_followups');
    const inboundHealth = runtimeHealth.records.find((record) => record.id === 'sms_inbound');
    const outboundHealth = runtimeHealth.records.find((record) => record.id === 'sms_outbound');
    const webhookHealth = runtimeHealth.records.find((record) => record.id === 'sms_outbound_webhook');
    const inviteEmailHealth = runtimeHealth.records.find((record) => record.id === 'invite_email');
    const mobilePushHealth = runtimeHealth.records.find((record) => record.id === 'mobile_push');
    const retentionHealth = runtimeHealth.records.find((record) => record.id === 'data_retention');
    const outboundSummary = runtimeHealth.outboundDeliverySummary;
    const outboundAttentionItems = runtimeHealth.outboundAttentionItems;
    const archivedFarmerCount = farmers.filter((farmer) => farmer.status === 'archived').length;
    const redactedArchivedFarmerCount = farmers.filter((farmer) => Boolean(farmer.retentionRedactedAt)).length;
    const redactedAuditLogCount = auditLogs.filter((entry) => Boolean(entry.retentionRedactedAt)).length;
    const now = Date.now();
    const pendingArchivedRedactionCount = farmers.filter((farmer) => {
      if (farmer.status !== 'archived' || farmer.retentionRedactedAt || !farmer.archivedAt) {
        return false;
      }

      return now - new Date(farmer.archivedAt).getTime() >= archivedFarmerRedactionDays * 24 * 60 * 60 * 1000;
    }).length;
    const pendingAuditRedactionCount = auditLogs.filter((entry) => {
      if (entry.retentionRedactedAt) {
        return false;
      }

      return now - new Date(entry.timestamp).getTime() >= auditLogRedactionDays * 24 * 60 * 60 * 1000;
    }).length;

    useEffect(() => {
        if (currentUserProfile && !canAccessSettingsWorkspace) {
            router.replace('/dashboard');
        }
    }, [canAccessSettingsWorkspace, currentUserProfile, router]);
    
    useEffect(() => {
        setBrgyDescription(systemSettings.brgyDescription);
        setZoneDescriptions(systemSettings.zoneDescriptions);
        setReplyStartTime(systemSettings.replyStartTime);
        setReplyEndTime(systemSettings.replyEndTime);
        setAdminPhone(systemSettings.adminPhone);
        setTemplateCategories(systemSettings.templateCategories);
        setSmsLexiconRules(systemSettings.smsLexiconRules);
        setAutoReplyEnabled(systemSettings.autoReplyEnabled);
        setAutoReplyTimeout(systemSettings.autoReplyTimeoutMinutes);
        setRetentionEnabled(systemSettings.retentionPolicy.autoRedactionEnabled);
        setAuditLogRedactionDays(systemSettings.retentionPolicy.auditLogRedactionDays);
        setArchivedFarmerRedactionDays(systemSettings.retentionPolicy.archivedFarmerRedactionDays);
    }, [systemSettings]);

    const handleOpenEditDialog = (categoryId: string, template: SystemTemplate) => {
        setEditingTemplate({ categoryId, template });
        setEditedTemplateText(template.text);
        setEditedTemplateKeywords(template.keywords.join(', '));
    };

    const handleUpdateTemplate = () => {
        if (!editingTemplate) return;

        const { categoryId, template } = editingTemplate;
        
        setTemplateCategories(prev =>
            prev.map(cat =>
                cat.id === categoryId
                    ? {
                        ...cat,
                        templates: cat.templates.map(t =>
                            t.id === template.id
                                ? {
                                    ...t,
                                    text: editedTemplateText,
                                    keywords: editedTemplateKeywords.split(',').map(kw => kw.trim()).filter(Boolean),
                                  }
                                : t
                        ),
                      }
                    : cat
            )
        );

        toast({ title: "Tagumpay!", description: "Nai-update na ang template." });
        setEditingTemplate(null);
    };


    const handleAddTemplate = () => {
        if (!newTemplateText.trim() || !newTemplateCategory) {
            toast({ title: "Kulang ang Impormasyon", description: "Mangyaring punan ang text ng template at pumili ng kategorya.", variant: 'destructive' });
            return;
        }

        const newTemplate: SystemTemplate = {
            id: `t${Date.now()}`,
            text: newTemplateText.trim(),
            keywords: newTemplateKeywords.split(',').map(kw => kw.trim()).filter(Boolean),
        };

        setTemplateCategories(prev =>
            prev.map(cat =>
                cat.id === newTemplateCategory
                    ? { ...cat, templates: [...cat.templates, newTemplate] }
                    : cat
            )
        );
        
        setAddDialogOpen(false);
        setNewTemplateText('');
        setNewTemplateKeywords('');
        setNewTemplateCategory('');
        toast({ title: "Tagumpay!", description: "Nalagay na ang bagong template." });
    };

    const handleDeleteTemplate = () => {
        if (!deletingTemplate) return;
        const { categoryId, templateId } = deletingTemplate;

        setTemplateCategories(prev =>
            prev.map(cat =>
                cat.id === categoryId
                    ? { ...cat, templates: cat.templates.filter(t => t.id !== templateId) }
                    : cat
            )
        );
        toast({ title: "Tagumpay!", description: "Natanggal na ang template.", variant: 'destructive' });
        setDeletingTemplate(null);
    };

    const resetLexiconForm = (rule?: SmsLexiconRule | null) => {
        const nextRule = rule ?? createEmptyLexiconRule();
        setEditingLexiconRule(rule ?? null);
        setRulePhrase(nextRule.phrase);
        setRuleIntent(nextRule.intent);
        setRuleUrgency(nextRule.urgency);
        setRuleSafetyFlag(nextRule.safetyFlag);
        setRuleTone(nextRule.tone ?? 'none');
        setRuleGuidance(nextRule.guidance);
        setRuleApplicability(nextRule.applicability ?? '');
        setRuleNotes(nextRule.notes ?? '');
        setRuleEnabled(nextRule.enabled);
    };

    const openCreateLexiconDialog = () => {
        resetLexiconForm(null);
        setLexiconDialogOpen(true);
    };

    const openEditLexiconDialog = (rule: SmsLexiconRule) => {
        resetLexiconForm(rule);
        setLexiconDialogOpen(true);
    };

    const handleSaveLexiconRule = () => {
        const trimmedPhrase = rulePhrase.trim();
        const trimmedGuidance = ruleGuidance.trim();

        if (!trimmedPhrase || !trimmedGuidance) {
            toast({
                title: "Kulang ang detalye",
                description: "Kailangan ang phrase at guidance bago ma-save ang cue rule.",
                variant: "destructive",
            });
            return;
        }

        const timestamp = new Date().toISOString();
        const nextRule: SmsLexiconRule = {
            id: editingLexiconRule?.id ?? `LEX-${Date.now()}`,
            phrase: trimmedPhrase,
            intent: ruleIntent,
            urgency: ruleUrgency,
            safetyFlag: ruleSafetyFlag,
            tone: ruleTone === 'none' ? undefined : ruleTone,
            guidance: trimmedGuidance,
            applicability: ruleApplicability.trim() || undefined,
            enabled: ruleEnabled,
            notes: ruleNotes.trim() || undefined,
            createdAt: editingLexiconRule?.createdAt ?? timestamp,
            updatedAt: timestamp,
        };

        setSmsLexiconRules((previousRules) => {
            const ruleKey = buildLexiconRuleKey(nextRule);
            const withoutDuplicates = previousRules.filter((rule) => {
                if (editingLexiconRule && rule.id === editingLexiconRule.id) {
                    return false;
                }

                return buildLexiconRuleKey(rule) !== ruleKey;
            });

            return [...withoutDuplicates, nextRule].sort((left, right) =>
                left.phrase.localeCompare(right.phrase)
            );
        });

        toast({
            title: editingLexiconRule ? "Na-update ang cue rule" : "Naidagdag ang cue rule",
            description: "I-save ang live settings para tuluyang mailapat ang bagong turo sa system.",
        });
        setLexiconDialogOpen(false);
        resetLexiconForm(null);
    };

    const handleDeleteLexiconRule = () => {
        if (!deletingLexiconRule) {
            return;
        }

        setSmsLexiconRules((previousRules) =>
            previousRules.filter((rule) => rule.id !== deletingLexiconRule.id)
        );
        toast({
            title: "Natanggal ang cue rule",
            description: "I-save ang live settings para tuluyang maalis ang cue rule sa system.",
        });
        setDeletingLexiconRule(null);
    };

    const handleExportLexiconJson = () => {
        downloadFile(
            `lingkod-ani-sms-cues-${new Date().toISOString().slice(0, 10)}.json`,
            JSON.stringify(smsLexiconRules, null, 2),
            "application/json"
        );
        toast({
            title: "Na-export ang cue bank",
            description: `${smsLexiconRules.length} cue rules ang naisama sa JSON file.`,
        });
    };

    const handleExportLexiconCsv = () => {
        downloadFile(
            `lingkod-ani-sms-cues-${new Date().toISOString().slice(0, 10)}.csv`,
            formatSmsLexiconRulesAsCsv(smsLexiconRules),
            "text/csv;charset=utf-8"
        );
        toast({
            title: "Na-export ang cue bank",
            description: `${smsLexiconRules.length} cue rules ang naisama sa CSV file.`,
        });
    };

    const handleExportTrainingCsv = () => {
        downloadFile(
            `lingkod-ani-sms-training-${new Date().toISOString().slice(0, 10)}.csv`,
            formatSmsTrainingExamplesAsCsv(smsTrainingExamples),
            "text/csv;charset=utf-8"
        );
        toast({
            title: "Na-export ang reviewed examples",
            description: `${smsTrainingExamples.length} reviewed SMS examples ang naisama sa CSV file.`,
        });
    };

    const handleImportLexiconSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setIsImportingLexicon(true);

        try {
            const extension = getFileExtension(file.name);
            let importedRules: SmsLexiconRule[] = [];

            if (isSpreadsheetExtension(extension)) {
                importedRules = parseSmsLexiconRulesCsv(await readSpreadsheetAsCsv(file));
            } else {
                const text = await file.text();
                importedRules =
                    extension === "csv"
                        ? parseSmsLexiconRulesCsv(text)
                        : extractSmsLexiconRulesFromJson(JSON.parse(text));
            }

            if (importedRules.length === 0) {
                throw new Error("Walang valid na cue rules sa file.");
            }

            setSmsLexiconRules((previousRules) => {
                const merged = new Map<string, SmsLexiconRule>();

                previousRules.forEach((rule) => {
                    merged.set(buildLexiconRuleKey(rule), rule);
                });

                importedRules.forEach((rule) => {
                    const existing = merged.get(buildLexiconRuleKey(rule));
                    merged.set(buildLexiconRuleKey(rule), {
                        ...existing,
                        ...rule,
                        id: existing?.id ?? rule.id,
                        createdAt: existing?.createdAt ?? rule.createdAt,
                        updatedAt: new Date().toISOString(),
                    });
                });

                return Array.from(merged.values()).sort((left, right) =>
                    left.phrase.localeCompare(right.phrase)
                );
            });

            toast({
                title: "Na-import ang cue bank",
                description: `${importedRules.length} cue rules ang nadagdag o na-update. I-save ang live settings para mailapat ang mga ito.`,
            });
        } catch (error) {
            toast({
                title: "Hindi ma-import ang cue bank",
                description: error instanceof Error ? error.message : "Hindi mabasa ang cue file.",
                variant: "destructive",
            });
        } finally {
            setIsImportingLexicon(false);
            event.target.value = "";
        }
    };

    const handleImportTrainingSelect = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setIsImportingTraining(true);

        try {
            const extension = getFileExtension(file.name);
            let examples = [];

            if (extension === "pdf" || file.type.startsWith("image/") || file.type.startsWith("audio/")) {
                const formData = new FormData();
                formData.append("file", file);

                const headers: HeadersInit = {};

                if (isLiveMode) {
                    const idToken = await getClientAuth().currentUser?.getIdToken();

                    if (!idToken) {
                        throw new Error("Mag-sign in muna sa live account bago mag-import ng PDF, larawan, o audio.");
                    }

                    headers.Authorization = `Bearer ${idToken}`;
                }

                const response = await fetch("/api/data-center/training/import-document", {
                    method: "POST",
                    headers,
                    body: formData,
                });
                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(String(payload.error ?? "Hindi mabasa ang PDF/image/audio file."));
                }

                examples = Array.isArray(payload.examples) ? payload.examples : [];
            } else {
                if (isSpreadsheetExtension(extension)) {
                    examples = parseSmsTrainingExamplesCsv(await readSpreadsheetAsCsv(file));
                } else {
                    const text = await file.text();
                    examples =
                        extension === "csv"
                            ? parseSmsTrainingExamplesCsv(text)
                            : extractSmsTrainingExamplesFromJson(JSON.parse(text));
                }
            }

            if (examples.length === 0) {
                throw new Error("Walang valid na SMS teaching examples sa file.");
            }

            const count = await importSmsTrainingExamples(examples);
            toast({
                title: "Na-import ang SMS teaching file",
                description: `${count} reviewed examples ang na-merge sa teaching dataset.`,
            });
        } catch (error) {
            toast({
                title: "Hindi ma-import ang SMS teaching file",
                description: error instanceof Error ? error.message : "Hindi mabasa ang teaching file.",
                variant: "destructive",
            });
        } finally {
            setIsImportingTraining(false);
            event.target.value = "";
        }
    };

    const handleSaveChanges = async () => {
        await saveSystemSettings({
            ...systemSettings,
            brgyDescription,
            zoneDescriptions,
            replyStartTime,
            replyEndTime,
            adminPhone,
            templateCategories,
            smsLexiconRules,
            autoReplyEnabled,
            autoReplyTimeoutMinutes: Math.max(1, autoReplyTimeout),
            retentionPolicy: {
              autoRedactionEnabled: retentionEnabled,
              auditLogRedactionDays: Math.max(30, auditLogRedactionDays),
              archivedFarmerRedactionDays: Math.max(30, archivedFarmerRedactionDays),
            },
        });
        toast({
            title: "Tagumpay!",
            description: "Nai-save na ang live runtime settings ng barangay.",
        });
    };
    
    const handleNotify = async () => {
        const advisoryNotice = `Advisory Notice: Ang oras ng serbisyo ng barangay agriculture team ay ${replyStartTime} hanggang ${replyEndTime}. Para sa after-hours concerns, makipag-ugnayan sa ${adminPhone}.`;

        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(advisoryNotice);
        }
        toast({
            title: "Handa na ang Advisory Notice",
            description: `Nakopya ang after-hours advisory notice para sa oras na ${replyStartTime} - ${replyEndTime}.`,
        });
    }

    const runAutomation = async (target: 'overdue' | 'followup' | 'retention') => {
        if (!currentUser) {
            toast({
                title: "Walang live session",
                description: "Mag-sign in muna sa live account bago magpatakbo ng automation.",
                variant: "destructive",
            });
            return;
        }

        setRunningAutomation(target);

        try {
            const token = await currentUser.getIdToken();
            const path = target === 'overdue'
                ? '/api/system/process-overdue-sms'
                : target === 'followup'
                  ? '/api/system/process-follow-ups'
                  : '/api/system/process-data-retention';
            const response = await fetch(path, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(typeof payload.error === 'string' ? payload.error : 'Hindi natapos ang automation run.');
            }

            toast({
                title:
                    target === 'overdue'
                      ? 'Natapos ang overdue SMS check'
                      : target === 'followup'
                        ? 'Natapos ang follow-up check'
                        : 'Natapos ang data retention sweep',
                description: payload.skipped
                    ? 'May kasalukuyang automation run na isinasagawa sa ibang session.'
                    : target === 'retention'
                      ? `${payload.redactedAuditLogs ?? 0} audit log at ${payload.redactedArchivedFarmers ?? 0} archived farmer record ang na-redact.`
                      : `${payload.processedCount ?? 0} item ang naproseso sa batch na ito.`,
            });
        } catch (error) {
            toast({
                title: "Hindi natapos ang automation run",
                description: error instanceof Error ? error.message : "Subukan muli pagkatapos ng ilang sandali.",
                variant: "destructive",
            });
        } finally {
            setRunningAutomation(null);
        }
    };

    const handleRunRetentionSweep = async () => {
        if (isLiveMode) {
            await runAutomation('retention');
            return;
        }

        const result = await runDataRetentionSweep();
        toast({
            title: 'Natapos ang data retention sweep',
            description: `${result.redactedAuditLogs} audit log at ${result.redactedArchivedFarmers} archived farmer record ang na-redact sa kasalukuyang local dataset.`,
        });
    };

    if (currentUserProfile && !canAccessSettingsWorkspace) {
        return (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Card className="max-w-lg border-amber-300/40 bg-amber-50/60">
              <CardHeader>
                <CardTitle>Limitado ang Access sa Settings</CardTitle>
                <CardDescription>
                  Ang page na ito ay available lamang para sa barangay at developer accounts. Ibinabalik ka na sa dashboard.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        );
    }

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Mga Setting ng Barangay</h1>
        <p className="text-muted-foreground">
          Dito lang inilalagay ang mga editable na setting para sa barangay. Ang technical health, live SMS watch, at automation diagnostics ay nasa hiwalay na page na ngayon.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Technical Status ay Nasa Hiwalay na Page</CardTitle>
          <CardDescription>
            Para mas malinaw ang settings page, ang runtime health, delivery watch, at automation diagnostics ay nasa bagong Katayuan ng System page na.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-background/80 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Makikita mo na roon ang:</p>
            <div className="mt-3 space-y-2">
              <p>1. Live SMS readiness at huling natanggap o naipadalang mensahe</p>
              <p>2. AI, uploads, invite-email, at mobile push setup status</p>
              <p>3. Overdue SMS, follow-up, at retention batch diagnostics</p>
              <p>4. Delivery watch, webhook details, at manual rerun buttons</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button asChild>
            <Link href="/dashboard/system-status">Buksan ang Katayuan ng System</Link>
          </Button>
        </CardFooter>
      </Card>

      {false ? (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>System Health at Bersyon</CardTitle>
          <CardDescription>
            Mabilis na tingin kung ano ang handa sa live runtime at anong build ang tumatakbo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-lg border bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">App version</p>
              <p className="mt-2 text-base font-semibold">{capabilities.appVersion ?? 'Unknown'}</p>
              <p className="mt-1 text-xs text-muted-foreground">Commit: {capabilities.buildCommit ?? 'Unknown'}</p>
            </div>
            <div className="rounded-lg border bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">AI</p>
              <p className="mt-2 text-base font-semibold">{capabilities.aiConfigured ? 'Configured' : 'Locked'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{capabilities.reasons.ai}</p>
            </div>
            <div className="rounded-lg border bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Live SMS</p>
              <p className="mt-2 text-base font-semibold">{capabilities.liveSmsConfigured ? 'Ready' : 'Kulang pa'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{capabilities.reasons.liveSms ?? capabilities.automationMode}</p>
            </div>
            <div className="rounded-lg border bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Live SMS test mode</p>
              <p className="mt-2 text-base font-semibold">{capabilities.liveSmsTestModeEnabled ? 'Enabled' : 'Locked'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{capabilities.reasons.liveSmsTestMode}</p>
            </div>
            <div className="rounded-lg border bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Invite email</p>
              <p className="mt-2 text-base font-semibold">{capabilities.inviteEmailConfigured ? 'Automatic' : 'Manual fallback'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{capabilities.reasons.inviteEmail}</p>
            </div>
            <div className="rounded-lg border bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Mobile push</p>
              <p className="mt-2 text-base font-semibold">{capabilities.mobilePushConfigured ? 'Ready' : 'Kulang pa'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{capabilities.reasons.mobilePush}</p>
            </div>
            <div className="rounded-lg border bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Firebase Admin</p>
              <p className="mt-2 text-base font-semibold">{capabilities.firebaseAdminConfigured ? 'Ready' : 'Kulang pa'}</p>
            </div>
            <div className="rounded-lg border bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Uploads</p>
              <p className="mt-2 text-base font-semibold">{capabilities.storageUploadConfigured ? 'Ready' : 'Locked'}</p>
              <p className="mt-1 text-xs text-muted-foreground">{capabilities.reasons.storageUpload ?? 'Puwede ang document, larawan, at audio uploads.'}</p>
            </div>
            <div className="rounded-lg border bg-background/80 p-4">
              <p className="text-sm text-muted-foreground">Automation mode</p>
              <p className="mt-2 text-sm font-semibold">{capabilities.automationMode ?? 'Manual / local only'}</p>
            </div>
            <div className="rounded-lg border bg-background/80 p-4 sm:col-span-2 xl:col-span-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Runtime Health</p>
                <Badge variant="outline">{runtimeHealthLoading ? 'Refreshing...' : 'Live status'}</Badge>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border bg-muted/20 p-3 md:col-span-2">
                  <p className="text-sm font-medium text-foreground">Operations Watch</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last failed subsystem: {runtimeHealth.latestFailure?.label ?? 'Wala pa'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Failure time: {formatRuntimeTimestamp(runtimeHealth.latestFailure?.lastFailureAt ?? runtimeHealth.latestFailure?.updatedAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last automation failure: {runtimeHealth.latestAutomationFailure?.label ?? 'Wala pa'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Automation failure time: {formatRuntimeTimestamp(runtimeHealth.latestAutomationFailure?.lastFailureAt ?? runtimeHealth.latestAutomationFailure?.updatedAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last inbound farmer: {runtimeHealth.latestInbound?.farmerName ?? 'Wala pa'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recent outbound needing attention: {outboundSummary.needsAttentionCount} / {outboundSummary.recentCount}
                  </p>
                  {runtimeHealth.latestFailure?.lastError ? (
                    <p className="mt-1 text-xs text-muted-foreground">Error: {runtimeHealth.latestFailure?.lastError}</p>
                  ) : null}
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-sm font-medium text-foreground">Overdue SMS Batch</p>
                  <p className="mt-1 text-xs text-muted-foreground">Status: {overdueHealth?.status ?? 'Wala pa'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Huling success: {formatRuntimeTimestamp(overdueHealth?.lastSuccessAt)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Huling failure: {formatRuntimeTimestamp(overdueHealth?.lastFailureAt)}</p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-sm font-medium text-foreground">Follow-up Batch</p>
                  <p className="mt-1 text-xs text-muted-foreground">Status: {followUpHealth?.status ?? 'Wala pa'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Huling success: {formatRuntimeTimestamp(followUpHealth?.lastSuccessAt)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Huling failure: {formatRuntimeTimestamp(followUpHealth?.lastFailureAt)}</p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-sm font-medium text-foreground">Inbound SMS</p>
                  <p className="mt-1 text-xs text-muted-foreground">Huling event: {formatRuntimeTimestamp(inboundHealth?.updatedAt)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Latest case: {runtimeHealth.latestInbound?.caseId ?? 'Wala pa'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Source: {runtimeHealth.latestInbound?.sourceProvider ?? 'Wala pa'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Farmer: {runtimeHealth.latestInbound?.farmerName ?? 'Wala pa'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Preview: {runtimeHealth.latestInbound?.messagePreview ?? 'Wala pa'}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-sm font-medium text-foreground">Outbound SMS</p>
                  <p className="mt-1 text-xs text-muted-foreground">Huling event: {formatRuntimeTimestamp(outboundHealth?.updatedAt)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Latest status: {runtimeHealth.latestOutbound?.status ?? 'Wala pa'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Purpose: {runtimeHealth.latestOutbound?.purpose ?? 'Wala pa'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Audience: {runtimeHealth.latestOutbound?.audience ?? 'Wala pa'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Priority: {runtimeHealth.latestOutbound?.queuePriorityLabel ?? 'Wala pa'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Provider message ID: {runtimeHealth.latestOutbound?.providerMessageId ?? 'Wala pa'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Delivered at: {formatRuntimeTimestamp(runtimeHealth.latestOutbound?.deliveryReceivedAt)}
                  </p>
                  {runtimeHealth.latestOutbound?.errorMessage ? (
                    <p className="mt-1 text-xs text-muted-foreground">Error: {runtimeHealth.latestOutbound?.errorMessage}</p>
                  ) : null}
                </div>
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-sm font-medium text-foreground">Outbound Webhook</p>
                  <p className="mt-1 text-xs text-muted-foreground">Status: {webhookHealth?.status ?? runtimeHealth.latestWebhook?.status ?? 'Wala pa'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Huling event: {formatRuntimeTimestamp(runtimeHealth.latestWebhook?.updatedAt ?? webhookHealth?.updatedAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Provider message ID: {String(runtimeHealth.latestWebhook?.meta?.providerMessageId ?? 'Wala pa')}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Outbound ID: {String(runtimeHealth.latestWebhook?.meta?.outboundId ?? 'Wala pa')}
                  </p>
                  {runtimeHealth.latestWebhook?.lastError ? (
                    <p className="mt-1 text-xs text-muted-foreground">Error: {runtimeHealth.latestWebhook?.lastError}</p>
                  ) : null}
                </div>
                <div className="rounded-lg border bg-muted/20 p-3 md:col-span-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">Outbound Delivery Watch</p>
                    <Badge variant="outline">Delivered {outboundSummary.deliveredCount}</Badge>
                    <Badge variant="outline">Awaiting {outboundSummary.awaitingReceiptCount}</Badge>
                    <Badge variant="outline">Queued {outboundSummary.queuedCount}</Badge>
                    <Badge variant="outline">Failed {outboundSummary.failedCount}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Latest delivered: {formatRuntimeTimestamp(runtimeHealth.latestDeliveredOutbound?.deliveryReceivedAt ?? runtimeHealth.latestDeliveredOutbound?.lastStatusAt)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last delivered recipient: {runtimeHealth.latestDeliveredOutbound?.recipientPhone ?? 'Wala pa'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Last delivered purpose: {runtimeHealth.latestDeliveredOutbound?.purpose ?? 'Wala pa'}
                  </p>
                  {outboundAttentionItems.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {outboundAttentionItems.map((item) => (
                        <div key={item.id} className="rounded-md border bg-background/70 p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{formatDeliveryState(item.deliveryState)}</Badge>
                            <Badge variant="outline">{item.purpose}</Badge>
                            <Badge variant="outline">{item.audience}</Badge>
                            {item.queuePriorityLabel ? <Badge variant="outline">{item.queuePriorityLabel}</Badge> : null}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Recipient: {item.recipientPhone} · Provider: {item.provider}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Created: {formatRuntimeTimestamp(item.createdAt)} · Last status: {formatRuntimeTimestamp(item.lastStatusAt)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Reason: {item.attentionReason ?? item.errorMessage ?? 'Needs manual review'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Walang recent outbound messages na kailangan ng manual attention.
                    </p>
                  )}
                </div>
                <div className="rounded-lg border bg-muted/20 p-3 md:col-span-2">
                  <p className="text-sm font-medium text-foreground">Invite Email</p>
                  <p className="mt-1 text-xs text-muted-foreground">Status: {inviteEmailHealth?.status ?? 'Wala pa'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Huling success: {formatRuntimeTimestamp(inviteEmailHealth?.lastSuccessAt)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Huling failure: {formatRuntimeTimestamp(inviteEmailHealth?.lastFailureAt)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Provider: {String(inviteEmailHealth?.meta?.provider ?? 'Wala pa')}</p>
                  {inviteEmailHealth?.lastError ? (
                    <p className="mt-1 text-xs text-muted-foreground">Error: {inviteEmailHealth?.lastError}</p>
                  ) : null}
                </div>
                <div className="rounded-lg border bg-muted/20 p-3 md:col-span-2">
                  <p className="text-sm font-medium text-foreground">Mobile Push</p>
                  <p className="mt-1 text-xs text-muted-foreground">Status: {mobilePushHealth?.status ?? 'Wala pa'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Huling success: {formatRuntimeTimestamp(mobilePushHealth?.lastSuccessAt)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Huling failure: {formatRuntimeTimestamp(mobilePushHealth?.lastFailureAt)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Huling run: {formatRuntimeTimestamp(runtimeHealth.latestPush?.updatedAt ?? mobilePushHealth?.updatedAt)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Last action: {String(runtimeHealth.latestPush?.meta?.action ?? 'Wala pa')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Last case: {String(runtimeHealth.latestPush?.meta?.caseId ?? 'Wala pa')}</p>
                  {mobilePushHealth?.lastError ? (
                    <p className="mt-1 text-xs text-muted-foreground">Error: {mobilePushHealth?.lastError}</p>
                  ) : null}
                </div>
                <div className="rounded-lg border bg-muted/20 p-3 md:col-span-2">
                  <p className="text-sm font-medium text-foreground">Data Retention</p>
                  <p className="mt-1 text-xs text-muted-foreground">Status: {retentionHealth?.status ?? 'Wala pa'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Huling run: {formatRuntimeTimestamp(retentionHealth?.updatedAt)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Audit logs redacted: {String(retentionHealth?.meta?.redactedAuditLogs ?? 0)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Archived farmers redacted: {String(retentionHealth?.meta?.redactedArchivedFarmers ?? 0)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Checked audit logs: {String(retentionHealth?.meta?.checkedAuditLogs ?? 0)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Checked farmers: {String(retentionHealth?.meta?.checkedFarmers ?? 0)}</p>
                  {retentionHealth?.lastError ? (
                    <p className="mt-1 text-xs text-muted-foreground">Error: {retentionHealth?.lastError}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-background/80 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Ano ang ibig sabihin nito</p>
            <div className="mt-3 space-y-2">
              <p>1. Kapag naka-lock ang AI o uploads, huwag umasa na gagana ang related automation sa live use.</p>
              <p>2. Ang commit/build info ay madaling reference kung updated ba talaga ang deployed website.</p>
              <p>3. Ang teaching queue sa ibaba ang dapat mong unahin kapag may bagong imported file na hindi pa dapat pagkatiwalaan agad.</p>
              {capabilities.knownBuildWarnings.length > 0 ? (
                <p>4. Build note: {capabilities.knownBuildWarnings[0]}</p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
      ) : null}

      <Tabs defaultValue="barangay" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted/60 p-1 md:grid-cols-4">
          <TabsTrigger value="barangay">Barangay Info</TabsTrigger>
          <TabsTrigger value="templates">Mga Template</TabsTrigger>
          <TabsTrigger value="teaching">Pagtuturo</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="barangay" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Impormasyon ng Barangay</CardTitle>
          <CardDescription>
            I-update ang mga paglalarawan at i-configure ang mga setting ng system para sa iyong barangay.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="brgy-desc">Paglalarawan ng Barangay</Label>
                <Textarea 
                    id="brgy-desc" 
                    value={brgyDescription}
                    onChange={(e) => setBrgyDescription(e.target.value)}
                    placeholder="Isulat ang pangkalahatang paglalarawan ng iyong barangay dito..."
                />
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Mga Paglalarawan ng Bawat Zone</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {zoneDescriptions.map((item, index) => (
                    <div key={item.zone} className="space-y-2">
                        <Label htmlFor={`zone-desc-${index}`}>{item.zone}</Label>
                        <Input
                            id={`zone-desc-${index}`}
                            value={item.description}
                            onChange={(e) => {
                                const newDescriptions = [...zoneDescriptions];
                                newDescriptions[index].description = e.target.value;
                                setZoneDescriptions(newDescriptions);
                            }}
                        />
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Separator />
            
            <div className="space-y-4">
                 <div className="space-y-2">
                    <Label>Oras ng Serbisyo ng Auto-Reply</Label>
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                        <Input 
                            id="reply-start-time" 
                            type="time" 
                            value={replyStartTime}
                            onChange={(e) => setReplyStartTime(e.target.value)}
                        />
                        <span className="text-sm text-muted-foreground">hanggang</span>
                         <Input 
                            id="reply-end-time" 
                            type="time" 
                            value={replyEndTime}
                            onChange={(e) => setReplyEndTime(e.target.value)}
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Ito ang live service hours na ginagamit sa advisory notice at after-hours automation copy.
                    </p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="admin-phone">Numero ng Admin (para sa After-Hours)</Label>
                    <Input 
                        id="admin-phone" 
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                    />
                     <p className="text-sm text-muted-foreground">
                        Ang numerong ito ay ilalagay sa after-hours advisory notice.
                     </p>
                </div>
                <div className="rounded-lg border p-4 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <Label className="text-base">Data Retention at Privacy</Label>
                          <p className="text-sm text-muted-foreground">
                            Awtomatikong i-redact ang lumang audit-log PII at mga archived farmer record na lampas na sa retention window.
                          </p>
                        </div>
                        <Switch checked={retentionEnabled} onCheckedChange={setRetentionEnabled} />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="audit-redaction-days">Audit log redaction window (days)</Label>
                        <Input
                          id="audit-redaction-days"
                          type="number"
                          min={30}
                          value={auditLogRedactionDays}
                          onChange={(e) => setAuditLogRedactionDays(Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Pagkalipas ng panahong ito, ang pangalan at detalye sa audit log ay ire-redact pero mananatili ang action at timestamp.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="archived-farmer-redaction-days">Archived farmer redaction window (days)</Label>
                        <Input
                          id="archived-farmer-redaction-days"
                          type="number"
                          min={30}
                          value={archivedFarmerRedactionDays}
                          onChange={(e) => setArchivedFarmerRedactionDays(Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Para sa mga na-archive nang farmer, ire-redact ang direct PII pagkatapos ng retention window habang nananatili ang historical counts.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-md border bg-background/70 p-3 text-sm">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Archived farmers</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{archivedFarmerCount}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{pendingArchivedRedactionCount} ready for next redaction sweep</p>
                      </div>
                      <div className="rounded-md border bg-background/70 p-3 text-sm">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Farmer PII redacted</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{redactedArchivedFarmerCount}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Records retained for audit history without direct PII.</p>
                      </div>
                      <div className="rounded-md border bg-background/70 p-3 text-sm">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Audit logs redacted</p>
                        <p className="mt-2 text-lg font-semibold text-foreground">{redactedAuditLogCount}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{pendingAuditRedactionCount} old logs already due for the next sweep</p>
                      </div>
                      <div className="rounded-md border bg-background/70 p-3 text-sm">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Privacy flow</p>
                        <p className="mt-2 text-sm font-medium text-foreground">Archive to wait to redact</p>
                        <p className="mt-1 text-xs text-muted-foreground">Mas ligtas ito kaysa agad mag-delete, dahil nananatili ang counts at audit trail.</p>
                      </div>
                    </div>
                    <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Retention runtime</p>
                      <p className="mt-1">Status: {retentionHealth?.status ?? 'Wala pa'}</p>
                      <p className="mt-1">Huling run: {formatRuntimeTimestamp(retentionHealth?.updatedAt)}</p>
                      <p className="mt-1">
                        Huling redaction: audit logs {String(retentionHealth?.meta?.redactedAuditLogs ?? 0)}, archived farmers {String(retentionHealth?.meta?.redactedArchivedFarmers ?? 0)}
                      </p>
                      {retentionHealth?.lastError ? (
                        <p className="mt-1">Error: {retentionHealth.lastError}</p>
                      ) : null}
                    </div>
                    <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">Paano gamitin ang privacy controls</p>
                      <p className="mt-1">1. I-archive ang farmer record kung moved away, duplicate, o hindi na aktibo.</p>
                      <p className="mt-1">2. Hintayin ang retention window bago i-redact ng system ang direct PII.</p>
                      <p className="mt-1">3. Gamitin ang retention sweep kung kailangan ng immediate cleanup para sa testing o audit prep.</p>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={handleRunRetentionSweep}
                        disabled={runningAutomation === 'retention'}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        {runningAutomation === 'retention'
                          ? 'Pinoproseso ang retention...'
                          : 'Patakbuhin ngayon ang retention sweep'}
                      </Button>
                    </div>
                </div>
            </div>

        </CardContent>
        <CardFooter className="justify-end gap-2">
            {canOpenDataCenter ? (
              <Button variant="outline" asChild>
                  <Link href="/dashboard/data-center">Buksan ang Data Center</Link>
              </Button>
            ) : null}
            <Button variant="outline" onClick={handleNotify}>Kopyahin ang Advisory Notice</Button>
            <Button onClick={handleSaveChanges}>I-save ang Live Settings</Button>
        </CardFooter>
      </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
        <Card>
          <CardHeader>
                <CardTitle>Mga Template ng Tugon</CardTitle>
                <CardDescription>Pindutin ang isang kategorya para tingnan, i-edit, o tanggalin ang mga template.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templateCategories.map((category) => (
                        <Dialog key={category.id}>
                            <DialogTrigger asChild>
                                <button className="w-full text-left p-4 border rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring">
                                    <h3 className="font-semibold">{category.label}</h3>
                                    <p className="text-sm text-muted-foreground">{category.templates.length} templates</p>
                                </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Mga Template: {category.label}</DialogTitle>
                                    <DialogDescription>Pamahalaan ang mga template para sa kategoryang ito.</DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="h-72 my-4">
                                    <div className="space-y-3 pr-4">
                                        {category.templates.map((template) => (
                                            <div key={template.id} className="flex items-start gap-2 p-3 border rounded-md">
                                                <div className="flex-1">
                                                    <p className="text-sm">{template.text}</p>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {template.keywords.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button size="icon" variant="ghost" onClick={() => handleOpenEditDialog(category.id, template)}>
                                                        <FilePen className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => setDeletingTemplate({ categoryId: category.id, templateId: template.id })}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {category.templates.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Walang template sa kategoryang ito.</p>}
                                    </div>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={() => setAddDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Magdagdag ng Template</Button>
            </CardFooter>
        </Card>
        </TabsContent>

        <TabsContent value="teaching" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pagtuturo sa System</CardTitle>
            <CardDescription>
              Turuan ang Lingkod-Ani gamit ang lokal na cue words, karaniwang parirala, at mga reviewed SMS examples na galing sa tunay na barangay workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Enabled cue rules</p>
                <p className="mt-2 text-2xl font-semibold">{teachingCoverage.enabledRules}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Reviewed SMS examples</p>
                <p className="mt-2 text-2xl font-semibold">{teachingCoverage.approvedExamples}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Pending review</p>
                <p className="mt-2 text-2xl font-semibold">{teachingCoverage.pendingExamples + pendingKnowledgeArticles.length}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Accepted file types</p>
                <p className="mt-2 text-sm font-medium">CSV, Excel, JSON, PDF, larawan, audio</p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Learning Queue para sa mga salitang hindi pa kilala ng system</h3>
                <p className="text-sm text-muted-foreground">
                  Kapag paulit-ulit na may nakikitang lokal na salita ang Lingkod-Ani pero wala pa itong cue rule, lalabas dito ang mga posibleng susunod ninyong ituro.
                </p>
              </div>
              <div className="mt-4 grid gap-3">
                {learningQueue.length > 0 ? learningQueue.map((candidate) => (
                  <div key={candidate.token} className="rounded-lg border bg-background/80 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold">{candidate.token}</span>
                      <Badge variant="outline">{candidate.occurrences} beses nakita</Badge>
                      {candidate.suggestedIntent ? <Badge variant="outline">Madaling iugnay sa {candidate.suggestedIntent}</Badge> : null}
                      {candidate.detectedLanguages.length > 0 ? (
                        <Badge variant="outline">{candidate.detectedLanguages.join(", ")}</Badge>
                      ) : null}
                    </div>
                    {candidate.exampleMessages.length > 0 ? (
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {candidate.exampleMessages.map((exampleMessage, index) => (
                          <p key={`${candidate.token}-${index}`}>• {exampleMessage}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )) : (
                  <div className="rounded-lg border border-dashed bg-background/60 p-4 text-sm text-muted-foreground">
                    Wala pang paulit-ulit na unknown local terms na kailangang gawing cue rule sa ngayon.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Best results para sa pag-turo sa system</p>
              <p className="mt-2">
                Para sa cue bank, gumamit ng isang phrase bawat row sa CSV o Excel. Para sa reviewed teaching files, puwede ang JSON, CSV, Excel, PDF, at malinaw na screenshot o litrato ng reference.
              </p>
              <p className="mt-2">
                Pinakamaganda ang resulta kapag malinaw ang text, hindi malabo ang larawan, at hindi lalampas sa humigit-kumulang 8 MB bawat PDF o image file.
              </p>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">SMS Cue Bank</h3>
                  <p className="text-sm text-muted-foreground">
                    Magdagdag ng lokal na salita o parirala tulad ng pest names, crop aliases, o paulit-ulit na request wording. Ito ang unang tinitingnan ng system bago ito umasa sa generic na analysis.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => lexiconImportRef.current?.click()} disabled={isImportingLexicon}>
                    <Upload className="mr-2 h-4 w-4" />
                    {isImportingLexicon ? 'Ini-import...' : 'Import CSV/Excel/JSON'}
                  </Button>
                  <Button variant="outline" onClick={handleExportLexiconCsv}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={handleExportLexiconJson}>
                    <Download className="mr-2 h-4 w-4" />
                    Export JSON
                  </Button>
                  <Button onClick={openCreateLexiconDialog}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Magdagdag ng Cue Rule
                  </Button>
                </div>
              </div>

              <div className="grid gap-3">
                {smsLexiconRules.map((rule) => (
                  <div key={rule.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-semibold">{rule.phrase}</span>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                            {rule.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <Badge variant="outline">{rule.intent}</Badge>
                          <Badge variant="outline">{rule.urgency}</Badge>
                          <Badge variant="outline">{rule.safetyFlag}</Badge>
                          {rule.tone ? <Badge variant="outline">{rule.tone}</Badge> : null}
                        </div>
                        <p className="text-sm text-muted-foreground">{rule.guidance}</p>
                        {rule.applicability ? (
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">
                            Local applicability: {rule.applicability}
                          </p>
                        ) : null}
                        {rule.notes ? (
                          <p className="text-xs text-muted-foreground">Tala: {rule.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEditLexiconDialog(rule)}>
                          <FilePen className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeletingLexiconRule(rule)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">Reviewed SMS Teaching Files</h3>
                  <p className="text-sm text-muted-foreground">
                    Mag-upload ng reviewed SMS examples para magkaroon ng lokal na precedent ang AI. Puwede ang JSON, CSV, Excel, PDF, audio, at malinaw na larawan o screenshot ng annotated references.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => trainingImportRef.current?.click()} disabled={isImportingTraining}>
                    <Upload className="mr-2 h-4 w-4" />
                    {isImportingTraining ? 'Ini-import...' : 'Import Teaching File / Audio'}
                  </Button>
                  <Button variant="outline" onClick={handleExportTrainingCsv}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Reviewed CSV
                  </Button>
                </div>
              </div>
              <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                Sa live runtime, ginagamit ng system ang approved local cue rules at ang mga pinakahuling reviewed examples bilang dagdag na gabay bago bumuo ng analysis at draft reply. Puwede na ring manggaling ang reviewed examples sa malinaw na narrated audio kung iyon ang mas madaling maihanda ng barangay staff.
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-3 rounded-lg border p-4">
                <div className="space-y-1">
                  <h3 className="font-semibold">Teaching Review Queue</h3>
                  <p className="text-sm text-muted-foreground">
                    Ang imported teaching examples ay hindi dapat agad gamitin bilang precedent hangga't walang review.
                  </p>
                </div>
                {pendingTrainingExamples.length > 0 ? pendingTrainingExamples.map((example) => (
                  <div key={example.id} className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-sm font-medium">{example.farmerName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{example.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Source: {example.sourceLabel ?? 'Imported dataset'} • Suggested final intent: {example.finalReview.finalAnalysis.parsedIntent}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => void reviewSmsTrainingExample(example.id, 'approved', 'Na-review at puwede nang gamitin bilang live precedent.')}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void reviewSmsTrainingExample(example.id, 'rejected', 'Hindi muna gagamitin bilang live precedent.')}>
                        Reject
                      </Button>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Walang teaching examples na naghihintay ng review ngayon.</p>
                )}
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="space-y-1">
                  <h3 className="font-semibold">Knowledge Review Queue</h3>
                  <p className="text-sm text-muted-foreground">
                    Ang imported na article ay puwedeng makita ng admin, pero hindi muna isasama sa live assistant hangga't hindi approved.
                  </p>
                </div>
                {pendingKnowledgeArticles.length > 0 ? pendingKnowledgeArticles.map((article) => (
                  <div key={article.id} className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-sm font-medium">{article.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{article.summary}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Source: {article.sourceLabel ?? article.author} • Version: {article.version ?? 1}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => void reviewKnowledgeArticle(article.id, 'approved', 'Na-review at puwede nang gamitin sa live search assistant.')}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void reviewKnowledgeArticle(article.id, 'archived', 'Hindi muna isasama sa active local knowledge base.')}>
                        Archive
                      </Button>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Walang knowledge articles na naghihintay ng review ngayon.</p>
                )}
              </div>
            </div>

            <Input
              ref={lexiconImportRef}
              type="file"
              accept=".json,.csv,.xls,.xlsx,application/json,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={handleImportLexiconSelect}
            />
            <Input
              ref={trainingImportRef}
              type="file"
              accept=".json,.csv,.xls,.xlsx,.pdf,.mp3,.wav,.m4a,.aac,.ogg,.webm,application/json,text/csv,application/pdf,image/*,audio/*,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={handleImportTrainingSelect}
            />
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleSaveChanges}>I-save ang Itinuro sa System</Button>
          </CardFooter>
        </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-6">
      {false && isLiveMode ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Automation sa Free Hosting</CardTitle>
            <CardDescription>
              Sa kasalukuyang free-hosting setup, puwedeng tumakbo araw-araw sa background ang overdue SMS at follow-up automation kapag naka-deploy ang cron routes, at may manual fallback pa rin para sa testing o emergency reruns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Kapag naka-deploy sa Vercel Hobby na may configured <code>CRON_SECRET</code>, nakaiskedyul ang overdue SMS at follow-up batch checks isang beses kada araw kahit walang nakabukas na dashboard tab.
            </p>
            <p>
              Kung kailangan mo ng mas madalas na unattended checks kaysa araw-araw, puwede kang gumamit ng libreng external scheduler tulad ng GitHub Actions o Cloudflare Workers Cron, o mano-manong rerun mula sa page na ito.
            </p>
            <p>
              May nakahandang GitHub Actions workflow template sa repository na puwedeng tumama sa automation endpoints gamit ang secure automation token, para hindi nakaasa lang sa daily Vercel Hobby cron.
            </p>
            <p>
              Maaari mo pa ring gamitin ang mga button sa ibaba para sa mano-manong rerun anumang oras, lalo na habang local testing o kapag gusto mong pilitin ang isang bagong batch check agad.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => runAutomation('overdue')}
              disabled={runningAutomation !== null}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {runningAutomation === 'overdue' ? 'Pinoproseso ang overdue SMS...' : 'Patakbuhin ang Overdue SMS Check'}
            </Button>
            <Button
              onClick={() => runAutomation('followup')}
              disabled={runningAutomation !== null}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {runningAutomation === 'followup' ? 'Pinoproseso ang follow-up...' : 'Patakbuhin ang Follow-up Check'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => runAutomation('retention')}
              disabled={runningAutomation !== null}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {runningAutomation === 'retention' ? 'Pinoproseso ang retention...' : 'Patakbuhin ang Data Retention Sweep'}
            </Button>
          </CardFooter>
        </Card>
      ) : null}
        <Card>
          <CardHeader>
              <CardTitle>Pagtugon sa Emergency</CardTitle>
              <CardDescription>Awtomatikong magpadala ng paunang tugon para sa mga mensaheng may mataas na prayoridad kung walang aksyon mula sa admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                  <Switch id="auto-reply-switch" checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
                  <Label htmlFor="auto-reply-switch">Paganahin ang awtomatikong pagtugon para sa mga urgent na mensahe</Label>
              </div>
              {autoReplyEnabled && (
                <>
                  <div className="space-y-2 pt-4">
                      <Label htmlFor="auto-reply-timeout">Timeout para sa Admin (minuto)</Label>
                      <Input id="auto-reply-timeout" type="number" value={autoReplyTimeout} onChange={(e) => setAutoReplyTimeout(Number(e.target.value))} />
                      <p className="text-sm text-muted-foreground">
                          Ito ang live timeout na ginagamit ng inbound analysis at overdue SMS automation.
                      </p>
                  </div>
                  <div className="space-y-2">
                      <Label>Template source para sa Auto-Reply</Label>
                      <div className="rounded-md border p-3 text-sm text-muted-foreground">
                          Ginagamit ng system ang unang template sa kategoryang <strong>Emergency</strong> para sa urgent cases,
                          <strong> Pagsisiyasat</strong> para sa clarification cases, at <strong>Pagkumpirma</strong> o
                          <strong> Resolusyon</strong> para sa mga regular na fallback reply.
                      </div>
                      <p className="text-sm text-muted-foreground">
                          Kapag in-edit at sinave ang mga template sa itaas, iyon din ang gagamitin ng automation sa live mode.
                      </p>
                  </div>
                </>
              )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveChanges}>I-save ang mga Setting ng Emergency</Button>
          </CardFooter>
      </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Template Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Magdagdag ng Bagong Template</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-template-text">Text ng Template</Label>
                        <Textarea id="new-template-text" value={newTemplateText} onChange={(e) => setNewTemplateText(e.target.value)} placeholder="Isulat ang iyong bagong template dito..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-template-keywords">Mga Keyword (paghiwalayin ng kuwit)</Label>
                        <Input id="new-template-keywords" value={newTemplateKeywords} onChange={(e) => setNewTemplateKeywords(e.target.value)} placeholder="hal. voucher, binhi, kunin" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-template-category">Kategorya</Label>
                        <Select value={newTemplateCategory} onValueChange={setNewTemplateCategory}>
                            <SelectTrigger id="new-template-category">
                                <SelectValue placeholder="Pumili ng kategorya..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templateCategories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Kanselahin</Button></DialogClose>
                    <Button onClick={handleAddTemplate}>I-save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Edit Template Dialog */}
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>I-edit ang Template</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-template-text">Text ng Template</Label>
                        <Textarea id="edit-template-text" value={editedTemplateText} onChange={(e) => setEditedTemplateText(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-template-keywords">Mga Keyword (paghiwalayin ng kuwit)</Label>
                        <Input id="edit-template-keywords" value={editedTemplateKeywords} onChange={(e) => setEditedTemplateKeywords(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Kanselahin</Button></DialogClose>
                    <Button onClick={handleUpdateTemplate}>I-save ang mga Pagbabago</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog
            open={isLexiconDialogOpen}
            onOpenChange={(open) => {
                setLexiconDialogOpen(open);
                if (!open) {
                    resetLexiconForm(null);
                }
            }}
        >
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editingLexiconRule ? 'I-edit ang Cue Rule' : 'Magdagdag ng Cue Rule'}</DialogTitle>
                    <DialogDescription>
                        Ang cue rules ay lokal na salita o parirala na inuuna ng system kapag tumutugma sa mensahe ng magsasaka.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="rule-phrase">Phrase o keyword</Label>
                        <Input
                            id="rule-phrase"
                            value={rulePhrase}
                            onChange={(event) => setRulePhrase(event.target.value)}
                            placeholder="hal. armyworm, tungro, walang patubig"
                        />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-2">
                            <Label>Intent</Label>
                            <Select value={ruleIntent} onValueChange={(value) => setRuleIntent(value as SmsLexiconRule['intent'])}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="REGISTER">REGISTER</SelectItem>
                                    <SelectItem value="CROP_UPDATE">CROP_UPDATE</SelectItem>
                                    <SelectItem value="HARVEST">HARVEST</SelectItem>
                                    <SelectItem value="REQUEST">REQUEST</SelectItem>
                                    <SelectItem value="PEST_DISEASE">PEST_DISEASE</SelectItem>
                                    <SelectItem value="WEATHER_HELP">WEATHER_HELP</SelectItem>
                                    <SelectItem value="PRICE_CHECK">PRICE_CHECK</SelectItem>
                                    <SelectItem value="EMERGENCY">EMERGENCY</SelectItem>
                                    <SelectItem value="UNKNOWN">UNKNOWN</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Urgency</Label>
                            <Select value={ruleUrgency} onValueChange={(value) => setRuleUrgency(value as SmsLexiconRule['urgency'])}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">low</SelectItem>
                                    <SelectItem value="medium">medium</SelectItem>
                                    <SelectItem value="high">high</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Safety flag</Label>
                            <Select value={ruleSafetyFlag} onValueChange={(value) => setRuleSafetyFlag(value as SmsLexiconRule['safetyFlag'])}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tone</Label>
                            <Select value={ruleTone} onValueChange={(value) => setRuleTone(value as SmsTone | 'none')}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Walang override</SelectItem>
                                    <SelectItem value="Neutral">Neutral</SelectItem>
                                    <SelectItem value="Nag-aalala">Nag-aalala</SelectItem>
                                    <SelectItem value="Kritikal">Kritikal</SelectItem>
                                    <SelectItem value="Positibo">Positibo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rule-guidance">Guidance na dapat sundin ng system</Label>
                        <Textarea
                            id="rule-guidance"
                            value={ruleGuidance}
                            onChange={(event) => setRuleGuidance(event.target.value)}
                            placeholder="hal. I-prioritize ang field validation at magbigay ng ligtas na paunang payo habang hinihintay ang AEW review."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rule-applicability">Local applicability check</Label>
                        <Textarea
                            id="rule-applicability"
                            value={ruleApplicability}
                            onChange={(event) => setRuleApplicability(event.target.value)}
                            placeholder="hal. I-check muna kung may available na stock, akma sa crop stage, at valid sa local na kondisyon bago irekomenda."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rule-notes">Notes para sa admin team</Label>
                        <Textarea
                            id="rule-notes"
                            value={ruleNotes}
                            onChange={(event) => setRuleNotes(event.target.value)}
                            placeholder="Opsyonal: lokal na alias, crop coverage, o special reminder."
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="rule-enabled" checked={ruleEnabled} onCheckedChange={setRuleEnabled} />
                        <Label htmlFor="rule-enabled">Gamitin ang cue rule na ito sa live analysis</Label>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Kanselahin</Button></DialogClose>
                    <Button onClick={handleSaveLexiconRule}>I-save ang Cue Rule</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sigurado ka ba?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Ang aksyon na ito ay hindi na maaaring bawiin. Permanenteng tatanggalin nito ang template na ito.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingTemplate(null)}>Kanselahin</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTemplate}>Ituloy</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deletingLexiconRule} onOpenChange={() => setDeletingLexiconRule(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Tanggalin ang cue rule?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Mawawala ang lokal na cue rule na ito sa susunod na save ng settings. Maaari ka pa ring mag-import muli o gumawa ng bagong rule pagkatapos.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletingLexiconRule(null)}>Kanselahin</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteLexiconRule}>Tanggalin</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}

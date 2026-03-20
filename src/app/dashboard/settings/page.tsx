
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
import { canAccessDataCenter, canManageBarangaySettings } from '@/lib/access-control';
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
import { summarizeTeachingCoverage } from '@/lib/sms-teaching';
import { isSpreadsheetExtension, readSpreadsheetAsCsv } from '@/lib/spreadsheet-import';
import type { SmsLexiconRule, SmsTone, SystemTemplate, SystemTemplateCategory } from '@/lib/types';
import { defaultSystemSettings } from '@/lib/system-settings';

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
      systemSettings,
      saveSystemSettings,
      smsTrainingExamples,
      importSmsTrainingExamples,
    } = useData();
    const { currentUser, currentUserProfile } = useAuth();
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
    const [ruleNotes, setRuleNotes] = useState('');
    const [ruleEnabled, setRuleEnabled] = useState(true);


    const [autoReplyEnabled, setAutoReplyEnabled] = useState(defaultSystemSettings.autoReplyEnabled);
    const [autoReplyTimeout, setAutoReplyTimeout] = useState(defaultSystemSettings.autoReplyTimeoutMinutes);
    const [runningAutomation, setRunningAutomation] = useState<null | 'overdue' | 'followup'>(null);
    const [isImportingLexicon, setIsImportingLexicon] = useState(false);
    const [isImportingTraining, setIsImportingTraining] = useState(false);
    const canManageSettings = canManageBarangaySettings(currentUserProfile);
    const canOpenDataCenter = canAccessDataCenter(currentUserProfile);
    const teachingCoverage = summarizeTeachingCoverage(smsLexiconRules, smsTrainingExamples);

    useEffect(() => {
        if (currentUserProfile && !canManageSettings) {
            router.replace('/dashboard');
        }
    }, [canManageSettings, currentUserProfile, router]);
    
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

            if (extension === "pdf" || file.type.startsWith("image/")) {
                const formData = new FormData();
                formData.append("file", file);

                const headers: HeadersInit = {};

                if (isLiveMode) {
                    const idToken = await getClientAuth().currentUser?.getIdToken();

                    if (!idToken) {
                        throw new Error("Mag-sign in muna sa live account bago mag-import ng PDF o larawan.");
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
                    throw new Error(String(payload.error ?? "Hindi mabasa ang PDF/image file."));
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

    const runAutomation = async (target: 'overdue' | 'followup') => {
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
                : '/api/system/process-follow-ups';
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
                title: target === 'overdue' ? 'Natapos ang overdue SMS check' : 'Natapos ang follow-up check',
                description: payload.skipped
                    ? 'May kasalukuyang automation run na isinasagawa sa ibang session.'
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

    if (currentUserProfile && !canManageSettings) {
        return (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Card className="max-w-lg border-amber-300/40 bg-amber-50/60">
              <CardHeader>
                <CardTitle>Limitado ang Access sa Settings</CardTitle>
                <CardDescription>
                  Ang page na ito ay para lamang sa barangay managers at developers. Ibinabalik ka na sa dashboard.
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
        <p className="text-muted-foreground">Pamahalaan ang mga detalye tungkol sa iyong barangay at i-configure ang mga setting ng system.</p>
      </div>

      <Tabs defaultValue="barangay" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted/60 p-1 md:grid-cols-4">
          <TabsTrigger value="barangay">Barangay Info</TabsTrigger>
          <TabsTrigger value="templates">Mga Template</TabsTrigger>
          <TabsTrigger value="teaching">Pagtuturo</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
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
                <p className="text-sm text-muted-foreground">Accepted file types</p>
                <p className="mt-2 text-sm font-medium">CSV, Excel, JSON, PDF, larawan</p>
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
                    Mag-upload ng reviewed SMS examples para magkaroon ng lokal na precedent ang AI. Puwede ang JSON, CSV, Excel, PDF, at malinaw na larawan o screenshot ng annotated references.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => trainingImportRef.current?.click()} disabled={isImportingTraining}>
                    <Upload className="mr-2 h-4 w-4" />
                    {isImportingTraining ? 'Ini-import...' : 'Import Teaching File'}
                  </Button>
                  <Button variant="outline" onClick={handleExportTrainingCsv}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Reviewed CSV
                  </Button>
                </div>
              </div>
              <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                Sa live runtime, ginagamit ng system ang approved local cue rules at ang mga pinakahuling reviewed examples bilang dagdag na gabay bago bumuo ng analysis at draft reply.
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
              accept=".json,.csv,.xls,.xlsx,.pdf,application/json,text/csv,application/pdf,image/*,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={handleImportTrainingSelect}
            />
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleSaveChanges}>I-save ang Itinuro sa System</Button>
          </CardFooter>
        </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
      {isLiveMode ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Automation sa Free Hosting</CardTitle>
            <CardDescription>
              Gumagana pa rin ang overdue SMS at follow-up automation sa Vercel Hobby kahit walang paid cron jobs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Habang may naka-open na live dashboard, awtomatikong tatakbo ang overdue SMS checks kada 1 minuto at ang follow-up checks kada 30 minuto.
            </p>
            <p>
              Kapag walang staff na naka-open sa dashboard, hindi tuloy-tuloy ang background run. Maaari mong gamitin ang mga button sa ibaba para mano-manong patakbuhin ang checks anumang oras.
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

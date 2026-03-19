'use client';

import Link from 'next/link';
import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BrainCircuit,
  Download,
  FileJson,
  Shield,
  Upload,
} from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { useData } from '@/context/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { HelpDialog } from '@/components/ui/help-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  extractKnowledgeArticlesFromJson,
  extractSmsTrainingExamplesFromJson,
  extractUserManagementValuesFromJson,
  formatKnowledgeArticlesAsCsv,
  formatSmsTrainingExamplesAsCsv,
  formatUsersAsCsv,
  isPortableAppBackup,
  parseKnowledgeArticlesCsv,
  parseSmsTrainingExamplesCsv,
  parseUsersCsv,
} from '@/lib/data-portability';
import { getClientAuth } from '@/lib/firebase/auth-client';
import { isLiveMode } from '@/lib/config/app-mode';

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

export default function DataCenterPage() {
  const {
    farmers,
    resources,
    knowledgeArticles,
    marketPrices,
    smsMessages,
    smsTrainingExamples,
    users,
    addUser,
    exportPortableBackup,
    importKnowledgeArticles,
    importPortableBackup,
    importSmsTrainingExamples,
  } = useData();
  const { currentUserProfile } = useAuth();
  const { toast } = useToast();
  const backupImportRef = useRef<HTMLInputElement>(null);
  const knowledgeImportRef = useRef<HTMLInputElement>(null);
  const trainingImportRef = useRef<HTMLInputElement>(null);
  const staffImportRef = useRef<HTMLInputElement>(null);
  const [isImportingBackup, setIsImportingBackup] = useState(false);
  const [isImportingKnowledge, setIsImportingKnowledge] = useState(false);
  const [isImportingTraining, setIsImportingTraining] = useState(false);
  const [isImportingStaff, setIsImportingStaff] = useState(false);

  const isDeveloper = currentUserProfile?.role === 'developer';
  const backHref = isDeveloper ? '/dashboard/developer' : '/dashboard/settings';
  const snapshotSummary = useMemo(() => ([
    { label: 'Farmers', value: farmers.length },
    { label: 'SMS', value: smsMessages.length },
    { label: 'Resources', value: resources.length },
    { label: 'Knowledge', value: knowledgeArticles.length },
    { label: 'Prices', value: marketPrices.length },
    { label: 'Training', value: smsTrainingExamples.length },
  ]), [farmers.length, knowledgeArticles.length, marketPrices.length, resources.length, smsMessages.length, smsTrainingExamples.length]);

  const handleExportBackup = () => {
    const backup = exportPortableBackup();
    downloadFile(
      `lingkod-ani-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(backup, null, 2),
      'application/json'
    );
    toast({
      title: 'Na-export ang backup',
      description: 'Na-download ang operational backup ng app bilang JSON file.',
    });
  };

  const handleImportBackupSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImportingBackup(true);

    try {
      const payload = JSON.parse(await file.text()) as unknown;

      if (!isPortableAppBackup(payload)) {
        throw new Error('Hindi tugma ang backup file sa Lingkod-Ani backup format.');
      }

      const result = await importPortableBackup(payload);
      toast({
        title: 'Na-import ang backup',
        description: `Na-merge ang ${result.importedRecords} record mula sa ${result.importedCollections.length} collection.`,
      });
    } catch (error) {
      toast({
        title: 'Hindi ma-import ang backup',
        description: error instanceof Error ? error.message : 'Hindi mabasa ang backup file.',
        variant: 'destructive',
      });
    } finally {
      setIsImportingBackup(false);
      event.target.value = '';
    }
  };

  const handleExportTrainingJson = () => {
    downloadFile(
      `sms-training-examples-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(smsTrainingExamples, null, 2),
      'application/json'
    );
    toast({
      title: 'Na-export ang training data',
      description: `${smsTrainingExamples.length} training examples ang naisama sa JSON file.`,
    });
  };

  const handleExportKnowledgeJson = () => {
    downloadFile(
      `knowledge-articles-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(knowledgeArticles, null, 2),
      'application/json'
    );
    toast({
      title: 'Na-export ang knowledge files',
      description: `${knowledgeArticles.length} knowledge articles ang naisama sa JSON file.`,
    });
  };

  const handleExportKnowledgeCsv = () => {
    downloadFile(
      `knowledge-articles-${new Date().toISOString().slice(0, 10)}.csv`,
      formatKnowledgeArticlesAsCsv(knowledgeArticles),
      'text/csv;charset=utf-8'
    );
    toast({
      title: 'Na-export ang knowledge files',
      description: `${knowledgeArticles.length} knowledge articles ang naisama sa CSV file.`,
    });
  };

  const handleImportKnowledgeSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImportingKnowledge(true);

    try {
      const text = await file.text();
      const extension = getFileExtension(file.name);
      const articles = extension === 'csv'
        ? parseKnowledgeArticlesCsv(text)
        : extractKnowledgeArticlesFromJson(JSON.parse(text));

      if (articles.length === 0) {
        throw new Error('Walang valid na knowledge articles sa file.');
      }

      const count = await importKnowledgeArticles(articles);
      toast({
        title: 'Na-import ang knowledge files',
        description: `${count} knowledge articles ang na-merge sa reply knowledge base.`,
      });
    } catch (error) {
      toast({
        title: 'Hindi ma-import ang knowledge files',
        description: error instanceof Error ? error.message : 'Hindi mabasa ang knowledge file.',
        variant: 'destructive',
      });
    } finally {
      setIsImportingKnowledge(false);
      event.target.value = '';
    }
  };

  const handleExportTrainingCsv = () => {
    downloadFile(
      `sms-training-examples-${new Date().toISOString().slice(0, 10)}.csv`,
      formatSmsTrainingExamplesAsCsv(smsTrainingExamples),
      'text/csv;charset=utf-8'
    );
    toast({
      title: 'Na-export ang training data',
      description: `${smsTrainingExamples.length} training examples ang naisama sa CSV file.`,
    });
  };

  const handleImportTrainingSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsImportingTraining(true);

    try {
      const text = await file.text();
      const extension = getFileExtension(file.name);
      const examples = extension === 'csv'
        ? parseSmsTrainingExamplesCsv(text)
        : extractSmsTrainingExamplesFromJson(JSON.parse(text));

      if (examples.length === 0) {
        throw new Error('Walang valid na SMS training examples sa file.');
      }

      const count = await importSmsTrainingExamples(examples);
      toast({
        title: 'Na-import ang training data',
        description: `${count} training examples ang na-merge sa dataset.`,
      });
    } catch (error) {
      toast({
        title: 'Hindi ma-import ang training data',
        description: error instanceof Error ? error.message : 'Hindi mabasa ang training file.',
        variant: 'destructive',
      });
    } finally {
      setIsImportingTraining(false);
      event.target.value = '';
    }
  };

  const handleExportStaffJson = () => {
    const normalizedUsers = users.map((user) => ({
      name: user.name,
      email: user.email,
      title: user.title ?? '',
      phone: user.phone ?? '',
      role: user.role,
      status: user.status ?? 'active',
      preferredWorkspace: user.preferredWorkspace ?? (user.role === 'developer' ? 'detailed' : 'simple'),
    }));

    downloadFile(
      `lingkod-ani-staff-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(normalizedUsers, null, 2),
      'application/json'
    );
    toast({
      title: 'Na-export ang staff list',
      description: `${normalizedUsers.length} staff profiles ang naisama sa JSON file.`,
    });
  };

  const handleExportStaffCsv = () => {
    downloadFile(
      `lingkod-ani-staff-${new Date().toISOString().slice(0, 10)}.csv`,
      formatUsersAsCsv(users),
      'text/csv;charset=utf-8'
    );
    toast({
      title: 'Na-export ang staff list',
      description: `${users.length} staff profiles ang naisama sa CSV file.`,
    });
  };

  const handleImportStaffSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !isDeveloper) {
      return;
    }

    setIsImportingStaff(true);

    try {
      const text = await file.text();
      const extension = getFileExtension(file.name);
      const rows = extension === 'csv'
        ? parseUsersCsv(text)
        : extractUserManagementValuesFromJson(JSON.parse(text));

      if (rows.length === 0) {
        throw new Error('Walang valid na staff records sa file.');
      }

      if (isLiveMode) {
        const idToken = await getClientAuth().currentUser?.getIdToken();

        if (!idToken) {
          throw new Error('Walang authenticated developer session.');
        }

        const results: Array<Record<string, string>> = [];

        for (const row of rows) {
          const response = await fetch('/api/developer/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(row),
          });
          const payload = await response.json().catch(() => ({}));

          results.push({
            email: row.email,
            name: row.name,
            status: response.ok ? 'created' : 'failed',
            temporaryPassword: typeof payload.temporaryPassword === 'string' ? payload.temporaryPassword : '',
            error: response.ok ? '' : String(payload.error ?? 'Import failed'),
          });
        }

        const successCount = results.filter((item) => item.status === 'created').length;
        const passwordRows = results.filter((item) => item.temporaryPassword);

        if (passwordRows.length > 0) {
          downloadFile(
            `lingkod-ani-import-passwords-${new Date().toISOString().slice(0, 10)}.json`,
            JSON.stringify(passwordRows, null, 2),
            'application/json'
          );
        }

        toast({
          title: 'Natapos ang staff import',
          description: `${successCount} sa ${rows.length} staff records ang na-provision. ${passwordRows.length > 0 ? 'Na-download din ang temporary passwords.' : ''}`,
          variant: successCount > 0 ? 'default' : 'destructive',
        });
      } else {
        rows.forEach((row) => addUser(row));
        toast({
          title: 'Na-import ang staff list',
          description: `${rows.length} demo staff profiles ang naidagdag.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Hindi ma-import ang staff list',
        description: error instanceof Error ? error.message : 'Hindi mabasa ang staff file.',
        variant: 'destructive',
      });
    } finally {
      setIsImportingStaff(false);
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Input ref={backupImportRef} type="file" className="hidden" accept=".json,application/json" onChange={handleImportBackupSelect} />
      <Input ref={knowledgeImportRef} type="file" className="hidden" accept=".json,.csv,application/json,text/csv" onChange={handleImportKnowledgeSelect} />
      <Input ref={trainingImportRef} type="file" className="hidden" accept=".json,.csv,application/json,text/csv" onChange={handleImportTrainingSelect} />
      <Input ref={staffImportRef} type="file" className="hidden" accept=".json,.csv,application/json,text/csv" onChange={handleImportStaffSelect} />

      <div className="flex items-center gap-4">
        <HoverTooltip text={isDeveloper ? 'Bumalik sa developer dashboard' : 'Bumalik sa barangay settings'}>
          <Button variant="outline" size="icon" asChild>
            <Link href={backHref}>
              <ArrowLeft />
            </Link>
          </Button>
        </HoverTooltip>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Data Center</h1>
            <HelpDialog title="Data Center" tooltipText="Import, export, at backup center">
              <p>Dito pinamamahalaan ang backup, restore, at file-based import/export ng Lingkod-Ani.</p>
              <p><strong>Operational backup:</strong> kasama ang farmers, SMS, resources, knowledge base, price watch, alerts, assistance, field visits, vouchers, logs, at system settings.</p>
              <p><strong>Knowledge files:</strong> puwedeng mag-import ng JSON o CSV articles/tips na puwedeng maging reference ng system replies at staff search workflows.</p>
              <p><strong>Training data:</strong> maaari nang mag-import at mag-export ng labeled SMS examples ang barangay at developer.</p>
              <p><strong>Mahalaga:</strong> ang training files at templates ay tumutulong sa evaluation, prompt tuning, at workflow quality, pero hindi nito awtomatikong fine-tune ang Gemini model.</p>
            </HelpDialog>
          </div>
          <p className="text-muted-foreground">Backup, restore, at file-based portability para sa operational data at training assets.</p>
        </div>
      </div>

      {isDeveloper ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 p-5 text-sm text-muted-foreground">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-semibold tracking-tight text-foreground">Developer oversight mode</p>
              <p>
                Ang page na ito ay para sa platform monitoring, staff provisioning, at controlled data portability.
                Hindi ito barangay operations page at hindi ito kapalit ng pang-araw-araw na barangay settings workflow.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-6">
        {snapshotSummary.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle>{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Operational Backup</CardTitle>
            <CardDescription>Export ang buong operational state bilang JSON backup, o mag-import ng existing Lingkod-Ani backup file.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportBackup}>
              <Download className="mr-2 h-4 w-4" />
              Export Backup
            </Button>
            <Button onClick={() => backupImportRef.current?.click()} disabled={isImportingBackup}>
              <Upload className="mr-2 h-4 w-4" />
              {isImportingBackup ? 'Nag-i-import...' : 'Import Backup'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Ang import na ito ay <strong>merge/upsert</strong> sa live mode. Ibig sabihin, ia-add o ia-update nito ang records na nasa file, pero hindi awtomatikong buburahin ang lumang data na wala sa backup.</p>
          <p>Kasama sa backup ang templates at system settings, kaya puwedeng i-restore ang mga reply rules, service hours, at barangay advisory content.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Knowledge Files</CardTitle>
            <CardDescription>Mag-import o mag-export ng articles, tips, at structured reply references para sa knowledge base.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportKnowledgeJson}>
              <FileJson className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="outline" onClick={handleExportKnowledgeCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => knowledgeImportRef.current?.click()} disabled={isImportingKnowledge}>
              <Upload className="mr-2 h-4 w-4" />
              {isImportingKnowledge ? 'Nag-i-import...' : 'Import Knowledge File'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Supported formats: `JSON` at `CSV`. Ito ang pinakamalapit sa “upload files that shape replies” sa current app, dahil ang imported entries ay napupunta sa shared knowledge base na puwedeng gamitin ng staff at future AI lookup workflows.</p>
          <p>Para sa audio uploads, article metadata pa lang ang portable ngayon. Wala pang real file storage/transcription pipeline para sa audio asset mismo.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>SMS Training Files</CardTitle>
            <CardDescription>Mag-import o mag-export ng labeled SMS examples para sa review, QA, at future AI tuning work.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportTrainingJson}>
              <FileJson className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            <Button variant="outline" onClick={handleExportTrainingCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => trainingImportRef.current?.click()} disabled={isImportingTraining}>
              <Upload className="mr-2 h-4 w-4" />
              {isImportingTraining ? 'Nag-i-import...' : 'Import Training File'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Supported formats: `JSON` at `CSV`. Maaari kang mag-upload ng dating export file, o sarili mong labeled dataset basta tugma ang fields.</p>
          <p>Ang training files ay hindi pa direktang nagre-retrain ng Gemini model, pero agad silang nagiging managed dataset para sa human review, audit, at future tuning/export work.</p>
        </CardContent>
      </Card>

      {isDeveloper ? (
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Staff Access Import/Export</CardTitle>
              </div>
              <CardDescription>Developer-only provisioning files para sa barangay staff accounts at access profiles.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExportStaffJson}>
                <FileJson className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
              <Button variant="outline" onClick={handleExportStaffCsv}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={() => staffImportRef.current?.click()} disabled={isImportingStaff}>
                <Upload className="mr-2 h-4 w-4" />
                {isImportingStaff ? 'Nag-i-import...' : 'Import Staff File'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Sa live mode, ang import na ito ay gumagamit ng parehong provisioning API na ginagamit sa developer add-user flow, kaya maaari itong gumawa ng real Firebase Auth accounts at user profiles.</p>
            <p>Kapag may bagong temporary passwords, ida-download sila bilang hiwalay na JSON file para may record ka agad para sa turnover.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <CardTitle>What Influences Replies Right Now</CardTitle>
            </div>
            <CardDescription>Para malinaw kung ano ang na-aapektuhan ng uploads at settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>System templates:</strong> ginagamit sa auto-reply at fallback messaging.</p>
            <p><strong>Knowledge articles:</strong> ginagamit sa search at guidance workflows.</p>
            <p><strong>Price watch:</strong> ginagamit sa `PRICE_CHECK` SMS advice.</p>
            <p><strong>Training files:</strong> ginagamit sa QA at future tuning/export, pero hindi pa auto-fine-tune.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

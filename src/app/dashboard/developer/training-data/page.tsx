'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { ArrowLeft, BrainCircuit, Download, FileJson, Search } from 'lucide-react';

import { useData } from '@/context/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import { HelpDialog } from '@/components/ui/help-dialog';
import { useToast } from '@/hooks/use-toast';

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export default function TrainingDataPage() {
  const { smsTrainingExamples } = useData();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExamples = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();

    if (!needle) {
      return smsTrainingExamples;
    }

    return smsTrainingExamples.filter((example) => (
      example.message.toLowerCase().includes(needle) ||
      example.farmerName.toLowerCase().includes(needle) ||
      example.originalAnalysis.parsedIntent.toLowerCase().includes(needle) ||
      example.finalReview.action.toLowerCase().includes(needle) ||
      example.finalReview.reviewedBy.toLowerCase().includes(needle)
    ));
  }, [searchQuery, smsTrainingExamples]);

  const summary = useMemo(() => {
    return {
      total: smsTrainingExamples.length,
      aiBacked: smsTrainingExamples.filter((item) => item.analysisSource === 'ai').length,
      fallback: smsTrainingExamples.filter((item) => item.analysisSource === 'ai_fallback').length,
      edited: smsTrainingExamples.filter((item) => item.finalReview.wasAdviceEdited).length,
    };
  }, [smsTrainingExamples]);

  const handleExportJson = () => {
    downloadFile(
      `sms-training-examples-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(filteredExamples, null, 2),
      'application/json'
    );
    toast({
      title: 'Na-export ang JSON',
      description: `${filteredExamples.length} training examples ang naisama sa export.`,
    });
  };

  const handleExportCsv = () => {
    const rows = [
      [
        'id',
        'smsMessageId',
        'farmerName',
        'phone',
        'message',
        'analysisSource',
        'originalIntent',
        'originalUrgency',
        'originalTone',
        'reviewAction',
        'finalStatus',
        'finalAdvice',
        'reviewedBy',
        'reviewedAt',
        'wasAdviceEdited',
      ],
      ...filteredExamples.map((example) => [
        example.id,
        example.smsMessageId,
        example.farmerName,
        example.phone,
        example.message.replaceAll('"', '""'),
        example.analysisSource,
        example.originalAnalysis.parsedIntent,
        example.originalAnalysis.urgency,
        example.originalAnalysis.tone ?? '',
        example.finalReview.action,
        example.finalReview.status,
        example.finalReview.finalAdvice.replaceAll('"', '""'),
        example.finalReview.reviewedBy,
        example.finalReview.reviewedAt,
        String(example.finalReview.wasAdviceEdited),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    downloadFile(
      `sms-training-examples-${new Date().toISOString().slice(0, 10)}.csv`,
      csv,
      'text/csv;charset=utf-8'
    );
    toast({
      title: 'Na-export ang CSV',
      description: `${filteredExamples.length} training examples ang naisama sa export.`,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <HoverTooltip text="Bumalik sa Developer Dashboard">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/developer">
              <ArrowLeft />
            </Link>
          </Button>
        </HoverTooltip>
        <div className="space-y-1">
          <div className="flex items-center">
            <BrainCircuit className="mr-2 h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-tight">SMS Training Data</h1>
            <HelpDialog title="SMS Training Data" tooltipText="Suriin ang mga labeled SMS records.">
              <p>Ang pahinang ito ay nagpapakita ng mga SMS na na-review na ng tao at na-convert sa structured training examples.</p>
              <p><strong>Gamit nito:</strong> prompt tuning, AI evaluation, at pagbuo ng hinaharap na fine-tuning dataset.</p>
              <p><strong>Analysis source:</strong> ipinapakita kung ang unang analysis ay galing sa AI, rule fallback, o pure rules.</p>
            </HelpDialog>
          </div>
          <p className="text-muted-foreground">Suriin at i-export ang mga human-reviewed SMS examples para sa future AI improvement.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total reviewed</CardDescription>
            <CardTitle>{summary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI-analyzed</CardDescription>
            <CardTitle>{summary.aiBacked}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>AI fallback</CardDescription>
            <CardTitle>{summary.fallback}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Advice edited</CardDescription>
            <CardTitle>{summary.edited}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Captured Examples</CardTitle>
            <CardDescription>Mga SMS na na-review na ng admin at puwedeng gamitin bilang labeled dataset.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportJson}>
              <FileJson className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
            <Button onClick={handleExportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Maghanap sa farmer, message, reviewer, intent, o action..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          {filteredExamples.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Wala pang captured training examples. Mag-review muna ng SMS sa live feed para makabuo ng labeled data.
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Original Analysis</TableHead>
                    <TableHead>Final Review</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Reviewed By</TableHead>
                    <TableHead>Reviewed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExamples.map((example) => (
                    <TableRow key={example.id} className="align-top">
                      <TableCell className="min-w-56">
                        <div className="space-y-1">
                          <p className="font-medium">{example.farmerName}</p>
                          <p className="text-xs text-muted-foreground">{example.phone}</p>
                          <p className="text-xs leading-5 text-muted-foreground">{example.message}</p>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-52">
                        <div className="flex flex-wrap gap-2 pb-2">
                          <Badge variant="outline">{example.originalAnalysis.parsedIntent}</Badge>
                          <Badge variant="outline">{example.originalAnalysis.urgency}</Badge>
                          <Badge variant="outline">{example.originalAnalysis.tone ?? 'n/a'}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Advice: {example.originalAnalysis.aiAdvice}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-64">
                        <div className="flex flex-wrap gap-2 pb-2">
                          <Badge>{example.finalReview.action}</Badge>
                          <Badge variant="secondary">{example.finalReview.status}</Badge>
                          {example.finalReview.wasAdviceEdited ? (
                            <Badge variant="outline">edited</Badge>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2 pb-2">
                          <Badge variant="outline">{example.finalReview.finalAnalysis.parsedIntent}</Badge>
                          <Badge variant="outline">{example.finalReview.finalAnalysis.urgency}</Badge>
                          <Badge variant="outline">{example.finalReview.finalAnalysis.tone ?? 'n/a'}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Final: {example.finalReview.finalAdvice}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={example.analysisSource === 'ai' ? 'default' : 'outline'}>
                          {example.analysisSource}
                        </Badge>
                      </TableCell>
                      <TableCell>{example.finalReview.reviewedBy}</TableCell>
                      <TableCell>{formatDateTime(example.finalReview.reviewedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

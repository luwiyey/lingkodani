'use client';

import React, { useMemo, useState } from 'react';
import { Bot, Droplets, Send, ShieldAlert, Siren, Sparkles, Sun, Wind } from 'lucide-react';

import { generateAlert, type GenerateAlertOutput } from '@/ai/flows/generate-alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HelpDialog } from '@/components/ui/help-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/data-context';
import { AiStatusBanner } from '@/components/shared/ai-status-banner';
import { useAnalytics } from '@/hooks/use-analytics';
import { useRuntimeCapabilities } from '@/hooks/use-runtime-capabilities';

const alertIcons: Record<string, React.ElementType> = {
  flood: Droplets,
  pest: ShieldAlert,
  wind: Wind,
  heat: Sun,
  inventory: Siren,
};

const alertTitleMap = {
  flood: 'Panganib ng Baha',
  pest: 'Pagdami ng Peste',
  wind: 'Malakas na Hangin',
  heat: 'Matinding Init',
  inventory: 'Mababang Imbentaryo',
} as const;

const sourceLabelMap = {
  ai: 'AI',
  risk_center: 'Risk Center',
  manual: 'Manual',
} as const;

const severityVariant: Record<'Critical' | 'Warning', 'destructive' | 'secondary'> = {
  Critical: 'destructive',
  Warning: 'secondary',
};

export default function AlertsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [generatedAlert, setGeneratedAlert] = useState<GenerateAlertOutput | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const { alertHistory, broadcastAlert } = useData();
  const { outbreakClusters } = useAnalytics();
  const { capabilities, capabilitiesLoading } = useRuntimeCapabilities();
  const aiAlertLocked = !capabilities.aiConfigured;
  const liveBroadcastLocked =
    capabilities.mode === 'live' &&
    capabilities.realSmsEnabled &&
    !capabilities.liveSmsConfigured;
  const aiLockMessage =
    capabilities.reasons.ai ??
    'Naka-lock muna ang AI alert generation habang hindi pa configured ang Gemini/Genkit service.';
  const broadcastLockMessage =
    capabilities.reasons.liveSms ??
    'Naka-lock muna ang live SMS broadcast habang hindi pa kumpleto ang SMS provider setup.';

  const sortedHistory = useMemo(
    () => [...alertHistory].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()),
    [alertHistory]
  );

  const handleGenerateAlert = async (event: React.FormEvent) => {
    event.preventDefault();

    if (aiAlertLocked) {
      toast({
        title: 'AI alert locked',
        description: aiLockMessage,
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const smsSummary = formData.get('smsSummary') as string;
    const weatherData = formData.get('weatherData') as string;

    if (!smsSummary && !weatherData) {
      toast({
        title: 'Kulang ng impormasyon',
        description: 'Maglagay ng SMS summary o weather data para sa pagsusuri.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedAlert(null);

    try {
      const result = await generateAlert({ smsSummary, weatherData });
      setGeneratedAlert(result);
      toast({
        title: result.shouldGenerateAlert ? 'May iminungkahing alerto ang AI' : 'Walang alertong kailangan',
        description: result.shouldGenerateAlert
          ? 'Nasa ibaba ang mensaheng puwedeng i-broadcast.'
          : 'Ayon sa AI, sapat pa ang kasalukuyang sitwasyon at hindi kailangan ng alerto.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Nagka-error',
        description: 'Hindi nagtagumpay ang pagbuo ng alerto.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmBroadcast = async () => {
    if (!generatedAlert?.shouldGenerateAlert || !generatedAlert.alert) {
      setShowConfirmDialog(false);
      return;
    }

    if (liveBroadcastLocked) {
      toast({
        title: 'Live SMS locked',
        description: broadcastLockMessage,
        variant: 'destructive',
      });
      setShowConfirmDialog(false);
      return;
    }

    setIsBroadcasting(true);

    try {
      const entry = await broadcastAlert({
        title: alertTitleMap[generatedAlert.alert.type],
        type: generatedAlert.alert.type,
        severity: generatedAlert.alert.severity,
        message: generatedAlert.alert.message,
        recommendation: generatedAlert.alert.recommendation,
        source: 'ai',
      });

      toast({
        title: 'Na-broadcast ang alerto',
        description: `Naipadala sa ${entry.sentCount} magsasaka${entry.failedCount > 0 ? `, ${entry.failedCount} ang failed` : ''}.`,
      });

      setGeneratedAlert(null);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Hindi naipadala ang alerto',
        description: 'May problem sa pag-broadcast ng alertong ito.',
        variant: 'destructive',
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="flex items-center">
          <Siren className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">Pamamahala ng Alerto</h1>
          <HelpDialog title="Pamamahala ng Alerto" tooltipText="Bumuo at subaybayan ang mga alerto sa komunidad.">
            <p>Gamitin ang page na ito para gumawa ng alerto, i-broadcast ito sa mga magsasaka, at panatilihin ang totoong kasaysayan ng naipadalang babala.</p>
            <p>Kapag nag-broadcast ka rito, may maiiwang history record at logbook entries sa mga apektadong farmer profiles.</p>
          </HelpDialog>
        </div>
        <p className="text-muted-foreground">Manu-manong bumuo ng alerto gamit ang AI at tingnan ang broadcast history ng barangay.</p>
      </div>

      <AiStatusBanner
        title={aiAlertLocked ? "AI alert generation locked" : "AI alert generation ready"}
        description={
          aiAlertLocked
            ? aiLockMessage
            : "Available ang AI alert generation sa build na ito."
        }
      />
      {liveBroadcastLocked ? (
        <AiStatusBanner
          title="Live SMS broadcast locked"
          description={broadcastLockMessage}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldAlert /> Auto-detected Outbreak Signals</CardTitle>
          <CardDescription>
            Mga clustered na ulat batay sa zone, crop, at symptom pattern. Ito ay decision support lamang at kailangan pa ring i-validate bago i-broadcast.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {outbreakClusters.slice(0, 4).map((cluster) => (
            <div key={cluster.key} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{cluster.zone}</p>
                <Badge variant={cluster.stage === 'strong' ? 'destructive' : 'secondary'}>
                  {cluster.stage === 'strong' ? 'Strong cluster' : cluster.stage === 'suspected' ? 'Suspected cluster' : 'Weak cluster'}
                </Badge>
                <Badge variant="outline">{cluster.crop}</Badge>
                <Badge variant="outline">{cluster.signal}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {cluster.reportCount} magkakaugnay na ulat, {cluster.affectedFarmers} apektadong farmer, {cluster.unresolvedCount} hindi pa resolved.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Latest seen: {new Date(cluster.latestObservedAt).toLocaleString()} · Cluster score: {cluster.score}
              </p>
            </div>
          ))}
          {outbreakClusters.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Wala pang sapat na magkakatugmang ulat para sa outbreak cluster detection sa kasalukuyang dataset.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot /> Bumuo ng Alerto gamit ang AI</CardTitle>
            <CardDescription>Maglagay ng SMS summary at weather data para awtomatikong gumawa ng rekomendadong alerto.</CardDescription>
          </CardHeader>
          <CardFooter>
            <DialogTrigger asChild>
              <Button disabled={aiAlertLocked || capabilitiesLoading}>Bumuo ng Bagong Alerto</Button>
            </DialogTrigger>
          </CardFooter>
        </Card>

        <DialogContent className="w-[95vw] max-w-2xl">
          <form onSubmit={handleGenerateAlert}>
            <DialogHeader>
              <DialogTitle>Bumuo ng Alerto</DialogTitle>
              <DialogDescription>Ibigay ang summary na susuriin ng AI.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="smsSummary">Buod ng mga Ulat sa SMS</label>
                <Textarea id="smsSummary" name="smsSummary" placeholder="hal. 3 ulat ng rice bugs sa Zone 1 at Zone 3, karamihan ay palay." />
              </div>
              <div className="space-y-2">
                <label htmlFor="weatherData">Data o Pagtataya ng Panahon</label>
                <Textarea id="weatherData" name="weatherData" placeholder="hal. Inaasahan ang malakas na hangin at pag-ulan sa loob ng 48 oras." />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isGenerating || aiAlertLocked || capabilitiesLoading}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? 'Nagsusuri...' : aiAlertLocked ? 'AI locked muna' : 'Suriin gamit ang AI'}
              </Button>
            </DialogFooter>
          </form>

          <div className="mt-6">
            <h3 className="mb-2 font-semibold">Resulta ng AI</h3>
            {isGenerating ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : generatedAlert ? (
              generatedAlert.shouldGenerateAlert && generatedAlert.alert ? (
                <Card className="bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Siren className="text-destructive" />
                      Iminungkahing Alerto
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p><strong>Uri:</strong> {alertTitleMap[generatedAlert.alert.type]}</p>
                    <p><strong>Lala:</strong> {generatedAlert.alert.severity}</p>
                    <p><strong>Mensahe:</strong> {generatedAlert.alert.message}</p>
                    <p><strong>Rekomendasyon:</strong> {generatedAlert.alert.recommendation}</p>
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => setShowConfirmDialog(true)} className="w-full" disabled={liveBroadcastLocked || capabilitiesLoading}>
                      <Send className="mr-2 h-4 w-4" /> I-broadcast sa mga Magsasaka
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">Ayon sa AI, hindi pa kailangan ng alerto base sa ibinigay na datos.</p>
              )
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">Ang AI result ay lilitaw dito pagkatapos ng pagsusuri.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Kasaysayan ng mga Alerto</CardTitle>
          <CardDescription>Mga totoong alertong na-broadcast ng barangay sa demo na ito.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Petsa</TableHead>
                <TableHead>Alerto</TableHead>
                <TableHead>Lala</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Mensahe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHistory.map((entry) => {
                const Icon = alertIcons[entry.type] ?? Siren;
                return (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <div>
                          <p className="font-medium">{entry.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{entry.type}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={severityVariant[entry.severity]}>{entry.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{entry.sentCount} sent</p>
                        {entry.failedCount > 0 ? <p className="text-destructive">{entry.failedCount} failed</p> : null}
                      </div>
                    </TableCell>
                    <TableCell>{sourceLabelMap[entry.source]}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">{entry.message}</p>
                        <p className="text-xs text-muted-foreground">{entry.recommendation}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {sortedHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center text-muted-foreground">
                    Wala pang na-broadcast na alerto.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kumpirmahin ang Pag-broadcast</AlertDialogTitle>
            <AlertDialogDescription>
              Sigurado ka bang nais mong ipadala ang alertong ito sa mga target na magsasaka? Mag-iiwan din ito ng history record at farmer log entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBroadcasting}>Kanselahin</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBroadcast} disabled={isBroadcasting || liveBroadcastLocked || capabilitiesLoading}>
              {isBroadcasting ? 'Nagpapadala...' : 'Oo, I-broadcast'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

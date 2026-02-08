
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Siren, Bot, Send, Droplets, Wind, Sun, ShieldAlert, Sparkles } from 'lucide-react';
import { HelpDialog } from '@/components/ui/help-dialog';
import { HoverTooltip } from '@/components/ui/hover-tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { generateAlert, type GenerateAlertOutput } from '@/ai/flows/generate-alert';

const historicalAlerts = [
  {
    id: 'HIST001',
    timestamp: '2023-10-25T10:00:00Z',
    type: 'pest',
    severity: 'Warning',
    message: 'Babala: May mga ulat ng pagdami ng rice-black bug sa Zone 2. Suriin ang inyong mga pananim.',
    recommendation: 'Gumamit ng light traps upang mabawasan ang populasyon. I-monitor ang mga itlog.',
  },
  {
    id: 'HIST002',
    timestamp: '2023-10-15T18:00:00Z',
    type: 'wind',
    severity: 'Warning',
    message: 'Malakas na hangin ang inaasahan sa susunod na 24 oras. Mag-ingat sa mga posibleng pinsala sa mga istruktura.',
    recommendation: 'I-secure ang mga bubong at iba pang magaan na materyales sa bukid.',
  },
  {
    id: 'HIST003',
    timestamp: '2023-10-05T09:00:00Z',
    type: 'heat',
    severity: 'Warning',
    message: 'Posible ang heat wave. Tiyaking may sapat na tubig ang mga pananim.',
    recommendation: 'Diligan ang mga pananim sa umaga o hapon upang maiwasan ang mabilis na evaporation.',
  },
];

const alertIcons: { [key: string]: React.ElementType } = {
  flood: Droplets,
  pest: ShieldAlert,
  wind: Wind,
  heat: Sun,
};

const severityVariant: { [key: string]: 'destructive' | 'secondary' } = {
  Critical: 'destructive',
  Warning: 'secondary',
};

export default function AlertsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAlert, setGeneratedAlert] = useState<GenerateAlertOutput | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleGenerateAlert = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const smsSummary = formData.get('smsSummary') as string;
    const weatherData = formData.get('weatherData') as string;

    if (!smsSummary && !weatherData) {
      toast({ title: 'Kulang ng Impormasyon', description: 'Mangyaring maglagay ng data para sa pagsusuri.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setGeneratedAlert(null);

    try {
      const result = await generateAlert({ smsSummary, weatherData });
      setGeneratedAlert(result);
      if (result.shouldGenerateAlert) {
        toast({ title: 'Nakatanggap ng Mungkahi ang AI!', description: 'Nasa ibaba ang iminungkahing alerto.' });
      } else {
         toast({ title: 'Walang Kinakailangang Alerto', description: 'Ayon sa AI, hindi kailangan ng alerto sa ngayon.' });
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Nagka-error!', description: 'Hindi nagtagumpay ang pagbuo ng alerto.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmBroadcast = () => {
    toast({
      title: "Nagpapadala ng Alerto...",
      description: "Ang alerto ay ipinapadala na sa mga apektadong magsasaka.",
    });
    setShowConfirmDialog(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="flex items-center">
          <Siren className="mr-2 h-6 w-6"/>
          <h1 className="text-2xl font-bold tracking-tight">Pamamahala ng Alerto</h1>
          <HelpDialog title="Pamamahala ng Alerto">
            <p>Ito ang iyong command center para sa paglikha at pagsubaybay ng mga alerto sa buong komunidad.</p>
            <p><strong>Bumuo ng Alerto gamit ang AI:</strong> Gamitin ang tool na ito para sa proaktibong pag-alerto. Mag-input ng data, tulad ng buod ng mga SMS o ulat ng panahon, at hahayaan ang AI na bumuo ng isang structured na mensahe ng alerto at rekomendasyon.</p>
            <p><strong>Kasaysayan ng mga Alerto:</strong> Tingnan ang isang talaan ng lahat ng mga nakaraang alerto na ipinadala. Nakakatulong ito sa pagsusuri ng mga nakaraang kaganapan at pag-unawa sa mga pattern.</p>
          </HelpDialog>
        </div>
        <p className="text-muted-foreground">
          Manu-manong bumuo ng mga alerto gamit ang AI at tingnan ang kasaysayan.
        </p>
      </div>

       <Dialog>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot /> Bumuo ng Alerto gamit ang AI</CardTitle>
                    <CardDescription>Mag-input ng data (hal., buod ng mga ulat ng peste, data ng panahon) upang hayaan ang AI na bumuo ng isang alerto.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <DialogTrigger asChild>
                        <Button>Bumuo ng Bagong Alerto</Button>
                    </DialogTrigger>
                </CardFooter>
            </Card>

            <DialogContent className="sm:max-w-2xl">
                <form onSubmit={handleGenerateAlert}>
                    <DialogHeader>
                        <DialogTitle>Bumuo ng Alerto</DialogTitle>
                        <DialogDescription>Ibigay ang data na susuriin ng AI.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="smsSummary">Buod ng mga Ulat sa SMS</label>
                            <Textarea id="smsSummary" name="smsSummary" placeholder="hal. '3 ulat ng armyworm sa Zone 4, 2 ulat sa Zone 5. Mga pananim na apektado: mais.'"/>
                        </div>
                         <div className="space-y-2">
                            <label htmlFor="weatherData">Data/Pagtataya ng Panahon</label>
                            <Textarea id="weatherData" name="weatherData" placeholder="hal. 'Inaasahan ang malakas na pag-ulan (50-100mm) sa susunod na 48 oras.'"/>
                        </div>
                    </div>
                     <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button type="submit" disabled={isGenerating}>
                            <Sparkles className="mr-2 h-4 w-4"/>
                            {isGenerating ? 'Nagsusuri...' : 'Suriin gamit ang AI'}
                        </Button>
                    </DialogFooter>
                </form>
                
                <div className="mt-6">
                    <h3 className="font-semibold mb-2">Resulta ng AI</h3>
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
                                        <Siren className="text-destructive"/>
                                        Iminungkahing Alerto
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <p><strong>Uri:</strong> {generatedAlert.alert.type}</p>
                                    <p><strong>Lala:</strong> {generatedAlert.alert.severity}</p>
                                    <p><strong>Mensahe:</strong> {generatedAlert.alert.message}</p>
                                    <p><strong>Rekomendasyon:</strong> {generatedAlert.alert.recommendation}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button onClick={() => setShowConfirmDialog(true)} className="w-full">
                                        <Send className="mr-2 h-4 w-4"/> I-broadcast sa mga Magsasaka
                                    </Button>
                                </CardFooter>
                            </Card>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Ayon sa pagsusuri ng AI, walang kinakailangang alerto batay sa data na ibinigay.</p>
                        )
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Ang mga resulta mula sa AI ay lilitaw dito.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>


      <Card>
        <CardHeader>
          <CardTitle>Kasaysayan ng mga Alerto</CardTitle>
          <CardDescription>
            Isang log ng lahat ng mga alerto na naipadala sa nakaraan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Petsa</TableHead>
                <TableHead>Uri</TableHead>
                <TableHead>Lala</TableHead>
                <TableHead>Mensahe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historicalAlerts.map((alert) => {
                const Icon = alertIcons[alert.type] || Siren;
                return (
                  <TableRow key={alert.id}>
                    <TableCell>{isClient ? new Date(alert.timestamp).toLocaleDateString() : ''}</TableCell>
                    <TableCell className="capitalize">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4"/> {alert.type}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={severityVariant[alert.severity]}>{alert.severity}</Badge></TableCell>
                    <TableCell>{alert.message}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
       <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kumpirmahin ang Pag-broadcast</AlertDialogTitle>
            <AlertDialogDescription>
              Sigurado ka bang nais mong ipadala ang alertong ito sa lahat ng apektadong magsasaka? Ang aksyon na ito ay hindi na maaaring bawiin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Kanselahin</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBroadcast}>Oo, I-broadcast</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

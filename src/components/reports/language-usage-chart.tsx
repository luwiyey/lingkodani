"use client"

import { useMemo } from "react"
import { Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAnalytics } from "@/hooks/use-analytics"
import { useReportsTimeframe } from "@/context/reports-timeframe-context"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Expand, Download } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

export function LanguageUsageChart() {
  const { languageUsageData } = useAnalytics();
  const { timeframe, setTimeframe } = useReportsTimeframe();
  const { toast } = useToast();
  const chartConfig = useMemo<ChartConfig>(() => (
    languageUsageData.reduce<ChartConfig>((config, entry) => {
      config[entry.language] = {
        label: entry.language,
        color: entry.fill,
      };
      return config;
    }, {})
  ), [languageUsageData]);
  
  const topLanguage = languageUsageData.length > 0
    ? languageUsageData.reduce((prev, current) => (prev.value > current.value) ? prev : current)
    : { language: 'Wala pa', value: 0, fill: 'hsl(var(--muted-foreground))' };
  const total = languageUsageData.reduce((acc, current) => acc + current.value, 0);
  const topLanguagePercentage = total > 0 ? ((topLanguage.value / total) * 100).toFixed(1) : '0.0';
  const secondaryLanguage = languageUsageData
    .filter((entry) => entry.language !== topLanguage.language)
    .sort((left, right) => right.value - left.value)[0];
  
  const handleDownload = () => {
    toast({
        title: "Nagsisimula ang Pag-download...",
        description: "Ang iyong chart ay ini-export bilang PDF.",
    });
  };

  const renderChart = () => (
     <ResponsiveContainer width="100%" height="100%">
        <PieChart>
            <RechartsTooltip content={<ChartTooltipContent nameKey="language" />} />
            <Legend content={<ChartLegendContent nameKey="language"/>} />
            <Pie data={languageUsageData} dataKey="value" nameKey="language" innerRadius="50%" outerRadius="80%">
                 {languageUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
            </Pie>
        </PieChart>
    </ResponsiveContainer>
  );

  return (
    <Dialog>
      <Card>
        <CardHeader>
          <div className="flex justify-end gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{timeframe}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setTimeframe('Ngayong Araw')}>Ngayong Araw</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTimeframe('Lingguhan')}>Lingguhan</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTimeframe('Buwanan')}>Buwanan</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTimeframe('Quarterly')}>Quarterly</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTimeframe('Taunan')}>Taunan</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        <Expand className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleDownload}>
                          <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>I-save ang graph bilang PDF</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid gap-0.5">
                  <CardTitle>Paggamit ng Wika</CardTitle>
                  <CardDescription>Pamamahagi ng mga wikang ginagamit sa mga SMS.</CardDescription>
              </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold" style={{color: topLanguage.fill}}>{topLanguagePercentage}%</p>
                <p className="text-sm text-muted-foreground">ay nasa {topLanguage.language}</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: {topLanguagePercentage}% ng mga mensahe ay nasa {topLanguage.language}, na ginagawa itong pangunahing language pattern sa timeframe na ito.</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Paggamit ng Wika ({timeframe})</DialogTitle>
            <DialogDescription>
                Ipinapakita ng ulat na ito ang distribusyon ng mga wika at diyalekto na ginagamit ng mga magsasaka sa kanilang mga mensahe. Ito ay kritikal na impormasyon para sa pag-optimize ng AI's Natural Language Understanding (NLU) model.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang {topLanguage.language} ang nangingibabaw na language pattern, na bumubuo sa {topLanguagePercentage}% ng lahat ng komunikasyon sa napiling timeframe. {secondaryLanguage ? `Ang susunod na pattern ay ${secondaryLanguage.language}, kaya mahalagang marunong ang system sa parehong estilo ng pagsulat.` : 'Kapag dumami pa ang live messages, mas lilinaw pa ang language mix ng komunidad.'}</p>
                <p><strong>Rekomendasyon:</strong> Tiyaking ang AI model at response templates ay komportable sa dominanteng language mix sa barangay. Kapag tumaas ang bahagi ng code-switching, dagdagan ang training examples na may halo-halong Tagalog at English para hindi bumaba ang comprehension.</p>
            </div>
        </div>
        <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
                <Button type="button" variant="secondary">Isara</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


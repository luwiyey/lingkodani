"use client"

import { Pie, PieChart, Cell, Legend, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
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


const chartConfig = {
  "Nangailangan ng Clarification": { label: "Nangailangan ng Clarification", color: "hsl(var(--chart-2))" },
  "Hindi Kinailangan": { label: "Hindi Kinailangan", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function ClarificationNeededChart() {
  const { clarificationNeededData } = useAnalytics();
  const { timeframe, setTimeframe } = useReportsTimeframe();
  const { toast } = useToast();

  const neededClarification = clarificationNeededData.find(d => d.name === 'Nangailangan ng Clarification')?.value ?? 0;
  
  const handleDownload = () => {
    toast({
        title: "Nagsisimula ang Pag-download...",
        description: "Ang iyong chart ay ini-export bilang PDF.",
    });
  };

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <RechartsTooltip content={<ChartTooltipContent nameKey="name" />} />
        <Legend content={<ChartLegendContent nameKey="name" />} />
        <Pie data={clarificationNeededData} dataKey="value" nameKey="name" innerRadius="60%">
          {clarificationNeededData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
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
                  <CardTitle>Mga Mensaheng Kailangan ng Paglilinaw</CardTitle>
                  <CardDescription>Mga kaso kung saan mababa ang kumpiyansa ng AI.</CardDescription>
              </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-2">{neededClarification}%</p>
                <p className="text-sm text-muted-foreground">ang Nangailangan ng Paglilinaw</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: {neededClarification}% lamang ng mga mensahe ang nangailangan ng paglilinaw, na nagpapakita ng mahusay na pang-unawa ng AI.</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Mga Mensaheng Kailangan ng Paglilinaw ({timeframe})</DialogTitle>
            <DialogDescription>
                Sinusukat ng ulat na ito kung gaano kadalas nahihirapan ang AI na unawain ang isang mensahe (karaniwang kapag ang confidence score ay mababa). Ang isang mababang porsyento ay mas mainam.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang kasalukuyang {neededClarification}% na rate ng paglilinaw ay napakabuti. Ipinapakita nito na ang AI ay epektibong nakakaintindi ng karamihan sa mga papasok na mensahe sa unang subok. Ang mga kaso na nangangailangan ng paglilinaw ay karaniwang may kasamang malabong terminolohiya, mga typo, o kumplikadong halo-halong wika.</p>
                <p><strong>Rekomendasyon:</strong> Suriin ang mga mensaheng nangailangan ng paglilinaw. Ito ay mga gintong pagkakataon para sa pagsasanay. Gamitin ang mga ito upang turuan ang AI ng mga bagong lokal na termino o mga paraan ng pagpapahayag ng mga magsasaka, na magpapababa pa sa porsyentong ito sa hinaharap.</p>
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





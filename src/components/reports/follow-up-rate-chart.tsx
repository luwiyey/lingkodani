"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useAnalytics } from "@/hooks/use-analytics"
import { useReportsTimeframe } from "@/context/reports-timeframe-context"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"
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
  value: {
    label: "Porsyento",
  },
} satisfies ChartConfig

export function FollowUpRateChart() {
  const { followUpRateData } = useAnalytics();
  const { timeframe, setTimeframe } = useReportsTimeframe();
  const { toast } = useToast();

  const noFollowUpCount = followUpRateData.find(d => d.name === 'Walang Follow-up')?.value ?? 0;
  const total = followUpRateData.reduce((acc, entry) => acc + entry.value, 0);
  const noFollowUpRate = total > 0 ? ((noFollowUpCount / total) * 100).toFixed(1) : '0.0';
  
  const handleDownload = () => {
    toast({
        title: "Nagsisimula ang Pag-download...",
        description: "Ang iyong chart ay ini-export bilang PDF.",
    });
  };

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={followUpRateData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <XAxis type="number" dataKey="value" hide />
          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
          <RechartsTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
          <Bar dataKey="value" radius={5}>
              {followUpRateData.map((item) => (
                  <Cell key={item.name} fill={item.fill} />
              ))}
          </Bar>
      </BarChart>
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
                <CardTitle>Rate ng Follow-up</CardTitle>
                <CardDescription>Gaano kadalas mag-reply ang mga magsasaka.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-2">{noFollowUpRate}%</p>
                <p className="text-sm text-muted-foreground">ang Walang Follow-up</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: {noFollowUpRate}% ng repeat-contact pattern sa timeframe na ito ay walang kasunod na bagong mensahe mula sa parehong farmer.</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Rate ng Follow-up ({timeframe})</DialogTitle>
            <DialogDescription>
                Sinusukat ng ulat na ito ang repeat-contact pattern ng mga magsasaka sa napiling timeframe batay sa aktuwal na bilang ng inbound messages per farmer.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang mataas na porsyento ng "Walang Follow-up" ({noFollowUpRate}%) ay nangangahulugang sa napiling timeframe, mas maraming farmers ang hindi nagpadala ng panibagong mensahe pagkatapos ng initial contact. Ito ay useful bilang engagement signal, pero hindi nito awtomatikong ibig sabihin na solved na ang lahat ng kaso.</p>
                <p><strong>Rekomendasyon:</strong> Para makasiguro, mag-sample ng ilang mga "Walang Follow-up" na kaso at magpadala ng proaktibong mensahe, tulad ng, "Kumusta po, naging epektibo po ba ang payo namin para sa inyong [isyu]? Mayroon pa po ba kaming maitutulong?" Makakatulong ito na kumpirmahin ang kasiyahan ng magsasaka at magpakita ng mahusay na serbisyo.</p>
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


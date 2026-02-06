"use client"

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { highRiskKeywordData } from "@/lib/data";
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


const chartConfig = {
  count: {
    label: "Bilang",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig

export function HighRiskKeywordChart() {
  const [timeframe, setTimeframe] = useState('Buwanan');
  
  const topKeyword = highRiskKeywordData.reduce((prev, current) => (prev.count > current.count) ? prev : current);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={highRiskKeywordData} layout="vertical" margin={{ left: 10, right: 20 }}>
             <XAxis type="number" hide />
             <YAxis 
                dataKey="word" 
                type="category" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                width={80}
             />
             <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
             <Bar dataKey="count" fill="var(--color-count)" radius={4} />
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
                    <Button variant="outline" size="icon" className="h-8 w-8">
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
                <CardTitle>Mga Salitang Nagti-trigger ng Alerto</CardTitle>
                <CardDescription>Mga salita na awtomatikong nagtaas ng alerto.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-destructive">{topKeyword.count}</p>
                <p className="text-sm text-muted-foreground">pagbanggit ng '{topKeyword.word}'</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Ang salitang "{topKeyword.word}" ang pinakamadalas na dahilan ng alerto, na nagpapakita ng kahalagahan nito sa mga magsasaka.</p>
        </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Mga Salitang Nagti-trigger ng Alerto ({timeframe})</DialogTitle>
            <DialogDescription>
              Ipinapakita ng ulat na ito ang dalas ng mga partikular na salita na awtomatikong nag-trigger ng high-risk na alerto sa sistema. Ang pag-unawa sa mga ito ay nakakatulong na i-validate ang escalation logic ng AI.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang salitang '{topKeyword.word}' ang pinakamadalas na nag-trigger ng alerto. Ito ay nagpapatunay na ang sistema ay sensitibo sa mga pinaka-karaniwang problema na kinakaharap ng mga magsasaka. Ang mga salitang tulad ng "namamatay" at "lason" ay mas bihira ngunit kumakatawan sa mga napaka-kritikal na sitwasyon, na nagpapakita na ang sistema ay epektibong nakakakuha ng iba't ibang antas ng panganib.</p>
                <p><strong>Rekomendasyon:</strong> Regular na suriin ang listahan ng mga high-risk na keyword. Magdagdag ng mga bagong termino kung kinakailangan (hal., mga partikular na pangalan ng kemikal o sakit). Kung may salita na nagdudulot ng masyadong maraming "false positive" na alerto, isaalang-alang ang pag-adjust sa sensitivity ng trigger para sa salitang iyon.</p>
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

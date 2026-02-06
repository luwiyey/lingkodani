"use client"

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { topKeywordsData } from "@/lib/data";
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
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function TopKeywordsChart() {
  const [timeframe, setTimeframe] = useState('Lingguhan');

  const topKeyword = topKeywordsData.reduce((prev, current) => (prev.count > current.count) ? prev : current);

  const renderChart = () => (
     <ResponsiveContainer width="100%" height="100%">
        <BarChart data={topKeywordsData} layout="vertical" margin={{ left: 10, right: 20 }}>
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
                <CardTitle>Mga Karaniwang Salita</CardTitle>
                <CardDescription>Mga pinakamadalas na salitang ginagamit sa SMS.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-1">{topKeyword.count}</p>
                <p className="text-sm text-muted-foreground">pagbanggit ng '{topKeyword.word}'</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: "Peste," "pataba," at "sakit" ang mga pangunahing salita, na tumutukoy sa mga pangunahing alalahanin.</p>
        </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Mga Karaniwang Salita ({timeframe})</DialogTitle>
            <DialogDescription>
              Tinutukoy ng ulat na ito ang mga pinakamadalas na salitang ginagamit ng mga magsasaka sa kanilang mga mensahe. Ito ay isang direktang bintana sa kanilang mga alalahanin at prayoridad.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang mga salitang "Peste," "Pataba," at "Sakit" ang nangunguna sa listahan, na malinaw na nagpapahiwatig na ang mga ito ang tatlong pangunahing kategorya ng mga alalahanin para sa mga magsasaka. Ang pagkakaroon ng mga pangalan ng pananim tulad ng "Kamatis" at "Palay" ay nagpapakita kung aling mga pananim ang pinagtutuunan ng pansin.</p>
                <p><strong>Rekomendasyon:</strong> Gamitin ang mga keyword na ito para i-tag at i-kategorya ang nilalaman sa knowledge base upang mas madali itong mahanap. Ang mga nangungunang keyword na ito ay dapat ding maging priyoridad sa pagsasanay ng AI model upang matiyak na nauunawaan nito ang mga ito nang may mataas na katumpakan.</p>
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

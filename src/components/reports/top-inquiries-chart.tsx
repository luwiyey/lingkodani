"use client"

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { topInquiriesData } from "@/lib/data";
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
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function TopInquiriesChart() {
  const [timeframe, setTimeframe] = useState('Buwanan');
  
  const topInquiry = topInquiriesData.reduce((prev, current) => (prev.count > current.count) ? prev : current);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={topInquiriesData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="question" 
              type="category" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              width={120}
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
                <CardTitle>Pinakakaraniwang Uri ng Tanong</CardTitle>
                <CardDescription>Mga pinakamadalas na tanong ng mga magsasaka.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-5">{topInquiry.count}</p>
                <p className="text-sm text-muted-foreground text-center">tanong tungkol sa "{topInquiry.question}"</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Ang tanong tungkol sa "{topInquiry.question}" ang pinakamadalas, na nagpapakita ng pangangailangan para sa solusyon sa peste.</p>
        </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Pinakakaraniwang Uri ng Tanong ({timeframe})</DialogTitle>
            <DialogDescription>
              Kinakategorya ng ulat na ito ang mga pinakamadalas na katanungan na ipinapadala ng mga magsasaka. Ang pag-unawa sa mga pangunahing alalahanin na ito ay mahalaga para sa paglikha ng may-katuturang nilalaman sa knowledge base at pagpaplano ng mga aktibidad ng extension.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang mga tanong tungkol sa pamamahala ng peste ("Gamot sa peste?") at kalusugan ng pananim ("Bakit dilaw ang dahon?") ang nangingibabaw. Ito ay nagpapatunay na ang pag-diagnose at paggamot sa mga isyu sa bukid ang pangunahing dahilan kung bakit ginagamit ng mga magsasaka ang sistema.</p>
                <p><strong>Rekomendasyon:</strong> Gumawa o i-highlight ang mga artikulo sa knowledge base na direktang tumutugon sa mga nangungunang tanong na ito. Maaari ring maging kapaki-pakinabang na lumikha ng mga "Quick Reply" na template para sa mga karaniwang tanong na ito upang mas mapabilis pa ang oras ng pagtugon.</p>
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

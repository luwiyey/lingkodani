"use client"

import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { seasonalTrendData } from "@/lib/data"
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
  reports: {
    label: "Mga Ulat",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function SeasonalTrendChart() {
  const [timeframe, setTimeframe] = useState('Taunan');

  const peakMonth = seasonalTrendData.reduce((prev, current) => (prev.reports > current.reports) ? prev : current);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={seasonalTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
          <RechartsTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="reports" stroke="var(--color-reports)" strokeWidth={2} dot={false} />
      </LineChart>
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
                <CardTitle>Dami ng Ulat Ayon sa Panahon</CardTitle>
                <CardDescription>Mga buwan na may pinakamataas na dami ng ulat.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-1">{peakMonth.reports}</p>
                <p className="text-sm text-muted-foreground">ulat noong {peakMonth.month}</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Pinakamarami ang ulat tuwing {peakMonth.month}, na maaaring kasabay ng peak ng tag-ulan.</p>
        </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Dami ng Ulat Ayon sa Panahon ({timeframe})</DialogTitle>
            <DialogDescription>
                Ipinapakita ng ulat na ito ang buwanang dami ng mga ulat ng SMS sa buong taon. Ang pag-unawa sa mga seasonal na pattern ay mahalaga para sa pag-anticipate ng mga pangangailangan at pagpaplano ng mga aktibidad ng barangay.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Mayroong isang malinaw na peak sa dami ng ulat sa panahon ng tag-ulan, partikular na sa buwan ng {peakMonth.month}. Ito ay malamang na dahil sa pagtaas ng mga isyu na may kaugnayan sa baha, mga sakit ng halaman na dala ng fungal, at iba pang mga problema na pinalalala ng basa na kondisyon. Ang mga ulat ay bumababa sa panahon ng tag-araw.</p>
                <p><strong>Rekomendasyon:</strong> Gamitin ang data na ito para sa proaktibong pagpaplano. Bago ang mga peak na buwan, mag-broadcast ng mga advisory tungkol sa paghahanda para sa tag-ulan. Tiyaking may sapat na stock ng mga mapagkukunan na may kaugnayan sa mga isyu sa tag-ulan (hal., fungicides, tulong para sa baha). I-schedule ang mga AEW para sa mas maraming field visit sa mga buwan na ito.</p>
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

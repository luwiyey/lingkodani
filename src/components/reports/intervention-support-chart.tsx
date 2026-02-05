"use client"

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { interventionSupportData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Expand } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"


const chartConfig = {
  visits: {
    label: "Farm Visits",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function InterventionSupportChart() {
  const [timeframe, setTimeframe] = useState('Taunan');

  const totalVisits = interventionSupportData.reduce((acc, item) => acc + item.visits, 0);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={interventionSupportData} accessibilityLayer>
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
          <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey="visits" fill="var(--color-visits)" radius={4} />
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
            </div>
            <div className="grid gap-0.5">
                <CardTitle>Mga Pagbisita sa Bukid</CardTitle>
                <CardDescription>Mga kaso na nangailangan ng pisikal na pagbisita.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-1">{totalVisits}</p>
                <p className="text-sm text-muted-foreground">Kabuuang Pagbisita</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Pinakamarami ang kinakailangang pagbisita noong Mayo, posibleng dahil sa pagsisimula ng panahon ng pagtatanim.</p>
        </CardFooter>
      </Card>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
            <DialogTitle>Mga Pagbisita sa Bukid ({timeframe})</DialogTitle>
            <DialogDescription>
              Ipinapakita ng ulat na ito ang bilang ng mga kaso na minarkahan bilang nangangailangan ng direktang interbensyon mula sa isang Agricultural Extension Worker (AEW).
            </DialogDescription>
        </DialogHeader>
        <div className="h-[400px] w-full">
            <ChartContainer config={chartConfig}>
                {renderChart()}
            </ChartContainer>
        </div>
        <DialogFooter className="mt-4 text-sm text-muted-foreground">
            <div className="flex flex-col gap-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang bilang ng mga pagbisita sa bukid ay nagbibigay ng sukatan para sa workload ng mga AEW. Ang pinakamataas na bilang ay naitala noong Mayo, na karaniwang kasabay ng pagsisimula ng panahon ng pagtatanim para sa maraming pananim, kung kailan mas maraming isyu ang lumalabas. Ito ay nagpapakita ng seasonal na katangian ng pangangailangan para sa suporta.</p>
                <p><strong>Rekomendasyon:</strong> Gamitin ang data na ito para sa pagpaplano ng workforce. Sa mga buwan na may mataas na bilang ng kinakailangang pagbisita, tiyaking may sapat na tauhan at mapagkukunan ang mga AEW. Maaari ring mag-iskedyul ng mga proyektong pagsasanay o administratibo sa mga buwan na may mas mababang demand.</p>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

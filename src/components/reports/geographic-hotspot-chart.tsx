"use client"

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { geographicHotspotData } from "@/lib/data"
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
  issues: {
    label: "Mga Isyu",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function GeographicHotspotChart() {
  const [timeframe, setTimeframe] = useState('Lingguhan');
  const { toast } = useToast();

  const topHotspot = geographicHotspotData.reduce((prev, current) => (prev.issues > current.issues) ? prev : current);
  
  const handleDownload = () => {
    toast({
        title: "Nagsisimula ang Pag-download...",
        description: "Ang iyong chart ay ini-export bilang PDF.",
    });
  };

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={geographicHotspotData} accessibilityLayer>
        <XAxis dataKey="zone" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
        <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="issues" fill="var(--color-issues)" radius={4} />
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
                <CardTitle>Mga Hotspot ng Suliranin</CardTitle>
                <CardDescription>Distribusyon ng mga isyu sa bawat lokasyon.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-4">{topHotspot.issues}</p>
                <p className="text-sm text-muted-foreground">isyu sa {topHotspot.zone}</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Ang {topHotspot.zone} ang may pinakamaraming isyu, na ginagawa itong priority area.</p>
        </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Mga Hotspot ng Suliranin ({timeframe})</DialogTitle>
            <DialogDescription>
              Ipinapakita ng mapang ito kung saan sa barangay nagkukumpol ang mga isyu. Ang pagtukoy sa mga "hotspot" na ito ay nagbibigay-daan para sa naka-target na interbensyon at mahusay na paglalaan ng mga mapagkukunan.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Malinaw na ipinapakita ng data na ang {topHotspot.zone} ang kasalukuyang hotspot na may {topHotspot.issues} na iniulat na isyu. Ito ay maaaring sanhi ng iba't ibang mga kadahilanan tulad ng uri ng lupa, mga partikular na pananim na itinanim doon, o mga lokal na kondisyon ng panahon. Ang ibang mga zone tulad ng Zone 1 ay may mas kaunting mga isyu.</p>
                <p><strong>Rekomendasyon:</strong> I-prioritize ang {topHotspot.zone} para sa susunod na field visit ng Agricultural Extension Worker (AEW). Suriin ang mga partikular na ulat mula sa zone na ito upang maunawaan ang kalikasan ng mga isyu (hal., ito ba ay isang partikular na peste? Isang problema sa patubig?). Magplano ng isang seminar o focus group discussion para sa mga magsasaka sa zone na iyon.</p>
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

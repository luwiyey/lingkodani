"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
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


const chartConfig = {
  messages: {
    label: "Mga Mensahe",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function SmsPeakHoursChart() {
  const { smsPeakHoursData } = useAnalytics();
  const { timeframe, setTimeframe } = useReportsTimeframe();
  
  const peakHour = smsPeakHoursData.reduce((prev, current) => (prev.messages > current.messages) ? prev : current);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={smsPeakHoursData}>
        <XAxis
          dataKey="hour"
          stroke="hsl(var(--foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
          <RechartsTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
        <Bar dataKey="messages" fill="var(--color-messages)" radius={[4, 4, 0, 0]} />
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
                <CardTitle>Mga Oras na may Pinakamaraming Mensahe</CardTitle>
                <CardDescription>Dami ng SMS ayon sa oras sa isang araw.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-primary">{peakHour.hour}</p>
                <p className="text-sm text-muted-foreground">ang Peak Hour</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Pinaka-aktibo ang mga magsasaka sa pagitan ng {peakHour.hour}, na isang magandang oras para tiyakin ang pagkakaroon ng staff.</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Mga Oras na may Pinakamaraming Mensahe ({timeframe})</DialogTitle>
            <DialogDescription>
              Ipinapakita ng ulat na ito kung anong mga oras sa isang araw pinaka-aktibo ang mga magsasaka sa pagpapadala ng SMS. Ang impormasyong ito ay mahalaga para sa pag-iskedyul ng mga tauhan at pagtiyak na may sapat na suporta sa mga oras ng mataas na demand.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Mayroong malinaw na peak ng aktibidad sa hapon, partikular sa pagitan ng {peakHour.hour}. Ito ay malamang na pagkatapos ng trabaho sa bukid, kung kailan may oras na ang mga magsasaka na mag-ulat ng mga isyu o magtanong. Ang aktibidad ay mas mababa sa umaga at hatinggabi.</p>
                <p><strong>Rekomendasyon:</strong> Tiyaking may sapat na bilang ng mga AEW o admin na naka-duty sa mga peak hours upang mabilis na ma-validate at matugunan ang mga papasok na mensahe. Sa mga oras na mababa ang aktibidad, maaaring mag-focus ang mga tauhan sa ibang mga gawain tulad ng paglikha ng nilalaman para sa knowledge base o pagpaplano ng mga field visit.</p>
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





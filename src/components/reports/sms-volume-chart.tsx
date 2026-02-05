"use client"

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { smsVolumeData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltipContent } from "../ui/chart"
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
  total: {
    label: "Dami ng SMS",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig


export function SmsVolumeChart() {
  const [timeframe, setTimeframe] = useState('Lingguhan');

  const totalSms = smsVolumeData.reduce((acc, item) => acc + item.total, 0);
  const peakDay = smsVolumeData.reduce((prev, current) => (prev.total > current.total) ? prev : current);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={smsVolumeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8}/>
          <YAxis tickLine={false} axisLine={false} tickMargin={8}/>
          <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Legend content={<ChartLegendContent />} />
          <Bar dataKey="total" fill="var(--color-total)" radius={4} />
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
                <CardTitle>Chart ng Dami ng SMS</CardTitle>
                <CardDescription>Kabuuang papasok na SMS bawat araw.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-1">{totalSms}</p>
                <p className="text-sm text-muted-foreground">Kabuuang SMS ({timeframe})</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Pinakamataas ang dami ng SMS noong {peakDay.name} ({peakDay.total} mensahe).</p>
        </CardFooter>
      </Card>
       <DialogContent className="max-w-4xl">
        <DialogHeader>
            <DialogTitle>Chart ng Dami ng SMS ({timeframe})</DialogTitle>
            <DialogDescription>
              Ipinapakita ng ulat na ito ang dami ng mga papasok na mensahe ng SMS sa isang tinukoy na panahon. Nakakatulong ito sa mga admin na maunawaan ang mga pattern ng komunikasyon at mga panahon ng mataas na aktibidad.
            </DialogDescription>
        </DialogHeader>
        <div className="h-[400px] w-full">
            <ChartContainer config={chartConfig}>
                {renderChart()}
            </ChartContainer>
        </div>
        <DialogFooter className="mt-4 text-sm text-muted-foreground">
            <div className="flex flex-col gap-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang data ay nagpapakita ng isang malinaw na pattern ng aktibidad sa buong linggo, na may pinakamataas na dami ng mensahe tuwing {peakDay.name}. Ito ay maaaring magpahiwatig na ang mga magsasaka ay mas malamang na mag-ulat ng mga isyu bago ang katapusan ng linggo. Ang kabuuang {totalSms} na mensahe sa loob ng linggo ay nagpapakita ng malusog na antas ng pakikilahok.</p>
                <p><strong>Rekomendasyon:</strong> Pag-aralan kung bakit ang {peakDay.name} ay isang araw na may mataas na aktibidad. Maaaring ito ay nauugnay sa mga iskedyul ng merkado o mga gawain sa bukid. Tiyakin na may sapat na suporta mula sa admin sa mga araw na ito upang pamahalaan ang pagdagsa ng mga mensahe. Isaalang-alang ang pagpapadala ng mga paalala o pangkalahatang payo sa mga araw na mas mababa ang aktibidad upang mapanatili ang pakikipag-ugnayan.</p>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

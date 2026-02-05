"use client"

import { useState } from "react";
import { Pie, PieChart, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { smsDeliveryStatusData } from "@/lib/data"
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
  DialogClose,
} from "@/components/ui/dialog"
import { ScrollArea } from "../ui/scroll-area";


const chartConfig = {
  Napadala: { label: "Napadala", color: "hsl(var(--chart-1))" },
  Nabigo: { label: "Nabigo", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function SmsDeliveryStatusChart() {
  const [timeframe, setTimeframe] = useState('Lingguhan');

  const successRate = smsDeliveryStatusData.find(d => d.name === 'Napadala')?.value ?? 0;
  const failureRate = 1000 - successRate;

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip content={<ChartTooltipContent nameKey="name" />} />
        <Legend content={<ChartLegendContent nameKey="name" />} />
        <Pie data={smsDeliveryStatusData} dataKey="value" nameKey="name" innerRadius="60%">
          {smsDeliveryStatusData.map((entry) => (
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
            </div>
            <div className="grid gap-0.5">
                <CardTitle>Katayuan ng Pagpapadala ng SMS</CardTitle>
                <CardDescription>Rate ng tagumpay sa pagpapadala ng mga mensahe.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-1">{(successRate / (successRate+failureRate) * 100).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">ang Matagumpay na Naipadala</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Mataas ang rate ng tagumpay, na nagpapahiwatig ng maaasahang sistema ng komunikasyon.</p>
        </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
            <DialogTitle>Katayuan ng Pagpapadala ng SMS ({timeframe})</DialogTitle>
            <DialogDescription>
              Sinusubaybayan ng ulat na ito ang rate ng tagumpay ng mga papalabas na mensahe ng SMS mula sa sistema patungo sa mga magsasaka. Ito ay isang mahalagang sukatan ng teknikal na pagiging maaasahan.
            </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig}>
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-6 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang isang napakataas na rate ng tagumpay (higit sa 99%) ay nagpapakita na ang imprastraktura ng SMS ay matatag at ang mga mensahe ay epektibong nakakarating sa mga tatanggap. Ang maliit na bilang ng mga pagkabigo ay normal at maaaring sanhi ng mga pansamantalang isyu sa network o mga problema sa device ng tatanggap.</p>
                <p><strong>Rekomendasyon:</strong> Habang mataas ang rate ng tagumpay, mahalagang subaybayan pa rin ito. Kung may biglaang pagtaas sa rate ng pagkabigo, dapat itong imbestigahan kaagad dahil maaaring magpahiwatig ito ng isang problema sa SMS gateway provider o sa configuration ng sistema.</p>
            </div>
        </ScrollArea>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Isara</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { validationQueueData } from "@/lib/data"
import { ChartConfig, ChartContainer } from "../ui/chart"
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
  value: {
    label: "Mensahe",
  },
} satisfies ChartConfig

export function ValidationQueueChart() {
  const [timeframe, setTimeframe] = useState('Kasalukuyan');
  
  const pendingCount = validationQueueData.find(d => d.name === 'Nakabinbin')?.value ?? 0;

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
          data={validationQueueData}
          layout="vertical"
          margin={{ left: 10, right: 10 }}
      >
          <YAxis dataKey="name" type="category" ticks={[]} tickLine={false} axisLine={false} />
          <XAxis dataKey="value" type="number" hide />
          <Bar dataKey="value" layout="vertical" stackId="a" radius={5}>
                {validationQueueData.map((item) => (
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
          <div className="flex justify-between items-start">
            <div className="grid gap-0.5">
                <CardTitle>Validation Queue</CardTitle>
                <CardDescription>Bilang ng mga mensaheng nakabinbin vs. nalutas.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{timeframe}</span>
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setTimeframe('Kasalukuyan')}>Kasalukuyan</DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
              <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                      <Expand className="h-4 w-4" />
                  </Button>
              </DialogTrigger>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-2">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Nakabinbin para sa Validation</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: May {pendingCount} na mensahe na kasalukuyang naghihintay ng pagsusuri mula sa isang admin.</p>
        </CardFooter>
      </Card>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
            <DialogTitle>Katayuan ng Validation Queue ({timeframe})</DialogTitle>
            <DialogDescription>
              Ipinapakita ng ulat na ito ang real-time na katayuan ng validation queue. Sinusukat nito ang bilang ng mga mensahe na nangangailangan ng manu-manong pagsusuri mula sa isang AEW kumpara sa mga nalutas na.
            </DialogDescription>
        </DialogHeader>
        <div className="h-[400px] w-full">
            <ChartContainer config={chartConfig}>
                {renderChart()}
            </ChartContainer>
        </div>
        <DialogFooter className="mt-4 text-sm text-muted-foreground">
            <div className="flex flex-col gap-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang isang malaking bilang ng mga "Nalutas" na mga item ay nagpapakita ng isang mahusay na daloy ng trabaho. Ang bilang ng mga "Nakabinbin" na item ay kumakatawan sa kasalukuyang workload ng mga AEW. Ang layunin ay panatilihing mababa ang bilang ng mga nakabinbin hangga't maaari.</p>
                <p><strong>Rekomendasyon:</strong> Subaybayan ang bilang ng mga nakabinbin. Kung ito ay patuloy na tumataas, maaaring ito ay isang senyales na kulang ang mga tauhan upang mapangasiwaan ang dami ng mga mensahe. Gamitin ang data na ito upang matukoy ang mga oras na may pinakamataas na pila at mag-iskedyul ng mga tauhan nang naaayon.</p>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

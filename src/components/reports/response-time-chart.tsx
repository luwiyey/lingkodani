"use client"

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { responseTimeData } from "@/lib/data"
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
  time: {
    label: "Oras (minuto)",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function ResponseTimeChart() {
  const [timeframe, setTimeframe] = useState('Lingguhan');

  const averageTime = responseTimeData.find(d => d.name === 'Average')?.time ?? 0;

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={responseTimeData} accessibilityLayer>
        <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
        <YAxis unit="m" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
        <Tooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="time" fill="var(--color-time)" radius={4} />
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
                <CardTitle>Oras ng Pagtugon</CardTitle>
                <CardDescription>Average na oras bago maipadala ang isang tugon.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-5">{averageTime}<span className="text-2xl text-muted-foreground">min</span></p>
                <p className="text-sm text-muted-foreground">Average na Pagtugon</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Ang average na oras ng pagtugon ay {averageTime} minuto, na nagpapakita ng mabilis na sistema.</p>
        </CardFooter>
      </Card>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
            <DialogTitle>Oras ng Pagtugon ({timeframe})</DialogTitle>
            <DialogDescription>
              Sinusukat ng ulat na ito ang average na oras na lumipas mula sa pagtanggap ng isang SMS hanggang sa pagpapadala ng tugon (alinman sa awtomatikong payo o manu-manong tugon). Ang mabilis na oras ng pagtugon ay mahalaga para sa kasiyahan ng magsasaka.
            </DialogDescription>
        </DialogHeader>
        <div className="h-[400px] w-full">
            <ChartContainer config={chartConfig}>
                {renderChart()}
            </ChartContainer>
        </div>
        <DialogFooter className="mt-4 text-sm text-muted-foreground">
            <div className="flex flex-col gap-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang isang average na oras ng pagtugon na {averageTime} minuto ay napakahusay. Ipinapakita nito na ang sistema, kasama ang human-in-the-loop na proseso, ay mahusay at tumutugon nang mabilis sa mga pangangailangan ng magsasaka. Ang 90th percentile na oras ay nagpapahiwatig na kahit ang mga mas kumplikadong kaso ay karaniwang natutugunan sa loob ng humigit-kumulang 15 minuto.</p>
                <p><strong>Rekomendasyon:</strong> Panatilihin ang kahusayan na ito. Kung mapapansin na tumataas ang average na oras ng pagtugon, maaaring ito ay isang senyales na ang mga AEW ay overloaded o may bottleneck sa proseso ng pagpapatunay. Gamitin ang data na ito upang bigyang-katwiran ang pangangailangan para sa karagdagang tauhan kung kinakailangan.</p>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

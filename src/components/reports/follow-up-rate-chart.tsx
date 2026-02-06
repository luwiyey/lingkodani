"use client"

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { followUpRateData } from "@/lib/data"
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
  value: {
    label: "Porsyento",
  },
} satisfies ChartConfig

export function FollowUpRateChart() {
  const [timeframe, setTimeframe] = useState('Buwanan');

  const noFollowUpRate = followUpRateData.find(d => d.name === 'Walang Follow-up')?.value ?? 0;

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={followUpRateData} layout="vertical" margin={{ left: 20, right: 20 }}>
          <XAxis type="number" dataKey="value" hide />
          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
          <RechartsTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
          <Bar dataKey="value" radius={5}>
              {followUpRateData.map((item) => (
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
                <CardTitle>Rate ng Follow-up</CardTitle>
                <CardDescription>Gaano kadalas mag-reply ang mga magsasaka.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-2">{noFollowUpRate}%</p>
                <p className="text-sm text-muted-foreground">ang Walang Follow-up</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: {noFollowUpRate}% ng mga magsasaka ay hindi nagtatanong muli, na nagpapahiwatig na sapat na ang unang payo.</p>
        </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Rate ng Follow-up ({timeframe})</DialogTitle>
            <DialogDescription>
                Sinusukat ng ulat na ito ang porsyento ng mga magsasaka na nagpapadala ng isa pang mensahe (isang follow-up na tanong) pagkatapos makatanggap ng payo mula sa sistema.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="w-full h-full">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang mataas na porsyento ng "Walang Follow-up" ({noFollowUpRate}%) ay maaaring bigyang-kahulugan sa dalawang paraan: alinman sa (1) ang paunang payo ay napakalinaw at sapat na, kaya hindi na kailangan ng karagdagang tanong, o (2) ang magsasaka ay hindi nakikipag-ugnayan muli. Dahil mataas ang pangkalahatang engagement, malamang na ang unang interpretasyon ang tama.</p>
                <p><strong>Rekomendasyon:</strong> Para makasiguro, mag-sample ng ilang mga "Walang Follow-up" na kaso at magpadala ng proaktibong mensahe, tulad ng, "Kumusta po, naging epektibo po ba ang payo namin para sa inyong [isyu]? Mayroon pa po ba kaming maitutulong?" Makakatulong ito na kumpirmahin ang kasiyahan ng magsasaka at magpakita ng mahusay na serbisyo.</p>
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

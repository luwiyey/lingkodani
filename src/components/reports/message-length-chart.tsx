"use client"

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { messageLengthData } from "@/lib/data"
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
    label: "Bilang ng Mensahe",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function MessageLengthChart() {
  const [timeframe, setTimeframe] = useState('Lingguhan');

  const mostCommonRange = messageLengthData.reduce((prev, current) => (prev.count > current.count) ? prev : current);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={messageLengthData} accessibilityLayer>
        <XAxis dataKey="range" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
        <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
        <RechartsTooltip cursor={false} content={<ChartTooltipContent />} />
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
                <CardTitle>Haba ng Mensahe</CardTitle>
                <CardDescription>Pamamahagi ng haba ng mga mensahe.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
             <div className="flex flex-col items-center gap-2">
                <p className="text-5xl font-bold text-chart-4">{mostCommonRange.count}</p>
                <p className="text-sm text-muted-foreground">mensahe sa {mostCommonRange.range} chars</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Karamihan sa mga mensahe ay may haba na 21-80 characters, na mainam para sa SMS.</p>
        </CardFooter>
      </Card>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Haba ng Mensahe ({timeframe})</DialogTitle>
            <DialogDescription>
              Sinusuri ng ulat na ito ang haba ng mga papasok na mensahe ng SMS. Ang pag-unawa kung gaano kahaba o kaikli ang mga mensahe ng magsasaka ay makakatulong sa pag-optimize ng pag-unawa ng AI at sa pag-disenyo ng mga epektibong tugon.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ang pinakamalaking bilang ng mga mensahe ay nasa "Medium" na haba (21-80 characters). Ito ang perpektong haba para sa SMS, na sapat na detalyado ngunit hindi masyadong mahaba. Ang mga "Long" na mensahe (81-160) ay maaari namang maglaman ng mas kumplikadong mga isyu, habang ang mga "Short" (1-20) ay maaaring mga simpleng katanungan o kumpirmasyon.</p>
                <p><strong>Rekomendasyon:</strong> Para sa mga "Long" na mensahe, tiyaking kaya ng AI na i-parse ang maraming pangungusap at mga ideya. Para sa mga "Short" na mensahe, ang AI ay dapat na mahusay sa pag-unawa ng mga keyword kahit na limitado ang konteksto. Ang pag-alam sa mga haba na ito ay nakakatulong din na matiyak na ang mga awtomatikong tugon ay angkop din sa haba.</p>
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

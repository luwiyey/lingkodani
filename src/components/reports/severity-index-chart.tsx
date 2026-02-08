"use client"

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { severityIndexData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegendContent, ChartTooltipContent } from "../ui/chart"
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
  mild: { label: "Banayad", color: "hsl(var(--chart-1))" },
  moderate: { label: "Katamtaman", color: "hsl(var(--chart-2))" },
  severe: { label: "Malubha", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function SeverityIndexChart() {
  const [timeframe, setTimeframe] = useState('Buwanan');
  
  const mostSevereCategory = severityIndexData.reduce((prev, current) => ((prev.severe / (prev.mild + prev.moderate + prev.severe)) > (current.severe / (current.mild + current.moderate + current.severe))) ? prev : current);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={severityIndexData} layout="vertical" stackOffset="expand">
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={50} />
          <RechartsTooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
          <Bar dataKey="mild" stackId="a" fill="var(--color-mild)" />
          <Bar dataKey="moderate" stackId="a" fill="var(--color-moderate)" />
          <Bar dataKey="severe" stackId="a" fill="var(--color-severe)" radius={[0, 4, 4, 0]} />
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
                <CardTitle>Antas ng Kalubhaan ng Isyu</CardTitle>
                <CardDescription>Pamamahagi ng kalubhaan ng mga iniulat na sintomas.</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="h-[180px] flex items-center justify-center p-0">
            <div className="flex flex-col items-center gap-2">
                <p className="text-4xl font-bold text-destructive">{mostSevereCategory.name}</p>
                <p className="text-sm text-muted-foreground">ang may pinakamalubhang ulat</p>
            </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Pagsusuri: Ang "{mostSevereCategory.name}" ang may pinakamataas na bahagdan ng "malubhang" ulat.</p>
        </CardFooter>
      </Card>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Antas ng Kalubhaan ng Isyu ({timeframe})</DialogTitle>
            <DialogDescription>
              Kinakategorya ng chart na ito ang bawat uri ng isyu (Peste, Sakit, Panahon) batay sa kalubhaan ng mga iniulat na sintomas. Nakakatulong ito na i-prioritize ang mga isyu na may pinakamalaking epekto.
            </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto pr-4">
            <div className="h-[400px] w-full mt-4">
                <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderChart()}
                </ChartContainer>
            </div>
            <div className="mt-8 text-sm text-muted-foreground space-y-2">
                <p><strong>Detalyadong Pagsusuri:</strong> Ipinapakita ng data na habang ang "Peste" ay maaaring ang pinakamadalas na iulat, ang kategorya ng "{mostSevereCategory.name}" ay may pinakamataas na porsyento ng mga ulat na "moderate" at "severe". Ibig sabihin, kapag nag-ulat ang isang magsasaka tungkol sa sakit, ito ay malamang na isang malubhang problema na.</p>
                <p><strong>Rekomendasyon:</strong> Bigyan ng mas mataas na prayoridad ang mga ulat na may kaugnayan sa "{mostSevereCategory.name}". Tiyaking ang mga AEW ay may sapat na kaalaman at kagamitan para sa pag-diagnose at paggamot ng mga sakit ng halaman. Isaalang-alang ang paglikha ng mas maraming nilalaman sa knowledge base tungkol sa pag-iwas sa mga sakit.</p>
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

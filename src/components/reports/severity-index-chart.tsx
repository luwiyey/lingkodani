
"use client"

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { severityIndexData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegendContent, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const chartConfig = {
  mild: { label: "Banayad", color: "hsl(var(--chart-1))" },
  moderate: { label: "Katamtaman", color: "hsl(var(--chart-2))" },
  severe: { label: "Malubha", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function SeverityIndexChart() {
  const [timeframe, setTimeframe] = useState('Buwanan');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Antas ng Kalubhaan ng Isyu</CardTitle>
                <CardDescription className="text-xs">Pamamahagi ng kalubhaan ng mga iniulat na sintomas.</CardDescription>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{timeframe}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTimeframe('Lingguhan')}>Lingguhan</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeframe('Buwanan')}>Buwanan</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeframe('Taunan')}>Taunan</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={severityIndexData} layout="vertical" stackOffset="expand">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={50} />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend content={<ChartLegendContent />} />
                <Bar dataKey="mild" stackId="a" fill="var(--color-mild)" />
                <Bar dataKey="moderate" stackId="a" fill="var(--color-moderate)" />
                <Bar dataKey="severe" stackId="a" fill="var(--color-severe)" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Pagsusuri: Ang "Sakit" ang may pinakamataas na bahagdan ng "moderate" hanggang "severe" na ulat, na nagmamarka dito bilang isang kritikal na kategorya ng isyu.</p>
      </CardFooter>
    </Card>
  )
}

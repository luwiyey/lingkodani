
"use client"

import { useState } from "react";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { cropStageData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const chartConfig = {
    Pagtatanim: { label: "Pagtatanim", color: "hsl(var(--chart-1))" },
    Paglago: { label: "Paglago", color: "hsl(var(--chart-2))" },
    Pamumulaklak: { label: "Pamumulaklak", color: "hsl(var(--chart-3))" },
    "Pag-aani": { label: "Pag-aani", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

export function CropStageChart() {
  const [timeframe, setTimeframe] = useState('Kasalukuyan');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Pamamahagi ng Yugto ng Pananim</CardTitle>
                <CardDescription>Porsyento ng mga pananim sa bawat yugto.</CardDescription>
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{timeframe}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTimeframe('Kasalukuyan')}>Kasalukuyan</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeframe('Buwanan')}>Buwanan</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                    <Legend content={<ChartLegendContent nameKey="name"/>} />
                    <Pie data={cropStageData} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="80%">
                         {cropStageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
       <CardFooter>
        <p className="text-xs text-muted-foreground">Pagsusuri: Karamihan sa mga bukid ay nasa yugto ng "Pagtatanim" (142) at "Paglago" (115), na nagpapahiwatig ng peak season.</p>
      </CardFooter>
    </Card>
  )
}

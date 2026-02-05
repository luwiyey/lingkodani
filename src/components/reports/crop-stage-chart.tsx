
"use client"

import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cropStageData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
    Pagtatanim: { label: "Pagtatanim", color: "hsl(var(--chart-1))" },
    Paglago: { label: "Paglago", color: "hsl(var(--chart-2))" },
    Pamumulaklak: { label: "Pamumulaklak", color: "hsl(var(--chart-3))" },
    "Pag-aani": { label: "Pag-aani", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

export function CropStageChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pamamahagi ng Yugto ng Pananim</CardTitle>
        <CardDescription>Porsyento ng mga pananim sa bawat yugto ng paglago.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
    </Card>
  )
}

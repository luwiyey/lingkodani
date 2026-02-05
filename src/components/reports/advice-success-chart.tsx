"use client"

import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { adviceSuccessData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
    Inaprubahan: { label: "Inaprubahan", color: "hsl(var(--chart-1))" },
    "In-edit": { label: "In-edit", color: "hsl(var(--chart-2))" },
    Tinanggihan: { label: "Tinanggihan", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function AdviceSuccessChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mga Rate ng Pagpapatunay ng Payo</CardTitle>
        <CardDescription>Pamamahagi ng mga aksyon ng admin sa payo ng AI.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip content={<ChartTooltipContent nameKey="status" />} />
                    <Legend content={<ChartLegendContent nameKey="status"/>} />
                    <Pie data={adviceSuccessData} dataKey="value" nameKey="status" innerRadius="50%" outerRadius="80%">
                         {adviceSuccessData.map((entry, index) => (
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

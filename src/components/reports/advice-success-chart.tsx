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
    Approved: { label: "Approved", color: "hsl(var(--chart-1))" },
    Edited: { label: "Edited", color: "hsl(var(--chart-2))" },
    Rejected: { label: "Rejected", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function AdviceSuccessChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Advice Validation Rates</CardTitle>
        <CardDescription>Distribution of admin actions on AI advice.</CardDescription>
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

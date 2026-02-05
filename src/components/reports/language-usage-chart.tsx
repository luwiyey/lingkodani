"use client"

import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { languageUsageData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
    Tagalog: { label: "Tagalog", color: "hsl(var(--chart-1))" },
    Taglish: { label: "Taglish", color: "hsl(var(--chart-2))" },
    Ilocano: { label: "Ilocano", color: "hsl(var(--chart-3))" },
    English: { label: "English", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

export function LanguageUsageChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Paggamit ng Wika</CardTitle>
        <CardDescription>Pamamahagi ng mga wikang ginagamit sa mga SMS.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip content={<ChartTooltipContent nameKey="language" />} />
                    <Legend content={<ChartLegendContent nameKey="language"/>} />
                    <Pie data={languageUsageData} dataKey="value" nameKey="language" innerRadius="50%" outerRadius="80%">
                         {languageUsageData.map((entry, index) => (
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

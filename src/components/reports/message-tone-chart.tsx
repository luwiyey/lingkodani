
"use client"

import { Pie, PieChart, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { messageToneData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  Neutral: { label: "Neutral", color: "hsl(var(--chart-1))" },
  'Nag-aalala': { label: "Nag-aalala", color: "hsl(var(--chart-2))" },
  Kritikal: { label: "Kritikal", color: "hsl(var(--destructive))" },
  Positibo: { label: "Positibo", color: "hsl(var(--chart-3))" },
} satisfies ChartConfig

export function MessageToneChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend ng Tono ng Mensahe ng Magsasaka</CardTitle>
        <CardDescription className="text-xs">Pamamahagi ng emosyonal na tono na natukoy sa mga mensahe.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart>
            <Tooltip content={<ChartTooltipContent nameKey="tone" />} />
            <Legend content={<ChartLegendContent nameKey="tone" />} />
            <Pie data={messageToneData} dataKey="count" nameKey="tone" innerRadius="60%">
              {messageToneData.map((entry) => (
                <Cell key={entry.tone} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

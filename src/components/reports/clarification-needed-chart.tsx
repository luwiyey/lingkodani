
"use client"

import { Pie, PieChart, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { clarificationNeededData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  "Nangailangan ng Clarification": { label: "Nangailangan ng Clarification", color: "hsl(var(--chart-2))" },
  "Hindi Kinailangan": { label: "Hindi Kinailangan", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig

export function ClarificationNeededChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bilang ng Mensaheng Nangailangan ng Karagdagang Impormasyon</CardTitle>
        <CardDescription className="text-xs">Mga kaso kung saan mababa ang kumpiyansa ng AI at nangailangan ng paglilinaw.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart>
            <Tooltip content={<ChartTooltipContent nameKey="name" />} />
            <Legend content={<ChartLegendContent nameKey="name" />} />
            <Pie data={clarificationNeededData} dataKey="value" nameKey="name" innerRadius="60%">
              {clarificationNeededData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

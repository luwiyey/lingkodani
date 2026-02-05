
"use client"

import { Pie, PieChart, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { aiAgreementData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  "Approved As-is": { label: "Inaprubahan (Walang Edit)", color: "hsl(var(--chart-1))" },
  Revised: { label: "Binago", color: "hsl(var(--chart-2))" },
  Rejected: { label: "Tinanggihan", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function AIAgreementChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagkakatugma ng AI Output at Expert Validation</CardTitle>
        <CardDescription className="text-xs">Porsyento ng mga payo ng AI na inaprubahan nang walang pag-edit.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart>
            <Tooltip content={<ChartTooltipContent nameKey="name" />} />
            <Legend content={<ChartLegendContent nameKey="name" />} />
            <Pie data={aiAgreementData} dataKey="value" nameKey="name" innerRadius="60%">
              {aiAgreementData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

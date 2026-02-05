
"use client"

import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { smsDeliveryStatusData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  Napadala: { label: "Napadala", color: "hsl(var(--chart-1))" },
  Nabigo: { label: "Nabigo", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function SmsDeliveryStatusChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Katayuan ng Pagpapadala ng SMS Advisory</CardTitle>
        <CardDescription className="text-xs">Rate ng tagumpay sa pagpapadala ng mga mensahe sa mga magsasaka.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart>
            <Tooltip content={<ChartTooltipContent nameKey="name" />} />
            <Legend content={<ChartLegendContent nameKey="name" />} />
            <Pie data={smsDeliveryStatusData} dataKey="value" nameKey="name" innerRadius="60%">
              {smsDeliveryStatusData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

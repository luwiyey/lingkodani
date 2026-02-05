
"use client"

import { Pie, PieChart, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { advisoryDeliveryData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  Tagumpay: { label: "Tagumpay", color: "hsl(var(--chart-1))" },
  Nabigo: { label: "Nabigo", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function AdvisoryDeliveryChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Success Rate ng Pagpapadala ng Advisory SMS</CardTitle>
        <CardDescription className="text-xs">Ipinapakita ang porsyento ng mga SMS na matagumpay na naipadala.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart>
            <Tooltip content={<ChartTooltipContent nameKey="name" />} />
            <Legend content={<ChartLegendContent nameKey="name" />} />
            <Pie data={advisoryDeliveryData} dataKey="value" nameKey="name" innerRadius="60%">
              {advisoryDeliveryData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

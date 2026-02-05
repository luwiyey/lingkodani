
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { followUpRateData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  value: {
    label: "Porsyento",
  },
} satisfies ChartConfig

export function FollowUpRateChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bilang ng Follow-up Questions Pagkatapos ng Advisory</CardTitle>
        <CardDescription className="text-xs">Gaano kadalas mag-reply ang mga magsasaka pagkatapos makatanggap ng payo.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={followUpRateData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" dataKey="value" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="value" radius={5}>
                    {followUpRateData.map((item) => (
                        <Cell key={item.name} fill={item.fill} />
                    ))}
                </Bar>
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
import { Cell } from 'recharts';


"use client"

import { Bar, BarChart, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { validationQueueData } from "@/lib/data"
import { ChartConfig, ChartContainer } from "../ui/chart"

const chartConfig = {
  value: {
    label: "Mensahe",
  },
} satisfies ChartConfig

export function ValidationQueueChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Katayuan ng Mga Mensaheng Nasa Validation Queue</CardTitle>
        <CardDescription className="text-xs">Bilang ng mga mensaheng nakabinbin kumpara sa mga nalutas na.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart
                data={validationQueueData}
                layout="vertical"
                margin={{ left: 10, right: 10 }}
            >
                <YAxis dataKey="name" type="category" ticks={[]} tickLine={false} axisLine={false} />
                <XAxis dataKey="value" type="number" hide />
                <Bar dataKey="value" layout="vertical" stackId="a" radius={5}>
                     {validationQueueData.map((item) => (
                        <Cell key={item.name} fill={item.fill} />
                    ))}
                </Bar>
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// You might need to add this import if it's not auto-imported
import { Cell } from 'recharts';


"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { responseTimeData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  time: {
    label: "Oras (minuto)",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function ResponseTimeChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Karaniwang Oras ng Pagtugon sa Ulat ng SMS</CardTitle>
        <CardDescription className="text-xs">Average na oras bago maipadala ang isang advisory o tugon.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={responseTimeData} accessibilityLayer>
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
              <YAxis unit="m" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
              <Tooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="time" fill="var(--color-time)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

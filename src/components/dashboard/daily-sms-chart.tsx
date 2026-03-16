
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAnalytics } from "@/hooks/use-analytics"
import { smsVolumeData as fallbackSmsVolumeData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  total: {
    label: "SMS",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function DailySmsChart() {
  const { smsVolumeData } = useAnalytics();
  const chartData = smsVolumeData.some((item) => item.total > 0) ? smsVolumeData : fallbackSmsVolumeData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pang-araw-araw na Ulat sa SMS</CardTitle>
        <CardDescription>Dami ng mga papasok na SMS sa nakalipas na 7 araw.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis
                dataKey="name"
                stroke="hsl(var(--foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
               <Tooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
              <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}


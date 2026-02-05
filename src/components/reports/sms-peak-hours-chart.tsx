"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { smsPeakHoursData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  messages: {
    label: "Mga Mensahe",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function SmsPeakHoursChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mga Oras na may Pinakamaraming Mensahe</CardTitle>
        <CardDescription>Dami ng SMS ayon sa oras sa isang araw.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={smsPeakHoursData}>
              <XAxis
                dataKey="hour"
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
              <Bar dataKey="messages" fill="var(--color-messages)" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

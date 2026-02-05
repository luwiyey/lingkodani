"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { issueTrendsData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  Pests: {
    label: "Pests",
    color: "hsl(var(--chart-1))",
  },
  Disease: {
    label: "Disease",
    color: "hsl(var(--chart-2))",
  },
  Irrigation: {
    label: "Irrigation",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function IssueTrendsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Trend Graph</CardTitle>
        <CardDescription>Weekly trends of top issues reported by farmers.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={issueTrendsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="Pests" stroke="var(--color-Pests)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Disease" stroke="var(--color-Disease)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Irrigation" stroke="var(--color-Irrigation)" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

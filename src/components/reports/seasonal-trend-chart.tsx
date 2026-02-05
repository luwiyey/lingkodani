
"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { seasonalTrendData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  reports: {
    label: "Mga Ulat",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function SeasonalTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dami ng Ulat Ayon sa Panahon</CardTitle>
        <CardDescription className="text-xs">Ipinapakita ang mga buwan na may pinakamataas na dami ng ulat.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={seasonalTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="reports" stroke="var(--color-reports)" strokeWidth={2} dot={false} />
            </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

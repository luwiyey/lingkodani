
"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { aiConfidenceTrendData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  confidence: {
    label: "Kumpiyansa (%)",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function AIConfidenceTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend ng AI Interpretation Confidence</CardTitle>
        <CardDescription className="text-xs">Sinusubaybayan ang pag-unlad ng kumpiyansa ng AI sa paglipas ng panahon.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={aiConfidenceTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis unit="%" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="confidence" stroke="var(--color-confidence)" strokeWidth={2} dot={true} />
            </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

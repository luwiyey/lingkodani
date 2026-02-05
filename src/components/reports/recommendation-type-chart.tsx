
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { recommendationTypeData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  count: {
    label: "Bilang",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function RecommendationTypeChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Uri ng Mga Payong Naibibigay ng Sistema</CardTitle>
        <CardDescription className="text-xs">Ano ang mga pinakamadalas na uri ng payo na ibinibigay ng AI.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={recommendationTypeData} accessibilityLayer>
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
              <Tooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

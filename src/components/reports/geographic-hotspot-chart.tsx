
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { geographicHotspotData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  issues: {
    label: "Mga Isyu",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function GeographicHotspotChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mga Suliranin Ayon sa Zone/Purok</CardTitle>
        <CardDescription className="text-xs">Distribusyon ng mga iniulat na isyu sa bawat lokasyon.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={geographicHotspotData} accessibilityLayer>
              <XAxis dataKey="zone" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
              <Tooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="issues" fill="var(--color-issues)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

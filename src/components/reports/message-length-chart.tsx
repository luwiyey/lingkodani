
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { messageLengthData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  count: {
    label: "Bilang ng Mensahe",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

export function MessageLengthChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Haba ng Mensahe ng Magsasaka</CardTitle>
        <CardDescription className="text-xs">Pamamahagi ng haba ng mga mensahe na natatanggap.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={messageLengthData} accessibilityLayer>
              <XAxis dataKey="range" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
              <Tooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

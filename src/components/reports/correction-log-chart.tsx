
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { correctionLogData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  count: {
    label: "Bilang ng Corrections",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function CorrectionLogChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bilang ng Mensaheng Kinailangang I-correct</CardTitle>
        <CardDescription className="text-xs">Talaan ng mga mensahe na manu-manong iwinasto ng mga eksperto.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={correctionLogData} accessibilityLayer>
              <XAxis dataKey="type" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
              <Tooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

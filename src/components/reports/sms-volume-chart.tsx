"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { smsVolumeData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart"


const chartConfig = {
  total: {
    label: "SMS Volume",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig


export function SmsVolumeChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS Volume Chart</CardTitle>
        <CardDescription>Total incoming SMS per day for the last week.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={smsVolumeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8}/>
              <YAxis tickLine={false} axisLine={false} tickMargin={8}/>
              <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
               <Legend content={<ChartLegendContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

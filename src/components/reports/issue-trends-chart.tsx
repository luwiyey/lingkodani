
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
  MgaPeste: {
    label: "Mga Peste",
    color: "hsl(var(--chart-1))",
  },
  Sakit: {
    label: "Sakit",
    color: "hsl(var(--chart-2))",
  },
  Patubig: {
    label: "Patubig",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function IssueTrendsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Graph ng Trend ng Isyu</CardTitle>
        <CardDescription className="text-xs">Lingguhang mga uso ng mga pangunahing isyu na iniulat ng mga magsasaka.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={issueTrendsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend content={<ChartLegendContent />} />
                    <Line type="monotone" dataKey="MgaPeste" stroke="var(--color-MgaPeste)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Sakit" stroke="var(--color-Sakit)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Patubig" stroke="var(--color-Patubig)" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

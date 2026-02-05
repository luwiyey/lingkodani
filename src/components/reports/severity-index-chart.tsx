
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { severityIndexData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartLegendContent, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  mild: { label: "Banayad", color: "hsl(var(--chart-1))" },
  moderate: { label: "Katamtaman", color: "hsl(var(--chart-2))" },
  severe: { label: "Malubha", color: "hsl(var(--destructive))" },
} satisfies ChartConfig

export function SeverityIndexChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Antas ng Kalubhaan ng Mga Iniulat na Suliranin</CardTitle>
        <CardDescription className="text-xs">Pamamahagi ng kalubhaan ng mga iniulat na sintomas.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={severityIndexData} layout="vertical" stackOffset="expand">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={50} />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend content={<ChartLegendContent />} />
                <Bar dataKey="mild" stackId="a" fill="var(--color-mild)" />
                <Bar dataKey="moderate" stackId="a" fill="var(--color-moderate)" />
                <Bar dataKey="severe" stackId="a" fill="var(--color-severe)" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

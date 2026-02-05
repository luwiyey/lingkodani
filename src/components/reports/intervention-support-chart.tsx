
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { interventionSupportData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  visits: {
    label: "Farm Visits",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function InterventionSupportChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mga Mensaheng Nangailangan ng Personal na Extension Visit</CardTitle>
        <CardDescription className="text-xs">Sinusubaybayan ang mga kaso na nangailangan ng pisikal na pagbisita sa bukid para sa interbensyon.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={interventionSupportData} accessibilityLayer>
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
              <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12}/>
               <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Bar dataKey="visits" fill="var(--color-visits)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

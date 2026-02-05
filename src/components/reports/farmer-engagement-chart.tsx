
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { farmerEngagementData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  count: {
    label: "Bilang ng Magsasaka",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function FarmerEngagementChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Antas ng Pakikilahok ng Magsasaka</CardTitle>
        <CardDescription className="text-xs">Pamamahagi ng mga magsasaka batay sa dalas ng kanilang pag-uulat.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={farmerEngagementData} accessibilityLayer>
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

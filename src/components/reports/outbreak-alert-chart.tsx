
"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { outbreakAlertData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  ulat: {
    label: "Ulat",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig

export function OutbreakAlertChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Biglaang Pagtaas ng Ulat ng Peste</CardTitle>
        <CardDescription className="text-xs">Ipinapakita ang biglaang pagdami ng mga ulat ng parehong peste sa isang lugar.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={outbreakAlertData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="ulat" stroke="var(--color-ulat)" strokeWidth={2} dot={true} />
            </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

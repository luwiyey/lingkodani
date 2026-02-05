"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { topKeywordsData } from "@/lib/data";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  count: {
    label: "Bilang",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function TopKeywordsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mga Karaniwang Salita ng Magsasaka</CardTitle>
        <CardDescription>Mga pinakamadalas na salitang ginagamit sa mga mensahe ng SMS.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topKeywordsData} layout="vertical" margin={{ left: 10, right: 20 }}>
                     <XAxis type="number" hide />
                     <YAxis 
                        dataKey="word" 
                        type="category" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                        width={80}
                     />
                     <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                     <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

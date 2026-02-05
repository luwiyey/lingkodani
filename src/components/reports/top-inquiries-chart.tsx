
"use client"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { topInquiriesData } from "@/lib/data";
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  count: {
    label: "Bilang",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function TopInquiriesChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pinakakaraniwang Uri ng Tanong</CardTitle>
        <CardDescription className="text-xs">Mga pinakamadalas na tanong o paksa na itinanong ng mga magsasaka.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topInquiriesData} layout="vertical" margin={{ left: 20, right: 20 }}>
                     <XAxis type="number" hide />
                     <YAxis 
                        dataKey="question" 
                        type="category" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                        width={120}
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

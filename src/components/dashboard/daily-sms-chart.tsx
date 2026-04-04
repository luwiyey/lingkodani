
"use client"

import { Bar, BarChart, XAxis, YAxis, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAnalytics } from "@/hooks/use-analytics"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"

const chartConfig = {
  total: {
    label: "SMS",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function DailySmsChart() {
  const { smsVolumeData } = useAnalytics();
  const hasSmsVolume = smsVolumeData.some((item) => item.total > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pang-araw-araw na Ulat sa SMS</CardTitle>
        <CardDescription>Dami ng mga papasok na SMS sa nakalipas na 7 araw.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasSmsVolume ? (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={smsVolumeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                 <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
              </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 px-6 text-center text-sm text-muted-foreground">
            Wala pang naitatalang inbound SMS sa nakalipas na 7 araw sa live dataset.
          </div>
        )}
      </CardContent>
    </Card>
  )
}


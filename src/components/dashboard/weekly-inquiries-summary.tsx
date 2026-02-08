
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip as RechartsTooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '../ui/chart';

const weeklyInquiriesData = [
  { question: 'Peste', count: 45 },
  { question: 'Pataba', count: 38 },
  { question: 'Sakit', count: 32 },
  { question: 'Ani', count: 28 },
  { question: 'Tubig', count: 25 },
];

const chartConfig = {
  count: {
    label: "Bilang",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function WeeklyInquiriesSummary() {
  const topInquiry = [...weeklyInquiriesData].reduce(
    (prev, current) => (prev.count > current.count ? prev : current)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pinakakaraniwang Tanong (7 Araw)</CardTitle>
        <CardDescription>
          Mga nangungunang alalahanin mula sa mga magsasaka nitong linggo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
           <p className="text-3xl font-bold">{topInquiry.count}</p>
           <p className="text-sm text-muted-foreground">
             ulat tungkol sa "{topInquiry.question}"
           </p>
        </div>
        <div className="h-[120px]">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              accessibilityLayer
              data={weeklyInquiriesData}
              margin={{
                left: 0,
                right: 0,
                top: 5,
                bottom: 5,
              }}
            >
              <XAxis
                dataKey="question"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
                interval={0}
              />
              <RechartsTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" hideLabel />}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={4}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

"use client"

import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { seasonalTrendData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const chartConfig = {
  reports: {
    label: "Mga Ulat",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function SeasonalTrendChart() {
  const [timeframe, setTimeframe] = useState('Taunan');

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-end">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{timeframe}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setTimeframe('Ngayong Araw')}>Ngayong Araw</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeframe('Lingguhan')}>Lingguhan</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeframe('Buwanan')}>Buwanan</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeframe('Quarterly')}>Quarterly</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeframe('Taunan')}>Taunan</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="grid gap-0.5">
            <CardTitle>Dami ng Ulat Ayon sa Panahon</CardTitle>
            <CardDescription className="text-xs">Mga buwan na may pinakamataas na dami ng ulat.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={seasonalTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <Tooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="reports" stroke="var(--color-reports)" strokeWidth={2} dot={false} />
            </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">Pagsusuri: Pinakamarami ang ulat tuwing Agosto (320), na maaaring kasabay ng peak ng tag-ulan at mga kaugnay na isyu.</p>
      </CardFooter>
    </Card>
  )
}

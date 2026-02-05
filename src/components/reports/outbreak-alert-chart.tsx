"use client"

import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { outbreakAlertData } from "@/lib/data"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "../ui/chart"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const chartConfig = {
  ulat: {
    label: "Ulat",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig

export function OutbreakAlertChart() {
  const [timeframe, setTimeframe] = useState('Buwanan');

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
            <CardTitle>Mga Alerto sa Peste</CardTitle>
            <CardDescription className="text-xs">Biglaang pagdami ng ulat ng parehong peste.</CardDescription>
        </div>
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
      <CardFooter>
        <p className="text-xs text-muted-foreground">Pagsusuri: Isang biglaang pagtaas ng ulat ng peste ang nangyari noong Oktubre 22 (18 ulat), na posibleng isang outbreak.</p>
      </CardFooter>
    </Card>
  )
}

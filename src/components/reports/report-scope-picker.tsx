"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

import {
  useReportsTimeframe,
  type ReportsTimeframePreset,
} from "@/context/reports-timeframe-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PRESET_OPTIONS: ReportsTimeframePreset[] = [
  "Ngayong Araw",
  "Lingguhan",
  "Monthly",
  "Quarterly",
  "Yearly",
];

type ReportScopePickerProps = {
  align?: "start" | "center" | "end";
};

export function ReportScopePicker({
  align = "end",
}: ReportScopePickerProps) {
  const startDateId = React.useId();
  const endDateId = React.useId();
  const {
    timeframe,
    setTimeframe,
    customRangeStart,
    customRangeEnd,
    setCustomRangeStart,
    setCustomRangeEnd,
    applyCustomRange,
    clearCustomRange,
    isCustomRangeActive,
    activeLabel,
  } = useReportsTimeframe();

  const buttonLabel = isCustomRangeActive ? "Custom Dates" : timeframe;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span>{buttonLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-80 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Reporting Scope</p>
          <p className="text-xs text-muted-foreground">
            Lahat ng chart downloads dito ay puwedeng preset timeframe o exact custom dates.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Active Scope
            </p>
            <Badge variant="secondary" className="max-w-[190px] truncate">
              {activeLabel}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Preset Timeframes</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_OPTIONS.map((option) => (
              <Button
                key={option}
                variant={!isCustomRangeActive && timeframe === option ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border bg-background/80 p-3">
          <p className="text-sm font-medium text-foreground">Exact Date Range</p>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <label htmlFor={startDateId} className="text-xs text-muted-foreground">
                Start date
              </label>
              <Input
                id={startDateId}
                type="date"
                value={customRangeStart}
                onChange={(event) => setCustomRangeStart(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor={endDateId} className="text-xs text-muted-foreground">
                End date
              </label>
              <Input
                id={endDateId}
                type="date"
                value={customRangeEnd}
                onChange={(event) => setCustomRangeEnd(event.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" className="flex-1" onClick={applyCustomRange}>
              Apply Dates
            </Button>
            <Button variant="ghost" size="sm" onClick={clearCustomRange}>
              Back to Lingguhan
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

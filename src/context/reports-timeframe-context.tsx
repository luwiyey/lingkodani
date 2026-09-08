"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ReportsTimeframePreset =
  | "Ngayong Araw"
  | "Lingguhan"
  | "Monthly"
  | "Quarterly"
  | "Yearly";
export type ReportsTimeframe = ReportsTimeframePreset | "Custom Range";

export type ReportsResolvedWindow = {
  start: Date;
  end: Date;
  label: string;
  fileLabel: string;
};

type ReportsTimeframeContextType = {
  timeframe: ReportsTimeframe;
  setTimeframe: (value: ReportsTimeframePreset) => void;
  customRangeStart: string;
  customRangeEnd: string;
  setCustomRangeStart: (value: string) => void;
  setCustomRangeEnd: (value: string) => void;
  applyCustomRange: () => void;
  clearCustomRange: () => void;
  isCustomRangeActive: boolean;
  activeLabel: string;
  activeFileLabel: string;
  resolvedWindow: ReportsResolvedWindow;
};

const ReportsTimeframeContext = createContext<ReportsTimeframeContextType | undefined>(undefined);

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value: string, endOfDay = false) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return parsed;
}

function slugifyLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "report";
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildPresetWindow(timeframe: ReportsTimeframePreset, now = new Date()): ReportsResolvedWindow {
  const end = new Date(now);
  const start = new Date(now);

  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);

  if (timeframe === "Lingguhan") {
    start.setDate(start.getDate() - 6);
  } else if (timeframe === "Monthly") {
    start.setDate(start.getDate() - 29);
  } else if (timeframe === "Quarterly") {
    start.setDate(start.getDate() - 89);
  } else if (timeframe === "Yearly") {
    start.setDate(start.getDate() - 364);
  }

  return {
    start,
    end,
    label: timeframe,
    fileLabel: slugifyLabel(timeframe),
  };
}

export function ReportsTimeframeProvider({
  children,
  anchorDate,
  initialStartDate,
}: {
  children: React.ReactNode;
  anchorDate?: Date;
  initialStartDate?: Date;
}) {
  const anchorDay = useMemo(
    () => formatDateInput(anchorDate && !Number.isNaN(anchorDate.getTime()) ? anchorDate : new Date()),
    [anchorDate]
  );
  const initialWindow = useMemo(
    () => {
      const end = parseDate(anchorDay, true) ?? new Date();
      const start = initialStartDate && !Number.isNaN(initialStartDate.getTime())
        ? parseDate(formatDateInput(initialStartDate))
        : null;

      if (start && start.getTime() <= end.getTime()) {
        return {
          start,
          end,
          label: `Custom Range: ${formatDisplayDate(start)} to ${formatDisplayDate(end)}`,
          fileLabel: `${formatDateInput(start)}_to_${formatDateInput(end)}`,
        };
      }

      return buildPresetWindow("Monthly", end);
    },
    [anchorDay, initialStartDate]
  );
  const [timeframe, setTimeframeState] = useState<ReportsTimeframe>(
    initialStartDate ? "Custom Range" : "Monthly"
  );
  const [customRangeStart, setCustomRangeStart] = useState(() => formatDateInput(initialWindow.start));
  const [customRangeEnd, setCustomRangeEnd] = useState(() => formatDateInput(initialWindow.end));

  const setTimeframe = useCallback((value: ReportsTimeframePreset) => {
    const nextWindow = buildPresetWindow(value, parseDate(anchorDay, true) ?? new Date());
    setCustomRangeStart(formatDateInput(nextWindow.start));
    setCustomRangeEnd(formatDateInput(nextWindow.end));
    setTimeframeState(value);
  }, [anchorDay]);

  const applyCustomRange = useCallback(() => {
    setTimeframeState("Custom Range");
  }, []);

  const clearCustomRange = useCallback(() => {
    const nextWindow = buildPresetWindow("Monthly", parseDate(anchorDay, true) ?? new Date());
    setCustomRangeStart(formatDateInput(nextWindow.start));
    setCustomRangeEnd(formatDateInput(nextWindow.end));
    setTimeframeState("Monthly");
  }, [anchorDay]);

  const resolvedWindow = useMemo<ReportsResolvedWindow>(() => {
    if (timeframe !== "Custom Range") {
      return buildPresetWindow(timeframe, parseDate(anchorDay, true) ?? new Date());
    }

    const parsedStart = parseDate(customRangeStart) ?? parseDate(anchorDay) ?? new Date();
    const parsedEnd = parseDate(customRangeEnd, true) ?? parseDate(anchorDay, true) ?? new Date();
    const start = parsedStart.getTime() <= parsedEnd.getTime() ? parsedStart : parsedEnd;
    const end = parsedEnd.getTime() >= parsedStart.getTime() ? parsedEnd : parsedStart;

    return {
      start,
      end,
      label: `Custom Range: ${formatDisplayDate(start)} to ${formatDisplayDate(end)}`,
      fileLabel: `${formatDateInput(start)}_to_${formatDateInput(end)}`,
    };
  }, [anchorDay, customRangeEnd, customRangeStart, timeframe]);

  const value = useMemo<ReportsTimeframeContextType>(
    () => ({
      timeframe,
      setTimeframe,
      customRangeStart,
      customRangeEnd,
      setCustomRangeStart,
      setCustomRangeEnd,
      applyCustomRange,
      clearCustomRange,
      isCustomRangeActive: timeframe === "Custom Range",
      activeLabel: resolvedWindow.label,
      activeFileLabel: resolvedWindow.fileLabel,
      resolvedWindow,
    }),
    [applyCustomRange, clearCustomRange, customRangeEnd, customRangeStart, resolvedWindow, setTimeframe, timeframe]
  );

  return (
    <ReportsTimeframeContext.Provider value={value}>
      {children}
    </ReportsTimeframeContext.Provider>
  );
}

export function useReportsTimeframe() {
  const context = useContext(ReportsTimeframeContext);

  if (!context) {
    const fallbackWindow = buildPresetWindow("Lingguhan");
    return {
      timeframe: "Lingguhan" as ReportsTimeframe,
      setTimeframe: (() => undefined) as (value: ReportsTimeframePreset) => void,
      customRangeStart: formatDateInput(new Date()),
      customRangeEnd: formatDateInput(new Date()),
      setCustomRangeStart: (() => undefined) as (value: string) => void,
      setCustomRangeEnd: (() => undefined) as (value: string) => void,
      applyCustomRange: (() => undefined) as () => void,
      clearCustomRange: (() => undefined) as () => void,
      isCustomRangeActive: false,
      activeLabel: fallbackWindow.label,
      activeFileLabel: fallbackWindow.fileLabel,
      resolvedWindow: fallbackWindow,
    };
  }

  return context;
}

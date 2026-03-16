"use client";

import React, { createContext, useContext, useState } from "react";

export type ReportsTimeframe = "Ngayong Araw" | "Lingguhan" | "Buwanan" | "Quarterly" | "Taunan";

type ReportsTimeframeContextType = {
  timeframe: ReportsTimeframe;
  setTimeframe: React.Dispatch<React.SetStateAction<ReportsTimeframe>>;
};

const ReportsTimeframeContext = createContext<ReportsTimeframeContextType | undefined>(undefined);

export function ReportsTimeframeProvider({ children }: { children: React.ReactNode }) {
  const [timeframe, setTimeframe] = useState<ReportsTimeframe>("Lingguhan");

  return (
    <ReportsTimeframeContext.Provider value={{ timeframe, setTimeframe }}>
      {children}
    </ReportsTimeframeContext.Provider>
  );
}

export function useReportsTimeframe() {
  const context = useContext(ReportsTimeframeContext);

  if (!context) {
    return {
      timeframe: "Lingguhan" as ReportsTimeframe,
      setTimeframe: (() => undefined) as React.Dispatch<React.SetStateAction<ReportsTimeframe>>,
    };
  }

  return context;
}

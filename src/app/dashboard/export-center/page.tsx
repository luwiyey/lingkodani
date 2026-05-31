"use client";

import { Download, Shield } from "lucide-react";

import { ExportCenterPanel } from "@/components/reports/export-center-panel";
import { HelpDialog } from "@/components/ui/help-dialog";

export default function ExportCenterPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="flex items-center">
          <Download className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">Export Center</h1>
          <HelpDialog title="Export Center" tooltipText="Download filtered records and analytics exports.">
            <p>
              Ang Export Center ay para sa superadmin-level reporting at documentation. Dito puwedeng pumili ng
              specific date, date range, o preset filters bago i-download ang operational records, farmer demographic
              snapshots, at AI analytics summaries bilang CSV o PDF.
            </p>
            <p>
              Hindi nito pinapalitan ang regular na barangay reports dashboard. Sa halip, ito ang formal export
              workspace para sa filtered documentation, oversight, at cross-period record review.
            </p>
          </HelpDialog>
        </div>
        <p className="text-muted-foreground">
          Superadmin workspace para sa filtered report exports, demographic snapshots, AI analytics summaries, at downloadable
          operational records.
        </p>
      </div>

      <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <Shield className="h-4 w-4" />
          Superadmin export control
        </p>
        <p className="mt-2">
          Ang view na ito ay hiwalay sa araw-araw na barangay workflow para mas malinaw ang access sa filtered exports,
          AI analytics, at historical documentation support.
        </p>
      </div>

      <ExportCenterPanel />
    </div>
  );
}

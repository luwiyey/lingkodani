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
          <h1 className="text-2xl font-bold tracking-tight">Download Center</h1>
          <HelpDialog title="Download Center" tooltipText="Pumili ng petsa at mag-download ng opisyal na records.">
            <p>
              Ang Download Center ay para sa opisyal na ulat at dokumentasyon. Dito puwedeng pumili ng
              isang petsa, saklaw ng petsa, o mabilisang pili bago i-download ang operational records,
              demographic data ng magsasaka, at buod ng pagsusuri bilang CSV o PDF.
            </p>
            <p>
              Hindi nito pinapalitan ang regular na dashboard. Ito ang lugar para gumawa ng pormal na kopya
              ng records at ihambing ang impormasyon mula sa iba&apos;t ibang panahon.
            </p>
          </HelpDialog>
        </div>
        <p className="text-muted-foreground">
          Piliin ang petsa, tingnan kung ilang record ang kasama, at saka i-download ang CSV o PDF.
        </p>
      </div>

      <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <Shield className="h-4 w-4" />
          Kontroladong pag-download
        </p>
        <p className="mt-2">
          Ang bahaging ito ay para sa developer account upang maprotektahan ang sensitibong records at
          mapanatiling malinaw kung sino ang gumawa ng pormal na download.
        </p>
      </div>

      <ExportCenterPanel />
    </div>
  );
}

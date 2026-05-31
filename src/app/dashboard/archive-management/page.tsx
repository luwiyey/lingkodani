"use client";

import * as React from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, Download, Search, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpDialog } from "@/components/ui/help-dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { useToast } from "@/hooks/use-toast";
import {
  buildArchiveRetentionActivityTable,
  buildArchivedFarmersExportTable,
  downloadBlobFile,
  downloadTextFile,
  serializeExportTableToCsv,
} from "@/lib/report-export-center";

export default function ArchiveManagementPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { farmers, auditLogs, updateFarmerStatus, systemSettings, runDataRetentionSweep } = useData();
  const [search, setSearch] = React.useState("");
  const [isExportingPdf, setIsExportingPdf] = React.useState<null | "farmers" | "activity">(null);
  const [isRunningRetention, setIsRunningRetention] = React.useState(false);

  const archivedFarmers = React.useMemo(
    () =>
      farmers
        .filter((farmer) => farmer.status === "archived")
        .sort((left, right) => new Date(right.archivedAt ?? right.registrationDate).getTime() - new Date(left.archivedAt ?? left.registrationDate).getTime()),
    [farmers]
  );

  const filteredArchivedFarmers = React.useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return archivedFarmers;
    }

    return archivedFarmers.filter((farmer) => {
      const haystack = [
        farmer.id,
        farmer.name,
        farmer.phone,
        farmer.barangay,
        farmer.sitio,
        farmer.archiveReason,
        farmer.archivedBy,
        farmer.crops.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [archivedFarmers, search]);

  const retentionActivityLogs = React.useMemo(
    () =>
      auditLogs
        .filter(
          (log) =>
            log.action === "RUN_DATA_RETENTION_SWEEP" ||
            log.action === "ARCHIVE_FARMER" ||
            log.action === "RESTORE_FARMER" ||
            Boolean(log.retentionRedactedAt)
        )
        .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()),
    [auditLogs]
  );

  const archivedFarmersTable = React.useMemo(
    () => buildArchivedFarmersExportTable(filteredArchivedFarmers),
    [filteredArchivedFarmers]
  );
  const retentionActivityTable = React.useMemo(
    () => buildArchiveRetentionActivityTable(retentionActivityLogs),
    [retentionActivityLogs]
  );

  const redactedArchivedCount = archivedFarmers.filter((farmer) => Boolean(farmer.retentionRedactedAt)).length;
  const pendingRedactionCount = archivedFarmers.filter((farmer) => !farmer.retentionRedactedAt).length;

  const handleRestoreFarmer = async (farmerId: string) => {
    const result = await updateFarmerStatus(farmerId, "active");
    if (!result.ok) {
      toast({
        title: "Hindi na-restore ang archived record",
        description: typeof result.error === "string" ? result.error : "Subukang muli pagkatapos ng ilang sandali.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Na-restore ang record",
      description: "Bumalik na sa active roster ang archived farmer record.",
    });
  };

  const handleCsvDownload = (kind: "farmers" | "activity") => {
    const table = kind === "farmers" ? archivedFarmersTable : retentionActivityTable;
    const slug = kind === "farmers" ? "archived-farmers" : "archive-retention-activity";
    downloadTextFile(
      `lingkod-ani-${slug}-${new Date().toISOString().slice(0, 10)}.csv`,
      serializeExportTableToCsv(table),
      "text/csv;charset=utf-8"
    );
    toast({
      title: "Na-download ang CSV",
      description: kind === "farmers" ? "Archived farmer records ang na-export." : "Archive at retention activity ang na-export.",
    });
  };

  const handlePdfDownload = async (kind: "farmers" | "activity") => {
    setIsExportingPdf(kind);
    const table = kind === "farmers" ? archivedFarmersTable : retentionActivityTable;
    const slug = kind === "farmers" ? "archived-farmers" : "archive-retention-activity";

    try {
      const token = currentUser ? await currentUser.getIdToken() : null;
      const response = await fetch("/api/export/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type: "structured-report",
          title: table.title,
          description: table.description,
          timeframe: "Archive and retention workspace",
          generatedAt: new Date().toISOString(),
          columns: table.columns,
          rows: table.rows,
        }),
      });

      if (!response.ok) {
        throw new Error(`Structured PDF export failed with HTTP ${response.status}.`);
      }

      const blob = await response.blob();
      downloadBlobFile(`lingkod-ani-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`, blob);
      toast({
        title: "Na-download ang PDF",
        description: kind === "farmers" ? "Archived farmer records ang na-export." : "Archive at retention activity ang na-export.",
      });
    } catch (error) {
      toast({
        title: "Hindi na-export ang PDF",
        description: error instanceof Error ? error.message : "May problema sa pagbuo ng PDF export.",
        variant: "destructive",
      });
    } finally {
      setIsExportingPdf(null);
    }
  };

  const handleRunRetentionSweep = async () => {
    setIsRunningRetention(true);
    try {
      const result = await runDataRetentionSweep();
      toast({
        title: "Natapos ang data retention sweep",
        description: `${result.redactedAuditLogs} audit log at ${result.redactedArchivedFarmers} archived farmer record ang na-redact.`,
      });
    } catch (error) {
      toast({
        title: "Hindi natapos ang retention sweep",
        description: error instanceof Error ? error.message : "May problema sa pagtakbo ng retention sweep.",
        variant: "destructive",
      });
    } finally {
      setIsRunningRetention(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <div className="flex items-center">
          <Archive className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight">Archive Management</h1>
          <HelpDialog title="Archive Management" tooltipText="Manage archived farmer records and retention activity.">
            <p>
              Ang archive workspace na ito ay para sa superadmin oversight ng long-term records. Hindi permanent deletion
              ang gamit dito. Sa halip, ang archived records ay inaalis lang sa default active views habang nananatiling
              searchable, exportable, at restorable kung kinakailangan.
            </p>
            <p>
              Sa kasalukuyang Lingkod-Ani implementation, ang full soft-archive workflow ay applied sa farmer records.
              Ang iba pang long-term operational history ay available sa audit trail, reports, at export center.
            </p>
          </HelpDialog>
        </div>
        <p className="text-muted-foreground">
          Superadmin workspace para sa archived farmer records, retention activity, restore actions, at archive-related
          exports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Archived Farmers</CardTitle>
            <CardDescription>Mga lumang farmer record na wala na sa active roster.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{archivedFarmers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">PII Redacted</CardTitle>
            <CardDescription>Archived farmers na lampas na sa retention window.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{redactedArchivedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending Redaction</CardTitle>
            <CardDescription>Archived farmers na hindi pa nare-redact.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingRedactionCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Retention Window</CardTitle>
            <CardDescription>Araw bago i-redact ang archived farmer PII.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{systemSettings.retentionPolicy.archivedFarmerRedactionDays}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-base">Archive Controls</CardTitle>
            <CardDescription>
              Maghanap ng archived records, mag-export ng history, o patakbuhin ang retention sweep para sa redaction cycle.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings">Open Settings</Link>
            </Button>
            <Button onClick={() => void handleRunRetentionSweep()} disabled={isRunningRetention}>
              <ShieldAlert className="mr-2 h-4 w-4" />
              {isRunningRetention ? "Running..." : "Run Retention Sweep"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by farmer, phone, crop, archive reason, or ID"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{filteredArchivedFarmers.length} records in view</Badge>
            <Badge variant="outline">{retentionActivityLogs.length} archive/retention log entries</Badge>
            <Badge variant="outline">Historical exports for SMS, vouchers, inventory, and prices are in Export Center</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Archived Farmer Records</CardTitle>
              <CardDescription>
                Searchable archive ng farmer records. Ang redacted entries ay hindi na maaaring i-restore sa active roster.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handleCsvDownload("farmers")}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
              <Button size="sm" onClick={() => void handlePdfDownload("farmers")} disabled={isExportingPdf === "farmers"}>
                <Download className="mr-2 h-4 w-4" />
                {isExportingPdf === "farmers" ? "Preparing PDF..." : "Download PDF"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredArchivedFarmers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Wala pang archived farmer records na tugma sa filter.</p>
            ) : (
              filteredArchivedFarmers.map((farmer) => (
                <div key={farmer.id} className="rounded-xl border bg-background/90 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{farmer.name}</p>
                        <Badge variant="secondary">archived</Badge>
                        {farmer.retentionRedactedAt ? <Badge variant="outline">PII redacted</Badge> : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {farmer.phone} · {farmer.sitio}, {farmer.barangay}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Crops: {farmer.crops.join(", ") || "N/A"} {farmer.archiveReason ? `· ${farmer.archiveReason}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Archived {farmer.archivedAt ? new Date(farmer.archivedAt).toLocaleString() : "recently"}
                        {farmer.archivedBy ? ` by ${farmer.archivedBy}` : ""}
                      </p>
                      {farmer.retentionRedactedAt ? (
                        <p className="text-xs text-muted-foreground">
                          PII redacted {new Date(farmer.retentionRedactedAt).toLocaleString()}
                          {farmer.retentionRedactionReason ? ` · ${farmer.retentionRedactionReason}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleRestoreFarmer(farmer.id)}
                      disabled={Boolean(farmer.retentionRedactedAt)}
                    >
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      Restore
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Archive and Retention Activity</CardTitle>
              <CardDescription>
                Audit trail para sa archive actions, restore actions, at retention sweeps.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => handleCsvDownload("activity")}>
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </Button>
              <Button size="sm" onClick={() => void handlePdfDownload("activity")} disabled={isExportingPdf === "activity"}>
                <Download className="mr-2 h-4 w-4" />
                {isExportingPdf === "activity" ? "Preparing PDF..." : "Download PDF"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {retentionActivityLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Wala pang archive o retention activity logs sa ngayon.</p>
            ) : (
              retentionActivityLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="rounded-xl border bg-background/90 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{log.action}</p>
                    <Badge variant="outline">{log.user}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{log.details}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                  {log.retentionRedactedAt ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Retention redacted at {new Date(log.retentionRedactedAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

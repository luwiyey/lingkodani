"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, RefreshCcw } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { useToast } from "@/hooks/use-toast";
import { useRuntimeCapabilities } from "@/hooks/use-runtime-capabilities";
import { useRuntimeHealth } from "@/hooks/use-runtime-health";
import { canAccessDataCenter } from "@/lib/access-control";
import { isLiveMode } from "@/lib/config/app-mode";
import type { RuntimeHealthStatus } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type AutomationTarget = "overdue" | "followup" | "retention";

function formatRuntimeTimestamp(value?: string | null) {
  if (!value) {
    return "Wala pang activity";
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatDeliveryState(value?: string | null) {
  switch (value) {
    case "delivered":
      return "Na-deliver";
    case "failed":
      return "Hindi naipadala";
    case "awaiting_receipt":
      return "Naghihintay ng delivery receipt";
    case "queued":
      return "Nakapila";
    case "sent":
      return "Naipadala";
    default:
      return value ?? "Wala pang activity";
  }
}

function describeHealth(status?: RuntimeHealthStatus | null) {
  switch (status) {
    case "ok":
      return "Maayos";
    case "warn":
      return "May kailangang bantayan";
    case "error":
      return "May problema";
    default:
      return "Wala pang activity";
  }
}

function statusTone(status: "ok" | "warn" | "error" | "idle") {
  switch (status) {
    case "ok":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "warn":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function buildCapabilityState(isReady: boolean) {
  return isReady
    ? { label: "Handa", tone: "ok" as const }
    : { label: "Hindi pa handa", tone: "warn" as const };
}

function DetailList({
  items,
}: {
  items: Array<{ label: string; value: ReactNode }>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border bg-background/70 p-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {item.label}
          </p>
          <div className="mt-2 text-sm text-foreground">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export function SystemStatusPanel() {
  const { toast } = useToast();
  const { currentUser, currentUserProfile } = useAuth();
  const { runDataRetentionSweep } = useData();
  const { capabilities, capabilitiesLoading } = useRuntimeCapabilities();
  const { runtimeHealth, runtimeHealthLoading } = useRuntimeHealth();
  const [runningAutomation, setRunningAutomation] = useState<AutomationTarget | null>(null);

  const canOpenDataCenter = canAccessDataCenter(currentUserProfile);
  const loading = capabilitiesLoading || runtimeHealthLoading;
  const overdueHealth = runtimeHealth.records.find((record) => record.id === "automation_overdue");
  const followUpHealth = runtimeHealth.records.find((record) => record.id === "automation_followups");
  const inviteEmailHealth = runtimeHealth.records.find((record) => record.id === "invite_email");
  const mobilePushHealth = runtimeHealth.records.find((record) => record.id === "mobile_push");
  const retentionHealth = runtimeHealth.records.find((record) => record.id === "data_retention");
  const outboundSummary = runtimeHealth.outboundDeliverySummary;
  const outboundAttentionItems = runtimeHealth.outboundAttentionItems;

  const smsCapability = buildCapabilityState(capabilities.liveSmsConfigured);
  const aiCapability = buildCapabilityState(capabilities.aiConfigured);
  const uploadCapability = buildCapabilityState(capabilities.storageUploadConfigured);
  const inviteCapability = buildCapabilityState(capabilities.inviteEmailConfigured);
  const pushCapability = buildCapabilityState(capabilities.mobilePushConfigured);
  const automationStatus =
    runtimeHealth.latestAutomationFailure?.status === "error"
      ? { label: "May problema", tone: "error" as const }
      : runtimeHealth.latestAutomationFailure?.status === "warn"
        ? { label: "May kailangang bantayan", tone: "warn" as const }
        : { label: isLiveMode ? "Nakaantabay" : "Demo / mano-mano", tone: "ok" as const };

  const priorityItems: string[] = [];

  if (!capabilities.liveSmsConfigured) {
    priorityItems.push("Tapusin ang SMS provider setup bago umasa sa totoong mensahe mula sa mga magsasaka.");
  }

  if (runtimeHealth.latestFailure?.lastError) {
    priorityItems.push(
      `May huling isyu sa ${runtimeHealth.latestFailure.label}. Tingnan ang technical details para sa error at susunod na aksyon.`
    );
  }

  if (outboundSummary.needsAttentionCount > 0) {
    priorityItems.push(
      `${outboundSummary.needsAttentionCount} recent outbound SMS ang nangangailangan ng manual review o follow-up.`
    );
  }

  if (!capabilities.inviteEmailConfigured) {
    priorityItems.push("Kung gusto ng mas ligtas na onboarding ng staff, i-set up ang automatic invite email.");
  }

  if (!capabilities.mobilePushConfigured) {
    priorityItems.push("Kung gagamitin ang mobile app sa field, tapusin ang Firebase mobile push setup.");
  }

  if (priorityItems.length === 0) {
    priorityItems.push("Maayos ang pangunahing live features ngayon. Bantayan na lang ang bagong SMS, alerts, at training review queue.");
  }

  const runAutomation = async (target: AutomationTarget) => {
    if (target === "retention" && !isLiveMode) {
      const result = await runDataRetentionSweep();
      toast({
        title: "Natapos ang data retention sweep",
        description: `${result.redactedAuditLogs} audit log at ${result.redactedArchivedFarmers} archived farmer record ang na-redact sa kasalukuyang local dataset.`,
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Walang live session",
        description: "Mag-sign in muna sa live account bago magpatakbo ng live automation.",
        variant: "destructive",
      });
      return;
    }

    setRunningAutomation(target);

    try {
      const token = await currentUser.getIdToken();
      const path =
        target === "overdue"
          ? "/api/system/process-overdue-sms"
          : target === "followup"
            ? "/api/system/process-follow-ups"
            : "/api/system/process-data-retention";
      const response = await fetch(path, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string" ? payload.error : "Hindi natapos ang automation run."
        );
      }

      toast({
        title:
          target === "overdue"
            ? "Natapos ang overdue SMS check"
            : target === "followup"
              ? "Natapos ang follow-up check"
              : "Natapos ang data retention sweep",
        description: payload.skipped
          ? "May kasalukuyang automation run na isinasagawa sa ibang session."
          : target === "retention"
            ? `${payload.redactedAuditLogs ?? 0} audit log at ${payload.redactedArchivedFarmers ?? 0} archived farmer record ang na-redact.`
            : `${payload.processedCount ?? 0} item ang naproseso sa batch na ito.`,
      });
    } catch (error) {
      toast({
        title: "Hindi natapos ang automation run",
        description: error instanceof Error ? error.message : "Subukan muli pagkatapos ng ilang sandali.",
        variant: "destructive",
      });
    } finally {
      setRunningAutomation(null);
    }
  };

  const summaryCards = [
    {
      title: "SMS para sa magsasaka",
      status: smsCapability.label,
      tone: smsCapability.tone,
      detail:
        capabilities.reasons.liveSms ??
        "Tumatanggap at nagpapadala ng live SMS ang system kapag kumpleto ang provider setup.",
    },
    {
      title: "AI Assistant",
      status: aiCapability.label,
      tone: aiCapability.tone,
      detail:
        capabilities.reasons.ai ??
        "Handa ang AI assistance, pero kailangan pa ring bantayan ang fallback at human review sa sensitibong kaso.",
    },
    {
      title: "File uploads",
      status: uploadCapability.label,
      tone: uploadCapability.tone,
      detail:
        capabilities.reasons.storageUpload ??
        "Puwede ang document, larawan, at audio uploads para sa case evidence at knowledge files.",
    },
    {
      title: "Setup link ng staff",
      status: inviteCapability.label,
      tone: inviteCapability.tone,
      detail:
        capabilities.inviteEmailConfigured
          ? "Awtomatikong naie-email ang secure setup link sa bagong staff accounts."
          : capabilities.reasons.inviteEmail,
    },
    {
      title: "Abiso sa mobile",
      status: pushCapability.label,
      tone: pushCapability.tone,
      detail:
        capabilities.mobilePushConfigured
          ? "Puwedeng magpadala ng Android push alerts para sa urgent cases."
          : capabilities.reasons.mobilePush,
    },
    {
      title: "Araw-araw na automation",
      status: automationStatus.label,
      tone: automationStatus.tone,
      detail:
        capabilities.mode === "live"
          ? "Ito ang batch checks para sa overdue SMS, follow-up, at retention sweeps sa live setup."
          : "Sa demo preview, mano-manong sinusubok ang technical batch checks at maaaring walang live diagnostics.",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Katayuan ng System</h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            Hiwalay ito sa mga setting ng barangay para mas madaling makita kung alin ang handa, alin ang may dapat bantayan,
            at alin ang technical details lamang para sa admin o developer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings">
              Buksan ang Mga Setting ng Brgy.
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          {canOpenDataCenter ? (
            <Button variant="outline" asChild>
              <Link href="/dashboard/data-center">Buksan ang Data Center</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <CardTitle>Malinaw na Buod</CardTitle>
              <CardDescription>
                Tingnan muna ang mga card na ito. Kapag may kailangang ayusin, nasa ibaba ang susunod na hakbang at technical details.
              </CardDescription>
            </div>
            <Badge variant="outline">{loading ? "Sinusuri..." : "Na-refresh"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.title} className="rounded-xl border bg-background/90 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{card.title}</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{card.status}</p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusTone(card.tone)}`}
                >
                  {card.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.detail}</p>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-2 border-t pt-4 text-sm text-muted-foreground">
          <p>Bersyon ng app: <span className="font-medium text-foreground">{capabilities.appVersion ?? "0.1.0"}</span></p>
          <p>Commit / build: <span className="font-medium text-foreground">{capabilities.buildCommit ?? "local"}</span></p>
        </CardFooter>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Huling Galaw ng System</CardTitle>
            <CardDescription>
              Ito ang pinakahuling activity na nakikita ng system para sa inbound SMS, outbound delivery, at background jobs.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Huling natanggap na SMS</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {runtimeHealth.latestInbound
                  ? `${runtimeHealth.latestInbound.farmerName || "Hindi kilala"} - ${runtimeHealth.latestInbound.messagePreview}`
                  : "Wala pang natatanggap na live SMS sa kasalukuyang status view."}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Oras: {formatRuntimeTimestamp(runtimeHealth.latestInbound?.timestamp)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Huling outbound SMS</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {runtimeHealth.latestOutbound
                  ? `${runtimeHealth.latestOutbound.purpose} para sa ${runtimeHealth.latestOutbound.audience}`
                  : "Wala pang live outbound SMS na nakikita sa status view."}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Delivery: {formatDeliveryState(runtimeHealth.latestOutbound?.status)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Huling delivery receipt</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {runtimeHealth.latestDeliveredOutbound
                  ? `${runtimeHealth.latestDeliveredOutbound.purpose} papunta sa ${runtimeHealth.latestDeliveredOutbound.recipientPhone}`
                  : "Wala pang confirmed delivered outbound sa kasalukuyang watch."}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Na-deliver: {formatRuntimeTimestamp(
                  runtimeHealth.latestDeliveredOutbound?.deliveryReceivedAt ??
                    runtimeHealth.latestDeliveredOutbound?.lastStatusAt
                )}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Huling batch status</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Overdue SMS: {describeHealth(overdueHealth?.status)} | Follow-up: {describeHealth(followUpHealth?.status)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Huling automation issue: {runtimeHealth.latestAutomationFailure?.label ?? "Wala pang failure"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ano ang Dapat Unahin</CardTitle>
            <CardDescription>
              Simpleng gabay kung ano ang susunod na dapat tingnan o ayusin para manatiling dependable ang app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityItems.map((item, index) => (
              <div key={`${index}-${item}`} className="rounded-lg border bg-background/80 p-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{index + 1}.</span>{" "}
                {item}
              </div>
            ))}
            {capabilities.knownBuildWarnings.length > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <span className="font-medium">Build note:</span> {capabilities.knownBuildWarnings[0]}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mga Mano-manong Aksyon</CardTitle>
          <CardDescription>
            Gamitin ito kung kailangan mong pilitin ang isang batch check agad, lalo na kapag testing, follow-up debugging, o may kailangang emergency rerun.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
            {isLiveMode ? (
              <p>
                Sa live mode, puwede mong patakbuhin dito ang overdue SMS, follow-up, at retention sweeps. Kung demo preview lang ang gamit,
                normal lang na may ilang live diagnostics na walang laman.
              </p>
            ) : (
              <p>
                Demo preview ito. Puwede mong subukan ang data retention sweep, pero ang live SMS at live follow-up jobs ay nangangailangan ng totoong live session.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
            {isLiveMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => void runAutomation("overdue")}
                  disabled={runningAutomation !== null}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {runningAutomation === "overdue" ? "Pinoproseso ang overdue SMS..." : "Patakbuhin ang Overdue SMS Check"}
                </Button>
                <Button
                  onClick={() => void runAutomation("followup")}
                  disabled={runningAutomation !== null}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {runningAutomation === "followup" ? "Pinoproseso ang follow-up..." : "Patakbuhin ang Follow-up Check"}
                </Button>
              </>
            ) : null}
            <Button
              variant={isLiveMode ? "secondary" : "default"}
              onClick={() => void runAutomation("retention")}
              disabled={runningAutomation !== null}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {runningAutomation === "retention" ? "Pinoproseso ang retention..." : "Patakbuhin ang Data Retention Sweep"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Accordion type="multiple" className="space-y-4">
        <AccordionItem value="build-setup" className="rounded-xl border px-4">
          <AccordionTrigger className="text-left">Build at Setup Details</AccordionTrigger>
          <AccordionContent className="pb-4">
            <DetailList
              items={[
                { label: "App version", value: capabilities.appVersion ?? "0.1.0" },
                { label: "Commit / build", value: capabilities.buildCommit ?? "local" },
                { label: "AI Assistant", value: capabilities.aiConfigured ? "Configured / handa" : "Naka-lock muna" },
                { label: "Live SMS", value: capabilities.liveSmsConfigured ? "Handa" : "Hindi pa handa" },
                { label: "Live SMS test mode", value: capabilities.liveSmsTestModeEnabled ? "Naka-on" : "Naka-off muna" },
                { label: "Invite email", value: capabilities.inviteEmailConfigured ? "Automatic" : "Manual fallback" },
                { label: "Mobile push", value: capabilities.mobilePushConfigured ? "Handa" : "Hindi pa naka-set up" },
                { label: "Firebase Admin", value: capabilities.firebaseAdminConfigured ? "Handa" : "Hindi pa handa" },
                { label: "Uploads", value: capabilities.storageUploadConfigured ? "Handa" : "Naka-lock muna" },
                { label: "Automation mode", value: capabilities.automationMode ?? "Manual / local only" },
              ]}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="watch" className="rounded-xl border px-4">
          <AccordionTrigger className="text-left">Operations Watch</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <DetailList
              items={[
                { label: "Last failed subsystem", value: runtimeHealth.latestFailure?.label ?? "Wala pa" },
                {
                  label: "Failure time",
                  value: formatRuntimeTimestamp(
                    runtimeHealth.latestFailure?.lastFailureAt ?? runtimeHealth.latestFailure?.updatedAt
                  ),
                },
                {
                  label: "Last automation failure",
                  value: runtimeHealth.latestAutomationFailure?.label ?? "Wala pa",
                },
                {
                  label: "Automation failure time",
                  value: formatRuntimeTimestamp(
                    runtimeHealth.latestAutomationFailure?.lastFailureAt ??
                      runtimeHealth.latestAutomationFailure?.updatedAt
                  ),
                },
                {
                  label: "Last inbound farmer",
                  value: runtimeHealth.latestInbound?.farmerName ?? "Wala pa",
                },
                {
                  label: "Outbound needing attention",
                  value: `${outboundSummary.needsAttentionCount} / ${outboundSummary.recentCount}`,
                },
              ]}
            />
            {runtimeHealth.latestFailure?.lastError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <span className="font-medium">Last error:</span> {runtimeHealth.latestFailure.lastError}
              </div>
            ) : null}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="messaging" className="rounded-xl border px-4">
          <AccordionTrigger className="text-left">SMS, Delivery, at Webhook Details</AccordionTrigger>
          <AccordionContent className="space-y-4 pb-4">
            <DetailList
              items={[
                {
                  label: "Inbound SMS",
                  value: (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Huling event: {formatRuntimeTimestamp(runtimeHealth.latestInbound?.timestamp)}</p>
                      <p>Case: {runtimeHealth.latestInbound?.caseId ?? "Wala pa"}</p>
                      <p>Source: {runtimeHealth.latestInbound?.sourceProvider ?? "Wala pa"}</p>
                      <p>Preview: {runtimeHealth.latestInbound?.messagePreview ?? "Wala pa"}</p>
                    </div>
                  ),
                },
                {
                  label: "Outbound SMS",
                  value: (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Status: {runtimeHealth.latestOutbound?.status ?? "Wala pa"}</p>
                      <p>Purpose: {runtimeHealth.latestOutbound?.purpose ?? "Wala pa"}</p>
                      <p>Audience: {runtimeHealth.latestOutbound?.audience ?? "Wala pa"}</p>
                      <p>Priority: {runtimeHealth.latestOutbound?.queuePriorityLabel ?? "Wala pa"}</p>
                      <p>Delivered at: {formatRuntimeTimestamp(runtimeHealth.latestOutbound?.deliveryReceivedAt)}</p>
                    </div>
                  ),
                },
                {
                  label: "Outbound webhook",
                  value: (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Status: {runtimeHealth.latestWebhook?.status ?? "Wala pa"}</p>
                      <p>Huling event: {formatRuntimeTimestamp(runtimeHealth.latestWebhook?.updatedAt)}</p>
                      <p>Provider message ID: {String(runtimeHealth.latestWebhook?.meta?.providerMessageId ?? "Wala pa")}</p>
                      <p>Outbound ID: {String(runtimeHealth.latestWebhook?.meta?.outboundId ?? "Wala pa")}</p>
                    </div>
                  ),
                },
                {
                  label: "Delivery watch",
                  value: (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Delivered: {outboundSummary.deliveredCount}</p>
                      <p>Awaiting receipt: {outboundSummary.awaitingReceiptCount}</p>
                      <p>Queued: {outboundSummary.queuedCount}</p>
                      <p>Failed: {outboundSummary.failedCount}</p>
                    </div>
                  ),
                },
              ]}
            />
            {outboundAttentionItems.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Recent outbound na dapat tingnan</p>
                {outboundAttentionItems.map((item) => (
                  <div key={item.id} className="rounded-lg border bg-background/70 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{formatDeliveryState(item.deliveryState)}</Badge>
                      <Badge variant="outline">{item.purpose}</Badge>
                      <Badge variant="outline">{item.audience}</Badge>
                      {item.queuePriorityLabel ? <Badge variant="outline">{item.queuePriorityLabel}</Badge> : null}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Recipient: {item.recipientPhone} | Provider: {item.provider}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last status: {formatRuntimeTimestamp(item.lastStatusAt)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reason: {item.attentionReason ?? item.errorMessage ?? "Needs manual review"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Walang recent outbound messages na nangangailangan ng manual attention ngayon.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="channels" className="rounded-xl border px-4">
          <AccordionTrigger className="text-left">Invite Email, Mobile Push, at Data Retention</AccordionTrigger>
          <AccordionContent className="pb-4">
            <DetailList
              items={[
                {
                  label: "Invite email",
                  value: (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Status: {describeHealth(inviteEmailHealth?.status)}</p>
                      <p>Huling success: {formatRuntimeTimestamp(inviteEmailHealth?.lastSuccessAt)}</p>
                      <p>Huling failure: {formatRuntimeTimestamp(inviteEmailHealth?.lastFailureAt)}</p>
                      <p>Provider: {String(inviteEmailHealth?.meta?.provider ?? "Wala pa")}</p>
                    </div>
                  ),
                },
                {
                  label: "Mobile push",
                  value: (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Status: {describeHealth(mobilePushHealth?.status)}</p>
                      <p>Huling success: {formatRuntimeTimestamp(mobilePushHealth?.lastSuccessAt)}</p>
                      <p>Huling failure: {formatRuntimeTimestamp(mobilePushHealth?.lastFailureAt)}</p>
                      <p>Huling case: {String(runtimeHealth.latestPush?.meta?.caseId ?? "Wala pa")}</p>
                    </div>
                  ),
                },
                {
                  label: "Data retention",
                  value: (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Status: {describeHealth(retentionHealth?.status)}</p>
                      <p>Huling run: {formatRuntimeTimestamp(retentionHealth?.updatedAt)}</p>
                      <p>Audit logs redacted: {String(retentionHealth?.meta?.redactedAuditLogs ?? 0)}</p>
                      <p>Archived farmers redacted: {String(retentionHealth?.meta?.redactedArchivedFarmers ?? 0)}</p>
                    </div>
                  ),
                },
              ]}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

import { getEffectiveSmsCaseOutcome } from "@/lib/sms-case-outcomes";
import { normalizeSmsMessage } from "@/lib/sms-normalization";
import type { AuditLog, Farmer, MarketPriceEntry, Resource, SmsMessage, Voucher } from "@/lib/types";

const REPORT_STOP_WORDS = new Set([
  "ang",
  "ng",
  "sa",
  "at",
  "po",
  "ako",
  "kami",
  "kayo",
  "ito",
  "iyan",
  "namin",
  "para",
  "mga",
  "lang",
  "nang",
  "this",
  "that",
  "with",
  "from",
  "your",
  "have",
  "please",
  "help",
  "the",
  "and",
  "for",
  "are",
  "you",
]);

export type ReportExportPreset = "today" | "this_week" | "this_month" | "custom";
export type ReportExportMode = "preset" | "specific_date" | "date_range";

export type ReportExportFilter = {
  mode: ReportExportMode;
  preset: ReportExportPreset;
  specificDate: string;
  rangeStart: string;
  rangeEnd: string;
};

export type ResolvedReportExportWindow = {
  start: Date;
  end: Date;
  label: string;
  fileLabel: string;
};

export type ExportTable = {
  title: string;
  description: string;
  columns: string[];
  rows: string[][];
};

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseInputDate(value: string, endOfRange = false) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  if (endOfRange) {
    parsed.setHours(23, 59, 59, 999);
  } else {
    parsed.setHours(0, 0, 0, 0);
  }

  return parsed;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function toDisplayDate(date: Date) {
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fileSafeDate(date: Date) {
  return formatDateInput(date);
}

function normalizeCell(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function escapeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function formatIntentLabel(value?: SmsMessage["parsedIntent"]) {
  switch (value) {
    case "PEST_DISEASE":
      return "Pest / Disease";
    case "REQUEST":
      return "Request";
    case "EMERGENCY":
      return "Emergency";
    case "PRICE_CHECK":
      return "Price Check";
    case "REGISTER":
      return "Registration";
    case "WEATHER_HELP":
      return "Weather / Water";
    case "HARVEST":
      return "Harvest";
    case "CROP_UPDATE":
      return "Crop Update";
    default:
      return "Unknown";
  }
}

function tokenizeMessages(messages: SmsMessage[]) {
  return messages
    .flatMap((message) =>
      normalizeSmsMessage(message.message)
        .normalizedMessage.toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
    )
    .filter((token) => token.length >= 3 && !REPORT_STOP_WORDS.has(token));
}

export function createDefaultReportExportFilter(now = new Date()): ReportExportFilter {
  const today = formatDateInput(now);
  return {
    mode: "preset",
    preset: "today",
    specificDate: today,
    rangeStart: today,
    rangeEnd: today,
  };
}

export function resolveReportExportWindow(
  filter: ReportExportFilter,
  now = new Date()
): ResolvedReportExportWindow {
  const today = new Date(now);
  today.setHours(23, 59, 59, 999);

  if (filter.mode === "specific_date") {
    const start = parseInputDate(filter.specificDate) ?? new Date(now);
    const end = parseInputDate(filter.specificDate, true) ?? new Date(now);
    return {
      start,
      end,
      label: `Specific Date: ${toDisplayDate(start)}`,
      fileLabel: fileSafeDate(start),
    };
  }

  if (filter.mode === "date_range") {
    const parsedStart = parseInputDate(filter.rangeStart) ?? startOfWeek(now);
    const parsedEnd = parseInputDate(filter.rangeEnd, true) ?? today;
    const start = parsedStart.getTime() <= parsedEnd.getTime() ? parsedStart : parsedEnd;
    const end = parsedEnd.getTime() >= parsedStart.getTime() ? parsedEnd : parsedStart;
    return {
      start,
      end,
      label: `From ${toDisplayDate(start)} to ${toDisplayDate(end)}`,
      fileLabel: `${fileSafeDate(start)}_to_${fileSafeDate(end)}`,
    };
  }

  if (filter.preset === "this_week") {
    const start = startOfWeek(now);
    return {
      start,
      end: today,
      label: `This Week (${toDisplayDate(start)} to ${toDisplayDate(today)})`,
      fileLabel: `${fileSafeDate(start)}_to_${fileSafeDate(today)}`,
    };
  }

  if (filter.preset === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return {
      start,
      end: today,
      label: `This Month (${now.toLocaleDateString("en-PH", {
        month: "long",
        year: "numeric",
      })})`,
      fileLabel: `${fileSafeDate(start)}_to_${fileSafeDate(today)}`,
    };
  }

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return {
    start,
    end: today,
    label: `Today (${toDisplayDate(start)})`,
    fileLabel: fileSafeDate(start),
  };
}

export function filterItemsByReportWindow<T>(
  items: T[],
  getTimestamp: (item: T) => string | undefined,
  filter: ReportExportFilter,
  now = new Date()
) {
  const window = resolveReportExportWindow(filter, now);
  const start = window.start.getTime();
  const end = window.end.getTime();

  return items.filter((item) => {
    const value = getTimestamp(item);
    if (!value) {
      return false;
    }

    const timestamp = new Date(value).getTime();
    return !Number.isNaN(timestamp) && timestamp >= start && timestamp <= end;
  });
}

export function serializeExportTableToCsv(table: ExportTable) {
  return [table.columns, ...table.rows]
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

export function buildSmsCasesExportTable(messages: SmsMessage[]) {
  return {
    title: "SMS Cases",
    description: "Inbound SMS cases filtered by the selected report date window.",
    columns: [
      "Case ID",
      "Timestamp",
      "Farmer",
      "Phone",
      "Concern Category",
      "Urgency",
      "Safety",
      "Case Status",
      "Assigned To",
      "Resolution Status",
      "Message",
    ],
    rows: messages.map((message) => [
      message.caseId ?? message.id,
      message.timestamp,
      message.farmerName,
      message.phone,
      formatIntentLabel(message.parsedIntent),
      message.urgency ?? "N/A",
      message.safetyFlag ?? "N/A",
      message.caseStatus ?? message.status ?? "open",
      message.assignedTo ?? "Unassigned",
      getEffectiveSmsCaseOutcome(message) ?? "pending",
      message.message,
    ]),
  } satisfies ExportTable;
}

export function buildFarmerRegistrationsExportTable(farmers: Farmer[]) {
  return {
    title: "Farmer Registrations",
    description: "Farmer records filtered by registration date.",
    columns: [
      "Farmer ID",
      "Registration Date",
      "Name",
      "Phone",
      "Barangay",
      "Sitio",
      "Primary Crops",
      "Farm Size",
      "Status",
    ],
    rows: farmers.map((farmer) => [
      farmer.id,
      farmer.registrationDate,
      farmer.name,
      farmer.phone,
      farmer.barangay,
      farmer.sitio,
      farmer.crops.join(", "),
      farmer.farmSize ? String(farmer.farmSize) : "N/A",
      farmer.status,
    ]),
  } satisfies ExportTable;
}

export function buildFarmerDemographicsExportTable(farmers: Farmer[]) {
  return {
    title: "Farmer Demographics",
    description: "Farmer demographic records filtered by the selected report date window.",
    columns: [
      "Farmer ID",
      "Registration Date",
      "Name",
      "Age",
      "Gender",
      "Phone",
      "Barangay",
      "Sitio",
      "Farm Size (ha)",
      "Primary Crops",
      "Last SMS Activity",
      "Profile Source",
      "Status",
    ],
    rows: farmers.map((farmer) => [
      farmer.id,
      farmer.registrationDate,
      farmer.name,
      Number.isFinite(farmer.age) && farmer.age > 0 ? String(farmer.age) : "N/A",
      farmer.gender || "N/A",
      farmer.phone,
      farmer.barangay,
      farmer.sitio || "N/A",
      Number.isFinite(farmer.farmSize) && farmer.farmSize > 0 ? String(farmer.farmSize) : "N/A",
      farmer.crops.join(", "),
      farmer.lastSmsActivity,
      farmer.profileSource ?? "N/A",
      farmer.status,
    ]),
  } satisfies ExportTable;
}

export function buildVoucherTransactionsExportTable(
  vouchers: Voucher[],
  farmers: Farmer[],
  resources: Resource[]
) {
  const farmerMap = new Map(farmers.map((farmer) => [farmer.id, farmer]));
  const resourceMap = new Map(resources.map((resource) => [resource.id, resource]));

  return {
    title: "Voucher Transactions",
    description: "Voucher issuance and redemption records filtered by issue date.",
    columns: [
      "Voucher ID",
      "Issued At",
      "Redeemed At",
      "Farmer",
      "Phone",
      "Resource",
      "Quantity",
      "Code",
      "Status",
    ],
    rows: vouchers.map((voucher) => {
      const farmer = farmerMap.get(voucher.farmerId);
      const resource = resourceMap.get(voucher.resourceId);
      return [
        voucher.id,
        voucher.issueDate,
        voucher.redemptionDate ?? "Pending",
        farmer?.name ?? voucher.farmerId,
        farmer?.phone ?? "N/A",
        resource?.name ?? voucher.resourceId,
        String(voucher.quantity),
        voucher.code,
        voucher.status,
      ];
    }),
  } satisfies ExportTable;
}

export function buildInventoryUpdatesExportTable(resources: Resource[]) {
  return {
    title: "Inventory Updates",
    description: "Current inventory records using each resource's last updated timestamp.",
    columns: [
      "Resource ID",
      "Last Updated",
      "Resource Name",
      "Category",
      "Group",
      "Stock",
      "Unit",
      "Intended Use",
    ],
    rows: resources.map((resource) => [
      resource.id,
      resource.lastUpdated,
      resource.name,
      resource.category,
      resource.inventoryGroup ?? "N/A",
      String(resource.stock),
      resource.unit,
      resource.intendedUse ?? "N/A",
    ]),
  } satisfies ExportTable;
}

export function buildPriceWatchExportTable(entries: MarketPriceEntry[]) {
  return {
    title: "Price Watch Updates",
    description: "Price watch records filtered by the selected report date window.",
    columns: [
      "Entry ID",
      "Updated At",
      "Crop",
      "Price",
      "Unit",
      "Trend",
      "Source",
    ],
    rows: entries.map((entry) => [
      entry.id,
      entry.updatedAt,
      entry.crop,
      String(entry.price),
      entry.unit,
      entry.trend,
      entry.source,
    ]),
  } satisfies ExportTable;
}

export function buildAiAnalyticsExportTable(messages: SmsMessage[]) {
  const intentCounts = new Map<string, number>();
  const urgencyCounts = new Map<string, number>();
  const safetyCounts = new Map<string, number>();

  for (const message of messages) {
    const intent = formatIntentLabel(message.parsedIntent);
    intentCounts.set(intent, (intentCounts.get(intent) ?? 0) + 1);

    const urgency = message.urgency ?? "N/A";
    urgencyCounts.set(urgency, (urgencyCounts.get(urgency) ?? 0) + 1);

    const safety = message.safetyFlag ?? "N/A";
    safetyCounts.set(safety, (safetyCounts.get(safety) ?? 0) + 1);
  }

  const keywordCounter = new Map<string, number>();
  for (const token of tokenizeMessages(messages)) {
    keywordCounter.set(token, (keywordCounter.get(token) ?? 0) + 1);
  }

  const topKeywords = [...keywordCounter.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([keyword, count]) => `${keyword} (${count})`)
    .join(", ");

  const rows: string[][] = [
    ["Total filtered SMS cases", String(messages.length), "All inbound SMS records within the selected window."],
    [
      "High-priority cases",
      String(messages.filter((message) => message.urgency === "high" || message.safetyFlag === "High").length),
      "Messages tagged as high urgency or high safety concern.",
    ],
    [
      "Awaiting farmer confirmation",
      String(messages.filter((message) => message.resolutionConfirmationStatus === "awaiting_farmer").length),
      "Closed cases still waiting for farmer confirmation.",
    ],
    [
      "Top keywords",
      topKeywords || "N/A",
      "Most repeated normalized keywords from the filtered SMS text.",
    ],
  ];

  [...intentCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .forEach(([intent, count]) => {
      rows.push([`Concern category: ${intent}`, String(count), "Count of filtered messages under this concern category."]);
    });

  [...urgencyCounts.entries()].forEach(([urgency, count]) => {
    rows.push([`Urgency: ${urgency}`, String(count), "Filtered message count by urgency level."]);
  });

  [...safetyCounts.entries()].forEach(([safety, count]) => {
    rows.push([`Safety flag: ${safety}`, String(count), "Filtered message count by safety flag."]);
  });

  return {
    title: "AI Analytics Summary",
    description: "Concern categories, urgency patterns, and keyword summaries generated from filtered SMS cases.",
    columns: ["Metric", "Value", "Notes"],
    rows,
  } satisfies ExportTable;
}

export function buildArchivedFarmersExportTable(farmers: Farmer[]) {
  return {
    title: "Archived Farmer Records",
    description: "Archived farmer records, including archive reason and retention-redaction status.",
    columns: [
      "Farmer ID",
      "Name",
      "Phone",
      "Barangay",
      "Sitio",
      "Crops",
      "Archived At",
      "Archived By",
      "Archive Reason",
      "Retention Redacted At",
      "Retention Reason",
    ],
    rows: farmers.map((farmer) => [
      farmer.id,
      farmer.name,
      farmer.phone,
      farmer.barangay,
      farmer.sitio,
      farmer.crops.join(", "),
      farmer.archivedAt ?? "N/A",
      farmer.archivedBy ?? "N/A",
      farmer.archiveReason ?? "N/A",
      farmer.retentionRedactedAt ?? "N/A",
      farmer.retentionRedactionReason ?? "N/A",
    ]),
  } satisfies ExportTable;
}

export function buildArchiveRetentionActivityTable(logs: AuditLog[]) {
  return {
    title: "Archive and Retention Activity",
    description: "Audit entries related to archive actions and retention sweeps.",
    columns: ["Timestamp", "Actor", "Action", "Details", "Retention Redacted At"],
    rows: logs.map((log) => [
      log.timestamp,
      log.user,
      log.action,
      log.details,
      log.retentionRedactedAt ?? "N/A",
    ]),
  } satisfies ExportTable;
}

export function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadBlobFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildStructuredReportPrintHtml(table: ExportTable, label: string) {
  const escapedTitle = normalizeCell(table.title)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const escapedDescription = normalizeCell(table.description)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const rows = table.rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${normalizeCell(cell).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`)
          .join("")}</tr>`
    )
    .join("");
  const headers = table.columns.map((column) => `<th>${column}</th>`).join("");

  return `
    <!doctype html>
    <html>
      <head>
        <title>${escapedTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
          h1 { margin: 0 0 4px; font-size: 24px; }
          .meta { color: #4b5563; margin-bottom: 18px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h1>${escapedTitle}</h1>
        <div class="meta">Filter: ${label}</div>
        <p>${escapedDescription}</p>
        <table>
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
}

export function openStructuredReportPrintView(table: ExportTable, label: string) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1024,height=720");
  if (!printWindow) {
    return false;
  }

  printWindow.document.write(buildStructuredReportPrintHtml(table, label));
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
  return true;
}

export function toSummaryMetricRows(metrics: Array<{ metric: string; value: string; notes?: string }>) {
  return metrics.map((entry) => [entry.metric, entry.value, entry.notes ?? ""]);
}

export function buildSummaryMetricsCsv(
  title: string,
  description: string,
  metrics: Array<{ metric: string; value: string; notes?: string }>
) {
  return serializeExportTableToCsv({
    title,
    description,
    columns: ["Metric", "Value", "Notes"],
    rows: toSummaryMetricRows(metrics),
  });
}

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
  return date.toLocaleDateString("fil-PH", {
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
      return "Peste / Sakit";
    case "REQUEST":
      return "Kahilingan";
    case "EMERGENCY":
      return "Agarang Panganib";
    case "PRICE_CHECK":
      return "Presyo";
    case "REGISTER":
      return "Pagpaparehistro";
    case "WEATHER_HELP":
      return "Panahon / Tubig";
    case "HARVEST":
      return "Ani";
    case "CROP_UPDATE":
      return "Kalagayan ng Pananim";
    default:
      return "Hindi Natukoy";
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
      label: `Petsa: ${toDisplayDate(start)}`,
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
      label: `Mula ${toDisplayDate(start)} hanggang ${toDisplayDate(end)}`,
      fileLabel: `${fileSafeDate(start)}_to_${fileSafeDate(end)}`,
    };
  }

  if (filter.preset === "this_week") {
    const start = startOfWeek(now);
    return {
      start,
      end: today,
      label: `Linggong Ito (${toDisplayDate(start)} hanggang ${toDisplayDate(today)})`,
      fileLabel: `${fileSafeDate(start)}_to_${fileSafeDate(today)}`,
    };
  }

  if (filter.preset === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return {
      start,
      end: today,
      label: `Buwang Ito (${now.toLocaleDateString("fil-PH", {
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
    label: `Ngayong Araw (${toDisplayDate(start)})`,
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
    title: "Mga Concern sa SMS",
    description: "Mga natanggap na SMS na sakop ng napiling petsa.",
    columns: [
      "Case ID",
      "Petsa at Oras",
      "Magsasaka",
      "Telepono",
      "Uri ng Concern",
      "Prayoridad",
      "Kaligtasan",
      "Kalagayan ng Kaso",
      "Nakatalagang Staff",
      "Kalagayan ng Resolusyon",
      "Mensahe",
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
      message.assignedTo ?? "Hindi pa nakatalaga",
      getEffectiveSmsCaseOutcome(message) ?? "pending",
      message.message,
    ]),
  } satisfies ExportTable;
}

export function buildFarmerRegistrationsExportTable(farmers: Farmer[]) {
  return {
    title: "Mga Rehistrasyon ng Magsasaka",
    description: "Farmer records na sakop ng napiling petsa ng pagpaparehistro.",
    columns: [
      "Farmer ID",
      "Petsa ng Rehistrasyon",
      "Pangalan",
      "Telepono",
      "Barangay",
      "Sitio",
      "Mga Pangunahing Pananim",
      "Laki ng Sakahan",
      "Kalagayan",
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
    title: "Demograpiko ng mga Magsasaka",
    description: "Demographic records ng mga magsasakang sakop ng napiling petsa.",
    columns: [
      "Farmer ID",
      "Petsa ng Rehistrasyon",
      "Pangalan",
      "Edad",
      "Kasarian",
      "Telepono",
      "Barangay",
      "Sitio",
      "Laki ng Sakahan (ha)",
      "Mga Pangunahing Pananim",
      "Huling Aktibidad sa SMS",
      "Pinagmulan ng Profile",
      "Kalagayan",
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
    title: "Mga Transaksyon ng Voucher",
    description: "Pag-isyu at pag-redeem ng voucher na sakop ng napiling petsa.",
    columns: [
      "Voucher ID",
      "Petsa ng Pag-isyu",
      "Petsa ng Pag-redeem",
      "Magsasaka",
      "Telepono",
      "Rekurso",
      "Dami",
      "Code",
      "Kalagayan",
    ],
    rows: vouchers.map((voucher) => {
      const farmer = farmerMap.get(voucher.farmerId);
      const resource = resourceMap.get(voucher.resourceId);
      return [
        voucher.id,
        voucher.issueDate,
        voucher.redemptionDate ?? "Hindi pa nagagamit",
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
    title: "Mga Update sa Imbentaryo",
    description: "Kasalukuyang imbentaryo ayon sa huling petsa ng bawat rekurso.",
    columns: [
      "Resource ID",
      "Huling Update",
      "Pangalan ng Rekurso",
      "Kategorya",
      "Grupo",
      "Natitirang Stock",
      "Yunit",
      "Nakalaang Gamit",
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
    title: "Mga Update sa Presyo",
    description: "Mga tala ng presyo na sakop ng napiling petsa.",
    columns: [
      "Tala ID",
      "Petsa ng Update",
      "Pananim",
      "Presyo",
      "Yunit",
      "Galaw ng Presyo",
      "Pinagmulan",
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
    ["Kabuuang SMS concern", String(messages.length), "Lahat ng natanggap na SMS sa napiling petsa."],
    [
      "Mataas na prayoridad",
      String(messages.filter((message) => message.urgency === "high" || message.safetyFlag === "High").length),
      "Mga mensaheng mataas ang urgency o may seryosong usaping pangkaligtasan.",
    ],
    [
      "Naghihintay ng kumpirmasyon ng magsasaka",
      String(messages.filter((message) => message.resolutionConfirmationStatus === "awaiting_farmer").length),
      "Mga kasong naghihintay pa ng kumpirmasyon bago tuluyang isara.",
    ],
    [
      "Madalas na salita",
      topKeywords || "N/A",
      "Mga salitang pinakamadalas lumabas sa napiling SMS.",
    ],
  ];

  [...intentCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .forEach(([intent, count]) => {
      rows.push([`Uri ng concern: ${intent}`, String(count), "Bilang ng mensahe sa uring ito."]);
    });

  [...urgencyCounts.entries()].forEach(([urgency, count]) => {
    rows.push([`Prayoridad: ${urgency}`, String(count), "Bilang ng mensahe ayon sa antas ng prayoridad."]);
  });

  [...safetyCounts.entries()].forEach(([safety, count]) => {
    rows.push([`Kaligtasan: ${safety}`, String(count), "Bilang ng mensahe ayon sa antas ng kaligtasan."]);
  });

  return {
    title: "Buod ng Pagsusuri sa SMS",
    description: "Buod ng uri ng concern, prayoridad, at madalas na salita mula sa napiling SMS.",
    columns: ["Sukatan", "Bilang o Halaga", "Paliwanag"],
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

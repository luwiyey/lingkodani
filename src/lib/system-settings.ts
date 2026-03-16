import type { SystemSettings, SystemTemplateCategory, SystemTemplateCategoryId } from "@/lib/types";

export const SYSTEM_SETTINGS_DOCUMENT_ID = "barangay-current";
const BARANGAY_TIME_ZONE = "Asia/Manila";

export const defaultTemplateCategories: SystemTemplateCategory[] = [
  {
    label: "Pagkumpirma",
    id: "confirmation",
    templates: [
      {
        id: "confirmation-1",
        text: "Salamat sa inyong ulat. Natanggap na ito ng Lingkod-Ani at ipo-forward namin agad sa barangay agriculture team.",
        keywords: ["salamat", "ulat", "natanggap"],
      },
      {
        id: "confirmation-2",
        text: "Natanggap na namin ang inyong mensahe. Magpapadala kami ng kasunod na payo matapos ang review ng barangay team.",
        keywords: ["review", "kasunod", "payo"],
      },
    ],
  },
  {
    label: "Pagsisiyasat",
    id: "investigation",
    templates: [
      {
        id: "investigation-1",
        text: "Salamat sa ulat. Maaari po bang ilahad ang crop, lokasyon, at pangunahing sintomas upang mas tumpak ang aming payo?",
        keywords: ["crop", "lokasyon", "sintomas"],
      },
    ],
  },
  {
    label: "Resolusyon",
    id: "resolution",
    templates: [
      {
        id: "resolution-1",
        text: "Na-review na ang inyong kahilingan at magpapadala kami ng sunod na update tungkol sa susunod na hakbang o resource availability.",
        keywords: ["review", "resource", "update"],
      },
    ],
  },
  {
    label: "Emergency",
    id: "emergency",
    templates: [
      {
        id: "emergency-1",
        text: "Natanggap ang inyong agarang ulat. Unahin ang kaligtasan at makipag-ugnayan sa barangay sa [Numero ng Hotline] kung may banta sa tao o ari-arian.",
        keywords: ["agarang", "kaligtasan", "hotline"],
      },
    ],
  },
];

export const defaultSystemSettings: SystemSettings = {
  id: SYSTEM_SETTINGS_DOCUMENT_ID,
  brgyDescription:
    "Isang masiglang barangay na nakatuon sa pagpapabuti ng agrikultura at kapakanan ng mga magsasaka nito.",
  zoneDescriptions: Array.from({ length: 7 }, (_, index) => ({
    zone: `Zone ${index + 1}`,
    description: `Paglalarawan para sa Zone ${index + 1}...`,
  })),
  replyStartTime: "08:00",
  replyEndTime: "19:00",
  adminPhone: "+639123456789",
  templateCategories: defaultTemplateCategories,
  autoReplyEnabled: true,
  autoReplyTimeoutMinutes: 3,
};

export function mergeSystemSettings(
  partial?: Partial<SystemSettings> | null
): SystemSettings {
  if (!partial) {
    return {
      ...defaultSystemSettings,
      templateCategories: defaultTemplateCategories.map((category) => ({
        ...category,
        templates: [...category.templates],
      })),
      zoneDescriptions: [...defaultSystemSettings.zoneDescriptions],
    };
  }

  return {
    ...defaultSystemSettings,
    ...partial,
    id: partial.id ?? SYSTEM_SETTINGS_DOCUMENT_ID,
    zoneDescriptions: partial.zoneDescriptions ?? [...defaultSystemSettings.zoneDescriptions],
    templateCategories:
      partial.templateCategories?.length
        ? partial.templateCategories
        : defaultTemplateCategories.map((category) => ({
            ...category,
            templates: [...category.templates],
          })),
  };
}

export function getSystemTemplate(
  settings: SystemSettings,
  categoryId: SystemTemplateCategoryId
) {
  return settings.templateCategories.find((category) => category.id === categoryId)?.templates[0] ?? null;
}

function toMinutes(value: string) {
  const [hourPart = "0", minutePart = "0"] = value.split(":");
  const hours = Number.parseInt(hourPart, 10);
  const minutes = Number.parseInt(minutePart, 10);

  return hours * 60 + minutes;
}

export function isWithinReplyWindow(timestamp: string, settings: SystemSettings) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: BARANGAY_TIME_ZONE,
  }).formatToParts(new Date(timestamp));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  const currentMinutes = toMinutes(`${hour}:${minute}`);

  return currentMinutes >= toMinutes(settings.replyStartTime) &&
    currentMinutes <= toMinutes(settings.replyEndTime);
}

export function replaceSystemTemplateTokens(text: string, settings: SystemSettings) {
  return text.replaceAll("[Numero ng Hotline]", settings.adminPhone);
}

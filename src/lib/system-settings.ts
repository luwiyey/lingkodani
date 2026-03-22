import type {
  SmsLexiconRule,
  SystemSettings,
  SystemTemplateCategory,
  SystemTemplateCategoryId,
} from "@/lib/types";

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

export const defaultSmsLexiconRules: SmsLexiconRule[] = [
  {
    id: "lex-armyworm",
    phrase: "armyworm",
    intent: "PEST_DISEASE",
    urgency: "high",
    safetyFlag: "Medium",
    tone: "Kritikal",
    guidance:
      "Nabanggit ang armyworm sa ulat. I-prioritize ang field validation at magbigay agad ng ligtas na pest-management guidance para sa apektadong tanim.",
    applicability:
      "I-check muna kung anong pananim ang apektado, gaano kalawak ang infestation, at kung may available na barangay support o validated local treatment.",
    enabled: true,
    notes: "Para sa fall armyworm at katulad na ulat sa mais o gulay.",
  },
  {
    id: "lex-bph",
    phrase: "brown planthopper",
    intent: "PEST_DISEASE",
    urgency: "high",
    safetyFlag: "Medium",
    tone: "Kritikal",
    guidance:
      "Mukhang may brown planthopper / hopper concern. I-check ang lawak ng infestation at iwasan ang sobrang nitrogen habang hinihintay ang rekomendasyon ng AEW.",
    applicability:
      "Siguraduhing tumutugma ito sa aktuwal na sintomas sa palayan at kung may kasalukuyang advisory na mas akma sa local planting stage.",
    enabled: true,
    notes: "Puwedeng gumawa ng hiwalay na row para sa lokal na alias tulad ng hopper o bph.",
  },
  {
    id: "lex-tungro",
    phrase: "tungro",
    intent: "PEST_DISEASE",
    urgency: "high",
    safetyFlag: "Medium",
    tone: "Nag-aalala",
    guidance:
      "May banggit ng tungro. I-flag ito para sa agarang assessment at ihiwalay muna ang malinaw na apektadong bahagi kung posible.",
    applicability:
      "I-verify kung tungro nga ang sintomas at iwasang magbigay ng sobrang tiyak na treatment kung wala pang field confirmation.",
    enabled: true,
  },
  {
    id: "lex-leaf-blast",
    phrase: "leaf blast",
    intent: "PEST_DISEASE",
    urgency: "medium",
    safetyFlag: "Medium",
    tone: "Nag-aalala",
    guidance:
      "Posibleng leaf blast concern. Suriin ang stage ng pananim at ihanda ang payo sa moisture, spacing, at fungicide options kung naaangkop.",
    applicability:
      "Mas angkop ito kung malinaw ang crop stage at may local confirmation na hindi ibang sakit ang sanhi ng sintomas.",
    enabled: true,
  },
  {
    id: "lex-tagtuyot",
    phrase: "tagtuyot",
    intent: "WEATHER_HELP",
    urgency: "high",
    safetyFlag: "Medium",
    tone: "Kritikal",
    guidance:
      "Ituring ito bilang mataas na water-stress concern. I-prioritize ang patubig guidance, soil moisture conservation, at agarang follow-up sa apektadong lugar.",
    applicability:
      "I-check muna kung isolated lang ba ang concern o malawakan sa sitio/zone bago magbigay ng mas malawak na advisory.",
    enabled: true,
  },
  {
    id: "lex-walang-patubig",
    phrase: "walang patubig",
    intent: "WEATHER_HELP",
    urgency: "high",
    safetyFlag: "Medium",
    tone: "Kritikal",
    guidance:
      "May malinaw na kakulangan sa patubig. I-escalate para sa irrigation support o barangay coordination kung paulit-ulit ang ulat.",
    applicability:
      "Kumpirmahin kung talagang walang patubig sa lugar at kung may available na local workaround o schedule ng suplay ng tubig.",
    enabled: true,
  },
  {
    id: "lex-lubog-palayan",
    phrase: "lubog ang palayan",
    intent: "EMERGENCY",
    urgency: "high",
    safetyFlag: "High",
    tone: "Kritikal",
    guidance:
      "Mukhang baha o agarang pinsala ang iniulat. Unahin ang kaligtasan at i-route agad ito sa emergency / disaster response review.",
    applicability:
      "Unahin ang safety at actual damage validation bago magbigay ng teknikal na crop advice.",
    enabled: true,
  },
  {
    id: "lex-sprayer-request",
    phrase: "mahihiraman ng sprayer",
    intent: "REQUEST",
    urgency: "medium",
    safetyFlag: "Low",
    tone: "Neutral",
    guidance:
      "Ito ay kahilingan sa kagamitan. I-check agad ang availability ng sprayer at ang barangay release process bago tumugon.",
    applicability:
      "I-match ang alok sa tunay na available na stock, proseso ng pahiram, at saklaw ng barangay support.",
    enabled: true,
  },
  {
    id: "lex-presyo-palay",
    phrase: "presyo ng palay",
    intent: "PRICE_CHECK",
    urgency: "low",
    safetyFlag: "Low",
    tone: "Neutral",
    guidance:
      "Tanong ito tungkol sa presyo ng palay. I-match ang reply sa pinakahuling market reference na nasa system.",
    applicability:
      "Sabihin kung gaano kasariwa ang market data at iwasang magbigay ng presyong mukhang final kung luma na ang reference.",
    enabled: true,
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
  smsLexiconRules: defaultSmsLexiconRules,
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
      smsLexiconRules: defaultSystemSettings.smsLexiconRules.map((rule) => ({ ...rule })),
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
    smsLexiconRules:
      partial.smsLexiconRules?.length
        ? partial.smsLexiconRules.map((rule) => ({ ...rule }))
        : defaultSmsLexiconRules.map((rule) => ({ ...rule })),
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

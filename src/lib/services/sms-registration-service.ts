import { normalizeSmsMessage } from "@/lib/sms-normalization";
import type { Farmer, SmsDetectedLanguage } from "@/lib/types";

const KNOWN_CROPS = [
  "palay",
  "mais",
  "kamatis",
  "gulay",
  "sibuyas",
  "talong",
  "monggo",
  "saging",
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function extractZone(tokens: string[]) {
  const zoneIndex = tokens.findIndex((token) => token.toLowerCase() === "zone");

  if (zoneIndex >= 0 && tokens[zoneIndex + 1]) {
    return `Zone ${tokens[zoneIndex + 1]}`;
  }

  return "Hindi tukoy";
}

function extractGender(tokens: string[]) {
  const value = tokens.find((token) => /^(lalaki|babae)$/i.test(token));
  return value ? titleCase(value) : "Hindi natukoy";
}

function extractAge(tokens: string[]) {
  const value = tokens.find((token) => /^\d{2}$/.test(token));
  return value ? Number(value) : 0;
}

function extractFarmSize(tokens: string[]) {
  const hectareToken = tokens.find((token) => /^\d+(\.\d+)?ha$/i.test(token));

  if (hectareToken) {
    return Number(hectareToken.toLowerCase().replace("ha", ""));
  }

  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = tokens[index];
    const previous = tokens[index - 1]?.toLowerCase();

    if (/^\d+(\.\d+)?$/.test(token) && previous !== "zone") {
      const numeric = Number(token);

      if (numeric > 0 && numeric <= 20) {
        return numeric;
      }
    }
  }

  return 0;
}

function extractCrops(tokens: string[]) {
  const crops = tokens
    .map((token) => token.toLowerCase())
    .filter((token) => KNOWN_CROPS.includes(token))
    .map((token) => titleCase(token));

  return Array.from(new Set(crops));
}

function extractName(tokens: string[]) {
  const stopIndex = tokens.findIndex((token) => {
    const lower = token.toLowerCase();
    return /^\d{2}$/.test(token) || /^(lalaki|babae|zone)$/i.test(token) || KNOWN_CROPS.includes(lower);
  });

  const nameTokens = (stopIndex === -1 ? tokens : tokens.slice(0, stopIndex)).filter((token) => !/^register$/i.test(token));
  const normalized = normalizeWhitespace(nameTokens.join(" "));
  return normalized ? titleCase(normalized) : "Hindi pa nakilalang magsasaka";
}

const REGISTRATION_REQUIRED_FIELDS = {
  name: {
    filipino: "buong pangalan",
    english: "full name",
  },
  sitio: {
    filipino: "sitio o zone",
    english: "sitio or zone",
  },
} as const;

type RegistrationRequiredField = keyof typeof REGISTRATION_REQUIRED_FIELDS;

function describeRegistrationField(
  field: RegistrationRequiredField,
  detectedLanguage: SmsDetectedLanguage
) {
  return detectedLanguage === "English"
    ? REGISTRATION_REQUIRED_FIELDS[field].english
    : REGISTRATION_REQUIRED_FIELDS[field].filipino;
}

function getMissingRegistrationFields(farmer: Farmer) {
  const missing: RegistrationRequiredField[] = [];

  if (!farmer.name || farmer.name === "Hindi pa nakilalang magsasaka") {
    missing.push("name");
  }

  if (!farmer.sitio || farmer.sitio === "Hindi tukoy") {
    missing.push("sitio");
  }

  return missing;
}

function joinMissingFields(fields: string[], detectedLanguage: SmsDetectedLanguage) {
  const translatedFields = fields.map((field) =>
    describeRegistrationField(field as RegistrationRequiredField, detectedLanguage)
  );

  if (translatedFields.length === 0) {
    return "";
  }

  if (translatedFields.length === 1) {
    return translatedFields[0];
  }

  if (translatedFields.length === 2) {
    return detectedLanguage === "English"
      ? `${translatedFields[0]} and ${translatedFields[1]}`
      : `${translatedFields[0]} at ${translatedFields[1]}`;
  }

  return detectedLanguage === "English"
    ? `${translatedFields.slice(0, -1).join(", ")}, and ${translatedFields[translatedFields.length - 1]}`
    : `${translatedFields.slice(0, -1).join(", ")}, at ${translatedFields[translatedFields.length - 1]}`;
}

export function buildRegistrationPrompt(
  missingFields?: RegistrationRequiredField[],
  detectedLanguage: SmsDetectedLanguage = "Filipino"
) {
  const normalizedMissingFields = (missingFields ?? []).filter(Boolean);
  const useEnglish = detectedLanguage === "English";

  if (normalizedMissingFields.length > 0) {
    return useEnglish
      ? `We have received your registration request. To submit it for farmer approval, please send your ${joinMissingFields(normalizedMissingFields, detectedLanguage)}. You may also include your main crop and farm size if available.`
      : `Opo, natanggap po namin ang inyong registration request. Para maipasa po namin ito sa farmer approval, pakisend po ang ${joinMissingFields(normalizedMissingFields, detectedLanguage)}. Maaari rin po ninyong isama ang pangunahing pananim at lawak ng sakahan kung available.`;
  }

  if (useEnglish) {
    return "We could not yet match your registration details. Please reply using the format: REGISTER Name Zone MainCrop FarmSizeHa so we can submit it for farmer approval.";
  }

  return "Opo, hindi pa po namin kayo maitugma sa rehistro. Pakisagot po sa format na REGISTER Pangalan Zone PangunahingPananim LawakHa upang maipasa po namin kayo sa farmer approval.";
}

export type RegistrationAssessment = {
  isRegistrationMessage: boolean;
  farmer: Farmer | null;
  missingFields: RegistrationRequiredField[];
  clarificationPrompt?: string;
  detectedLanguage?: SmsDetectedLanguage;
};

export function assessRegistrationMessage(input: {
  message: string;
  phone: string;
  timestamp: string;
  barangay?: string;
}): RegistrationAssessment {
  const normalized = normalizeWhitespace(input.message);
  const detectedLanguage = normalizeSmsMessage(input.message).detectedLanguage;

  if (!/^register\b/i.test(normalized)) {
    return {
      isRegistrationMessage: false,
      farmer: null,
      missingFields: [],
      detectedLanguage,
    };
  }

  const payload = normalized.replace(/^register\b/i, "").trim();

  if (!payload) {
    const missingFields: RegistrationRequiredField[] = [
      "name",
      "sitio",
    ];

    return {
      isRegistrationMessage: true,
      farmer: null,
      missingFields,
      clarificationPrompt: buildRegistrationPrompt(missingFields, detectedLanguage),
      detectedLanguage,
    };
  }

  const tokens = payload.split(" ");
  const farmer: Farmer = {
    id: `FARM${Date.now()}`,
    name: extractName(tokens),
    age: extractAge(tokens),
    gender: extractGender(tokens),
    phone: input.phone,
    barangay: input.barangay ?? "Batakil",
    sitio: extractZone(tokens),
    farmSize: extractFarmSize(tokens),
    crops: extractCrops(tokens),
    registrationDate: input.timestamp,
    lastSmsActivity: input.timestamp,
    status: "pending_approval",
  };
  const missingFields = getMissingRegistrationFields(farmer);

  if (missingFields.length > 0) {
    return {
      isRegistrationMessage: true,
      farmer: null,
      missingFields,
      clarificationPrompt: buildRegistrationPrompt(missingFields, detectedLanguage),
      detectedLanguage,
    };
  }

  return {
    isRegistrationMessage: true,
    farmer,
    missingFields: [],
    detectedLanguage,
  };
}

export function extractRegistrationFarmer(input: {
  message: string;
  phone: string;
  timestamp: string;
  barangay?: string;
}): Farmer | null {
  return assessRegistrationMessage(input).farmer;
}

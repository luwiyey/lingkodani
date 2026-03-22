import type { Farmer } from "@/lib/types";

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
  name: "buong pangalan",
  sitio: "sitio o zone",
} as const;

function getMissingRegistrationFields(farmer: Farmer) {
  const missing: string[] = [];

  if (!farmer.name || farmer.name === "Hindi pa nakilalang magsasaka") {
    missing.push(REGISTRATION_REQUIRED_FIELDS.name);
  }

  if (!farmer.sitio || farmer.sitio === "Hindi tukoy") {
    missing.push(REGISTRATION_REQUIRED_FIELDS.sitio);
  }

  return missing;
}

function joinMissingFields(fields: string[]) {
  if (fields.length === 0) {
    return "";
  }

  if (fields.length === 1) {
    return fields[0];
  }

  if (fields.length === 2) {
    return `${fields[0]} at ${fields[1]}`;
  }

  return `${fields.slice(0, -1).join(", ")}, at ${fields[fields.length - 1]}`;
}

export function buildRegistrationPrompt(missingFields?: string[]) {
  const normalizedMissingFields = (missingFields ?? []).filter(Boolean);

  if (normalizedMissingFields.length > 0) {
    return `Opo, natanggap po namin ang inyong registration request. Para maipasa po namin ito sa farmer approval, pakisend po ang ${joinMissingFields(normalizedMissingFields)}. Maaari rin po ninyong isama ang pangunahing pananim at lawak ng sakahan kung available.`;
  }

  return "Opo, hindi pa po namin kayo maitugma sa rehistro. Pakisagot po sa format na REGISTER Pangalan Zone PangunahingPananim LawakHa upang maipasa po namin kayo sa farmer approval.";
}

export type RegistrationAssessment = {
  isRegistrationMessage: boolean;
  farmer: Farmer | null;
  missingFields: string[];
  clarificationPrompt?: string;
};

export function assessRegistrationMessage(input: {
  message: string;
  phone: string;
  timestamp: string;
  barangay?: string;
}): RegistrationAssessment {
  const normalized = normalizeWhitespace(input.message);

  if (!/^register\b/i.test(normalized)) {
    return {
      isRegistrationMessage: false,
      farmer: null,
      missingFields: [],
    };
  }

  const payload = normalized.replace(/^register\b/i, "").trim();

  if (!payload) {
    const missingFields = [
      REGISTRATION_REQUIRED_FIELDS.name,
      REGISTRATION_REQUIRED_FIELDS.sitio,
    ];

    return {
      isRegistrationMessage: true,
      farmer: null,
      missingFields,
      clarificationPrompt: buildRegistrationPrompt(missingFields),
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
      clarificationPrompt: buildRegistrationPrompt(missingFields),
    };
  }

  return {
    isRegistrationMessage: true,
    farmer,
    missingFields: [],
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

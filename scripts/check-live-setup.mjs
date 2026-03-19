import { config as loadEnv } from "dotenv";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import firebaseAdminCredentialHelpers from "../src/lib/firebase/admin-credentials.js";

loadEnv({ path: ".env.local", override: true });
loadEnv();

const { resolveFirebaseAdminCredentials } = firebaseAdminCredentialHelpers;

function readDefaultFirebaseProject() {
  const firebaseRcPath = join(process.cwd(), ".firebaserc");

  if (!existsSync(firebaseRcPath)) {
    return null;
  }

  try {
    const firebaseRc = JSON.parse(readFileSync(firebaseRcPath, "utf8"));
    return firebaseRc?.projects?.default ?? null;
  } catch {
    return null;
  }
}

function isPresent(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function readLiveSmsProvider() {
  const explicitProvider = (process.env.LIVE_SMS_PROVIDER ?? process.env.NEXT_PUBLIC_LIVE_SMS_PROVIDER ?? "").trim().toLowerCase();

  if (["twilio", "semaphore", "smsgate", "textbee"].includes(explicitProvider)) {
    return explicitProvider;
  }

  if (
    isPresent(process.env.TEXTBEE_API_KEY) ||
    isPresent(process.env.TEXTBEE_DEVICE_ID) ||
    isPresent(process.env.TEXTBEE_WEBHOOK_SECRET)
  ) {
    return "textbee";
  }

  if (
    isPresent(process.env.SMSGATE_USERNAME) ||
    isPresent(process.env.SMSGATE_PASSWORD) ||
    isPresent(process.env.SMSGATE_DEVICE_ID) ||
    isPresent(process.env.SMS_USERNAME) ||
    isPresent(process.env.SMS_PASSWORD) ||
    isPresent(process.env.SMS_DEVICE_ID) ||
    isPresent(process.env.SMS_API_URL)
  ) {
    return "smsgate";
  }

  if (
    isPresent(process.env.TWILIO_ACCOUNT_SID) ||
    isPresent(process.env.TWILIO_AUTH_TOKEN) ||
    isPresent(process.env.TWILIO_FROM_NUMBER)
  ) {
    return "twilio";
  }

  if (
    isPresent(process.env.SEMAPHORE_API_KEY) ||
    isPresent(process.env.SEMAPHORE_SENDER_NAME)
  ) {
    return "semaphore";
  }

  return "generic";
}

function readSmsgateUsername() {
  return process.env.SMSGATE_USERNAME ?? process.env.SMS_USERNAME ?? "";
}

function readSmsgatePassword() {
  return process.env.SMSGATE_PASSWORD ?? process.env.SMS_PASSWORD ?? "";
}

function readSmsgateDeviceId() {
  return process.env.SMSGATE_DEVICE_ID ?? process.env.SMS_DEVICE_ID ?? "";
}

function readTextbeeApiKey() {
  return process.env.TEXTBEE_API_KEY ?? "";
}

function readTextbeeDeviceId() {
  return process.env.TEXTBEE_DEVICE_ID ?? "";
}

function printStatus(label, passed, details) {
  console.log(`${passed ? "[ok]" : "[missing]"} ${label}: ${details}`);
}

const defaultProject = readDefaultFirebaseProject();
const adminCredentialSource = resolveFirebaseAdminCredentials(process.env);
const hasFirebaseWebConfig =
  isPresent(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) &&
  isPresent(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) &&
  isPresent(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
  isPresent(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) &&
  isPresent(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) &&
  isPresent(process.env.NEXT_PUBLIC_FIREBASE_APP_ID);

console.log("Lingkod-Ani live setup check");
console.log("");

printStatus("App mode", isPresent(process.env.APP_MODE), process.env.APP_MODE ?? "not set");
printStatus(
  "Firebase CLI default project",
  isPresent(defaultProject),
  defaultProject ?? "run `npx firebase-tools use --add <project-id>`"
);
printStatus(
  "Firebase web config",
  hasFirebaseWebConfig,
  hasFirebaseWebConfig ? "ready" : "missing one or more NEXT_PUBLIC_FIREBASE_* values"
);
printStatus(
  "Firebase Admin credentials",
  Boolean(adminCredentialSource),
  adminCredentialSource
    ? `resolved from ${adminCredentialSource.source}`
    : "set FIREBASE_* admin vars, FIREBASE_ADMIN_CREDENTIALS_PATH, FIREBASE_SERVICE_ACCOUNT_JSON, or GOOGLE_APPLICATION_CREDENTIALS"
);
printStatus(
  "Google GenAI key",
  isPresent(process.env.GOOGLE_GENAI_API_KEY) || isPresent(process.env.GEMINI_API_KEY),
  isPresent(process.env.GOOGLE_GENAI_API_KEY)
    ? "GOOGLE_GENAI_API_KEY"
    : isPresent(process.env.GEMINI_API_KEY)
      ? "GEMINI_API_KEY"
      : "missing"
);
printStatus(
  "Live SMS provider",
  true,
  readLiveSmsProvider()
);

if (readLiveSmsProvider() === "smsgate") {
  printStatus(
    "SMSGate credentials",
    isPresent(readSmsgateUsername()) && isPresent(readSmsgatePassword()),
    isPresent(readSmsgateUsername()) && isPresent(readSmsgatePassword())
      ? "ready"
      : "missing SMSGATE_USERNAME/SMS_USERNAME or SMSGATE_PASSWORD/SMS_PASSWORD"
  );
  printStatus(
    "SMSGate device",
    isPresent(readSmsgateDeviceId()),
    readSmsgateDeviceId() || "missing SMSGATE_DEVICE_ID/SMS_DEVICE_ID"
  );
}

if (readLiveSmsProvider() === "textbee") {
  printStatus(
    "TextBee API key",
    isPresent(readTextbeeApiKey()),
    isPresent(readTextbeeApiKey()) ? "ready" : "missing TEXTBEE_API_KEY"
  );
  printStatus(
    "TextBee device",
    isPresent(readTextbeeDeviceId()),
    readTextbeeDeviceId() || "missing TEXTBEE_DEVICE_ID"
  );
}

if (readLiveSmsProvider() === "generic") {
  printStatus(
    "Generic SMS webhook URL",
    isPresent(process.env.GENERIC_SMS_WEBHOOK_URL),
    process.env.GENERIC_SMS_WEBHOOK_URL ?? "missing"
  );
}

console.log("");
console.log("Next recommended commands:");
console.log("1. npx firebase-tools deploy --only firestore:rules --project lingkod-ani");
console.log("2. npm.cmd run firebase:doctor");
console.log("3. npm.cmd run seed:firestore");

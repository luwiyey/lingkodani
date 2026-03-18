type SupportedProvider = "twilio" | "semaphore" | "generic" | "smsgate";

function isPresent(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function readLiveSmsProvider(env: NodeJS.ProcessEnv = process.env): SupportedProvider {
  const explicitProvider = (env.LIVE_SMS_PROVIDER ?? env.NEXT_PUBLIC_LIVE_SMS_PROVIDER ?? "").trim().toLowerCase();

  if (explicitProvider === "twilio" || explicitProvider === "semaphore" || explicitProvider === "smsgate") {
    return explicitProvider;
  }

  if (
    isPresent(env.SMSGATE_USERNAME) ||
    isPresent(env.SMSGATE_PASSWORD) ||
    isPresent(env.SMSGATE_DEVICE_ID) ||
    isPresent(env.SMS_USERNAME) ||
    isPresent(env.SMS_PASSWORD) ||
    isPresent(env.SMS_DEVICE_ID) ||
    isPresent(env.SMS_API_URL)
  ) {
    return "smsgate";
  }

  if (
    isPresent(env.TWILIO_ACCOUNT_SID) ||
    isPresent(env.TWILIO_AUTH_TOKEN) ||
    isPresent(env.TWILIO_FROM_NUMBER)
  ) {
    return "twilio";
  }

  if (
    isPresent(env.SEMAPHORE_API_KEY) ||
    isPresent(env.SEMAPHORE_SENDER_NAME)
  ) {
    return "semaphore";
  }

  return "generic";
}

export function readSmsgateUsername(env: NodeJS.ProcessEnv = process.env) {
  return env.SMSGATE_USERNAME?.trim() || env.SMS_USERNAME?.trim() || "";
}

export function readSmsgatePassword(env: NodeJS.ProcessEnv = process.env) {
  return env.SMSGATE_PASSWORD?.trim() || env.SMS_PASSWORD?.trim() || "";
}

export function readSmsgateDeviceId(env: NodeJS.ProcessEnv = process.env) {
  return env.SMSGATE_DEVICE_ID?.trim() || env.SMS_DEVICE_ID?.trim() || "";
}

export function readSmsgateBaseUrl(env: NodeJS.ProcessEnv = process.env) {
  return env.SMSGATE_BASE_URL?.trim() || env.SMS_API_URL?.trim() || "";
}

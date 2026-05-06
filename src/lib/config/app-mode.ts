export type AppMode = "demo" | "live";

function readMode(): AppMode {
  const raw = process.env.NEXT_PUBLIC_APP_MODE ?? process.env.APP_MODE ?? "demo";
  const normalized = String(raw).trim().toLowerCase();
  return normalized === "live" ? "live" : "demo";
}

export const appMode = readMode();
export const isDemoMode = appMode === "demo";
export const isLiveMode = appMode === "live";
export const enableRealSms =
  String(process.env.NEXT_PUBLIC_ENABLE_REAL_SMS ?? process.env.ENABLE_REAL_SMS ?? "false")
    .trim()
    .toLowerCase() === "true";

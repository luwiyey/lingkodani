export const DEMO_PREVIEW_ACCESS_COOKIE_NAME = "lingkod_ani_demo_preview";
const DEMO_PREVIEW_MAX_AGE_SECONDS = 60 * 60 * 4;

function buildCookieAttributes(maxAgeSeconds: number) {
  const attributes = [
    "path=/",
    "SameSite=Lax",
    `max-age=${maxAgeSeconds}`,
  ];

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

export function enableDemoPreviewAccessCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${DEMO_PREVIEW_ACCESS_COOKIE_NAME}=1; ${buildCookieAttributes(DEMO_PREVIEW_MAX_AGE_SECONDS)}`;
}

export function clearDemoPreviewAccessCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${DEMO_PREVIEW_ACCESS_COOKIE_NAME}=; ${buildCookieAttributes(0)}`;
}

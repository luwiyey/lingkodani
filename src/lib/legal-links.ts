export type LegalSource = "startup" | "login" | "dashboard";

export function buildLegalPageHref(path: "/terms-of-service" | "/privacy-policy", source: LegalSource) {
  return `${path}?from=${source}`;
}

export function getLegalBackLink(source: string | null) {
  switch (source) {
    case "login":
      return {
        href: "/login",
        label: "Bumalik sa login",
      };
    case "dashboard":
      return {
        href: "/dashboard",
        label: "Bumalik sa dashboard",
      };
    case "startup":
    default:
      return {
        href: "/",
        label: "Bumalik sa startup page",
      };
  }
}

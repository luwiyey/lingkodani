function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "LA";
  }

  return parts
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function createInitialsAvatarDataUrl(name: string) {
  const initials = escapeSvgText(getInitials(name));
  const safeName = escapeSvgText(name.trim() || "Lingkod-Ani");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="${safeName}">
      <defs>
        <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#E8F5E9" />
          <stop offset="100%" stop-color="#D0E7D2" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="100" fill="url(#avatarGradient)" />
      <circle cx="100" cy="100" r="92" fill="none" stroke="#A8C9AE" stroke-width="4" />
      <text
        x="100"
        y="114"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="64"
        font-weight="700"
        fill="#2F6F3E"
      >
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

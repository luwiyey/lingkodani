import { Archive, FilePen, MessageSquare, Scan, Shield, type LucideIcon } from "lucide-react";

import type { LogbookEntryType } from "@/lib/types";

const logbookIcons: Record<LogbookEntryType, LucideIcon> = {
  SMS: MessageSquare,
  Payo: Scan,
  "Tala sa Bukid": FilePen,
  Insidente: Shield,
  Tulong: Archive,
};

export function getLogbookEntryIcon(type: LogbookEntryType) {
  return logbookIcons[type] ?? FilePen;
}

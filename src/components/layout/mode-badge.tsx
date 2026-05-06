"use client";

import { Cloud, FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { appMode } from "@/lib/config/app-mode";
import { isDemoRuntimeActive } from "@/lib/runtime-mode";

export function ModeBadge() {
  const { currentUser, currentUserProfile } = useAuth();
  const usingDemoSandbox = isDemoRuntimeActive({ currentUser, currentUserProfile });

  if (usingDemoSandbox) {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <FlaskConical className="h-3.5 w-3.5" />
        Demo Mode
      </Badge>
    );
  }

  return (
    <Badge className="gap-1.5 bg-emerald-600 hover:bg-emerald-600">
      <Cloud className="h-3.5 w-3.5" />
      {appMode === "live" ? "Live Mode" : "Mode"}
    </Badge>
  );
}

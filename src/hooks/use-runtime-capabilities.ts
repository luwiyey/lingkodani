"use client";

import { useEffect, useState } from "react";

import { getFallbackRuntimeCapabilities, type RuntimeCapabilities } from "@/lib/runtime-capabilities";

export function useRuntimeCapabilities() {
  const [capabilities, setCapabilities] = useState<RuntimeCapabilities>(() => getFallbackRuntimeCapabilities());
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/system/capabilities", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as RuntimeCapabilities;

        if (active) {
          setCapabilities(payload);
        }
      })
      .catch(() => {
        // Keep the fallback capabilities when the health endpoint is unavailable.
      })
      .finally(() => {
        if (active) {
          setCapabilitiesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return { capabilities, capabilitiesLoading };
}

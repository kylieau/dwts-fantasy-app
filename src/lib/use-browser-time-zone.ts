"use client";

import { useEffect, useState } from "react";

// Reads on the client only, after mount — the server-rendered pass has no
// meaningful browser time zone to report, and computing it during render
// would mismatch the server's SSR output and trigger a hydration error.
export function useBrowserTimeZone(): string {
  const [timeZone, setTimeZone] = useState("");
  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);
  return timeZone;
}

export function airsAtToUtcIso(localValue: string): string | null {
  if (!localValue) return null;
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

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

// Converts an absolute instant into the datetime-local input format (no
// timezone suffix, minute precision) in the viewer's own time zone.
export function utcIsoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// The show's normal slot: 8pm US Eastern on the next Tuesday (today counts,
// so scheduling on a Tuesday itself defaults to that same night), correctly
// accounting for EST/EDT. Returned in the viewer's own time zone since
// that's what the datetime-local input needs to display the right moment.
export function nextTuesdayAt8pmEasternForInput(): string {
  const now = new Date();

  const nyDateParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    }).formatToParts(now).map((p) => [p.type, p.value])
  );
  const weekdayIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const daysUntilTuesday = (2 - weekdayIndex[nyDateParts.weekday] + 7) % 7;

  // Guess the UTC instant for "that NY calendar day at 20:00", then correct
  // for whatever DST offset actually applies by checking how the guess reads
  // back in America/New_York and adjusting by the difference.
  const guessUtc = Date.UTC(
    Number(nyDateParts.year),
    Number(nyDateParts.month) - 1,
    Number(nyDateParts.day) + daysUntilTuesday,
    20,
    0,
    0
  );
  const readBack = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).formatToParts(new Date(guessUtc)).map((p) => [p.type, p.value])
  );
  const readBackAsUtc = Date.UTC(
    Number(readBack.year),
    Number(readBack.month) - 1,
    Number(readBack.day),
    Number(readBack.hour),
    Number(readBack.minute),
    Number(readBack.second)
  );

  return utcIsoToLocalInput(new Date(guessUtc - (readBackAsUtc - guessUtc)).toISOString());
}

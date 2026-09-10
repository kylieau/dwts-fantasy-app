"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SunIcon, LayoutGridIcon, SettingsIcon } from "lucide-react";

const DESTINATIONS = [
  { href: "/today", label: "Today", icon: SunIcon },
  { href: "/leagues", label: "Leagues", icon: LayoutGridIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AccountTabBar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] sm:static sm:border-t-0 sm:border-b sm:pb-0">
      <div className="mx-auto flex max-w-2xl justify-around px-4 py-1 sm:justify-start sm:gap-1">
        {DESTINATIONS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={
                active
                  ? "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-primary sm:flex-row sm:gap-1.5"
                  : "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-foreground/60 hover:text-foreground sm:flex-row sm:gap-1.5"
              }
            >
              <Icon className="size-5 sm:size-4" />
              <span className="text-[10px] sm:text-sm">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

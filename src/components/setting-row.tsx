import type { ReactNode } from "react";

export function SettingRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

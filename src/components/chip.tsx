import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

// The mockup's pill-shaped pick selector — a single tap target that's
// either selected (filled gold) or not (outlined), standing in for a
// radio option. Used anywhere a manager is choosing one couple from a
// small set (Curtain Call picks, Grand Finale ordering).
export function Chip({
  selected,
  className,
  ...props
}: { selected: boolean } & Omit<ComponentProps<typeof Button>, "variant">) {
  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      size="sm"
      className={cn("rounded-full", className)}
      {...props}
    />
  );
}

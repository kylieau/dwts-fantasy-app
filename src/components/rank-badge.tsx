import { cn } from "cn";

function ordinal(n: number): string {
  const remainder100 = n % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function RankBadge({ rank, className }: { rank: number; className?: string }) {
  return (
    <div
      className={cn(
        "flex size-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent to-primary font-heading text-lg font-bold text-primary-foreground shadow-lg shadow-black/40",
        className
      )}
    >
      {ordinal(rank)}
    </div>
  );
}

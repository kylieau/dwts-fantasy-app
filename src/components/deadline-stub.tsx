import Link from "next/link";
import { cn } from "cn";

// The mockup's "ticket stub" pattern for a next-deadline callout — a
// curtain-colored card with punched-out notches on each edge, used
// wherever the app needs to surface "something is due soon."
export function DeadlineStub({
  label,
  headline,
  ctaLabel,
  href,
  className,
}: {
  label: string;
  headline: string;
  ctaLabel: string;
  href: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-primary/40 bg-linear-to-br from-curtain to-curtain-light px-5 py-4",
        className
      )}
    >
      <span className="absolute top-1/2 -left-[7px] size-3.5 -translate-y-1/2 rounded-full bg-background" />
      <span className="absolute top-1/2 -right-[7px] size-3.5 -translate-y-1/2 rounded-full bg-background" />
      <p className="text-xs text-accent">{label}</p>
      <p className="mt-1 font-heading text-xl font-semibold text-foreground">{headline}</p>
      <Link
        href={href}
        className="mt-2 inline-block rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

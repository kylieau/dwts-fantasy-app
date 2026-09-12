type MemberBreakdown = {
  managerId: string;
  displayName: string;
  danceCard: number | null;
  curtainCall: number | null;
  grandFinale: number | null;
};

export function StandingsModuleBreakdown({
  members,
  danceCardOn,
  curtainCallOn,
  grandFinaleOn,
}: {
  members: MemberBreakdown[];
  danceCardOn: boolean;
  curtainCallOn: boolean;
  grandFinaleOn: boolean;
}) {
  const columns = [
    danceCardOn && { key: "danceCard" as const, label: "Dance Card" },
    curtainCallOn && { key: "curtainCall" as const, label: "Curtain Call" },
    grandFinaleOn && { key: "grandFinale" as const, label: "Grand Finale" },
  ].filter((c): c is { key: "danceCard" | "curtainCall" | "grandFinale"; label: string } => !!c);

  if (columns.length < 2) return null;

  return (
    <div className="mt-8">
      <h2 className="font-heading text-lg font-semibold">Points by Module</h2>
      <div
        className="mt-3 grid gap-x-3 gap-y-2 text-sm"
        style={{ gridTemplateColumns: `1fr repeat(${columns.length}, auto)` }}
      >
        <div />
        {columns.map((c) => (
          <span key={c.key} className="text-right text-xs font-medium text-muted-foreground">
            {c.label}
          </span>
        ))}
        {members.map((m) => (
          <div key={m.managerId} className="contents">
            <span className="border-t border-border py-2 font-medium">{m.displayName}</span>
            {columns.map((c) => (
              <span
                key={c.key}
                className="border-t border-border py-2 text-right font-semibold text-foreground"
              >
                {m[c.key] ?? "—"}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

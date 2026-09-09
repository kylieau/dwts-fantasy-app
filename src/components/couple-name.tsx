import type { ReactNode } from "react";
import type { CoupleNameParts } from "@/lib/couple-display";

// The show bills the celebrity as the star and the pro as their partner —
// bold the celebrity name wherever a couple is displayed, everywhere.
export function CoupleName({ celebrity, pro }: CoupleNameParts) {
  return (
    <>
      <strong>{celebrity}</strong> &amp; {pro}
    </>
  );
}

export function coupleNameNode(parts: CoupleNameParts): ReactNode {
  return <CoupleName celebrity={parts.celebrity} pro={parts.pro} />;
}

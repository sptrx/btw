import { ViewTransition, type ReactNode } from "react";

const pageFade = { default: "page-fade" } as const;

/** Remounts on navigation so route changes crossfade instead of popping in blank. */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={pageFade} exit={pageFade}>
      {children}
    </ViewTransition>
  );
}

import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function ContentSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-4" aria-hidden>
      <Bone className="h-8 w-48" />
      <Bone className="h-4 w-full max-w-md" />
      <div className="overflow-hidden rounded-xl border border-border/70">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="space-y-3 border-b border-border/70 px-4 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <Bone className="size-11 rounded-full" />
              <Bone className="h-4 w-40" />
            </div>
            <Bone className="aspect-video w-full rounded-xl" />
            <Bone className="h-6 w-3/4" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

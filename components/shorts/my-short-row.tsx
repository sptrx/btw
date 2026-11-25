"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteShort } from "@/actions/shorts";
import { Button } from "@/components/ui/button";
import { SHORT_STATUS_LABEL, type ShortItem } from "@/lib/shorts-types";

export function MyShortRow({ short }: { short: ShortItem }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!window.confirm("Delete this short? This can't be undone.")) return;
    setBusy(true);
    await deleteShort(short.id);
    router.refresh();
  }

  return (
    <li className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{short.caption || "Untitled short"}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {SHORT_STATUS_LABEL[short.status]}
          {short.status === "rejected" && short.rejectionReason ? `: ${short.rejectionReason}` : ""}
        </p>
      </div>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => void remove()}>
        Delete
      </Button>
    </li>
  );
}

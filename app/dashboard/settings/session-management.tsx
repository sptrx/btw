"use client";

import { useState } from "react";
import {
  signOutAllOtherDevices,
  signOutAllDevices,
} from "@/actions/auth";

export default function SessionManagement() {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="max-w-md space-y-4">
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="mb-2 text-sm text-muted-foreground">
          <strong className="text-foreground">This device</strong> – You are
          currently signed in here.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <form
          action={async () => {
            setLoading("others");
            setMessage(null);
            const result = await signOutAllOtherDevices();
            setLoading(null);
            if (result?.error) {
              setMessage(result.error);
            } else {
              setMessage("Signed out from all other devices.");
            }
          }}
        >
          <button
            type="submit"
            disabled={!!loading}
            className="w-full rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 sm:w-auto"
          >
            {loading === "others" ? "Signing out…" : "Sign out from all other devices"}
          </button>
        </form>

        <form action={signOutAllDevices}>
          <button
            type="submit"
            className="w-full rounded-xl border border-destructive/30 px-5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 sm:w-auto"
          >
            Sign out from all devices (including this one)
          </button>
        </form>
      </div>

      {message && (
        <p className="text-sm text-primary">{message}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Use these options if you believe your account may have been used on a device you
        don&apos;t recognize.
      </p>
    </div>
  );
}

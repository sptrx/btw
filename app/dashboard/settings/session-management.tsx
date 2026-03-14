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
    <div className="space-y-4 max-w-md">
      <div className="border-2 border-warm-200 dark:border-warm-700 rounded-xl p-4 bg-warm-50/30 dark:bg-warm-800/30">
        <p className="text-sm text-warm-600 dark:text-warm-400 mb-2">
          <strong className="text-warm-800 dark:text-warm-100">This device</strong> – You are
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
            className="px-4 py-2.5 border-2 border-warm-300 dark:border-warm-600 rounded-xl hover:bg-sage-50 dark:hover:bg-warm-700 font-medium transition-colors disabled:opacity-50"
          >
            {loading === "others" ? "Signing out…" : "Sign out from all other devices"}
          </button>
        </form>

        <form action={signOutAllDevices}>
          <button
            type="submit"
            className="px-4 py-2.5 text-terracotta-600 dark:text-terracotta-400 border-2 border-terracotta-400 dark:border-terracotta-600 rounded-xl hover:bg-terracotta-50 dark:hover:bg-terracotta-950/30 font-medium transition-colors"
          >
            Sign out from all devices (including this one)
          </button>
        </form>
      </div>

      {message && (
        <p className="text-sm text-sage-600 dark:text-sage-400">{message}</p>
      )}
      <p className="text-xs text-warm-500 dark:text-warm-400">
        Use these options if you believe your account may have been used on a device you
        don&apos;t recognize.
      </p>
    </div>
  );
}

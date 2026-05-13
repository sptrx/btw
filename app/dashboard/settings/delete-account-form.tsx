"use client";

import { useState, useTransition } from "react";
import { deleteCurrentUser } from "@/actions/auth";

type Props = { userEmail: string };

export default function DeleteAccountForm({ userEmail }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSubmit = confirmText.trim() === "DELETE" && !pending;

  const cancel = () => {
    setExpanded(false);
    setConfirmText("");
    setPassword("");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await deleteCurrentUser(formData);
      // A successful delete redirects (server action throws NEXT_REDIRECT),
      // so we only get here on validation failures.
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="border-2 border-terracotta-300 dark:border-terracotta-700 bg-terracotta-50/30 dark:bg-terracotta-950/20 rounded-2xl p-5 max-w-md space-y-3">
      <div>
        <h3 className="font-semibold text-terracotta-800 dark:text-terracotta-200">
          Delete account
        </h3>
        <p className="text-sm text-warm-700 dark:text-warm-300 mt-1">
          Permanently remove your BTW account and all associated data — profile, posts,
          comments, likes, notifications, and channel memberships. This action cannot be
          undone.
        </p>
      </div>

      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="px-4 py-2.5 border-2 border-terracotta-400 dark:border-terracotta-600 text-terracotta-700 dark:text-terracotta-300 rounded-xl hover:bg-terracotta-100 dark:hover:bg-terracotta-950/40 font-medium transition-colors"
        >
          Delete my account…
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label
              htmlFor="delete_current_password"
              className="block text-sm font-medium mb-1 text-warm-700 dark:text-warm-300"
            >
              Current password
            </label>
            <input
              id="delete_current_password"
              name="current_password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password (leave blank if you use magic link/OAuth)"
              className="w-full px-4 py-2.5 border-2 border-warm-300 dark:border-warm-600 rounded-xl dark:bg-warm-800"
            />
            <p className="text-xs text-warm-500 mt-1">
              Required for email/password accounts ({userEmail || "your account email"}).
              OAuth users can leave this blank — your active session is your confirmation.
            </p>
          </div>
          <div>
            <label
              htmlFor="delete_confirm_text"
              className="block text-sm font-medium mb-1 text-warm-700 dark:text-warm-300"
            >
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </label>
            <input
              id="delete_confirm_text"
              name="confirm_text"
              type="text"
              required
              autoComplete="off"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-4 py-2.5 border-2 border-warm-300 dark:border-warm-600 rounded-xl dark:bg-warm-800 font-mono"
            />
          </div>
          {error && <p className="text-terracotta-600 text-sm">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="px-4 py-2.5 bg-terracotta-600 text-white rounded-xl hover:bg-terracotta-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? "Deleting…" : "Permanently delete account"}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="px-4 py-2.5 border-2 border-warm-300 dark:border-warm-600 rounded-xl hover:bg-warm-100 dark:hover:bg-warm-800 font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

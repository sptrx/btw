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
    <div className="max-w-md space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
      <div>
        <h3 className="font-semibold text-destructive">Delete account</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently remove your BTW account and all associated data — profile, posts,
          comments, likes, notifications, and channel memberships. This action cannot be
          undone.
        </p>
      </div>

      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-xl border border-destructive/30 px-5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          Delete my account…
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label
              htmlFor="delete_current_password"
              className="mb-1 block text-sm font-medium text-foreground"
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
              className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Required for email/password accounts ({userEmail || "your account email"}).
              OAuth users can leave this blank — your active session is your confirmation.
            </p>
          </div>
          <div>
            <label
              htmlFor="delete_confirm_text"
              className="mb-1 block text-sm font-medium text-foreground"
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
              className="w-full min-h-11 rounded-xl border border-input bg-background px-4 py-3 font-mono text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-destructive px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Permanently delete account"}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="rounded-xl border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

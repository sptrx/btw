"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Mic, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { authPrimaryButtonClass } from "@/lib/auth-form-styles";

type Role = "user" | "channel_author";

const roleOptions = [
  {
    value: "user" as const,
    title: "Regular user",
    description: "Browse, comment, and share content from channels you follow",
    Icon: User,
  },
  {
    value: "channel_author" as const,
    title: "Channel author",
    description: "Everything above, plus create and manage your own channels",
    Icon: Mic,
  },
];

export function OnboardingRoleForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role },
      });
      if (updateError) throw updateError;
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save your choice");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground mb-2">
          I&apos;ll be using Believe The Works as a
        </legend>
        <div className="flex flex-col gap-2">
          {roleOptions.map(({ value, title, description, Icon }) => {
            const selected = role === value;
            return (
              <label
                key={value}
                className={
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors focus-within:ring-2 focus-within:ring-ring " +
                  (selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-foreground/20 hover:bg-muted/50")
                }
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={selected}
                  onChange={() => setRole(value)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg " +
                    (selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")
                  }
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="flex-1 space-y-0.5">
                  <span className="block text-sm font-medium text-foreground">{title}</span>
                  <span className="block text-sm text-muted-foreground leading-snug">{description}</span>
                </span>
                <span
                  aria-hidden
                  className={
                    "mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors " +
                    (selected ? "border-primary bg-primary" : "border-input bg-background")
                  }
                >
                  {selected && <span className="size-1.5 rounded-full bg-primary-foreground" />}
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          You can always upgrade to a Channel author later from your account settings
        </p>
      </fieldset>
      {error && (
        <p role="alert" className="text-destructive text-sm rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2">
          {error}
        </p>
      )}
      <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
        {loading ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}

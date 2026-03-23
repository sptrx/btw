"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { authInputClass, authPrimaryButtonClass } from "@/lib/auth-form-styles";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"user" | "channel_author">("user");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) throw error;
      setMessage("Check your email for the confirmation link.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const invalid = !!error;

  return (
    <div className="max-w-md mx-auto mt-12 sm:mt-20">
      <div className="rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Create account</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Join a community built on faith and encouragement.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="signup-name" className="text-sm font-medium text-foreground">
              Full name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={authInputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="signup-email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-invalid={invalid}
              aria-describedby={invalid ? "signup-error" : undefined}
              className={authInputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="signup-password" className="text-sm font-medium text-foreground">
              Password <span className="font-normal text-muted-foreground">(min 6 characters)</span>
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              aria-invalid={invalid}
              aria-describedby={invalid ? "signup-error" : undefined}
              className={authInputClass}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground mb-2">Sign up as</legend>
            <div className="flex flex-col gap-3">
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md p-1 text-sm text-muted-foreground -m-1 focus-within:ring-2 focus-within:ring-ring">
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={role === "user"}
                  onChange={() => setRole("user")}
                  className="mt-1 accent-primary size-4 shrink-0"
                />
                <span>Regular user (browse, comment & share)</span>
              </label>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md p-1 text-sm text-muted-foreground -m-1 focus-within:ring-2 focus-within:ring-ring">
                <input
                  type="radio"
                  name="role"
                  value="channel_author"
                  checked={role === "channel_author"}
                  onChange={() => setRole("channel_author")}
                  className="mt-1 accent-primary size-4 shrink-0"
                />
                <span>Channel author (create & manage channels)</span>
              </label>
            </div>
          </fieldset>
          {error && (
            <p id="signup-error" role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          {message && (
            <p className="text-primary text-sm" role="status">
              {message}
            </p>
          )}
          <button type="submit" disabled={loading} className={authPrimaryButtonClass}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground text-center">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

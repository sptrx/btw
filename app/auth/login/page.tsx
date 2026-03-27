"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const msg = searchParams.get("message");
    if (msg === "signed_out_all") {
      setMessage("You have been signed out from all devices. Please sign in again.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const next = searchParams.get("next");
      window.location.href = next && next.startsWith("/") ? next : "/channel/browse";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const invalid = !!error;

  return (
    <div className="max-w-md mx-auto mt-12 sm:mt-20">
      <div className="btw-auth-panel">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Sign in</h1>
        <p className="text-muted-foreground text-sm mb-6">
          A safe space for faith, encouragement, and community.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate suppressHydrationWarning>
          <div className="space-y-2">
            <label htmlFor="login-email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-invalid={invalid}
              aria-describedby={invalid ? "login-error" : undefined}
              className="w-full min-h-11 px-4 py-3 rounded-xl border border-input bg-background text-base text-foreground placeholder:text-muted-foreground/60 sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:border-transparent aria-invalid:border-destructive"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="login-password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-invalid={invalid}
              aria-describedby={invalid ? "login-error" : undefined}
              className="w-full min-h-11 px-4 py-3 rounded-xl border border-input bg-background text-base text-foreground placeholder:text-muted-foreground/60 sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:border-transparent aria-invalid:border-destructive"
            />
          </div>
          <p className="text-right -mt-1">
            <Link
              href="/auth/forgot-password"
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              Forgot password?
            </Link>
          </p>
          {error && (
            <p id="login-error" role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          {message && (
            <p className="text-primary text-sm" role="status">
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-11 rounded-xl bg-primary text-primary-foreground font-medium text-base sm:text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors touch-manipulation"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-sm text-muted-foreground text-center">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto mt-12 sm:mt-20">
          <div className="btw-auth-panel">
            <div className="h-8 w-40 rounded-md bg-muted animate-pulse mb-2" />
            <div className="h-4 w-full max-w-sm rounded bg-muted/80 animate-pulse mb-6" />
            <div className="h-11 w-full rounded-xl bg-muted animate-pulse mb-4" />
            <div className="h-11 w-full rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

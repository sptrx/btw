"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export function AuthListener() {
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Redirect to login when session ends (timeout, token expired, refresh failed)
      if (event === "SIGNED_OUT") {
        const isAuthRoute =
          pathname.startsWith("/auth/login") ||
          pathname.startsWith("/auth/signup") ||
          pathname.startsWith("/auth/forgot-password") ||
          pathname === "/auth/callback" ||
          pathname === "/auth/reset-password";
        if (!isAuthRoute) {
          const next = encodeURIComponent(pathname);
          window.location.href = `/auth/login?next=${next}`;
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  return null;
}

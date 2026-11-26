"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setAccountRole } from "@/actions";

/** Accounts start as readers. A channel is granted when they publish or create one. */
export function FinishOnboarding() {
  const router = useRouter();

  useEffect(() => {
    void setAccountRole("user").finally(() => {
      router.replace("/");
      router.refresh();
    });
  }, [router]);

  return <p className="text-sm text-muted-foreground">Finishing your account...</p>;
}

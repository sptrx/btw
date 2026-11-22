"use client";

import { useEffect } from "react";

/** Registers the tiny service worker that makes the site installable. */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Install prompt is optional; the site still works in the browser. */
    });
  }, []);
  return null;
}

"use client";

import gsap from "gsap";
import { useLayoutEffect, type RefObject } from "react";

export type UsePointerTiltOptions = {
  maxRotateX?: number;
  maxRotateY?: number;
  parallaxRef?: RefObject<HTMLElement | null>;
  parallaxStrength?: number;
};

/**
 * Mouse-only 3D tilt (and optional x/y parallax on a child). Skipped when prefers-reduced-motion is set.
 */
export function usePointerTilt(
  linkRef: RefObject<HTMLElement | null>,
  tiltRef: RefObject<HTMLElement | null>,
  options?: UsePointerTiltOptions
): void {
  const maxRotateX = options?.maxRotateX ?? 9;
  const maxRotateY = options?.maxRotateY ?? 11;
  const parallaxRef = options?.parallaxRef;
  const parallaxStrength = options?.parallaxStrength ?? 7;

  useLayoutEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const link = linkRef.current;
    const tilt = tiltRef.current;
    if (!link || !tilt) return;

    const parallaxEl = parallaxRef?.current ?? null;

    gsap.set(tilt, { transformPerspective: 1100, transformOrigin: "center center" });

    const rotX = gsap.quickTo(tilt, "rotationX", { duration: 0.42, ease: "power3.out" });
    const rotY = gsap.quickTo(tilt, "rotationY", { duration: 0.42, ease: "power3.out" });

    const px = parallaxEl
      ? gsap.quickTo(parallaxEl, "xPercent", { duration: 0.55, ease: "power3.out" })
      : null;
    const py = parallaxEl
      ? gsap.quickTo(parallaxEl, "yPercent", { duration: 0.55, ease: "power3.out" })
      : null;

    const reset = () => {
      rotX(0);
      rotY(0);
      px?.(0);
      py?.(0);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const rect = link.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const nx = (x - 0.5) * 2;
      const ny = (y - 0.5) * 2;
      rotY(nx * -maxRotateY);
      rotX(-ny * maxRotateX);
      px?.(nx * -parallaxStrength);
      py?.(ny * -parallaxStrength);
    };

    link.addEventListener("pointermove", onMove);
    link.addEventListener("pointerleave", reset);
    link.addEventListener("pointercancel", reset);

    return () => {
      link.removeEventListener("pointermove", onMove);
      link.removeEventListener("pointerleave", reset);
      link.removeEventListener("pointercancel", reset);
      reset();
      gsap.set(tilt, { clearProps: "rotationX,rotationY,transformPerspective,transformOrigin" });
      if (parallaxEl) gsap.set(parallaxEl, { clearProps: "xPercent,yPercent" });
    };
  }, [maxRotateX, maxRotateY, parallaxStrength]);
}

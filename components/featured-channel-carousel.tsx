"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePointerTilt } from "@/hooks/use-pointer-tilt";
import { cn } from "@/lib/utils";
import type { LandingFeaturedCard } from "@/actions/landing";

gsap.registerPlugin(ScrollTrigger);

function cardImageUnoptimized(src: string) {
  return !src.includes("images.unsplash.com");
}

type Props = {
  items: LandingFeaturedCard[];
  displayFontClassName: string;
};

const SLIDE_CLASSES =
  "featured-slide-root snap-start shrink-0 w-[min(88vw,20rem)] sm:w-[min(72vw,22rem)] md:w-[min(55%,24rem)] lg:w-[min(48%,26rem)] max-w-none";

function slideFocusT(cx: number, viewMid: number, halfSpan: number): number {
  const d = Math.abs(cx - viewMid);
  return gsap.utils.clamp(0, 1, 1 - d / halfSpan);
}

function FeaturedCarouselSlide({
  item,
  displayFontClassName,
  index,
  total,
}: {
  item: LandingFeaturedCard;
  displayFontClassName: string;
  index: number;
  total: number;
}) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  usePointerTilt(linkRef, tiltRef, {
    parallaxRef,
    maxRotateX: 9,
    maxRotateY: 11,
    parallaxStrength: 7,
  });

  return (
    <div className={SLIDE_CLASSES} aria-label={`${index + 1} of ${total}`}>
      <div className="featured-slide-panel h-full will-change-transform motion-reduce:transform-none">
        <Link
          ref={linkRef}
          href={item.href}
          className="group relative block h-full min-h-[200px] aspect-[5/3] sm:aspect-[4/3] md:aspect-[3/4] w-full rounded-2xl no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [perspective:1100px] motion-reduce:hover:translate-y-0"
        >
          <div
            ref={tiltRef}
            className={cn(
              "featured-slide-tilt relative h-full w-full transform-gpu will-change-transform overflow-hidden rounded-2xl",
              "border border-border/50 bg-muted shadow-sm transition-shadow duration-300",
              "motion-safe:group-hover:shadow-xl motion-reduce:transition-none"
            )}
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="featured-slide-media-scale absolute inset-0 overflow-hidden">
              <div
                ref={parallaxRef}
                className="absolute inset-[-12%] will-change-transform motion-reduce:relative motion-reduce:inset-0"
              >
                <div className="relative h-full w-full">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 88vw, (max-width: 1024px) 55vw, 380px"
                    unoptimized={cardImageUnoptimized(item.image)}
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
            <div
              className={cn("absolute inset-0 bg-gradient-to-t opacity-90 z-[1]", item.accent)}
              aria-hidden
            />
            <div className="absolute inset-0 z-[2] flex flex-col justify-end p-5 sm:p-6 md:p-7 text-white pointer-events-none">
              <p className="text-xs font-medium tracking-wider uppercase text-white/70">{item.subtitle}</p>
              <p
                className={cn(
                  displayFontClassName,
                  "mt-2 text-xl sm:text-2xl md:text-3xl font-normal leading-tight"
                )}
              >
                {item.title}
              </p>
              <span className="mt-3 inline-flex items-center text-sm font-medium opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 motion-reduce:opacity-100 motion-reduce:translate-y-0">
                Open
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function FeaturedChannelCarousel({ items, displayFontClassName }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(() => items.length > 1);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || items.length === 0) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    setCanPrev(scrollLeft > 4);
    setCanNext(scrollLeft < maxScroll - 4);

    const slideWidth =
      el.children.length > 0 ? (el.children[0] as HTMLElement).getBoundingClientRect().width + 16 : 1;
    const idx = Math.round(scrollLeft / slideWidth);
    setActiveIndex(Math.min(Math.max(0, idx), items.length - 1));
  }, [items.length]);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [items, updateScrollState]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || items.length === 0) return;

    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || items.length < 2) {
      return;
    }

    let raf = 0;

    const applyFocus = () => {
      const roots = gsap.utils.toArray<HTMLElement>(".featured-slide-root", scroller);
      const scRect = scroller.getBoundingClientRect();
      const viewMid = scRect.left + scRect.width / 2;
      const halfSpan = Math.max(scRect.width * 0.52, 160);

      roots.forEach((root) => {
        const panel = root.querySelector<HTMLElement>(".featured-slide-panel");
        const mediaScale = root.querySelector<HTMLElement>(".featured-slide-media-scale");
        if (!panel) return;

        const r = root.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const t = slideFocusT(cx, viewMid, halfSpan);

        gsap.set(panel, {
          scale: 0.9 + 0.1 * t,
          opacity: 0.5 + 0.5 * t,
          y: 18 * (1 - t),
        });

        if (mediaScale) {
          gsap.set(mediaScale, { scale: 1.12 - 0.12 * t });
        }
      });
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(applyFocus);
    };

    const scrollRange = () => Math.max(1, scroller.scrollWidth - scroller.clientWidth);

    const st = ScrollTrigger.create({
      trigger: scroller,
      scroller,
      horizontal: true,
      start: "left left",
      end: () => `+=${scrollRange()}`,
      onUpdate: schedule,
    });

    applyFocus();

    scroller.addEventListener("scroll", schedule, { passive: true });

    const ro = new ResizeObserver(() => {
      ScrollTrigger.refresh();
      schedule();
    });
    ro.observe(scroller);

    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", schedule);
      st.kill();
      ro.disconnect();

      const roots = gsap.utils.toArray<HTMLElement>(".featured-slide-root", scroller);
      roots.forEach((root) => {
        const panel = root.querySelector<HTMLElement>(".featured-slide-panel");
        const mediaScale = root.querySelector<HTMLElement>(".featured-slide-media-scale");
        if (panel) gsap.set(panel, { clearProps: "scale,opacity,y" });
        if (mediaScale) gsap.set(mediaScale, { clearProps: "scale" });
      });
    };
  }, [items]);

  const scrollByDir = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el || el.children.length === 0) return;
    const first = el.children[0] as HTMLElement;
    const gap = 16;
    const amount = first.getBoundingClientRect().width + gap;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  const scrollToIndex = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el || el.children.length === 0) return;
    const child = el.children[i] as HTMLElement;
    child.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  }, []);

  if (items.length === 0) return null;

  const showNav = items.length > 1;

  return (
    <div className="w-full min-w-0">
      <p className="mb-3 text-center text-xs font-medium tracking-wide text-muted-foreground sm:text-left">
        Swipe or use arrows to browse featured channels
      </p>

      <div className="relative py-1 sm:px-11 md:px-12">
        <div
          ref={scrollerRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Featured channels"
          className={cn(
            "featured-horizontal-scroller flex gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2",
            "snap-x snap-mandatory",
            "scroll-pl-1 scroll-pr-1 sm:scroll-pl-0 sm:scroll-pr-0",
            "[scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
          )}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              scrollByDir(-1);
            }
            if (e.key === "ArrowRight") {
              e.preventDefault();
              scrollByDir(1);
            }
          }}
        >
          {items.map((item, index) => (
            <FeaturedCarouselSlide
              key={`${item.href}::${item.title}`}
              item={item}
              displayFontClassName={displayFontClassName}
              index={index}
              total={items.length}
            />
          ))}
        </div>

        {showNav && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-10 items-center justify-start sm:flex">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="pointer-events-auto size-10 rounded-full border border-border/80 bg-background/95 shadow-md hover:bg-background disabled:opacity-40"
                onClick={() => scrollByDir(-1)}
                disabled={!canPrev}
                aria-label="Previous featured channel"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </Button>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-10 items-center justify-end sm:flex">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="pointer-events-auto size-10 rounded-full border border-border/80 bg-background/95 shadow-md hover:bg-background disabled:opacity-40"
                onClick={() => scrollByDir(1)}
                disabled={!canNext}
                aria-label="Next featured channel"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </Button>
            </div>
          </>
        )}
      </div>

      {showNav && (
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <div className="flex gap-2 sm:hidden">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-full"
              onClick={() => scrollByDir(-1)}
              disabled={!canPrev}
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 rounded-full"
              onClick={() => scrollByDir(1)}
              disabled={!canNext}
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex justify-center gap-2" role="group" aria-label="Featured slides">
            {items.map((item, i) => (
              <button
                key={`dot-${item.href}-${item.title}`}
                type="button"
                onClick={() => scrollToIndex(i)}
                className={cn(
                  "size-2.5 rounded-full transition-colors",
                  i === activeIndex ? "bg-primary" : "bg-muted-foreground/40 hover:bg-muted-foreground/70"
                )}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === activeIndex ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

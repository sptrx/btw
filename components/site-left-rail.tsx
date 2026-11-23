import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, ShieldCheck } from "lucide-react";
import { LandingHeroSlogan } from "@/components/landing-hero-slogan";
import { Button } from "@/components/ui/button";
import { btwDisplayFont } from "@/lib/btw-ui";
import { cn } from "@/lib/utils";

export function SiteLeftRail({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <aside className="sticky top-[calc(var(--header-bar-height)+0.75rem)] hidden max-h-[calc(100dvh-var(--header-bar-height)-1.5rem)] overflow-y-auto lg:block">
      <section className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        <div className="relative h-28">
          <Image
            src="/sunrise-hero.jpg"
            alt=""
            fill
            priority
            sizes="260px"
            className="object-cover object-[50%_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20" />
          <p className="absolute inset-x-3 bottom-3 text-xs leading-relaxed text-amber-50">
            Weigh the actions and evidence of Jesus Christ when words alone are hard to accept. John 10:38
          </p>
        </div>
        <div className="space-y-3 p-3">
          <LandingHeroSlogan className={cn(btwDisplayFont, "text-lg leading-snug text-foreground")} />
          <p className="text-sm italic leading-relaxed text-foreground/90">
            As it is written, they overcame by the word of their testimony.
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Sign up, create your channel, and share your story of what God has done through posts, photos, podcasts, or video.
          </p>
          <div className="flex flex-col gap-2">
            {!isLoggedIn ? (
              <Button asChild size="sm" className="rounded-full">
                <Link href="/auth/signup">
                  Get started
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link href="/channel/browse">
                <Play className="mr-1.5 h-3.5 w-3.5 fill-current" aria-hidden />
                Browse channels
              </Link>
            </Button>
          </div>
          <p className="inline-flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            All content moderated by AI. Safe for every age.
          </p>
        </div>
      </section>
    </aside>
  );
}

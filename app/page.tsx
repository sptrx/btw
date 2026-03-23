import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="relative py-12 text-center sm:py-20 md:py-24" aria-labelledby="home-heading">
      <h1 id="home-heading" className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
        BTW
      </h1>
      <p className="text-base font-medium text-muted-foreground sm:text-lg mb-2 tracking-tight px-1">
        Testify Boldly: In a Space Guarded by Grace
      </p>
      <p className="text-sm text-muted-foreground/90 mb-10 max-w-md mx-auto sm:mb-12">
        Revelation 12:11
      </p>
      <p className="text-muted-foreground mb-10 max-w-lg mx-auto text-pretty px-1">
        Explore channels with videos, podcasts, articles, and discussions. Sign up
        to comment and share. AI-powered moderation keeps content safe.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <Button asChild size="lg" className="min-h-11 min-w-[10rem] touch-manipulation">
          <Link href="/auth/signup">Get started</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="min-h-11 min-w-[10rem] touch-manipulation">
          <Link href="/auth/login">Sign in</Link>
        </Button>
      </div>
    </section>
  );
}

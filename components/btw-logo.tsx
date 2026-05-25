import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_WIDTH = 627;
const LOGO_HEIGHT = 111;

const sizeClassName =
  "h-auto max-h-9 w-full max-w-[min(100%,13.5rem)] object-contain object-left sm:max-h-10 md:max-w-[14rem] lg:max-w-[17rem]";

type Props = {
  className?: string;
  /** When set, wraps the logo in a home link. */
  href?: string;
  linkClassName?: string;
  priority?: boolean;
};

export function BtwLogo({ className, href, linkClassName, priority = false }: Props) {
  const images = (
    <>
      <Image
        src="/assets/btw-logo-light.svg"
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={priority}
        aria-hidden
        className={cn(sizeClassName, "dark:hidden", className)}
      />
      <Image
        src="/assets/btw-logo-dark.svg"
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={priority}
        aria-hidden
        className={cn(sizeClassName, "hidden dark:block", className)}
      />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={linkClassName} aria-label="Believe The Works home">
        {images}
      </Link>
    );
  }

  return (
    <span className={cn("relative inline-flex min-w-0", className)} aria-label="Believe The Works">
      {images}
    </span>
  );
}

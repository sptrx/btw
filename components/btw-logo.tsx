import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Matches viewBox of `/public/assets/btw-logo-*.svg` (v7 wordmark). */
const LOGO_WIDTH = 551;
const LOGO_HEIGHT = 72;

const sizeClassNames = {
  default:
    "h-auto max-h-9 w-full max-w-[min(100%,13.5rem)] object-contain object-left sm:max-h-10 md:max-w-[14rem] lg:max-w-[17rem]",
  header:
    "h-10 w-auto max-w-[min(100%,10.5rem)] object-contain object-left sm:h-12 sm:max-w-[14rem] lg:h-[3.25rem] lg:max-w-[18rem]",
} as const;

type Props = {
  className?: string;
  /** When set, wraps the logo in a home link. */
  href?: string;
  linkClassName?: string;
  priority?: boolean;
  size?: keyof typeof sizeClassNames;
};

export function BtwLogo({
  className,
  href,
  linkClassName,
  priority = false,
  size = "default",
}: Props) {
  const imageClassName = sizeClassNames[size];

  const images = (
    <>
      <Image
        src="/assets/btw-logo-light.svg"
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={priority}
        aria-hidden
        className={cn(imageClassName, "dark:hidden", className)}
      />
      <Image
        src="/assets/btw-logo-dark.svg"
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={priority}
        aria-hidden
        className={cn(imageClassName, "hidden dark:block", className)}
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

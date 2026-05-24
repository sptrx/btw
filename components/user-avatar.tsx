import Image from "next/image";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<Size, string> = {
  sm: "size-8 text-xs",
  md: "size-9 text-sm",
  lg: "size-16 text-lg",
  xl: "size-24 text-2xl",
};

type Props = {
  name: string;
  avatarUrl?: string | null;
  size?: Size;
  className?: string;
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({ name, avatarUrl, size = "md", className }: Props) {
  const label = name.trim() || "Member";
  const cls = cn(
    "relative shrink-0 overflow-hidden rounded-full bg-primary/10 font-semibold text-primary",
    sizeClasses[size],
    className
  );

  if (avatarUrl?.trim()) {
    return (
      <span className={cls}>
        <Image
          src={avatarUrl}
          alt=""
          fill
          sizes={size === "xl" ? "96px" : size === "lg" ? "64px" : "36px"}
          className="object-cover"
          unoptimized
        />
      </span>
    );
  }

  return (
    <span className={cn(cls, "inline-flex items-center justify-center")} aria-hidden>
      {initialsFrom(label)}
    </span>
  );
}

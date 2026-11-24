import { BookOpen, Compass, Hash, HandHeart, Home, MessageCircle, type LucideIcon } from "lucide-react";
import type { SiteNavKey } from "@/lib/site-nav";

const ICONS: Record<SiteNavKey, LucideIcon> = {
  home: Home,
  explore: Compass,
  channels: Hash,
  prayer: HandHeart,
  bible: BookOpen,
  ask: MessageCircle,
};

export function SiteNavIcon({ name, className }: { name: SiteNavKey; className?: string }) {
  const Icon = ICONS[name];
  return <Icon className={className} aria-hidden />;
}

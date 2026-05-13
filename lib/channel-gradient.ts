/**
 * Calm, muted gradient palette used as the fallback banner for channels
 * without a `banner_image_url`. Keep these literal so Tailwind's JIT
 * scanner can discover them; never build the class names dynamically.
 */
export const CHANNEL_GRADIENTS = [
  "from-stone-300 to-stone-500",
  "from-emerald-300 to-emerald-600",
  "from-sky-300 to-sky-600",
  "from-amber-300 to-amber-600",
  "from-rose-300 to-rose-500",
  "from-violet-300 to-violet-600",
] as const;

export type ChannelGradient = (typeof CHANNEL_GRADIENTS)[number];

/**
 * Deterministically pick a gradient for a channel from its slug (preferred)
 * or any other stable seed. Same input always yields the same gradient so
 * the visual identity stays stable across renders and devices.
 *
 * Uses a simple djb2-style 32-bit hash — adequate for bucketing into 6 slots.
 */
export function getChannelGradient(seed: string | null | undefined): ChannelGradient {
  const s = seed?.trim() ?? "";
  if (!s) return CHANNEL_GRADIENTS[0];
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash + s.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % CHANNEL_GRADIENTS.length;
  return CHANNEL_GRADIENTS[idx];
}

/** OKLCH (CSS Color 4) to linear sRGB, then WCAG relative luminance. */
export function oklchToLinear(L: number, C: number, H: number): [number, number, number] {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function relativeLuminance(linear: [number, number, number]): number {
  const [r, g, b] = linear.map(clamp01);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(
  foreground: [number, number, number],
  background: [number, number, number]
): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

export function parseOklch(value: string): [number, number, number] {
  const match = value.trim().match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/);
  if (!match) throw new Error(`Not an oklch color: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

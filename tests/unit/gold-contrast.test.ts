import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, oklchToLinear, parseOklch } from "@/lib/gold-contrast";

function block(css: string, selector: string): string {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`Missing ${selector}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error(`Unclosed ${selector}`);
}

function token(cssBlock: string, name: string): [number, number, number] {
  const match = cssBlock.match(new RegExp(`${name}:\\s*(oklch\\([^)]+\\))`));
  if (!match) throw new Error(`Missing ${name}`);
  return parseOklch(match[1]);
}

describe("dark gold accent", () => {
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  const dark = block(css, "Dark: warm espresso");
  const root = block(css, "Light: warm paper");

  it("keeps gold text above WCAG AA on the dark page and cards", () => {
    const gold = token(dark, "--primary");
    const background = token(dark, "--background");
    const card = token(dark, "--card");
    expect(contrastRatio(oklchToLinear(...gold), oklchToLinear(...background))).toBeGreaterThan(4.5);
    expect(contrastRatio(oklchToLinear(...gold), oklchToLinear(...card))).toBeGreaterThan(4.5);
  });

  it("keeps button labels readable on the gold fill", () => {
    for (const source of [dark, root]) {
      const fill = token(source, "--primary");
      const label = token(source, "--primary-foreground");
      expect(contrastRatio(oklchToLinear(...label), oklchToLinear(...fill))).toBeGreaterThan(4.5);
    }
  });
});

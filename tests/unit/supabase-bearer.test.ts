import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));

import { bearerTokenFrom } from "@/utils/supabase/server";

describe("bearerTokenFrom", () => {
  it("extracts the token from an Authorization header", () => {
    expect(bearerTokenFrom("Bearer abc.def.ghi")).toBe("abc.def.ghi");
    expect(bearerTokenFrom("bearer abc")).toBe("abc");
  });

  it("ignores missing or malformed headers", () => {
    expect(bearerTokenFrom(null)).toBeNull();
    expect(bearerTokenFrom("Basic abc")).toBeNull();
    expect(bearerTokenFrom("Bearer ")).toBeNull();
    expect(bearerTokenFrom("Bearer a b")).toBeNull();
  });
});

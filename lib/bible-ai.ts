import "server-only";

import { bibleAiServerBaseUrl } from "@/lib/bible-ai-config";

function baseUrl(): string {
  return bibleAiServerBaseUrl();
}

function apiKey(): string {
  return (process.env.BIBLE_AI_API_KEY ?? "").trim();
}

export type ScriptureGuideInput = {
  message: string;
  threadContext: string;
  pageContext?: string;
  translationId?: string;
};

/**
 * Server-to-server call to bible-ai `/api/v1/guide`.
 * Set BIBLE_AI_BASE_URL (e.g. http://localhost:3040) for local/dev; production defaults to the hosted
 * bible-ai origin in bible-ai-config. Optionally set BIBLE_AI_API_KEY to match bible-ai's shared secret.
 */
export async function fetchScriptureGuideReply(
  input: ScriptureGuideInput
): Promise<{ response: string } | { error: string }> {
  const base = baseUrl();
  if (!base) {
    return {
      error:
        "Scripture guide URL is not configured. Set BIBLE_AI_BASE_URL for local development.",
    };
  }

  const url = `${base}/api/v1/guide`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = apiKey();
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: input.message,
        threadContext: input.threadContext,
        pageContext: input.pageContext,
        translationId: input.translationId ?? "kjv",
      }),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    const isTimeout = e instanceof Error && e.name === "AbortError";
    return { error: isTimeout ? "Scripture guide timed out (>15 s). Your comment was posted." : `Scripture guide unreachable: ${msg}` };
  } finally {
    clearTimeout(timeout)
  }

  const data = (await res.json()) as {
    error?: string;
    response?: string;
    hint?: string;
  };

  if (!res.ok) {
    const detail = data.hint ? `${data.error ?? "Error"}\n${data.hint}` : data.error ?? "Guide request failed";
    return { error: detail };
  }

  if (!data.response?.trim()) {
    return { error: "Empty response from Scripture guide." };
  }

  return { response: data.response.trim() };
}

export function isScriptureGuideConfigured(): boolean {
  return baseUrl().length > 0;
}

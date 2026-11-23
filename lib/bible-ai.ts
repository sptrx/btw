import "server-only";

import { bibleAiServerBaseUrl } from "@/lib/bible-ai-config";

function baseUrl(): string {
  return bibleAiServerBaseUrl();
}

function apiKey(): string {
  return (process.env.BIBLE_AI_API_KEY ?? "").trim();
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const key = apiKey();
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

export type BibleAiCitation = {
  book: string;
  abbrev: string;
  chapter: number;
  verse: number;
};

export type BibleAiFeature = "commentary" | "explain";

export type ScriptureGuideInput = {
  userId: string;
  message: string;
  threadContext: string;
  pageContext?: string;
  translationId?: string;
};

export type BibleExplanationInput = {
  userId: string;
  message: string;
  translationId?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
};

type BibleAiSuccess = {
  response: string;
  citations?: BibleAiCitation[];
};

type BibleAiError = { error: string };

async function requestBibleAi<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: Record<string, unknown> },
  timeoutMs = 15_000,
): Promise<T | BibleAiError> {
  const base = baseUrl();
  if (!base) {
    return {
      error:
        "xgesis URL is not configured. Set BIBLE_AI_BASE_URL for local development.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: init.method,
      headers: authHeaders(),
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    const isTimeout = e instanceof Error && e.name === "AbortError";
    return {
      error: isTimeout
        ? `xgesis request timed out (>${Math.round(timeoutMs / 1000)} s).`
        : `xgesis unreachable: ${msg}`,
    };
  } finally {
    clearTimeout(timeout);
  }

  const data = (await res.json().catch(() => null)) as
    | (T & { error?: string; hint?: string })
    | null;

  if (!res.ok || !data) {
    const detail = data?.hint
      ? `${data.error ?? "Error"}\n${data.hint}`
      : data?.error ?? "Request failed";
    return { error: detail };
  }

  if (typeof data.error === "string" && data.error.trim()) {
    return { error: data.error };
  }

  return data as T;
}

async function postBibleAi<TBody extends Record<string, unknown>>(
  path: string,
  body: TBody,
  timeoutMs = 15_000,
): Promise<BibleAiSuccess | BibleAiError> {
  const data = await requestBibleAi<BibleAiSuccess>(path, { method: "POST", body }, timeoutMs);
  if ("error" in data) return data;
  if (!data.response?.trim()) {
    return { error: "Empty response from xgesis." };
  }
  return {
    response: data.response.trim(),
    citations: data.citations,
  };
}

/**
 * Thread commentary for comment threads (BTW Scripture guide checkbox).
 */
export async function fetchScriptureGuideReply(
  input: ScriptureGuideInput,
): Promise<{ response: string } | { error: string }> {
  const result = await postBibleAi("/api/v1/commentary", {
    userId: input.userId,
    feature: "commentary",
    message: input.message,
    threadContext: input.threadContext,
    pageContext: input.pageContext,
    translationId: input.translationId ?? "kjv",
  });

  if ("error" in result) return result;
  return { response: result.response };
}

/**
 * Passage, theme, or verse explanations with optional short conversation history.
 */
export async function fetchBibleExplanation(
  input: BibleExplanationInput,
): Promise<BibleAiSuccess | BibleAiError> {
  return postBibleAi("/api/v1/explain", {
    userId: input.userId,
    feature: "explain",
    message: input.message,
    translationId: input.translationId ?? "kjv",
    messages: input.messages ?? [],
  });
}

export function isScriptureGuideConfigured(): boolean {
  return baseUrl().length > 0;
}

export type BibleTranslation = { id: string; label: string };

export type BibleBookSummary = {
  abbrev: string;
  title: string;
  chapterCount: number;
  index: number;
};

export type BibleChapterVerse = { verse: number; text: string };

export type BibleChapterNav = {
  abbrev: string;
  bookTitle: string;
  chapter: number;
};

export type BibleChapter = {
  translationId: string;
  translationLabel: string;
  abbrev: string;
  bookTitle: string;
  chapter: number;
  chapterCount: number;
  verses: BibleChapterVerse[];
  prev: BibleChapterNav | null;
  next: BibleChapterNav | null;
};

/** Free-rights translations available for the Bible reader. */
export async function fetchBibleTranslations(): Promise<
  { translations: BibleTranslation[] } | BibleAiError
> {
  return requestBibleAi<{ translations: BibleTranslation[] }>("/api/v1/translations", {
    method: "GET",
  });
}

export async function fetchBibleBooks(
  translationId = "kjv",
): Promise<
  | { translationId: string; translationLabel: string; books: BibleBookSummary[] }
  | BibleAiError
> {
  const q = new URLSearchParams({ translationId });
  return requestBibleAi(`/api/v1/books?${q.toString()}`, { method: "GET" });
}

export async function fetchBibleChapter(input: {
  translationId?: string;
  book: string;
  chapter: number;
}): Promise<BibleChapter | BibleAiError> {
  const q = new URLSearchParams({
    translationId: input.translationId?.trim() || "kjv",
    book: input.book.trim(),
    chapter: String(input.chapter),
  });
  return requestBibleAi<BibleChapter>(`/api/v1/chapter?${q.toString()}`, {
    method: "GET",
  });
}

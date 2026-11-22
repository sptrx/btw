import { config } from '@/lib/config';
import { supabase } from '@/lib/supabase';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }

  get needsSignIn() {
    return this.status === 401;
  }
}

async function post<T>(path: string, body: unknown): Promise<T & Record<string, unknown>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  let res: Response;
  try {
    res = await fetch(`${config.apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    throw new ApiError("Can't reach Believe The Works. Check your connection and try again.", 0);
  }

  const json = (await res.json().catch(() => null)) as (T & Record<string, unknown>) | null;
  if (!res.ok || !json) {
    const message = typeof json?.error === 'string' ? json.error : 'Something went wrong. Please try again.';
    throw new ApiError(message, res.status);
  }
  return json;
}

/** Calls one of the website's mobile actions (`POST /api/mobile/<action>`). */
export async function api<T>(action: string, args: Record<string, unknown> = {}): Promise<T> {
  const json = await post<{ data: T }>(`/api/mobile/${action}`, args);
  return json.data;
}

export type BibleAnswer = {
  response: string;
  citations: unknown[];
  remaining?: number;
};

export function askBible(message: string, messages: { role: 'user' | 'assistant'; content: string }[]) {
  return post<BibleAnswer>('/api/bible-ai/ask', { message, messages, translationId: 'kjv' });
}

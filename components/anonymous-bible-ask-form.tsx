"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: "user" | "assistant"; content: string };

type Props = {
  initialQuestion?: string;
  className?: string;
  /** Compact layout for /explore embed */
  compact?: boolean;
};

export function AnonymousBibleAskForm({
  initialQuestion = "",
  className,
  compact = false,
}: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState(initialQuestion);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const conversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuestion) setInput(initialQuestion);
  }, [initialQuestion]);

  const scrollConversationToBottom = useCallback(() => {
    const el = conversationRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, []);

  /** Keep new messages visible inside the panel; avoid scrolling the whole page to an inner anchor. */
  useEffect(() => {
    if (messages.length === 0) return;
    scrollConversationToBottom();
  }, [messages, loading, scrollConversationToBottom]);

  /** After an answer loads, bring the conversation panel into view (user is often still at the form). */
  useEffect(() => {
    if (loading || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last?.role !== "assistant") return;
    scrollConversationToBottom();
    conversationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading, messages, scrollConversationToBottom]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text };
    const prior = messages;
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const res = await fetch("/api/bible-ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          translationId: "kjv",
          messages: prior.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        hint?: string;
        response?: string;
        anonymous?: boolean;
      };
      if (!res.ok) {
        const err = data.error ?? "Request failed";
        const hint = data.hint ? `\n\n${data.hint}` : "";
        throw new Error(`${err}${hint}`);
      }
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: String(data.response ?? ""),
        },
      ]);
      setAnswered(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send();
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {messages.length > 0 ? (
        <div
          ref={conversationRef}
          className={cn(
            "btw-surface mb-4 max-h-[min(32rem,65vh)] overflow-y-auto overscroll-contain rounded-xl border border-border/70 p-4 space-y-4 scroll-smooth",
            compact && "max-h-72",
          )}
          role="log"
          aria-live="polite"
          aria-label="Bible Q&A conversation"
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "text-sm leading-relaxed",
                m.role === "user"
                  ? "ml-4 rounded-lg bg-primary/10 px-3 py-2 text-foreground"
                  : "mr-2 text-muted-foreground",
              )}
            >
              {m.role === "user" ? (
                <p className="font-medium text-foreground/90">You</p>
              ) : null}
              <p className="mt-0.5 whitespace-pre-wrap">{m.content}</p>
            </div>
          ))}
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Thinking…
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="mb-3 text-sm text-destructive whitespace-pre-wrap" role="alert">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <label className="sr-only" htmlFor="bible-ask-input">
          Your Bible question
        </label>
        <textarea
          id="bible-ask-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about the Bible…"
          rows={compact ? 2 : 3}
          className="min-h-[2.75rem] flex-1 resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-full sm:min-w-[7rem]"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <>
              Ask
              <Send className="ml-2 size-4" aria-hidden />
            </>
          )}
        </Button>
      </form>

      {answered ? (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
          <p className="font-medium">Want to save this conversation and ask more?</p>
          <p className="mt-1 text-muted-foreground">
            Create a free account — no pressure, and you can keep exploring at your own pace.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" className="rounded-full">
              <Link href="/auth/signup">Create free account</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="rounded-full">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <p className="mt-2 text-xs text-muted-foreground">
        Answers are AI-assisted and meant for exploration, not personal pastoral care. You can ask a
        few questions per hour without signing in.
      </p>
    </div>
  );
}

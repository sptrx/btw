/**
 * AI Content Moderation for Christian faith-based platform
 * Supports OpenRouter, Google AI (Gemini), and OpenAI
 * Filters: porn, inappropriate content, blasphemy, anti-Christian content
 */

const FAITH_BASED_SYSTEM_PROMPT = `You are a content moderator for a Christian faith-based social platform. Your job is to evaluate if user-generated content is appropriate.

REJECT (return FLAGGED) if the content contains:
- Pornographic or sexually explicit material
- Profanity, vulgar language, or crude humor
- Blasphemy or mockery of God, Jesus, or the Bible
- Hate speech, bullying, or harassment
- Promotion of violence, drugs, or illegal activity
- Anti-Christian rhetoric or mockery of the faith
- Spam, scam attempts, or fake promotional content
- Content that could harm or mislead others spiritually

ALLOW (return OK) if the content:
- Is respectful and builds others up
- Shares faith, scripture, testimony, or encouragement
- Asks genuine questions about faith
- Discusses topics respectfully even if disagreeing
- Is neutral or off-topic but not harmful

Respond with ONLY one word: FLAGGED or OK.`;

export type ModerationResult = {
  allowed: boolean;
  reason?: string;
};

async function moderateWithOpenRouter(text: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: FAITH_BASED_SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      max_tokens: 10,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error: ${err}`);
  }

  const data = await res.json();
  const reply = (data.choices?.[0]?.message?.content || "").trim().toUpperCase();
  const flagged = reply.includes("FLAGGED");

  return {
    allowed: !flagged,
    reason: flagged ? "Content does not meet our community standards." : undefined,
  };
}

async function moderateWithGoogleAI(text: string): Promise<ModerationResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${FAITH_BASED_SYSTEM_PROMPT}\n\nUser content to evaluate:\n${text}` }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google AI API error: ${err}`);
  }

  const data = await res.json();
  const reply = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim().toUpperCase();
  const flagged = reply.includes("FLAGGED");

  return {
    allowed: !flagged,
    reason: flagged ? "Content does not meet our community standards." : undefined,
  };
}

async function moderateWithOpenAI(text: string): Promise<ModerationResult> {
  const { default: OpenAI } = await import("openai");
  const openai = new (OpenAI as any)({ apiKey: process.env.OPENAI_API_KEY });
  const mod = await openai.moderations.create({ input: text });
  const flagged = mod.results?.[0]?.flagged ?? false;
  return {
    allowed: !flagged,
    reason: flagged ? "Your post contains inappropriate content." : undefined,
  };
}

export async function moderateContent(text: string): Promise<ModerationResult> {
  const trimmed = text?.trim() || "";
  if (!trimmed) return { allowed: false, reason: "Content cannot be empty." };

  // Priority: OpenRouter > Google AI > OpenAI
  if (process.env.OPENROUTER_API_KEY) {
    return moderateWithOpenRouter(trimmed);
  }
  if (process.env.GOOGLE_AI_API_KEY) {
    return moderateWithGoogleAI(trimmed);
  }
  if (process.env.OPENAI_API_KEY) {
    return moderateWithOpenAI(trimmed);
  }

  throw new Error(
    "No AI provider configured. Set OPENROUTER_API_KEY, GOOGLE_AI_API_KEY, or OPENAI_API_KEY."
  );
}

/**
 * Simple fake-user / spam heuristic
 * Flags new users who post excessively in a short window
 */
export function checkFakeUserHeuristic(userId: string, postCountLast24h: number): boolean {
  const maxPostsPerDay = 20;
  return postCountLast24h >= maxPostsPerDay;
}

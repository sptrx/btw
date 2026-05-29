/**
 * AI content moderation for Believe The Works — safety + mission fit.
 * Supports OpenRouter (recommended), Google AI, and OpenAI fallback.
 */

import {
  MODERATION_UNAVAILABLE_MESSAGE,
  moderationUserMessage,
  type ModerationCategory,
} from "@/lib/moderation-messages";

export type { ModerationCategory };

export type ModerationResult = {
  allowed: boolean;
  /** Edge-case content held for human review instead of auto-publish. */
  pendingReview?: boolean;
  reason?: string;
  category?: ModerationCategory;
  suggestEdit?: string;
};

export type ModerateContentOptions = {
  /** Post type — discussions are held to a stricter mission bar. */
  contentType?: "video" | "podcast" | "article" | "discussion" | "comment" | "prayer";
  /**
   * User requested an AI Scripture guide reply — allow respectful Bible questions,
   * passage reflection, and article discussion without requiring full testimony tone.
   */
  scriptureGuideRequest?: boolean;
};

type AiVerdict = {
  safety: "ok" | "flagged";
  mission_fit:
    | "on_mission"
    | "borderline"
    | "off_topic"
    | "political"
    | "pure_opinion"
    | "spam";
  confidence: number;
  needs_review?: boolean;
  suggest_edit?: string | null;
};

const MISSION_SYSTEM_PROMPT = `You are a content moderator for Believe The Works (believetheworks.org), a Christian faith platform for testimony and encouragement.

Mission: "Share your witness. Strengthen another." Content should center on faith, testimony, scripture in context, prayer, worship, or how God met someone in their life.

REJECT (safety = "flagged") for:
- Pornographic or sexually explicit material
- Profanity, vulgar language, crude humor
- Blasphemy or mockery of God, Jesus, or the Bible
- Hate speech, bullying, or harassment
- Promotion of violence, drugs, or illegal activity
- Anti-Christian rhetoric intended to mock or harm

REJECT (mission_fit = "political") for:
- Political campaigns, candidates, parties, elections, voting appeals
- Partisan culture-war framing even without naming a candidate
- Advocacy whose primary purpose is political change, not witness

REJECT (mission_fit = "pure_opinion") for:
- General hot takes, news commentary, or debate without a testimony angle
- Product reviews, sports, entertainment gossip, lifestyle blogging unrelated to faith

REJECT (mission_fit = "off_topic") for:
- Content with no meaningful connection to faith, testimony, or encouragement
- Generic life updates with no spiritual witness

REJECT (mission_fit = "spam") for:
- Scams, repetitive promotion, or fake engagement bait

HUMAN REVIEW (mission_fit = "borderline") — use this instead of on_mission when witness is thin:
- Church or ministry event announcements (times, locations, RSVP, "stop by", "all welcome")
- Small-group or church social recaps that are mostly ordinary life with only a light faith mention
- Scripture quoted or referenced with minimal personal reflection (e.g. sticky note, "posting in case someone needs this")
- Logistics, invitations, or information where faith is present but not the main testimony
- When genuinely unsure between on_mission and off_topic, choose borderline (not on_mission)

ALLOW (mission_fit = "on_mission") ONLY when:
- There is a clear personal testimony, salvation/healing/deliverance story, or meaningful reflection
- Scripture is shared with personal application—not just quoted
- Encouragement or prayer rooted in the author's faith experience
- Respectful faith questions with context
- Hardship shared with trust in God (not primarily blaming political opponents)

Do NOT label event announcements, verse-of-the-day posts, or social recaps as on_mission if they lack a real witness—use borderline.

Respond with ONLY valid JSON (no markdown):
{"safety":"ok"|"flagged","mission_fit":"on_mission"|"borderline"|"off_topic"|"political"|"pure_opinion"|"spam","confidence":0.0-1.0,"needs_review":true|false,"suggest_edit":"optional short tip or null"}`;

function parseAiVerdict(raw: string): AiVerdict | null {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const parsed = JSON.parse(jsonMatch[0]) as Partial<AiVerdict>;
    const safety = parsed.safety === "flagged" ? "flagged" : "ok";
    const mission_fit =
      parsed.mission_fit === "borderline" ||
      parsed.mission_fit === "off_topic" ||
      parsed.mission_fit === "political" ||
      parsed.mission_fit === "pure_opinion" ||
      parsed.mission_fit === "spam"
        ? parsed.mission_fit
        : "on_mission";
    const confidence =
      typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
        ? Math.min(1, Math.max(0, parsed.confidence))
        : 0.75;
    return {
      safety,
      mission_fit,
      confidence,
      needs_review: parsed.needs_review === true,
      suggest_edit:
        typeof parsed.suggest_edit === "string" ? parsed.suggest_edit : null,
    };
  } catch {
    return null;
  }
}

function pendingReviewResult(
  verdict: AiVerdict,
  category: ModerationCategory = "borderline"
): ModerationResult {
  const suggestEdit = verdict.suggest_edit?.trim() || undefined;
  return {
    allowed: true,
    pendingReview: true,
    category,
    suggestEdit,
  };
}

/** Backup when the model still labels thin witness as on_mission. */
function looksLikeThinWitness(text: string): boolean {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return false;

  const witnessMarkers =
    /\b(testimony|salvation|deliverance|met me|changed my|struggled with|repent|witness|gospel|saved me|baptism|conversion|redemption|forgave me|convicted me)\b/i;
  const hasWitnessDepth = witnessMarkers.test(normalized);

  const eventLogistics =
    /\b(\d{1,2}\s*[-–]\s*\d{1,2}\s*(?:am|pm)|rsvp|sign[- ]?up|parking lot|potluck|bring a dish|all neighbors welcome|stop by and say hello|no signup needed)\b/i;
  const ministryAnnouncement =
    /\b(hosting|free breakfast|community breakfast|brief devotion|meet people who might not)\b/i;
  if ((eventLogistics.test(normalized) || ministryAnnouncement.test(normalized)) && !hasWitnessDepth) {
    return true;
  }

  const quotedVerse =
    /["'"]([^"'"]{12,})["'"]\s*\(\s*[1-3]?\s*[A-Za-z]+\s+\d+:\d+/i.test(normalized) ||
    /\b(?:romans|john|psalm|matthew|mark|luke|acts|corinthians|ephesians|philippians|colossians|hebrews|james|peter|revelation)\s+\d+:\d+/i.test(
      normalized
    );
  if (quotedVerse && normalized.length < 520 && !hasWitnessDepth) {
    return true;
  }

  const socialRecap =
    /\b(caught up on life|busy week at work|nothing dramatic|ordinary nights|school runs|laundry)\b/i;
  const lightFaithHook =
    /\b(prayer|small group|home group|church community|god has placed)\b/i.test(normalized);
  if (socialRecap.test(normalized) && lightFaithHook && !hasWitnessDepth) {
    return true;
  }

  return false;
}

function buildModerationUserBlock(
  text: string,
  options?: ModerateContentOptions,
): string {
  const parts: string[] = [];
  if (options?.contentType) {
    parts.push(`Content type: ${options.contentType}`);
  }
  if (options?.scriptureGuideRequest) {
    parts.push(
      "Scripture guide requested: yes. The author opted in to receive an AI scripture-grounded reply. " +
        "ALLOW respectful Bible questions, verse references, passage meaning, and reflection on the article's " +
        "scripture even when there is no long personal testimony. Rate mission_fit as on_mission unless the " +
        "comment is clearly unrelated to faith or scripture.",
    );
  }
  parts.push(text);
  return parts.join("\n\n");
}

function verdictToResult(
  verdict: AiVerdict,
  options?: ModerateContentOptions,
  sourceText?: string
): ModerationResult {
  const suggestEdit = verdict.suggest_edit?.trim() || undefined;
  const strictDiscussion = options?.contentType === "discussion";
  const scriptureGuide = options?.scriptureGuideRequest === true;

  if (verdict.safety === "flagged") {
    return {
      allowed: false,
      category: "safety",
      suggestEdit,
      reason: moderationUserMessage("safety", suggestEdit),
    };
  }

  if (verdict.mission_fit === "political") {
    return {
      allowed: false,
      category: "political",
      suggestEdit,
      reason: moderationUserMessage("political", suggestEdit),
    };
  }

  if (verdict.mission_fit === "pure_opinion") {
    if (scriptureGuide && verdict.confidence < 0.85) {
      return { allowed: true, category: "ok" };
    }
    return {
      allowed: false,
      category: "pure_opinion",
      suggestEdit,
      reason: moderationUserMessage("pure_opinion", suggestEdit),
    };
  }

  if (verdict.mission_fit === "spam") {
    return {
      allowed: false,
      category: "spam",
      suggestEdit,
      reason: moderationUserMessage("spam", suggestEdit),
    };
  }

  if (verdict.mission_fit === "borderline" || verdict.needs_review) {
    return scriptureGuide
      ? { allowed: true, category: "ok" }
      : pendingReviewResult(verdict, "borderline");
  }

  if (verdict.mission_fit === "off_topic") {
    const blockThreshold = scriptureGuide ? 0.92 : strictDiscussion ? 0.55 : 0.68;
    if (verdict.confidence >= blockThreshold) {
      if (scriptureGuide) {
        return pendingReviewResult(verdict, "off_topic");
      }
      return {
        allowed: false,
        category: "off_topic",
        suggestEdit,
        reason: moderationUserMessage("off_topic", suggestEdit),
      };
    }
    if (verdict.confidence >= 0.32) {
      return scriptureGuide
        ? { allowed: true, category: "ok" }
        : pendingReviewResult(verdict, "off_topic");
    }
  }

  if (verdict.mission_fit === "on_mission") {
    const reviewConfidence = strictDiscussion ? 0.72 : 0.68;
    if (verdict.confidence < reviewConfidence) {
      return scriptureGuide
        ? { allowed: true, category: "ok" }
        : pendingReviewResult(verdict, "borderline");
    }
    if (sourceText && looksLikeThinWitness(sourceText) && !scriptureGuide) {
      return pendingReviewResult(verdict, "borderline");
    }
  }

  return { allowed: true, category: "ok" };
}

function legacyFlaggedReply(reply: string): ModerationResult {
  const flagged = reply.toUpperCase().includes("FLAGGED");
  if (!flagged) return { allowed: true, category: "ok" };
  return {
    allowed: false,
    category: "safety",
    reason: moderationUserMessage("safety"),
  };
}

async function moderateWithOpenRouter(
  text: string,
  options?: ModerateContentOptions
): Promise<ModerationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const userBlock = buildModerationUserBlock(text, options);

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: MISSION_SYSTEM_PROMPT },
        { role: "user", content: userBlock },
      ],
      max_tokens: 220,
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error: ${err}`);
  }

  const data = await res.json();
  const reply = (data.choices?.[0]?.message?.content || "").trim();
  const verdict = parseAiVerdict(reply);
  if (verdict) return verdictToResult(verdict, options, text);
  return legacyFlaggedReply(reply);
}

async function moderateWithGoogleAI(
  text: string,
  options?: ModerateContentOptions
): Promise<ModerationResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");

  const userBlock = buildModerationUserBlock(text, options);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${MISSION_SYSTEM_PROMPT}\n\nUser content to evaluate:\n${userBlock}`,
              },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 220, temperature: 0.1 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google AI API error: ${err}`);
  }

  const data = await res.json();
  const reply = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
  const verdict = parseAiVerdict(reply);
  if (verdict) return verdictToResult(verdict, options, text);
  return legacyFlaggedReply(reply);
}

async function moderateWithOpenAI(text: string): Promise<ModerationResult> {
  const { default: OpenAI } = await import("openai");
  const openai = new (OpenAI as any)({ apiKey: process.env.OPENAI_API_KEY });
  const mod = await openai.moderations.create({ input: text });
  const flagged = mod.results?.[0]?.flagged ?? false;
  if (!flagged) return { allowed: true, category: "ok" };
  return {
    allowed: false,
    category: "safety",
    reason: moderationUserMessage("safety"),
  };
}

function moderationSkippedResult(): ModerationResult {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.MODERATION_SKIP !== "true"
  ) {
    console.error("[moderation] No AI provider configured in production.");
    return { allowed: false, reason: MODERATION_UNAVAILABLE_MESSAGE };
  }
  console.warn("[moderation] No AI provider; skipping checks (dev/MODERATION_SKIP).");
  return { allowed: true, category: "ok" };
}

export async function moderateContent(
  text: string,
  options?: ModerateContentOptions
): Promise<ModerationResult> {
  const trimmed = text?.trim() || "";
  if (!trimmed) return { allowed: false, reason: "Content cannot be empty." };

  const hasProvider =
    !!process.env.OPENROUTER_API_KEY ||
    !!process.env.GOOGLE_AI_API_KEY ||
    !!process.env.OPENAI_API_KEY;

  if (!hasProvider) return moderationSkippedResult();

  try {
    if (process.env.OPENROUTER_API_KEY) {
      return await moderateWithOpenRouter(trimmed, options);
    }
    if (process.env.GOOGLE_AI_API_KEY) {
      return await moderateWithGoogleAI(trimmed, options);
    }
    return await moderateWithOpenAI(trimmed);
  } catch (e) {
    console.error("[moderation]", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return {
      allowed: false,
      reason: `${MODERATION_UNAVAILABLE_MESSAGE} (${msg})`,
    };
  }
}

/** Simple fake-user / spam heuristic — flags excessive posting. */
export function checkFakeUserHeuristic(userId: string, postCountLast24h: number): boolean {
  void userId;
  const maxPostsPerDay = 20;
  return postCountLast24h >= maxPostsPerDay;
}

export function isMissingModerationStatusColumn(err: {
  message?: string;
  code?: string;
} | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  return msg.includes("moderation_status");
}

export function isMissingModerationNoteColumn(err: {
  message?: string;
  code?: string;
} | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  return msg.includes("moderation_note");
}

export function isMissingSharingTypeColumn(err: {
  message?: string;
  code?: string;
} | null): boolean {
  if (!err) return false;
  const msg = (err.message ?? "").toLowerCase();
  return msg.includes("sharing_type") || msg.includes("scripture_reference");
}

/** PostgREST filter: approved content only (includes legacy rows before migration). */
export function approvedModerationOrFilter(column = "moderation_status"): string {
  return `${column}.eq.approved,${column}.is.null`;
}

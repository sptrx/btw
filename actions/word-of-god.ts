"use server";

import { createClient } from "@/utils/supabase/server";
import {
  scripturePracticeMatches,
  wordOfGodForDay,
} from "@/lib/word-of-god";

export type WordOfGodToday = {
  reference: string;
  text: string;
  practicedToday: boolean;
  practiceCount: number;
  bankSize: number;
};

export type MemorizedScriptureItem = {
  id: string;
  reference: string;
  text: string;
  practicedOn: string;
  practiceCount: number;
};

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getTodaysWordOfGod(): Promise<WordOfGodToday> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const verse = wordOfGodForDay(new Date(), user?.id ?? "");

  if (!user) {
    return {
      reference: verse.reference,
      text: verse.text,
      practicedToday: false,
      practiceCount: 0,
      bankSize: verse.bankSize,
    };
  }

  const { data } = await supabase
    .from("memorized_scripture")
    .select("practiced_on, practice_count")
    .eq("user_id", user.id)
    .eq("reference", verse.reference)
    .maybeSingle();

  return {
    reference: verse.reference,
    text: verse.text,
    practicedToday: data?.practiced_on === utcToday(),
    practiceCount: data?.practice_count ?? 0,
    bankSize: verse.bankSize,
  };
}

export async function completeWordOfGodPractice(attempt: string): Promise<
  | { success: true; memorized: MemorizedScriptureItem }
  | { error: string; needsAuth?: boolean }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to save your practice.", needsAuth: true };

  const verse = wordOfGodForDay(new Date(), user.id);
  if (!scripturePracticeMatches(verse.text, attempt)) {
    return {
      error:
        "Not quite yet — try again from memory (small wording differences are okay).",
    };
  }

  const today = utcToday();
  const { data: existing } = await supabase
    .from("memorized_scripture")
    .select("id, practice_count, practiced_on")
    .eq("user_id", user.id)
    .eq("reference", verse.reference)
    .maybeSingle();

  if (existing) {
    const alreadyToday = existing.practiced_on === today;
    const { data, error } = await supabase
      .from("memorized_scripture")
      .update({
        text: verse.text,
        practiced_on: today,
        practice_count: alreadyToday ? existing.practice_count : existing.practice_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id, reference, text, practiced_on, practice_count")
      .single();
    if (error || !data) return { error: error?.message ?? "Could not save practice." };
    return {
      success: true,
      memorized: {
        id: data.id,
        reference: data.reference,
        text: data.text,
        practicedOn: data.practiced_on,
        practiceCount: data.practice_count,
      },
    };
  }

  const { data, error } = await supabase
    .from("memorized_scripture")
    .insert({
      user_id: user.id,
      reference: verse.reference,
      text: verse.text,
      practiced_on: today,
      practice_count: 1,
    })
    .select("id, reference, text, practiced_on, practice_count")
    .single();

  if (error || !data) return { error: error?.message ?? "Could not save practice." };
  return {
    success: true,
    memorized: {
      id: data.id,
      reference: data.reference,
      text: data.text,
      practicedOn: data.practiced_on,
      practiceCount: data.practice_count,
    },
  };
}

export async function listMemorizedScriptures(
  userId: string
): Promise<MemorizedScriptureItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memorized_scripture")
    .select("id, reference, text, practiced_on, practice_count")
    .eq("user_id", userId)
    .order("practiced_on", { ascending: false });
  if (error) {
    console.warn("[listMemorizedScriptures]", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    reference: r.reference,
    text: r.text,
    practicedOn: r.practiced_on,
    practiceCount: r.practice_count,
  }));
}

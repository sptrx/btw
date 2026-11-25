"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type BibleBookmarkItem = {
  id: string;
  translationId: string;
  bookAbbrev: string;
  bookTitle: string;
  chapter: number;
  verse: number;
  reference: string;
  verseText: string;
  createdAt: string;
};

function scriptureReference(bookTitle: string, chapter: number, verse: number) {
  return `${bookTitle} ${chapter}:${verse}`;
}

function missingBookmarks(message: string) {
  return message.includes("bible_bookmark");
}

export async function getBibleChapterMarks(input: {
  translationId: string;
  bookAbbrev: string;
  bookTitle: string;
  chapter: number;
  verses: number[];
}): Promise<{ bookmarked: number[]; remembered: number[] }> {
  const empty = { bookmarked: [] as number[], remembered: [] as number[] };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const references = input.verses.map((verse) =>
    scriptureReference(input.bookTitle, input.chapter, verse)
  );

  const [bookmarks, memory] = await Promise.all([
    supabase
      .from("bible_bookmark")
      .select("verse")
      .eq("user_id", user.id)
      .eq("translation_id", input.translationId)
      .eq("book_abbrev", input.bookAbbrev)
      .eq("chapter", input.chapter),
    references.length
      ? supabase
          .from("memorized_scripture")
          .select("reference")
          .eq("user_id", user.id)
          .in("reference", references)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (bookmarks.error && !missingBookmarks(bookmarks.error.message)) {
    console.warn("[getBibleChapterMarks]", bookmarks.error.message);
  }

  const remembered = new Set((memory.data ?? []).map((row) => row.reference as string));
  return {
    bookmarked: (bookmarks.data ?? []).map((row) => row.verse as number),
    remembered: input.verses.filter((verse) =>
      remembered.has(scriptureReference(input.bookTitle, input.chapter, verse))
    ),
  };
}

export async function listBibleBookmarks(): Promise<BibleBookmarkItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("bible_bookmark")
    .select("id, translation_id, book_abbrev, book_title, chapter, verse, reference, verse_text, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    if (!missingBookmarks(error.message)) console.warn("[listBibleBookmarks]", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    translationId: row.translation_id,
    bookAbbrev: row.book_abbrev,
    bookTitle: row.book_title,
    chapter: row.chapter,
    verse: row.verse,
    reference: row.reference,
    verseText: row.verse_text,
    createdAt: row.created_at,
  }));
}

export async function toggleBibleBookmark(input: {
  translationId: string;
  bookAbbrev: string;
  bookTitle: string;
  chapter: number;
  verse: number;
  verseText: string;
}): Promise<{ bookmarked: boolean } | { error: string; needsAuth?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to bookmark a verse.", needsAuth: true };

  const translationId = input.translationId.trim() || "kjv";
  const bookAbbrev = input.bookAbbrev.trim();
  const bookTitle = input.bookTitle.trim();
  const verseText = input.verseText.trim();
  if (!bookAbbrev || !bookTitle || !verseText || input.chapter < 1 || input.verse < 1) {
    return { error: "That verse could not be bookmarked." };
  }

  const { data: existing, error: readError } = await supabase
    .from("bible_bookmark")
    .select("id")
    .eq("user_id", user.id)
    .eq("translation_id", translationId)
    .eq("book_abbrev", bookAbbrev)
    .eq("chapter", input.chapter)
    .eq("verse", input.verse)
    .maybeSingle();

  if (readError) {
    if (missingBookmarks(readError.message)) {
      return { error: "Bookmarks are not available yet." };
    }
    return { error: readError.message };
  }

  if (existing) {
    const { error } = await supabase.from("bible_bookmark").delete().eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath("/dashboard/library");
    return { bookmarked: false };
  }

  const { error } = await supabase.from("bible_bookmark").insert({
    user_id: user.id,
    translation_id: translationId,
    book_abbrev: bookAbbrev,
    book_title: bookTitle,
    chapter: input.chapter,
    verse: input.verse,
    reference: scriptureReference(bookTitle, input.chapter, input.verse),
    verse_text: verseText,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/library");
  return { bookmarked: true };
}

export async function saveVerseToMemoryBank(input: {
  bookTitle: string;
  chapter: number;
  verse: number;
  verseText: string;
}): Promise<{ saved: boolean; already?: boolean } | { error: string; needsAuth?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to keep a verse in your scripture memory.", needsAuth: true };

  const text = input.verseText.trim();
  const bookTitle = input.bookTitle.trim();
  if (!bookTitle || !text || input.chapter < 1 || input.verse < 1) {
    return { error: "That verse could not be saved." };
  }
  const reference = scriptureReference(bookTitle, input.chapter, input.verse);

  const { data: existing, error: readError } = await supabase
    .from("memorized_scripture")
    .select("id")
    .eq("user_id", user.id)
    .eq("reference", reference)
    .maybeSingle();
  if (readError) return { error: readError.message };
  if (existing) return { saved: true, already: true };

  const { error } = await supabase.from("memorized_scripture").insert({
    user_id: user.id,
    reference,
    text,
    practice_count: 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/library");
  return { saved: true };
}

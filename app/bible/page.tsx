import Link from "next/link";
import { getCurrentUser } from "@/actions";
import { getBibleChapterMarks } from "@/actions/bible-reader";
import { BibleReader } from "@/components/bible/bible-reader";
import {
  fetchBibleBooks,
  fetchBibleChapter,
  isScriptureGuideConfigured,
  type BibleBookSummary,
  type BibleChapter,
} from "@/lib/bible-ai";

export const metadata = {
  title: "Bible",
  description: "Read a chapter of Scripture.",
};

function Unavailable({ message }: { message: string }) {
  return (
    <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-foreground">Bible</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
      <Link href="/ask" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">
        Open Bible Q&amp;A
      </Link>
    </article>
  );
}

export default async function BiblePage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; chapter?: string }>;
}) {
  if (!isScriptureGuideConfigured()) {
    return (
      <Unavailable message="Bible reading is not available right now. Bible Q&A is still open." />
    );
  }

  const sp = await searchParams;
  const booksResult = await fetchBibleBooks("kjv");
  if ("error" in booksResult || booksResult.books.length === 0) {
    return (
      <Unavailable message="The Bible could not be loaded right now. Bible Q&A is still open." />
    );
  }

  const requested = sp.book?.trim().toLowerCase();
  const book =
    booksResult.books.find((item) => item.abbrev.toLowerCase() === requested) ??
    booksResult.books[0];
  const requestedChapter = Number(sp.chapter);
  const chapterNumber = Math.min(
    book.chapterCount,
    Math.max(1, Number.isFinite(requestedChapter) && requestedChapter > 0 ? requestedChapter : 1)
  );
  const chapterResult = await fetchBibleChapter({
    translationId: "kjv",
    book: book.abbrev,
    chapter: chapterNumber,
  });
  const chapter = chapterResult && !("error" in chapterResult) ? chapterResult : null;
  const user = await getCurrentUser();
  const title = bookLabel(book, booksResult.books);
  const marks = chapter
    ? await getBibleChapterMarks({
        translationId: "kjv",
        bookAbbrev: book.abbrev,
        bookTitle: title,
        chapter: chapterNumber,
        verses: chapter.verses.map((verse) => verse.verse),
      })
    : { bookmarked: [], remembered: [] };

  return (
    <article className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Bible</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {booksResult.translationLabel || "King James Version"}
        </p>
      </header>
      <div className="grid gap-4 lg:grid-cols-[11rem_minmax(0,1fr)]">
        <BookList books={booksResult.books} current={book.abbrev} />
        <ChapterView
          book={book}
          books={booksResult.books}
          chapter={chapter}
          chapterNumber={chapterNumber}
          isAuthenticated={Boolean(user)}
          bookmarkedVerses={marks.bookmarked}
          rememberedVerses={marks.remembered}
        />
      </div>
    </article>
  );
}

const BOOK_TITLES: Record<string, string> = {
  jud: "Judges",
  job: "Job",
  prv: "Proverbs",
  eph: "Ephesians",
};

/**
 * The scripture service labels these two books wrongly (Ezra as "EZR", Ezekiel as
 * "Ezra"), so their names are fixed here by abbreviation, ahead of the generic map.
 */
const FORCED_TITLES: Record<string, string> = {
  ezr: "Ezra",
  ez: "Ezekiel",
};

function bookLabel(book: BibleBookSummary, books: BibleBookSummary[]) {
  const forced = FORCED_TITLES[book.abbrev.toLowerCase()];
  if (forced) return forced;
  const mapped = BOOK_TITLES[book.abbrev.toLowerCase()];
  if (!mapped) return book.title;
  const taken = books.some(
    (other) =>
      other.abbrev !== book.abbrev && other.title.toLowerCase() === mapped.toLowerCase()
  );
  return taken ? book.title : mapped;
}

function BookList({ books, current }: { books: BibleBookSummary[]; current: string }) {
  return (
    <nav
      aria-label="Bible books"
      className="order-2 max-h-56 overflow-y-auto rounded-xl border border-border/70 bg-card p-1.5 shadow-sm lg:order-1 lg:max-h-[70vh]"
    >
      {books.map((item) => {
        const active = item.abbrev === current;
        return (
          <Link
            key={item.abbrev}
            href={`/bible?book=${encodeURIComponent(item.abbrev)}&chapter=1`}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "block rounded-lg bg-primary/10 px-2 py-1.5 text-sm font-medium text-primary"
                : "block rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          >
            {bookLabel(item, books)}
          </Link>
        );
      })}
    </nav>
  );
}

function ChapterView({
  book,
  books,
  chapter,
  chapterNumber,
  isAuthenticated,
  bookmarkedVerses,
  rememberedVerses,
}: {
  book: BibleBookSummary;
  books: BibleBookSummary[];
  chapter: BibleChapter | null;
  chapterNumber: number;
  isAuthenticated: boolean;
  bookmarkedVerses: number[];
  rememberedVerses: number[];
}) {
  const prev = chapterNumber > 1 ? chapterNumber - 1 : null;
  const next = chapterNumber < book.chapterCount ? chapterNumber + 1 : null;
  return (
    <section className="order-1 rounded-xl border border-border/70 bg-card p-4 shadow-sm sm:p-6 lg:order-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-foreground">
          {bookLabel(book, books)} {chapterNumber}
        </h2>
        <div className="flex items-center gap-3 text-sm font-medium">
          {prev ? (
            <Link
              href={`/bible?book=${encodeURIComponent(book.abbrev)}&chapter=${prev}`}
              className="text-primary hover:underline"
            >
              Previous
            </Link>
          ) : (
            <span className="text-muted-foreground">Previous</span>
          )}
          {next ? (
            <Link
              href={`/bible?book=${encodeURIComponent(book.abbrev)}&chapter=${next}`}
              className="text-primary hover:underline"
            >
              Next
            </Link>
          ) : (
            <span className="text-muted-foreground">Next</span>
          )}
        </div>
      </div>
      {chapter ? (
        <div className="mt-5">
          <BibleReader
            translationId="kjv"
            bookAbbrev={book.abbrev}
            bookTitle={bookLabel(book, books)}
            chapterNumber={chapterNumber}
            verses={chapter.verses}
            isAuthenticated={isAuthenticated}
            bookmarkedVerses={bookmarkedVerses}
            rememberedVerses={rememberedVerses}
            loginHref={`/auth/login?next=${encodeURIComponent(`/bible?book=${book.abbrev}&chapter=${chapterNumber}`)}`}
          />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">This chapter could not be loaded.</p>
      )}
    </section>
  );
}

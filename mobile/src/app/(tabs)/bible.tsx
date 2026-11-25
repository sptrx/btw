import { useFocusEffect, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppChrome } from '@/components/app-chrome';
import {
  AppText,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type {
  BibleBookSummary,
  BibleChapter,
  BibleChapterNav,
  BibleTranslation,
} from '@/lib/types';

type ViewMode = 'books' | 'chapters' | 'read';

const verseFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

export default function BibleScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const [translations, setTranslations] = useState<BibleTranslation[]>([]);
  const [translationId, setTranslationId] = useState('kjv');
  const [books, setBooks] = useState<BibleBookSummary[]>([]);
  const [book, setBook] = useState<BibleBookSummary | null>(null);
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [mode, setMode] = useState<ViewMode>('books');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  const [remembered, setRemembered] = useState<number[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [spokenVerse, setSpokenVerse] = useState<number | null>(null);
  const stopReading = useRef(false);
  const speakingRef = useRef(false);

  const translationLabel =
    translations.find((t) => t.id === translationId)?.label ?? translationId.toUpperCase();

  const loadCatalog = useCallback(async (tid: string) => {
    setError(null);
    const [tRes, bRes] = await Promise.all([
      api<{ translations: BibleTranslation[] }>('bible.translations'),
      api<{ books: BibleBookSummary[] }>('bible.books', { translationId: tid }),
    ]);
    setTranslations(tRes.translations);
    setBooks(bRes.books);
    if (!tRes.translations.some((t) => t.id === tid) && tRes.translations[0]) {
      setTranslationId(tRes.translations[0].id);
    }
  }, []);

  const openChapter = useCallback(
    async (abbrev: string, chapterNum: number, tid = translationId) => {
      setError(null);
      setLoading(true);
      try {
        const data = await api<BibleChapter>('bible.chapter', {
          translationId: tid,
          book: abbrev,
          chapter: chapterNum,
        });
        setChapter(data);
        setBook((prev) => {
          if (prev?.abbrev === data.abbrev) return prev;
          return (
            books.find((b) => b.abbrev === data.abbrev) ?? {
              abbrev: data.abbrev,
              title: data.bookTitle,
              chapterCount: data.chapterCount,
              index: 0,
            }
          );
        });
        setMode('read');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load chapter.');
      } finally {
        setLoading(false);
      }
    },
    [books, translationId]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadCatalog(translationId)
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load Bible.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadCatalog, translationId]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      if (mode === 'read' && chapter) {
        await openChapter(chapter.abbrev, chapter.chapter);
      } else {
        await loadCatalog(translationId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not refresh.');
    } finally {
      setRefreshing(false);
    }
  }

  function selectBook(b: BibleBookSummary) {
    setBook(b);
    setChapter(null);
    setMode('chapters');
  }

  function goNav(nav: BibleChapterNav | null) {
    if (!nav) return;
    void openChapter(nav.abbrev, nav.chapter);
  }

  useEffect(() => {
    if (!session || !chapter) {
      setBookmarked([]);
      setRemembered([]);
      return;
    }
    let cancelled = false;
    api<{ bookmarked: number[]; remembered: number[] }>('bible.marks', {
      translationId,
      bookAbbrev: chapter.abbrev,
      bookTitle: chapter.bookTitle,
      chapter: chapter.chapter,
      verses: chapter.verses.map((verse) => verse.verse),
    })
      .then((marks) => {
        if (!cancelled) {
          setBookmarked(marks.bookmarked);
          setRemembered(marks.remembered);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBookmarked([]);
          setRemembered([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [chapter, session, translationId]);

  const haltReading = useCallback(() => {
    stopReading.current = true;
    if (!speakingRef.current) return;
    speakingRef.current = false;
    void Speech.stop();
    setSpeaking(false);
    setSpokenVerse(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        haltReading();
      };
    }, [haltReading])
  );

  const chapterKey = chapter ? `${translationId}:${chapter.abbrev}:${chapter.chapter}` : '';
  const chapterKeyRef = useRef(chapterKey);
  useEffect(() => {
    if (chapterKeyRef.current === chapterKey) return;
    chapterKeyRef.current = chapterKey;
    haltReading();
  }, [chapterKey, haltReading]);

  async function listen() {
    if (!chapter) return;
    if (speakingRef.current) {
      haltReading();
      return;
    }
    stopReading.current = false;
    speakingRef.current = true;
    setSpeaking(true);
    setError(null);
    let failed = false;
    for (const verse of chapter.verses) {
      if (stopReading.current) break;
      setSpokenVerse(verse.verse);
      const outcome = await new Promise<'done' | 'stopped' | 'error'>((resolve) => {
        Speech.speak(`Verse ${verse.verse}. ${verse.text}`, {
          language: 'en-US',
          pitch: 1,
          rate: 0.9,
          volume: 1,
          useApplicationAudioSession: false,
          onDone: () => resolve('done'),
          onStopped: () => resolve('stopped'),
          onError: () => resolve('error'),
        });
      });
      if (stopReading.current || outcome === 'stopped') break;
      if (outcome === 'error') {
        failed = true;
        break;
      }
    }
    speakingRef.current = false;
    setSpeaking(false);
    setSpokenVerse(null);
    if (failed) {
      setError(
        'No audio played. Turn the volume up, and make sure this phone has an English speech voice installed.'
      );
    }
  }

  async function onBookmark(verse: number, text: string) {
    if (!session || !chapter) {
      router.push('/sign-in');
      return;
    }
    try {
    const result = await api<{ bookmarked?: boolean; error?: string }>('bible.bookmark', {
      translationId,
      bookAbbrev: chapter.abbrev,
      bookTitle: chapter.bookTitle,
      chapter: chapter.chapter,
      verse,
      verseText: text,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setBookmarked((current) =>
      result.bookmarked ? [...current, verse] : current.filter((item) => item !== verse)
    );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not bookmark this verse.');
    }
  }

  async function onRemember(verse: number, text: string) {
    if (!session || !chapter) {
      router.push('/sign-in');
      return;
    }
    try {
    const result = await api<{ saved?: boolean; error?: string }>('bible.remember', {
      bookTitle: chapter.bookTitle,
      chapter: chapter.chapter,
      verse,
      verseText: text,
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    setRemembered((current) => (current.includes(verse) ? current : [...current, verse]));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save this verse.');
    }
  }

  const chapterButtons = useMemo(() => {
    if (!book) return [];
    return Array.from({ length: book.chapterCount }, (_, i) => i + 1);
  }, [book]);

  return (
    <AppChrome>
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
        {mode === 'books' ? (
          <FlatList
            data={books}
            keyExtractor={(b) => b.abbrev}
            contentContainerStyle={styles.list}
            style={{ backgroundColor: theme.background }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
            }
            ListHeaderComponent={
              <View style={styles.header}>
                <AppText variant="title">Bible</AppText>
                <AppText variant="small" tone="secondary">
                  Free-rights translations · Chapter by chapter
                </AppText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}>
                  {(translations.length ? translations : [{ id: 'kjv', label: 'KJV' }]).map((t) => (
                    <Chip
                      key={t.id}
                      label={t.label}
                      selected={translationId === t.id}
                      onPress={() => {
                        setTranslationId(t.id);
                        setBook(null);
                        setChapter(null);
                        setMode('books');
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => selectBook(item)}
                style={({ pressed }) => [
                  styles.bookRow,
                  { borderBottomColor: theme.border, opacity: pressed ? 0.88 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.chapterCount} chapters`}>
                <AppText variant="heading">{item.title}</AppText>
                <AppText variant="caption" tone="secondary">
                  {item.chapterCount} ch
                </AppText>
              </Pressable>
            )}
            ListEmptyComponent={
              loading ? (
                <LoadingState />
              ) : error ? (
                <ErrorState message={error} onRetry={() => void loadCatalog(translationId)} />
              ) : (
                <EmptyState title="No books available" />
              )
            }
          />
        ) : null}

        {mode === 'chapters' && book ? (
          <ScrollView
            style={{ backgroundColor: theme.background }}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
            }>
            <View style={styles.header}>
              <Pressable onPress={() => setMode('books')} accessibilityRole="button" hitSlop={8}>
                <AppText variant="small" tone="primary">
                  ← All books
                </AppText>
              </Pressable>
              <AppText variant="title">{book.title}</AppText>
              <AppText variant="small" tone="secondary">
                {translationLabel} · Choose a chapter
              </AppText>
            </View>
            <View style={styles.chapterGrid}>
              {chapterButtons.map((n) => (
                <Pressable
                  key={n}
                  onPress={() => void openChapter(book.abbrev, n)}
                  style={({ pressed }) => [
                    styles.chapterCell,
                    {
                      borderColor: theme.border,
                      backgroundColor: pressed ? theme.accentSoft : theme.muted,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Chapter ${n}`}>
                  <AppText variant="label">{n}</AppText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : null}

        {mode === 'read' ? (
          loading && !chapter ? (
            <LoadingState />
          ) : error && !chapter ? (
            <ErrorState message={error} onRetry={() => book && void openChapter(book.abbrev, 1)} />
          ) : chapter ? (
            <FlatList
              data={chapter.verses}
              keyExtractor={(v) => String(v.verse)}
              style={{ backgroundColor: theme.background }}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
              }
              ListHeaderComponent={
                <View style={[styles.header, styles.readHeader, { borderBottomColor: theme.border }]}>
                  <Pressable
                    onPress={() => {
                      setMode('chapters');
                      setChapter(null);
                    }}
                    accessibilityRole="button"
                    hitSlop={8}>
                    <AppText variant="small" tone="primary">
                      ← {chapter.bookTitle}
                    </AppText>
                  </Pressable>
                  <AppText variant="title">
                    {chapter.bookTitle} {chapter.chapter}
                  </AppText>
                  <AppText variant="small" tone="secondary">
                    {chapter.translationLabel}
                  </AppText>
                  <Pressable onPress={() => void listen()} accessibilityRole="button" hitSlop={8}>
                    <AppText variant="small" tone="primary">
                      {speaking ? 'Stop audio' : 'Listen'}
                    </AppText>
                  </Pressable>
                  {error ? (
                    <AppText variant="small" tone="danger" style={{ marginTop: Spacing.two }}>
                      {error}
                    </AppText>
                  ) : null}
                </View>
              }
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.verseRow,
                    spokenVerse === item.verse ? { backgroundColor: theme.accentSoft } : null,
                  ]}>
                  <AppText variant="caption" tone="primary" style={styles.verseNum}>
                    {item.verse}
                  </AppText>
                  <View style={styles.verseBody}>
                    <AppText
                      variant="body"
                      style={[styles.verseText, { color: theme.text, fontFamily: verseFont }]}>
                      {item.text}
                    </AppText>
                    <View style={styles.verseActions}>
                      <Pressable onPress={() => void onBookmark(item.verse, item.text)} hitSlop={6}>
                        <AppText variant="caption" tone={bookmarked.includes(item.verse) ? 'primary' : 'secondary'}>
                          {bookmarked.includes(item.verse) ? 'Bookmarked' : 'Bookmark'}
                        </AppText>
                      </Pressable>
                      <Pressable onPress={() => void onRemember(item.verse, item.text)} hitSlop={6}>
                        <AppText variant="caption" tone={remembered.includes(item.verse) ? 'primary' : 'secondary'}>
                          {remembered.includes(item.verse) ? 'In memory' : 'Memory bank'}
                        </AppText>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
              ListFooterComponent={
                <View style={[styles.navRow, { borderTopColor: theme.border }]}>
                  <Button
                    title="Previous"
                    variant="secondary"
                    small
                    disabled={!chapter.prev}
                    onPress={() => goNav(chapter.prev)}
                  />
                  <Button
                    title="Chapters"
                    variant="ghost"
                    small
                    onPress={() => {
                      setMode('chapters');
                      setChapter(null);
                    }}
                  />
                  <Button
                    title="Next"
                    variant="secondary"
                    small
                    disabled={!chapter.next}
                    onPress={() => goNav(chapter.next)}
                  />
                </View>
              }
            />
          ) : (
            <EmptyState title="Select a chapter to read" />
          )
        ) : null}
      </View>
    </AppChrome>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: {
    paddingBottom: Spacing.six,
    flexGrow: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.one,
  },
  readHeader: {
    paddingBottom: Spacing.three,
    marginBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chips: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingRight: Spacing.three,
  },
  bookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  chapterCell: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  verseNum: { minWidth: 28, paddingTop: 4, fontWeight: '700' },
  verseBody: { flex: 1, gap: Spacing.one },
  verseText: { lineHeight: 28, fontSize: 17 },
  verseActions: { flexDirection: 'row', gap: Spacing.three },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    marginTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

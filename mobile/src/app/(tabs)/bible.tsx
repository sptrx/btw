import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
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
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type {
  BibleBookSummary,
  BibleChapter,
  BibleChapterNav,
  BibleTranslation,
} from '@/lib/types';

type ViewMode = 'books' | 'chapters' | 'read';

export default function BibleScreen() {
  const theme = useTheme();
  const [translations, setTranslations] = useState<BibleTranslation[]>([]);
  const [translationId, setTranslationId] = useState('kjv');
  const [books, setBooks] = useState<BibleBookSummary[]>([]);
  const [book, setBook] = useState<BibleBookSummary | null>(null);
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [mode, setMode] = useState<ViewMode>('books');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const openChapter = useCallback(async (abbrev: string, chapterNum: number, tid = translationId) => {
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
  }, [books, translationId]);

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
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
            }
            ListHeaderComponent={
              <View style={styles.header}>
                <AppText variant="title">Bible</AppText>
                <AppText variant="small" tone="secondary">
                  Free-rights translations · Read chapter by chapter
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
                style={[styles.bookRow, { borderBottomColor: theme.border }]}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.chapterCount} chapters`}>
                <AppText variant="body">{item.title}</AppText>
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
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
            }>
            <View style={styles.header}>
              <Pressable onPress={() => setMode('books')} accessibilityRole="button">
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
                  style={[styles.chapterCell, { borderColor: theme.border, backgroundColor: theme.card }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Chapter ${n}`}>
                  <AppText variant="body">{n}</AppText>
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
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
              }
              ListHeaderComponent={
                <View style={styles.header}>
                  <Pressable
                    onPress={() => {
                      setMode('chapters');
                      setChapter(null);
                    }}
                    accessibilityRole="button">
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
                  {error ? (
                    <AppText variant="small" tone="danger" style={{ marginTop: Spacing.two }}>
                      {error}
                    </AppText>
                  ) : null}
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.verseRow}>
                  <AppText variant="caption" tone="secondary" style={styles.verseNum}>
                    {item.verse}
                  </AppText>
                  <AppText variant="body" style={styles.verseText}>
                    {item.text}
                  </AppText>
                </View>
              )}
              ListFooterComponent={
                <View style={styles.navRow}>
                  <Button
                    title="Previous"
                    variant="secondary"
                    small
                    disabled={!chapter.prev}
                    onPress={() => goNav(chapter.prev)}
                  />
                  <Button
                    title="Chapters"
                    variant="secondary"
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
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  verseNum: { minWidth: 28, paddingTop: 2 },
  verseText: { flex: 1, lineHeight: 26 },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
});

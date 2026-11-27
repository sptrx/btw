/** Shapes returned by the website's /api/mobile endpoints (see lib/mobile-api.ts there). */

/** Same glyphs as the website: heart, prayer, fire, raised hands, then X-style repost. */
export const REACTIONS = [
  { type: 'blessed', emoji: '❤️', label: 'Blessed me' },
  { type: 'amen', emoji: '🙏', label: 'Amen' },
  { type: 'spirit_filled', emoji: '🔥', label: 'Spirit-filled' },
  { type: 'praise_god', emoji: '🙌', label: 'Praise God' },
  { type: 'sharing', emoji: '🔁', label: 'Sharing' },
] as const;

export type ReactionType = (typeof REACTIONS)[number]['type'];
export type ReactionCounts = Record<ReactionType, number>;
export type PostKind = 'topic_content' | 'prayer_request' | 'praise_report' | 'short';
export type MediaItem = { url: string; type: string };

export type FeedFilter =
  | 'all'
  | 'following'
  | 'for_you'
  | 'testimonies'
  | 'revelations'
  | 'prophecies'
  | 'discussions'
  | 'questions'
  | 'devotionals'
  | 'praise'
  | 'prayer'
  | 'videos'
  | 'shorts';

export type FeedItem = {
  id: string;
  postKind: PostKind;
  badge: string;
  title: string;
  bodySnippet: string | null;
  readMinutes: number | null;
  createdAt: string;
  fromFollowed: boolean;
  channelSlug?: string;
  channelTitle?: string;
  scriptureReference?: string | null;
  mediaItems?: MediaItem[];
  commentCount?: number;
  /** Shorts only */
  playerUrl?: string | null;
  posterUrl?: string | null;
  hlsUrl?: string | null;
  durationSeconds?: number | null;
  authorLabel?: string | null;
  authorId?: string;
  reactions: ReactionCounts;
  userReaction: ReactionType | null;
};

export type FeedCursor = { createdAt: string; id: string; postKind: PostKind };
export type FeedPage = { items: FeedItem[]; nextCursor: FeedCursor | null };

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  ministry_name: string | null;
  website_url: string | null;
  role?: string | null;
  profile_private?: boolean;
};

export type Me = {
  user: { id: string; email: string | null } | null;
  profile?: Profile | null;
  disclaimerAccepted?: boolean;
  follows?: { followers: number; following: number };
};

export type ChannelListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  postCount: number;
  followerCount: number;
  authorName: string | null;
  tags: { id: string; slug: string; label: string }[];
};

export type ChannelContentItem = {
  id: string;
  type: string;
  typeLabel: string;
  sharingType: string;
  sharingLabel: string;
  title: string;
  bodySnippet: string | null;
  createdAt: string;
  pageTitle: string | null;
  media: MediaItem[];
};

export type ChannelDetail = {
  channel: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    bannerUrl: string | null;
    archived: boolean;
    authorName: string | null;
  };
  pages: { id: string; slug: string; title: string }[];
  currentPage: { slug: string; title: string; description: string | null };
  content: ChannelContentItem[];
};

export type Comment = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string | null;
  scriptureGuideReply: string | null;
};

export type PostDetail = {
  post: {
    id: string;
    type: string;
    sharingType: string | null;
    title: string;
    body: string | null;
    scriptureReference: string | null;
    createdAt: string;
    authorId: string;
    authorName: string | null;
    moderationStatus: string;
    media: MediaItem[];
    channelSlug: string | null;
    channelTitle: string | null;
  };
  comments: Comment[];
  reactions: ReactionCounts | null;
  userReaction: ReactionType | null;
  disclaimerAccepted: boolean;
};

export type PrayerFilter = 'all' | 'unanswered' | 'answered' | 'mine';

export type PrayerRequest = {
  id: string;
  title: string;
  body: string;
  isAnonymous: boolean;
  status: 'active' | 'answered' | 'closed';
  createdAt: string;
  authorId: string;
  authorDisplayName: string | null;
  prayerCount: number;
  userIsPraying: boolean;
  isOwner: boolean;
};

export type PraiseReport = {
  id: string;
  body: string;
  createdAt: string;
  authorDisplayName: string | null;
  prayerRequestId: string | null;
  prayerRequestTitle: string | null;
};

export type PrayerComment = {
  id: string;
  body: string;
  createdAt: string;
  authorDisplayName: string | null;
  authorId: string;
};

export type SubmitResult = {
  success: true;
  pendingReview?: boolean;
  message?: string;
  guideError?: string;
};

export type ShareableLibrary = {
  libraryTitle: string;
  isOwner: boolean;
  owner: {
    id: string;
    displayName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
  walkingWith: {
    topicId: string;
    title: string;
    slug: string;
    description: string | null;
    coverImageUrl: string | null;
  }[];
  kept: {
    contentId: string;
    title: string;
    typeLabel: string;
    channelSlug: string;
    channelTitle: string;
    bodySnippet: string | null;
  }[];
  memorized: {
    id: string;
    reference: string;
    text: string;
    practicedOn: string;
    practiceCount: number;
  }[];
  notes: {
    id: string;
    title: string;
    body: string;
    isPublic: boolean;
    updatedAt: string;
  }[];
};

export type NotificationPrefs = {
  prayerUpdates: boolean;
  comments: boolean;
  follows: boolean;
  reactions: boolean;
  wordOfGodReminder: boolean;
  channelUpdates: boolean;
};

export type BibleTranslation = { id: string; label: string };

export type BibleBookSummary = {
  abbrev: string;
  title: string;
  chapterCount: number;
  index: number;
};

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
  verses: { verse: number; text: string }[];
  prev: BibleChapterNav | null;
  next: BibleChapterNav | null;
};

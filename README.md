# BTW – Faith-Based Social Platform

A Christian faith-based social platform with channels, AI moderation, and community features.

## Features

- **User roles**: Sign up as **channel author** (create & manage channels) or **regular user** (post feedback & comments)
- **Channels**: Reach at `yoursite.com/channel/channel-name`
- **Sub-pages**: Each channel has a main page (Home) + custom sub-pages for videos, podcasts, articles, discussions
- **Content types**: Video, Podcast, Article, Discussion
- **Self-management**: Channel authors add, delete, and update pages and content
- **AI moderation**: All content moderated across the platform
- **Public viewing**: Anyone can view channel content
- **Signed-up for feedback**: Users must sign up to comment and give feedback
- **External sharing**: All content supports share and copy-link

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Supabase (database + auth)
- **AI**: OpenRouter / Google AI / OpenAI for moderation

## Setup

### 1. Install

```bash
npm install
```

### 2. Supabase migrations

Run in order in Supabase SQL Editor:

1. `supabase/migrations/20240101000001_initial_schema.sql`
2. `supabase/migrations/20240102000001_topics_and_channels.sql`
3. `supabase/migrations/20240103000001_channels_and_pages.sql`

### 3. Environment

Copy `env.example` to `.env.local` and configure Supabase + AI keys.

### 4. Run

```bash
npm run dev
```

## URL structure

- `/channel` – List channels
- `/channel/[slug]` – Channel home (e.g. `/channel/bible-study`)
- `/channel/[slug]/[pageSlug]` – Sub-page (e.g. `/channel/bible-study/videos`)
- `/channel/[slug]/content/[id]` – Content detail

## Tests

```bash
npm run test
```

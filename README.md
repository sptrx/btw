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

## UX (mobile, accessibility, performance)

- **Mobile**: Responsive spacing/typography, `min-h-dvh`, safe-area insets for notched devices, `touch-manipulation` on primary taps, ~44px minimum touch targets on header and CTAs.
- **Accessibility**: Skip link to main content, labeled form fields, `role="alert"` / `role="status"` for feedback, focus-visible rings, `prefers-reduced-motion` respected in global CSS.
- **Speed**: `next/font` with `display: swap`, `experimental.optimizePackageImports` for `lucide-react` in `next.config.ts`.

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Mobile**: Expo (React Native) app in [`mobile/`](./mobile) — iOS-first, same Supabase project + `/api/mobile` on this site
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

## Deploy on Cloudflare (believetheworks.org)

The app is configured for **Cloudflare Workers** using [OpenNext](https://opennext.js.org/cloudflare).

1. Set production env (especially `NEXT_PUBLIC_*`) — see **`.env.production.example`**.
2. Build and deploy:

```bash
npm run cf:build
npx wrangler login
npm run cf:deploy
```

3. Attach the custom domain **believetheworks.org** in the Cloudflare dashboard (Workers → your worker → Custom domains).
4. Update **Supabase** Site URL and redirect allowlist for `https://believetheworks.org`.

Full steps: **[docs/cloudflare-deploy.md](./docs/cloudflare-deploy.md)**.

## URL structure

- `/channel` – List channels
- `/channel/[slug]` – Channel home (e.g. `/channel/bible-study`)
- `/channel/[slug]/[pageSlug]` – Sub-page (e.g. `/channel/bible-study/videos`)
- `/channel/[slug]/content/[id]` – Content detail

## Tests

```bash
npm test                  # unit tests + database security tests (no network, no real services)
npm run test:watch        # re-run on change
npm run test:smoke        # HTTP checks of a running site: SMOKE_BASE_URL=http://localhost:3000 npm run test:smoke
npm run test:connections  # manual check of your real Supabase / AI keys (needs .env.local)
```

The database tests run the security migrations (`20261121000000_security_hardening.sql`,
`20261121000100_editorial_featured.sql`) against an in-memory Postgres and check who can change
roles, moderation status, featured posts, comments, and the Bible Q&A quota. If you add a
migration that changes those rules, extend `tests/db/security-migrations.test.ts`.

## Password rules

The minimum password length is 10 characters (`lib/password-policy.ts`). Keep it in sync with
Supabase → Authentication → "Minimum password length".

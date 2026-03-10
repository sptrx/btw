# BTW – Faith-Based Social Platform

A Christian faith-based social platform with AI-driven filtering for inappropriate content and fake users. Built with Next.js, Supabase, and OpenRouter/Google AI.

## Features

- **Faith-based community** – Share encouragement, scripture, and testimony in a safe space
- **Topic channels** – Authors create topic channels with written content, tutorials, debates, images, and videos
- **Join-request flow** – Users request to join a topic; authors approve members
- **Member-only interaction** – Only approved, signed-up users can comment, give feedback (like/helpful), and share
- **AI content moderation** – Filters porn, profanity, blasphemy, hate speech, and anti-Christian content
- **Fake-user protection** – Rate limiting and heuristics to reduce spam and bot behavior
- **Authentication** – Email signup/login via Supabase Auth
- **Profiles** – Display name, bio, and post history

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Supabase (database + auth), Server Actions
- **AI**: OpenRouter (Gemini), Google AI, or OpenAI (moderation)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-username/btw.git
cd btw
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migrations in `supabase/migrations/` (in order):
   - `20240101000001_initial_schema.sql` – profiles, posts
   - `20240102000001_topics_and_channels.sql` – topics, content, members, comments
3. In Authentication → URL Configuration, add:
   - Site URL: `http://localhost:3000` (dev) or your production URL
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 3. Environment variables

Copy `env.example` to `.env.local` and fill in:

```bash
cp env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key
- At least one AI provider:
  - `OPENROUTER_API_KEY` (recommended)
  - `GOOGLE_AI_API_KEY`
  - `OPENAI_API_KEY`

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
btw/
├── app/
│   ├── auth/              # Login, signup, callback
│   ├── feed/               # Main feed
│   ├── profile/            # User profiles
│   ├── dashboard/          # Dashboard + settings + topic member management
│   ├── posts/              # Post detail + edit
│   └── topics/             # Topic channels
│       ├── [slug]/         # Topic page, add content
│       │   └── content/    # New content form
│       └── content/[id]    # Content detail (comments, feedback, share)
├── actions/
│   ├── index.ts            # Posts, auth, profile
│   └── topics.ts           # Topics, content, members, comments
├── components/
├── lib/
│   └── moderation.ts       # AI moderation (OpenRouter/Google/OpenAI)
└── supabase/
    └── migrations/
```

## AI Moderation

The app uses AI to evaluate posts before they’re published. Priority:

1. **OpenRouter** – Faith-based prompt with Gemini (recommended)
2. **Google AI** – Same prompt with Gemini Pro
3. **OpenAI** – Basic Moderation API (no faith-specific rules)

Get an OpenRouter key at [openrouter.ai](https://openrouter.ai).

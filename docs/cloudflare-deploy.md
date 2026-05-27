# Deploy BTW on Cloudflare (Workers + OpenNext)

Production domain: **https://believetheworks.org**

This app uses [**OpenNext**](https://opennext.js.org/cloudflare) to run Next.js on **Cloudflare Workers** (not Pages-only static hosting).

## Prerequisites

- A [Cloudflare](https://dash.cloudflare.com) account with **believetheworks.org** on Cloudflare DNS (nameservers pointed to Cloudflare).
- [Node.js](https://nodejs.org/) 20+ and npm.
- For production builds, **Linux or macOS** (or **WSL** on Windows) is recommended; OpenNext warns that Windows native builds can be unreliable.

## 1. Install dependencies

```bash
npm install
```

## 2. Production environment (Supabase)

You can configure Supabase in either of these ways (or both):

1. **`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`** — inlined into the **client** bundle at **`cf:build`**. They must be present in **Workers Builds → Build variables** (or `.env.production` locally) when you build.

2. **`SUPABASE_URL` and `SUPABASE_ANON_KEY`** — read at **runtime** on the Worker (set under **Worker → Settings → Variables**). They are **not** prefixed with `NEXT_PUBLIC_`, so they are not baked into the JS at build time; the root layout injects them into the page as `window.__BTW_SUPABASE__` so the **browser** can still create the Supabase client **without** rebuilding if you only had Worker vars wrong before.

If the browser console still says the URL/key is missing, set **`SUPABASE_URL`** and **`SUPABASE_ANON_KEY`** on the Worker (same values as in Supabase **Project → API**), redeploy, and hard-refresh. Optionally also keep **`NEXT_PUBLIC_*`** in Build variables so the client bundle matches.

Copy `env.example` → `.env.production` for local `cf:build`, or export the same names in CI.

Add any other server-side secrets (`OPENROUTER_API_KEY`, R2 keys, etc.) the same way you use `.env.local` locally.

### Scripture Chat (bible-ai)

Production BTW calls **Scripture Chat** at [https://bible-ai-c3q.pages.dev](https://bible-ai-c3q.pages.dev/) for:

- **Bible Q&A** nav link → `/ask` on that host (defaults are baked in when `NODE_ENV=production`; override with **`NEXT_PUBLIC_BIBLE_AI_URL`** if you use another Pages project).
- **Scripture guide replies** on comments → server `POST` to `https://bible-ai-c3q.pages.dev/api/v1/commentary` with JSON body including **`userId`** (signed-in BTW user) and **`feature`: `"commentary"`** (defaults when **`BIBLE_AI_BASE_URL`** is unset in production; override for staging).

On the Worker (**Settings** → **Variables / Secrets**), set **`BIBLE_AI_API_KEY`** to the **same** value as bible-ai's **`BIBLE_AI_API_KEY`** (secret). Production bible-ai requires the partner key on all `/api/v1/*` POST routes.

**Phase 1 quotas:** BTW enforces **`BTW_BIBLE_AI_DAILY_LIMIT`** (default 30) per user via `bible_ai_daily_usage` (run Supabase migration). bible-ai also enforces **`BIBLE_AI_USER_DAILY_QUOTA`** (default 40) when `userId` is sent.

**Private bible-ai (BTW-only):** On the bible-ai Cloudflare project set **`BIBLE_AI_API_KEY`** (same secret as BTW), **`BIBLE_AI_HANDOFF_SECRET`** (same on both apps), **`BIBLE_AI_PUBLIC_SITE=false`**, **`BIBLE_AI_ALLOW_PUBLIC_CHAT=false`**, and **`BIBLE_AI_ALLOWED_ORIGINS`** to your BTW origin(s).

**SSO handoff:** Signed-in users open **Bible Q&A** via BTW **`/api/bible-ai/sso`** → short-lived JWT → bible-ai **`/auth/handoff`** → session cookie (7 days). Set on BTW Worker: **`BIBLE_AI_HANDOFF_SECRET`**, **`BIBLE_AI_PUBLIC_ORIGIN`** (bible-ai URL). Header link uses SSO when the handoff secret is set (default).

Optional overrides:

| Variable | Purpose |
| -------- | ------- |
| `BIBLE_AI_BASE_URL` | Server-only guide API origin (no trailing slash). |
| `NEXT_PUBLIC_BIBLE_AI_URL` | Full URL for the header **Bible Q&A** link (e.g. `https://bible-ai-c3q.pages.dev/ask`). Must be present at **`cf:build`** time if you rely on env instead of the production default. |

## 3. Build for Cloudflare

```bash
npm run cf:build
```

This runs `next build` and packages the OpenNext worker under `.open-next/` (gitignored).

## 4. Log in and deploy

```bash
npx wrangler login
npm run cf:deploy
```

`cf:deploy` runs `opennextjs-cloudflare deploy -- --keep-vars`, which uploads the worker and **keeps** existing dashboard **Variables** (Wrangler otherwise deletes vars not listed in `wrangler.jsonc`).

## 5. Bind environment variables / secrets on the Worker

Middleware and server code read Supabase from **`SUPABASE_URL` / `SUPABASE_ANON_KEY`** (preferred at runtime) or **`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`**. On Cloudflare Workers, `process.env` must be populated (`wrangler.jsonc` enables `nodejs_compat_populate_process_env`).

In the [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages** → your worker (**btw**) → **Settings** → **Variables**:

- **Supabase (pick one style or use both):**
  - **`SUPABASE_URL`** + **`SUPABASE_ANON_KEY`** — same values as Supabase **Project Settings → API** (Project URL and `anon` `public` key). Enough for server + middleware; the app injects them for the browser so the client works even if `NEXT_PUBLIC_*` was missing at build.
  - **`NEXT_PUBLIC_SUPABASE_URL`** + **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** — duplicate the same strings if you also want them inlined at **build** time (recommended together with Workers Builds → Build variables).
- Add other **plain-text** vars needed at **runtime** (e.g. `OPENROUTER_API_KEY`).
- Use **Secrets** for sensitive values (e.g. `R2_SECRET_ACCESS_KEY`, `OPENROUTER_API_KEY`).

### R2 media + profile avatars (required for uploads on production)

Avatar upload and channel media use the same R2 config as local `.env.local`. If any of these are missing on the Worker, uploads return *“not configured”* and users can only paste an image URL.

| Variable | Dashboard type | Notes |
| -------- | -------------- | ----- |
| `R2_ACCOUNT_ID` | Variable (plain) | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Variable (plain) | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | **Secret** | R2 API token secret — do not use plain text |
| `R2_BUCKET_NAME` | Variable (plain) | Your bucket name |
| `R2_PUBLIC_URL` | Variable (plain) | Public base URL, no trailing slash (e.g. `https://pub-xxxxx.r2.dev` or custom domain) |

Optional: `R2_PROXY_MAX_MB`, `R2_MAX_IMAGE_MB`, `R2_MAX_VIDEO_MB` (see `docs/cloudflare-r2.md`).

After adding variables, **redeploy is not required** for plain Worker variables/secrets — they apply on the next request. Hard-refresh the site and try upload again.

Copy the same values from your working `.env.local` into **Workers & Pages → btw → Settings → Variables and Secrets** (production environment).

#### R2 bucket binding (required for uploads on Workers)

Server-side uploads on Cloudflare Workers use the **R2 bucket binding** in `wrangler.jsonc` (not only the S3 API keys). Ensure:

```jsonc
"r2_buckets": [
  { "binding": "R2_MEDIA_BUCKET", "bucket_name": "<same as R2_BUCKET_NAME>" }
]
```

This repo sets `bucket_name` to `btw-bucket` — change it if your bucket name differs, then **`npm run cf:deploy`** with **`--keep-vars`**.

You still need **`R2_PUBLIC_URL`** as a Worker variable so the app can build public image URLs after upload.

**Workers Builds → Build variables:** still set **`NEXT_PUBLIC_*`** if you want the client bundle to embed Supabase without relying on injection; otherwise **`SUPABASE_*` on the Worker** alone is sufficient after this app’s layout injection.

If you change `NEXT_PUBLIC_*`, **rebuild** (`cf:build`) and **redeploy**.

### Variables disappearing after a deploy

**Wrangler’s default behavior** is to **remove** Worker **plain-text variables** that are not listed in `wrangler.jsonc` every time a deployment runs. That is why R2 / Supabase vars you typed into the dashboard vanish after a **Workers Builds** push.

**Secrets** (`R2_SECRET_ACCESS_KEY`, etc.) usually survive; **plain-text Variables** do not unless you use **`--keep-vars`**.

#### Fix: Cloudflare Workers Builds (Git-connected)

In **Workers & Pages → btw → Settings → Builds**, use **one** of these:

| Approach | Build / deploy command |
| -------- | ---------------------- |
| **Recommended (single step)** | `npm ci && npm run cf:deploy` |
| **Two steps** | Build: `npm ci && npm run cf:build` — then set a custom deploy step or non-interactive deploy: `npm run cf:deploy:upload` |

Do **not** use a deploy step of only `npx wrangler deploy` or `opennextjs-cloudflare deploy` **without** `-- --keep-vars` — that resets dashboard Variables to empty.

If the UI has no separate deploy command and only runs `npm run build`, change the build command to **`npm ci && npm run cf:deploy`** (not plain `npm run build`).

#### Fix: deploy from your machine

```bash
npm run cf:deploy
```

That runs `opennextjs-cloudflare deploy -- --keep-vars` and keeps dashboard Variables.

#### Alternative: define non-secret vars in `wrangler.jsonc`

Add a `"vars": { ... }` block in `wrangler.jsonc` for values you are OK storing in git (e.g. `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`). Each deploy then **sets** those from the file. Keep **`R2_SECRET_ACCESS_KEY`** and API keys as **Secrets** (`wrangler secret put` or dashboard Secrets), not in `vars`.

## 6. Custom domain: believetheworks.org

1. Dashboard → **Workers & Pages** → **btw** → **Domains & Routes** (or **Triggers** → **Custom Domains**).
2. **Add custom domain** → `believetheworks.org` and optionally `www.believetheworks.org`.
3. Cloudflare will provision DNS/SSL automatically if the zone is on Cloudflare.

## 7. Supabase auth URLs

In [Supabase](https://supabase.com/dashboard) → **Authentication** → **URL Configuration**:

- **Site URL**: set this to your **real** production origin (e.g. `https://believetheworks.org`). If it is left as a placeholder like **`https://yourdomain.com`**, confirmation and reset emails (and anything using `{{ .SiteURL }}` in templates) will point at that fake host and auth will fail or open the wrong URL.
- **Redirect URLs** (add all that apply):
  - `https://believetheworks.org/**`
  - `https://believetheworks.org/auth/callback`
  - `https://www.believetheworks.org/**` (if you use `www`)

Email magic links, **signup confirmation**, and password reset use `/auth/callback` (with a `next=` query for where to go next, e.g. `/auth/confirmed`); allowlist patterns must cover your callback URL.

The app sends `redirectTo: ${window.location.origin}/auth/callback?next=/auth/reset-password` when requesting a reset; **Redirect URLs** must include your production callback origin (`https://.../auth/callback` or a `/**` pattern). After changing **Site URL** or **Redirect URLs**, request a **new** reset email (old links keep old hosts).

### Password-changed email (security notification)

The **“Your password was changed”** email is configured in Supabase, not in this app repo’s runtime code. The template lives at `supabase/templates/password_changed.html` and is referenced from `supabase/config.toml`.

- **Do not** use markdown like `[/auth/forgot-password]Reset password now` — that will not render as a link. Use HTML: `<a href="{{ .SiteURL }}/auth/forgot-password">Reset password now</a>`.
- Deploy to the linked project: `npx supabase@2.84.4 config push` (from the `btw` directory).
- Or paste the HTML from `supabase/templates/password_changed.html` into the dashboard: **Authentication** → **Email Templates** → **Password changed** (security notification).

## 8. CI/CD (optional)

Cloudflare’s Workers pipeline often runs **`npm run build`** (`next build` only) and then **`opennextjs-cloudflare deploy`**. That fails with *“Could not find compiled Open Next config”* because **`next build` does not create `.open-next/`** — you must run **`opennextjs-cloudflare build`** before deploy.

**Do not** point the dashboard **Build command** at plain `npm run build` if the next step is `opennextjs-cloudflare deploy`. Use one of these:

1. **Build command:** `npm ci && npm run cf:build` — deploy with **`npm run cf:deploy:upload`** (includes **`--keep-vars`**), **or**
2. **Single command** for build+deploy: `npm ci && npm run cf:deploy` (includes **`--keep-vars`**; set Build variables so `NEXT_PUBLIC_*` are available during `cf:build`).

`opennextjs-cloudflare build` runs `next build` internally, so you must **not** set `package.json`’s `"build"` script to `opennextjs-cloudflare build` (that would recurse).

**Cloudflare build fails on `supabase` postinstall:** The Supabase **CLI** is not an npm dependency in this repo (it used to download a binary from GitHub during `npm ci`, which often fails on Workers Builds with `socket hang up`). Use `npx supabase@2.84.4 …` locally for migrations and `config push`. Runtime uses `@supabase/supabase-js` only.

- Connect the Git repo in **Workers & Pages** → **Create** → **Connect to Git**, **or**
- In GitHub Actions, set `CLOUDFLARE_API_TOKEN` and run `npm ci && npm run cf:deploy` (with production env available during `cf:build`).

## Local preview (Workers runtime)

```bash
# Copy .dev.vars.example → .dev.vars and fill values
npm run cf:preview
```

## References

- [OpenNext Cloudflare — Get started](https://opennext.js.org/cloudflare/get-started)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

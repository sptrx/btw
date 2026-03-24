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
- Add other **plain-text** vars needed at **runtime** (e.g. `OPENROUTER_API_KEY`, R2 credentials for server routes).
- Use **Secrets** for sensitive values.

**Workers Builds → Build variables:** still set **`NEXT_PUBLIC_*`** if you want the client bundle to embed Supabase without relying on injection; otherwise **`SUPABASE_*` on the Worker** alone is sufficient after this app’s layout injection.

If you change `NEXT_PUBLIC_*`, **rebuild** (`cf:build`) and **redeploy**.

### Variables disappearing after a deploy

**Wrangler’s default behavior** is to **remove** Worker **plain-text variables** that are not defined in `wrangler.jsonc` before applying the new deployment. Dashboard-only variables are therefore wiped unless you use **`--keep-vars`**.

- This repo’s **`npm run cf:deploy`** / **`npm run deploy`** already pass **`--keep-vars`** to Wrangler (via `opennextjs-cloudflare deploy -- --keep-vars`), so CLI deploys keep dashboard variables.
- If you deploy another way (e.g. raw `wrangler deploy` or a custom CI step), add **`--keep-vars`** there too.
- **Secrets** are not deleted by deploys in the same way; if something still vanishes, confirm you used **Secrets** vs **Variables** and that the right **environment** (production vs preview) is selected in the dashboard.

To **manage vars in Git** instead, define them under `[vars]` in `wrangler.jsonc` (non-secrets only) or use **`wrangler secret put`** / **`--var`** for scripted deploys—then Wrangler won’t need to “replace” dashboard-only values.

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

## 8. CI/CD (optional)

Cloudflare’s Workers pipeline often runs **`npm run build`** (`next build` only) and then **`opennextjs-cloudflare deploy`**. That fails with *“Could not find compiled Open Next config”* because **`next build` does not create `.open-next/`** — you must run **`opennextjs-cloudflare build`** before deploy.

**Do not** point the dashboard **Build command** at plain `npm run build` if the next step is `opennextjs-cloudflare deploy`. Use one of these:

1. **Build command:** `npm ci && npm run cf:build` — then let the platform run deploy, **or**
2. **Single command** for build+deploy: `npm ci && npm run cf:deploy` (set env vars so `NEXT_PUBLIC_*` and secrets are available during `cf:build`).

`opennextjs-cloudflare build` runs `next build` internally, so you must **not** set `package.json`’s `"build"` script to `opennextjs-cloudflare build` (that would recurse).

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

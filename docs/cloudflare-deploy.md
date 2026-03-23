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

## 2. Production environment (important for `NEXT_PUBLIC_*`)

Next.js inlines `NEXT_PUBLIC_*` variables **at build time**. Set them **before** `npm run cf:build`:

- Copy `env.example` → `.env.production` (or export vars in CI).
- At minimum:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Add any other server-side secrets your app needs (`OPENROUTER_API_KEY`, R2 keys, etc.) the same way you use `.env.local` locally.

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

`cf:deploy` runs `opennextjs-cloudflare deploy`, which uploads the worker.

## 5. Bind environment variables / secrets on the Worker

Middleware and server code read Supabase settings from `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`. On Cloudflare Workers, those names must exist as **runtime** variables, and Workers must populate `process.env` (this repo’s `wrangler.jsonc` enables `nodejs_compat_populate_process_env` for that).

In the [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages** → your worker (**btw**) → **Settings** → **Variables**:

- **Required for Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same values as in Supabase **Project Settings → API**).
- Add other **plain-text** vars needed at **runtime** (e.g. `OPENROUTER_API_KEY`, R2 credentials for server routes).
- Use **Secrets** for sensitive values.

Also add the same `NEXT_PUBLIC_*` values under **Workers Builds** → **Build variables and secrets** so `npm run cf:build` can inline them for the client bundle. If those are missing at build time, the browser throws `@supabase/ssr: Your project's URL and API key are required` because the client bundle was compiled without Supabase env.

`NEXT_PUBLIC_*` values must match between **build** and **runtime**; if you change them, **rebuild** (`cf:build`) and **redeploy**. Use `opennextjs-cloudflare deploy -- --keep-vars` (or Wrangler **keep-vars**) if CLI deploys would otherwise clear dashboard variables.

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

Email magic links and password reset use `/auth/callback`; they must match these allowlists.

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

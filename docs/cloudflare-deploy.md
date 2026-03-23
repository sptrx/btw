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

In the [Cloudflare dashboard](https://dash.cloudflare.com) → **Workers & Pages** → your worker (**btw**) → **Settings** → **Variables**:

- Add **plain-text** vars for anything that must also be available at **runtime** on the server (e.g. `OPENROUTER_API_KEY`, R2 credentials if used server-side).
- For sensitive values, use **Secrets** (encrypted).

`NEXT_PUBLIC_*` values must match what you used at **build** time; if you change them, **rebuild** (`cf:build`) and **redeploy**.

## 6. Custom domain: believetheworks.org

1. Dashboard → **Workers & Pages** → **btw** → **Domains & Routes** (or **Triggers** → **Custom Domains**).
2. **Add custom domain** → `believetheworks.org` and optionally `www.believetheworks.org`.
3. Cloudflare will provision DNS/SSL automatically if the zone is on Cloudflare.

## 7. Supabase auth URLs

In [Supabase](https://supabase.com/dashboard) → **Authentication** → **URL Configuration**:

- **Site URL**: `https://believetheworks.org`
- **Redirect URLs** (add all that apply):
  - `https://believetheworks.org/**`
  - `https://believetheworks.org/auth/callback`
  - `https://www.believetheworks.org/**` (if you use `www`)

Email magic links and password reset use `/auth/callback`; they must match these allowlists.

## 8. CI/CD (optional)

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

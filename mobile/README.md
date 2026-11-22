# BTW mobile (Expo)

Native iOS-first client for [Believe The Works](https://believetheworks.org). It talks to the same Supabase project as the website and calls `POST /api/mobile/<action>` on the deployed site for anything that needs server-side AI moderation (comments, prayer requests, etc.).

## Tabs

| Tab | What it does |
| --- | --- |
| Feed | Community feed with filters, reactions |
| Channels | Browse channels and read posts |
| Prayer | Prayer Wall: request, pray, encourage, mark answered |
| Ask | Bible Q&A (same `/api/bible-ai/ask` as the site) |
| Profile | Sign in / up, edit profile, delete account |

## Setup

```bash
cd mobile
cp .env.example .env.local
# Fill EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
# (same values as NEXT_PUBLIC_* on the website).
npm install
npm start
```

Then press `i` for the iOS Simulator (needs a Mac), scan the QR code with Expo Go on a device, or press `w` for a web preview.

### API URL

`EXPO_PUBLIC_API_URL` must point at a BTW website build that includes `/api/mobile`:

- Local Next.js: `http://localhost:3000` (Expo web / simulator on the same machine)
- Phone on your LAN: `http://192.168.x.x:3000` (your computer’s Wi-Fi IP; disable client firewall blocks on port 3000)
- Production: `https://believetheworks.org` (after that API is deployed)

## App Store build (iOS)

This app is configured for [EAS Build](https://docs.expo.dev/build/setup/):

```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile production
eas submit --platform ios
```

Bundle ID: `org.believetheworks.btw`. Account deletion is under Profile → Delete account (App Store requirement).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Expo dev server |
| `npm run ios` / `android` / `web` | Open a platform |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

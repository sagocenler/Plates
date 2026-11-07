# Plates

A mobile-first restaurant journal: log visits (with dishes and "why I'd recommend it"), build curated lists, and share recommendations.

**Status: front end complete; Supabase backend connected (opt-in mode).** React + Vite + TypeScript + Tailwind. Data lives in the browser (IndexedDB via Dexie) behind repository interfaces in `src/data/interfaces.ts`, so Supabase can replace it later without touching the UI. See `docs/schema.sql` for the target schema.

## Setup
```bash
npm install
npm run dev        # http://localhost:5173
```
Sign in with any email (local stub). In dev, a fresh store is seeded with ~30 NYC visits.

## Scripts
| | |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Typecheck + production build |
| `npm test` | Vitest unit/component tests |
| `npm run e2e` | Playwright end-to-end tests |
| `npm run lint` | oxlint |

## Supabase mode (real backend)
The app has two data backends behind the same interfaces (`src/data/interfaces.ts`):

| | Command | Data | Sign-in |
|---|---|---|---|
| Local (default) | `npm run dev` | IndexedDB in the browser, seeded with NYC demo data | any email (dev stub) |
| Supabase | `npm run dev:supabase` (port 5175) | your Supabase project, protected by row-level security | email + password |

Setup for Supabase mode:
1. Copy `.env.example` to `.env.supabase.local` (git-ignored) and fill in the project URL and **publishable** key.
2. Schema: `supabase/migrations/*.sql` (already applied to the project). Privacy tests: `supabase/tests/rls.sql`.
3. To skip email verification for now, turn **off** Authentication > Sign In / Providers > Email > "Confirm email" in the Supabase dashboard. (If it is on, sign-up tells the user to confirm by email.)
4. Create your account in the app ("Create an account"), then sign in.
5. Optional real-backend smoke test: `E2E_SUPABASE_EMAIL=... E2E_SUPABASE_PASSWORD=... npm run e2e -- supabase`.

Not yet in Supabase mode: Google Places search (mock list), offline queue/sync (needs a connection), uploading existing on-device data, and link previews for iMessage/WhatsApp/Slack (needs a small server function).

## Layout
- `src/domain/`: types, search/filter, share-payload builder (pure, tested)
- `src/data/`: repo interfaces, local Dexie implementation, mock places provider, seed
- `src/features/`, `src/routes/`, `src/components/`: UI

## Still to do
Google Places search, offline queue/sync, on-device data upload, Open Graph link previews, Google sign-in, email verification. See `.env.example` for what may and may not go in the browser.

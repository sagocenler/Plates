# Plates

A mobile-first restaurant journal: log visits (with dishes and "why I'd recommend it"), build curated lists, and share recommendations.

**Status: front end only.** React + Vite + TypeScript + Tailwind. Data lives in the browser (IndexedDB via Dexie) behind repository interfaces in `src/data/interfaces.ts`, so Supabase can replace it later without touching the UI. See `docs/schema.sql` for the target schema.

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

## Layout
- `src/domain/`: types, search/filter, share-payload builder (pure, tested)
- `src/data/`: repo interfaces, local Dexie implementation, mock places provider, seed
- `src/features/`, `src/routes/`, `src/components/`: UI

## Deferred to the Supabase phase
Real auth, Google Places, cross-device sync, server-rendered share pages with Open Graph previews, RLS tests. No secrets are needed today; see `.env.example`.

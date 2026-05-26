# PassportWatch

A real-time social media intelligence dashboard for tracking passport-related discussions across platforms. Built for a college assignment.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied to /api)
- `pnpm --filter @workspace/dashboard run dev` — run the React dashboard (proxied to /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `OPENAI_API_KEY` — for summaries and translation

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React 19, Vite, Tailwind CSS v4, Recharts, TanStack Query
- Theme: Dark "mission control" aesthetic with amber primary

## Where things live

- `lib/db/src/schema/posts.ts` — DB schema (`postsTable`, `scrapeSessionsTable`)
- `lib/api-spec/` — OpenAPI spec (source of truth for all API contracts)
- `lib/api-zod/` — Generated Zod validators (from codegen)
- `lib/api-client-react/` — Generated React Query hooks (from codegen)
- `artifacts/api-server/src/lib/scraper.ts` — Reddit + mock data scraper
- `artifacts/api-server/src/lib/nlp.ts` — NLP: categorize, sentiment, gibberish, translate, summarize
- `artifacts/api-server/src/lib/openai-client.ts` — OpenAI client (uses `OPENAI_API_KEY`)
- `artifacts/api-server/src/routes/` — Express routes (posts, stats, health)
- `artifacts/dashboard/src/pages/` — Dashboard and Analytics pages
- `artifacts/dashboard/src/components/dashboard/` — PostFeed, StatCards, SidebarCharts

## Architecture decisions

- Contract-first: OpenAPI spec defines all endpoints; Zod validators and React Query hooks are generated from it
- Background scraping: `POST /api/posts/refresh` starts async scrape, returns immediately; client queries poll for new data
- NLP pipeline: keyword categorization → sentiment scoring → gibberish filter → OpenAI batch summaries (5 concurrent)
- Clustering: posts grouped by category + top keywords; cluster ID is a hash of combined key
- Translation: on-demand via OpenAI, cached in DB per post per language

## Product

- **Operations Dashboard**: stat cards (total posts, 24h count, platforms, top category, sentiment, avg engagement), filterable post feed with search, per-post AI summaries and on-demand translation to 10 languages, post volume timeline, sentiment pie chart
- **Analytics**: platform breakdown (posts + engagement), category distribution, sentiment breakdown, 24h timeline line chart
- **Data pipeline**: scrapes Reddit (live) + generates realistic mock data for 6 other platforms, runs NLP, stores in Postgres
- **Export**: CSV and HTML report export with current filters applied

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After deploy or DB reset, call `POST /api/posts/refresh` once to seed initial data
- Scrape deletes all existing posts then re-inserts — no incremental updates
- OpenAI batch summaries (5 concurrent) add ~30s to scrape for 60 posts; Reddit fetch uses a 5s timeout and fails gracefully
- Header export URLs use relative `/api/posts/export` which routes through the shared proxy — do not change to absolute URLs

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

# PassportWatch 🛂

> A real-time social media intelligence dashboard for tracking, analysing, and translating passport-related discussions across 7 platforms.

**Live Demo:**   https://social-feed-aggregator--babitatomar1506.replit.app/

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [Features](#features)
5. [Tech Stack](#tech-stack)
6. [Setup & Installation](#setup--installation)
7. [Environment Variables](#environment-variables)
8. [API Reference](#api-reference)
9. [Project Structure](#project-structure)

---

## Overview

PassportWatch scrapes, processes, and visualises passport-related posts from social media. It runs an NLP pipeline on every post — categorising content into 10 topics, scoring sentiment, filtering gibberish, generating AI summaries, and clustering similar posts. The React dashboard lets you filter, search, translate to 10 languages, and export data.

Built as a college assignment demonstrating full-stack development, NLP pipelines, and API design.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (React)                          │
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────────────────────┐   │
│  │  Operations     │    │  Analytics                       │   │
│  │  Dashboard      │    │  - Platform breakdown            │   │
│  │  - Stat Cards   │    │  - Category distribution         │   │
│  │  - Post Feed    │    │  - Sentiment pie                 │   │
│  │  - Filters      │    │  - Timeline chart                │   │
│  │  - Timeline     │    └──────────────────────────────────┘   │
│  │  - Sentiment    │                                           │
│  └────────┬────────┘                                           │
│           │  TanStack Query (generated hooks)                  │
└───────────┼─────────────────────────────────────────────────────┘
            │  HTTP / JSON
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API SERVER  (Express 5)                      │
│                                                                 │
│  Routes                                                         │
│  ├── GET  /api/posts              ← list with filters           │
│  ├── POST /api/posts/refresh      ← trigger scrape              │
│  ├── GET  /api/posts/export       ← CSV / HTML report           │
│  ├── POST /api/posts/:id/translate← translate single post       │
│  ├── GET  /api/stats              ← summary KPIs                │
│  ├── GET  /api/stats/platforms    ← by platform                 │
│  ├── GET  /api/stats/categories   ← by category                 │
│  ├── GET  /api/stats/sentiment    ← by sentiment                │
│  └── GET  /api/stats/timeline     ← hourly post volume          │
│                                                                 │
│  Services                                                       │
│  ├── Scraper  → Reddit API + Mock data (6 platforms)            │
│  ├── NLP      → categorise · sentiment · gibberish · cluster    │
│  ├── OpenAI   → batch summaries (gpt-4o-mini)                   │
│  └── MyMemory → free translation API (10 languages)             │
└───────────────────┬─────────────────────────────────────────────┘
                    │  Drizzle ORM
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                PostgreSQL Database                               │
│                                                                 │
│  posts              scrape_sessions                             │
│  ├── id             ├── id                                      │
│  ├── platform       ├── started_at                              │
│  ├── content        ├── completed_at                            │
│  ├── category       ├── post_count                              │
│  ├── sentiment      └── status                                  │
│  ├── summary                                                    │
│  ├── cluster_id                                                 │
│  ├── translated_content                                         │
│  └── ... (20 fields total)                                      │
└─────────────────────────────────────────────────────────────────┘
                    │  HTTP
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│               External APIs                                     │
│                                                                 │
│  Reddit JSON API      → live posts (no auth required)           │
│  OpenAI gpt-4o-mini   → AI summaries (OPENAI_API_KEY)           │
│  MyMemory API         → translation (free, no key needed)       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
SCRAPE TRIGGER  POST /api/posts/refresh
       │
       ├─► 1. Fetch Reddit posts (/r/passport, /r/travel) — live
       │
       ├─► 2. Generate 60 mock posts across 6 platforms
       │       (Twitter/X · LinkedIn · Facebook · Instagram · YouTube · TikTok)
       │
       ├─► 3. NLP Pipeline (per post, synchronous)
       │       ├── isGibberish()     → drop low-quality posts
       │       ├── categorize()      → keyword scoring → 1 of 10 categories
       │       ├── analyzeSentiment()→ lexicon scoring → positive/negative/neutral
       │       ├── detectLanguage()  → script detection + keyword matching
       │       ├── detectRegion()    → keyword matching against 10 regions
       │       └── generateClusterId() → hash(category + top keywords)
       │
       ├─► 4. Batch AI Summaries (OpenAI, 5 concurrent)
       │       → 20–30 word neutral summary per post
       │
       ├─► 5. Compute cluster sizes
       │
       └─► 6. Bulk INSERT into PostgreSQL
```

---

## Features

| Feature | Details |
|---|---|
| **Multi-platform scraping** | Reddit (live API) + 6 mocked platforms |
| **10 NLP categories** | Application, Renewal, Appointments, Tatkal, Visa, Travel Issues, Govt Announcements, Scams/Fraud, News, Personal Experiences |
| **Sentiment analysis** | Positive / Negative / Neutral with numeric score |
| **Gibberish filter** | Drops low-quality, spam, or garbled posts |
| **AI summaries** | 20–30 word summaries via OpenAI gpt-4o-mini |
| **Post clustering** | Groups similar posts by topic fingerprint |
| **10-language translation** | Hindi, Spanish, French, German, Arabic, Chinese, Russian, Punjabi, Japanese (MyMemory API, free) |
| **Filters & search** | Platform, Category, Sentiment, Language, Region, free-text search |
| **Sorting** | Newest, Oldest, Most/Least engagement |
| **Cluster view** | Toggle to show one representative per cluster |
| **Export** | CSV (raw data) and HTML report, filter-aware |
| **Analytics charts** | Platform breakdown, category distribution, sentiment pie, hourly timeline |
| **Responsive UI** | Dark "mission control" theme, works on desktop and tablet |

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js 24 |
| Framework | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4 + drizzle-zod |
| AI Summaries | OpenAI gpt-4o-mini |
| Translation | MyMemory API (free) |
| Logging | pino + pino-http |
| Build | esbuild |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Data fetching | TanStack Query v5 |
| UI components | Radix UI / shadcn-style |
| Routing | Wouter |
| Notifications | Sonner |

### Tooling
| Tool | Purpose |
|---|---|
| pnpm workspaces | Monorepo package management |
| TypeScript 5.9 | Type safety across all packages |
| Orval | Generates React Query hooks + Zod schemas from OpenAPI spec |
| Drizzle Kit | DB schema push and migrations |

---

## Setup & Installation

### Prerequisites
- **Node.js** v20 or later — [nodejs.org](https://nodejs.org)
- **pnpm** — `npm install -g pnpm`
- **PostgreSQL** — local install or free cloud: [neon.tech](https://neon.tech) / [supabase.com](https://supabase.com)
- **OpenAI API key** — for AI summaries (optional — app still works without it, summaries fall back to truncated text)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/passportwatch.git
cd passportwatch

# 2. Install all dependencies
pnpm install

# 3. Create environment file
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# 4. Push database schema
pnpm --filter @workspace/db run push

# 5. Start the API server (Terminal 1)
pnpm --filter @workspace/api-server run dev

# 6. Start the frontend (Terminal 2)
PORT=5173 BASE_URL=/ pnpm --filter @workspace/dashboard run dev

# 7. Open http://localhost:5173 in your browser

# 8. Seed initial data — click "FORCE SYNC" in the top-right of the dashboard
#    OR run:
curl -X POST http://localhost:5173/api/posts/refresh
```

> **Note:** The first sync takes ~30–60 seconds because OpenAI generates summaries for each post. Subsequent syncs are the same speed.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Required — PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/passportwatch

# Required for AI summaries — get from https://platform.openai.com/api-keys
# App works without this but summaries will be truncated text
OPENAI_API_KEY=sk-...

# Required — any random 32+ character string for session security
SESSION_SECRET=change_this_to_a_random_secret_string
```

---

## API Reference

Full API docs with request/response examples: **[docs/API.md](docs/API.md)**

Postman collection: **[docs/PassportWatch.postman_collection.json](docs/PassportWatch.postman_collection.json)**

### Quick Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/posts` | List posts with filters and pagination |
| `POST` | `/api/posts/refresh` | Trigger a new scrape (async) |
| `GET` | `/api/posts/export` | Download CSV or HTML report |
| `POST` | `/api/posts/:id/translate` | Translate a post to a target language |
| `GET` | `/api/stats` | Dashboard summary KPIs |
| `GET` | `/api/stats/platforms` | Post count + engagement per platform |
| `GET` | `/api/stats/categories` | Post count per category |
| `GET` | `/api/stats/sentiment` | Post count per sentiment |
| `GET` | `/api/stats/timeline` | Hourly post volume (last 24h) |
| `GET` | `/api/healthz` | Health check |

---

## Project Structure

```
passportwatch/
├── artifacts/
│   ├── api-server/              # Express API
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── nlp.ts       # NLP pipeline (categorise, sentiment, translate…)
│   │       │   ├── scraper.ts   # Reddit + mock data scraper
│   │       │   └── openai-client.ts
│   │       └── routes/
│   │           ├── posts.ts     # /api/posts endpoints
│   │           └── stats.ts     # /api/stats endpoints
│   └── dashboard/               # React frontend
│       └── src/
│           ├── pages/
│           │   ├── Dashboard.tsx
│           │   └── Analytics.tsx
│           └── components/
│               └── dashboard/
│                   ├── PostFeed.tsx      # filterable post list
│                   ├── StatCards.tsx     # KPI cards
│                   └── SidebarCharts.tsx # timeline + sentiment charts
├── lib/
│   ├── db/                      # Drizzle schema + DB client
│   │   └── src/schema/posts.ts  # ← source of truth for DB schema
│   ├── api-spec/                # OpenAPI spec (contract-first source of truth)
│   │   └── openapi.yaml
│   ├── api-zod/                 # Generated Zod validators (from codegen)
│   └── api-client-react/        # Generated React Query hooks (from codegen)
├── docs/
│   ├── API.md                   # Full API documentation
│   └── PassportWatch.postman_collection.json
└── README.md
```

---

## Regenerating API Client

If you modify `lib/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```

This regenerates all Zod validators and React Query hooks automatically.

---

## Pushing DB Schema Changes

```bash
pnpm --filter @workspace/db run push
```

---

*Built with ❤️ as a college assignment — PassportWatch, 2026*

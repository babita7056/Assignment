# PassportWatch — API Documentation

**Base URL (dev):** `http://localhost:8080`  
**Base URL (production):** `https://9623aeee-292a-451c-818e-5e1e7c42ea75-00-jvdb1njfog3p.sisko.replit.dev`  
**All routes prefixed with:** `/api`  
**Content-Type:** `application/json`

---

## Health Check

### `GET /api/healthz`

Returns server health status.

**Response `200`**
```json
{ "status": "ok" }
```

---

## Posts

### `GET /api/posts`

List posts with optional filters, sorting, and pagination.

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `platform` | string | — | Filter by platform: `Twitter/X`, `Reddit`, `LinkedIn`, `Facebook`, `Instagram`, `YouTube`, `TikTok` |
| `category` | string | — | Filter by category (see Categories below) |
| `sentiment` | string | — | `positive`, `negative`, `neutral` |
| `language` | string | — | `English`, `Hindi`, `Arabic`, `Spanish`, `French`, `German`, `Chinese`, `Russian`, `Punjabi`, `Japanese` |
| `region` | string | — | `India`, `USA`, `UK`, `Canada`, `Australia`, `UAE`, `Germany`, `France`, `China`, `Pakistan`, `Global` |
| `search` | string | — | Full-text search across content, translated content, and summary |
| `sortBy` | string | `publishedAt` | `publishedAt` or `engagement` |
| `sortOrder` | string | `desc` | `asc` or `desc` |
| `clustered` | string | — | Set to `true` to return one representative post per cluster |
| `page` | number | `1` | Page number (1-indexed) |
| `limit` | number | `20` | Posts per page (max 100) |

**Response `200`**
```json
{
  "posts": [
    {
      "id": "CC19MiqeYcI6xLppHhwyC",
      "platform": "TikTok",
      "content": "PSK staff were incredibly rude during my appointment...",
      "translatedContent": null,
      "translatedLanguage": null,
      "author": "@globaltravelbae",
      "authorHandle": "@globaltravelbae",
      "publishedAt": "2026-05-26T15:41:29.000Z",
      "category": "Appointments",
      "sentiment": "neutral",
      "sentimentScore": 0,
      "language": "English",
      "region": "Global",
      "engagement": 1843,
      "likes": 999,
      "shares": 399,
      "comments": 445,
      "summary": "PSK staff refused to examine documents and demanded unlisted items during an appointment, prompting a grievance escalation.",
      "isGibberish": false,
      "clusterId": "2r4k1m",
      "clusterSize": 3,
      "url": "https://tiktok.com/post/AbCdEfGh",
      "mediaUrl": null,
      "scrapedAt": "2026-05-26T16:09:24.000Z"
    }
  ],
  "total": 60,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

**Example requests**
```bash
# All posts, newest first
GET /api/posts

# Reddit posts about scams
GET /api/posts?platform=Reddit&category=Scams%2FFraud

# Search + sentiment filter
GET /api/posts?search=tatkal&sentiment=negative&limit=5

# Cluster view, most engaged
GET /api/posts?clustered=true&sortBy=engagement&sortOrder=desc

# Paginate
GET /api/posts?page=2&limit=10
```

---

### `POST /api/posts/refresh`

Triggers a new scrape in the background. Returns immediately — the scrape runs async and takes 30–60 seconds to complete. Poll `/api/stats` or `/api/posts` to detect when new data is available.

**Request body:** none

**Response `200`**
```json
{
  "message": "Scrape started. Fresh data will be available shortly.",
  "postCount": 60,
  "lastRefreshed": "2026-05-26T16:09:25.565Z"
}
```

**What happens during a scrape:**
1. All existing posts are deleted
2. Live posts fetched from Reddit `/r/passport` and `/r/travel`
3. 60 mock posts generated across 6 other platforms
4. NLP pipeline runs on every post (categorise → sentiment → gibberish filter → cluster)
5. AI summaries generated via OpenAI (batched, 5 concurrent)
6. All posts inserted into PostgreSQL

---

### `GET /api/posts/export`

Download filtered posts as CSV or HTML report.

**Query Parameters**

Supports the same filter parameters as `GET /api/posts` (`platform`, `category`, `sentiment`, `language`, `region`, `search`), plus:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `format` | string | `csv` | `csv` or `pdf` (returns HTML report) |

**Response — CSV** (`Content-Type: text/csv`)

Headers: `id, platform, author, authorHandle, publishedAt, category, sentiment, language, region, engagement, likes, shares, comments, summary, content, url`

**Response — HTML** (`Content-Type: text/html`)

Styled HTML document with all matching posts. Save as `.html` and open in a browser to print as PDF.

**Example requests**
```bash
# All posts as CSV
GET /api/posts/export?format=csv

# Negative sentiment posts as HTML report
GET /api/posts/export?format=pdf&sentiment=negative

# Reddit scam posts as CSV
GET /api/posts/export?format=csv&platform=Reddit&category=Scams%2FFraud
```

---

### `POST /api/posts/:id/translate`

Translate a single post to a target language. The translated text is cached in the database for the post.

**URL Parameters**

| Parameter | Description |
|---|---|
| `id` | Post ID (from `GET /api/posts`) |

**Request Body**
```json
{
  "targetLanguage": "Hindi"
}
```

**Supported target languages**

`Hindi`, `Spanish`, `French`, `German`, `Arabic`, `Chinese`, `Russian`, `Punjabi`, `Japanese`, `Portuguese`, `Italian`, `Korean`, `Turkish`, `Dutch`

**Response `200`**
```json
{
  "id": "CC19MiqeYcI6xLppHhwyC",
  "translatedContent": "मेरी नियुक्ति के दौरान पीएसके कर्मचारी अविश्वसनीय रूप से अशिष्ट थे...",
  "targetLanguage": "Hindi"
}
```

**Response `404`** — Post not found  
**Response `500`** — Translation service error

---

## Stats

### `GET /api/stats`

Dashboard summary KPIs.

**Response `200`**
```json
{
  "totalPosts": 60,
  "postsLast24h": 56,
  "platforms": 6,
  "topCategory": "Personal Experiences",
  "topSentiment": "negative",
  "avgEngagement": 3122,
  "filteredCount": 60,
  "lastRefreshed": "2026-05-26T16:09:25.565Z"
}
```

---

### `GET /api/stats/platforms`

Post count and total engagement broken down by platform, ordered by post count descending.

**Response `200`**
```json
[
  { "platform": "Facebook",   "count": 14, "engagement": 47312 },
  { "platform": "YouTube",    "count": 12, "engagement": 33886 },
  { "platform": "TikTok",     "count": 10, "engagement": 38764 },
  { "platform": "Twitter/X",  "count": 10, "engagement": 22238 },
  { "platform": "Instagram",  "count": 9,  "engagement": 30637 },
  { "platform": "LinkedIn",   "count": 5,  "engagement": 14500 }
]
```

---

### `GET /api/stats/categories`

Post count per NLP category, ordered by count descending.

**Response `200`**
```json
[
  { "category": "Personal Experiences",      "count": 15 },
  { "category": "Application",               "count": 12 },
  { "category": "Renewal",                   "count": 10 },
  { "category": "Appointments",              "count": 8  },
  { "category": "Visa",                      "count": 6  },
  { "category": "Travel Issues",             "count": 4  },
  { "category": "Scams/Fraud",               "count": 3  },
  { "category": "Tatkal",                    "count": 1  },
  { "category": "Government Announcements",  "count": 1  }
]
```

**Available categories:**
`Application`, `Renewal`, `Appointments`, `Tatkal`, `Visa`, `Travel Issues`, `Government Announcements`, `Scams/Fraud`, `News`, `Personal Experiences`

---

### `GET /api/stats/sentiment`

Post count per sentiment value.

**Response `200`**
```json
[
  { "sentiment": "negative", "count": 28 },
  { "sentiment": "neutral",  "count": 20 },
  { "sentiment": "positive", "count": 12 }
]
```

---

### `GET /api/stats/timeline`

Hourly post volume for the last 24 hours, ordered chronologically.

**Response `200`**
```json
[
  { "hour": "2026-05-26 02:00", "count": 2 },
  { "hour": "2026-05-26 03:00", "count": 4 },
  { "hour": "2026-05-26 04:00", "count": 3 },
  { "hour": "2026-05-26 05:00", "count": 1 },
  ...
]
```

---

## Error Responses

All error responses follow this shape:

```json
{ "error": "Human-readable error message" }
```

| Status | Meaning |
|---|---|
| `400` | Bad request — invalid query parameters (Zod validation) |
| `404` | Resource not found |
| `500` | Internal server error |

---

## NLP Pipeline Details

### Categorisation

Keyword scoring across 10 category buckets. Each keyword's score is weighted by its word count (multi-word phrases score higher). The category with the highest total score wins; ties default to `Personal Experiences`.

### Sentiment Scoring

Lexicon-based. Positive and negative word lists are matched against each token. Raw score is normalised to `[-1, +1]`. Thresholds: `> 0.05` = positive, `< -0.05` = negative, otherwise neutral.

### Gibberish Detection

A post is flagged as gibberish and dropped if any of the following are true:
- Fewer than 2 words
- Average word length < 2 or > 15 characters
- Letter-to-character ratio < 40%
- Fewer than 4 unique characters
- Contains a repeated pattern (3+ chars repeated 3+ times)

### Clustering

Each post gets a cluster ID = `abs(hash(category + top_3_keywords)).toString(36).slice(0,6)`. Posts in the same cluster share a topic fingerprint. `clusterSize` shows how many posts share the same ID.

### Translation

Uses the [MyMemory API](https://mymemory.translated.net/) — free, no API key required. Supports 14 languages. Results are cached per post per language in the `translated_content` and `translated_language` columns.

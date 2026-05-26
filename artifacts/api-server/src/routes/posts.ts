import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, scrapeSessionsTable } from "@workspace/db";
import { and, ilike, eq, or, desc, asc, sql } from "drizzle-orm";
import {
  ListPostsQueryParams,
  TranslatePostParams,
  TranslatePostBody,
} from "@workspace/api-zod";
import { translateText } from "../lib/nlp.js";
import { scrapeAndProcess } from "../lib/scraper.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.get("/posts", async (req, res) => {
  try {
    const query = ListPostsQueryParams.parse(req.query);

    const conditions = [];

    if (query.platform) conditions.push(eq(postsTable.platform, query.platform));
    if (query.category) conditions.push(eq(postsTable.category, query.category));
    if (query.sentiment) conditions.push(eq(postsTable.sentiment, query.sentiment));
    if (query.language) conditions.push(eq(postsTable.language, query.language));
    if (query.region) conditions.push(eq(postsTable.region, query.region));
    if (query.search) {
      conditions.push(
        or(
          ilike(postsTable.content, `%${query.search}%`),
          ilike(postsTable.translatedContent, `%${query.search}%`),
          ilike(postsTable.summary, `%${query.search}%`)
        )
      );
    }

    conditions.push(eq(postsTable.isGibberish, false));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const sortCol = query.sortBy === "engagement" ? postsTable.engagement : postsTable.publishedAt;
    const sortDir = query.sortOrder === "asc" ? asc(sortCol) : desc(sortCol);

    const limit = Math.min(Number(query.limit ?? 20), 100);
    const page = Math.max(Number(query.page ?? 1), 1);
    const offset = (page - 1) * limit;

    let allPosts = await db
      .select()
      .from(postsTable)
      .where(where)
      .orderBy(sortDir)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(postsTable)
      .where(where);

    if (query.clustered === "true") {
      const seen = new Set<string>();
      const clustered = [];
      for (const post of allPosts) {
        const key = post.clusterId ?? post.id;
        if (!seen.has(key)) {
          seen.add(key);
          clustered.push(post);
        }
      }
      allPosts = clustered;
    }

    res.json({
      posts: allPosts,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    req.log.error({ err }, "Error listing posts");
    res.status(500).json({ error: "Failed to list posts" });
  }
});

router.post("/posts/refresh", async (req, res) => {
  try {
    scrapeAndProcess()
      .then(count => {
        logger.info({ count }, "Background scrape completed");
      })
      .catch(err => {
        logger.error({ err }, "Background scrape failed");
      });

    const [lastSession] = await db
      .select()
      .from(scrapeSessionsTable)
      .orderBy(desc(scrapeSessionsTable.startedAt))
      .limit(1);

    res.json({
      message: "Scrape started. Fresh data will be available shortly.",
      postCount: lastSession?.postCount ?? 0,
      lastRefreshed: lastSession?.completedAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error starting refresh");
    res.status(500).json({ error: "Failed to start refresh" });
  }
});

router.get("/posts/export", async (req, res) => {
  try {
    const params = req.query as { format?: string; platform?: string; category?: string; sentiment?: string; language?: string; region?: string; search?: string };
    const format = params.format === "pdf" ? "pdf" : "csv";

    const conditions = [eq(postsTable.isGibberish, false)];
    if (params.platform) conditions.push(eq(postsTable.platform, params.platform));
    if (params.category) conditions.push(eq(postsTable.category, params.category));
    if (params.sentiment) conditions.push(eq(postsTable.sentiment, params.sentiment));
    if (params.language) conditions.push(eq(postsTable.language, params.language));
    if (params.region) conditions.push(eq(postsTable.region, params.region));
    if (params.search) {
      conditions.push(
        or(
          ilike(postsTable.content, `%${params.search}%`),
          ilike(postsTable.summary, `%${params.search}%`)
        )
      );
    }

    const posts = await db
      .select()
      .from(postsTable)
      .where(and(...conditions))
      .orderBy(desc(postsTable.publishedAt))
      .limit(500);

    if (format === "csv") {
      const headers = ["id", "platform", "author", "authorHandle", "publishedAt", "category", "sentiment", "language", "region", "engagement", "likes", "shares", "comments", "summary", "content", "url"];
      const rows = posts.map(p =>
        headers.map(h => {
          const val = p[h as keyof typeof p];
          if (val === null || val === undefined) return "";
          const str = String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(",")
      );

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=\"passport_posts.csv\"");
      res.send([headers.join(","), ...rows].join("\n"));
    } else {
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", "attachment; filename=\"passport_posts.html\"");

      const html = `<!DOCTYPE html>
<html>
<head><title>Passport Social Media Export</title>
<style>
  body { font-family: Arial, sans-serif; margin: 20px; }
  h1 { color: #1e293b; }
  .post { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 12px 0; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 8px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; margin: 2px; }
  .positive { background: #dcfce7; color: #166534; }
  .negative { background: #fee2e2; color: #991b1b; }
  .neutral { background: #f1f5f9; color: #475569; }
  .summary { font-style: italic; color: #475569; margin: 8px 0; }
  .content { font-size: 13px; }
</style></head>
<body>
<h1>PassportWatch Export — ${posts.length} posts</h1>
<p>Generated: ${new Date().toLocaleString()}</p>
${posts.map(p => `
<div class="post">
  <div class="meta">${p.platform} · ${p.authorHandle} · ${new Date(p.publishedAt).toLocaleString()} · ${p.region} · ${p.language}</div>
  <span class="badge ${p.sentiment}">${p.sentiment}</span>
  <span class="badge" style="background:#e0e7ff;color:#3730a3">${p.category}</span>
  <div class="summary">${p.summary}</div>
  <div class="content">${p.content.substring(0, 300)}${p.content.length > 300 ? "..." : ""}</div>
  <div class="meta">Engagement: ${p.engagement} | Likes: ${p.likes} | Shares: ${p.shares} | Comments: ${p.comments}</div>
</div>`).join("\n")}
</body></html>`;

      res.send(html);
    }
  } catch (err) {
    req.log.error({ err }, "Error exporting posts");
    res.status(500).json({ error: "Failed to export posts" });
  }
});

router.post("/posts/:id/translate", async (req, res) => {
  try {
    const { id } = TranslatePostParams.parse(req.params);
    const { targetLanguage } = TranslatePostBody.parse(req.body);

    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, id)).limit(1);
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    const translatedContent = await translateText(post.content, targetLanguage);

    await db
      .update(postsTable)
      .set({ translatedContent, translatedLanguage: targetLanguage })
      .where(eq(postsTable.id, id));

    res.json({ id, translatedContent, targetLanguage });
  } catch (err) {
    req.log.error({ err }, "Error translating post");
    res.status(500).json({ error: "Failed to translate post" });
  }
});

export default router;

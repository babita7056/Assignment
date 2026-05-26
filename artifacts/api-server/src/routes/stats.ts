import { Router } from "express";
import { db } from "@workspace/db";
import { postsTable, scrapeSessionsTable } from "@workspace/db";
import { eq, sql, desc, count } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const [totals] = await db
      .select({
        totalPosts: sql<number>`cast(count(*) as int)`,
        avgEngagement: sql<number>`avg(${postsTable.engagement})`,
        platforms: sql<number>`cast(count(distinct ${postsTable.platform}) as int)`,
      })
      .from(postsTable)
      .where(eq(postsTable.isGibberish, false));

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [recent] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(postsTable)
      .where(sql`${postsTable.isGibberish} = false AND ${postsTable.publishedAt} >= ${twentyFourHoursAgo}`);

    const categoryStats = await db
      .select({ category: postsTable.category, count: sql<number>`cast(count(*) as int)` })
      .from(postsTable)
      .where(eq(postsTable.isGibberish, false))
      .groupBy(postsTable.category)
      .orderBy(desc(sql`count(*)`))
      .limit(1);

    const sentimentStats = await db
      .select({ sentiment: postsTable.sentiment, count: sql<number>`cast(count(*) as int)` })
      .from(postsTable)
      .where(eq(postsTable.isGibberish, false))
      .groupBy(postsTable.sentiment)
      .orderBy(desc(sql`count(*)`))
      .limit(1);

    const [lastSession] = await db
      .select()
      .from(scrapeSessionsTable)
      .orderBy(desc(scrapeSessionsTable.startedAt))
      .limit(1);

    res.json({
      totalPosts: totals.totalPosts ?? 0,
      postsLast24h: recent.count ?? 0,
      platforms: totals.platforms ?? 0,
      topCategory: categoryStats[0]?.category ?? "N/A",
      topSentiment: sentimentStats[0]?.sentiment ?? "N/A",
      avgEngagement: Math.round(totals.avgEngagement ?? 0),
      filteredCount: totals.totalPosts ?? 0,
      lastRefreshed: lastSession?.completedAt?.toISOString() ?? new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching stats");
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/stats/platforms", async (req, res) => {
  try {
    const stats = await db
      .select({
        platform: postsTable.platform,
        count: sql<number>`cast(count(*) as int)`,
        engagement: sql<number>`cast(sum(${postsTable.engagement}) as int)`,
      })
      .from(postsTable)
      .where(eq(postsTable.isGibberish, false))
      .groupBy(postsTable.platform)
      .orderBy(desc(sql`count(*)`));

    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Error fetching platform stats");
    res.status(500).json({ error: "Failed to fetch platform stats" });
  }
});

router.get("/stats/categories", async (req, res) => {
  try {
    const stats = await db
      .select({
        category: postsTable.category,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(postsTable)
      .where(eq(postsTable.isGibberish, false))
      .groupBy(postsTable.category)
      .orderBy(desc(sql`count(*)`));

    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Error fetching category stats");
    res.status(500).json({ error: "Failed to fetch category stats" });
  }
});

router.get("/stats/sentiment", async (req, res) => {
  try {
    const stats = await db
      .select({
        sentiment: postsTable.sentiment,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(postsTable)
      .where(eq(postsTable.isGibberish, false))
      .groupBy(postsTable.sentiment)
      .orderBy(desc(sql`count(*)`));

    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Error fetching sentiment stats");
    res.status(500).json({ error: "Failed to fetch sentiment stats" });
  }
});

router.get("/stats/timeline", async (req, res) => {
  try {
    const stats = await db
      .select({
        hour: sql<string>`to_char(date_trunc('hour', ${postsTable.publishedAt}::timestamp), 'YYYY-MM-DD HH24:00')`,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(postsTable)
      .where(eq(postsTable.isGibberish, false))
      .groupBy(sql`date_trunc('hour', ${postsTable.publishedAt}::timestamp)`)
      .orderBy(sql`date_trunc('hour', ${postsTable.publishedAt}::timestamp)`);

    res.json(stats);
  } catch (err) {
    req.log.error({ err }, "Error fetching timeline stats");
    res.status(500).json({ error: "Failed to fetch timeline stats" });
  }
});

export default router;

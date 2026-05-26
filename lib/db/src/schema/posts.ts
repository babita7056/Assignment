import { pgTable, text, integer, boolean, timestamp, real, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postsTable = pgTable("posts", {
  id: text("id").primaryKey(),
  platform: text("platform").notNull(),
  content: text("content").notNull(),
  translatedContent: text("translated_content"),
  translatedLanguage: text("translated_language"),
  author: text("author").notNull(),
  authorHandle: text("author_handle").notNull(),
  publishedAt: text("published_at").notNull(),
  category: text("category").notNull(),
  sentiment: text("sentiment").notNull(),
  sentimentScore: real("sentiment_score").notNull().default(0),
  language: text("language").notNull().default("English"),
  region: text("region").notNull().default("Unknown"),
  engagement: integer("engagement").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  shares: integer("shares").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  summary: text("summary").notNull().default(""),
  isGibberish: boolean("is_gibberish").notNull().default(false),
  clusterId: text("cluster_id"),
  clusterSize: integer("cluster_size").notNull().default(1),
  url: text("url"),
  mediaUrl: text("media_url"),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
});

export const scrapeSessionsTable = pgTable("scrape_sessions", {
  id: serial("id").primaryKey(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  postCount: integer("post_count").notNull().default(0),
  status: text("status").notNull().default("running"),
});

export const insertPostSchema = createInsertSchema(postsTable);
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;

export const insertScrapeSessionSchema = createInsertSchema(scrapeSessionsTable).omit({ id: true });
export type InsertScrapeSession = z.infer<typeof insertScrapeSessionSchema>;
export type ScrapeSession = typeof scrapeSessionsTable.$inferSelect;

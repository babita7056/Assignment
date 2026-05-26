import { db } from "@workspace/db";
import { postsTable, scrapeSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  categorize,
  analyzeSentiment,
  isGibberish,
  detectLanguage,
  detectRegion,
  generateClusterId,
  batchGenerateSummaries,
} from "./nlp.js";
import { logger } from "./logger.js";

const PLATFORMS = ["Twitter/X", "Reddit", "LinkedIn", "Facebook", "Instagram", "YouTube", "TikTok"] as const;

const MOCK_AUTHORS: Record<string, { names: string[]; handles: string[] }> = {
  "Twitter/X": {
    names: ["Priya Sharma", "Rahul Mehta", "Sarah Johnson", "Ahmed Hassan", "Li Wei", "Carlos Rivera", "Amelia Brown"],
    handles: ["@priya_travels", "@rahul_passport", "@sarahj_world", "@ahmed_h", "@liwei_global", "@carlosrivera", "@amelia_b"],
  },
  Reddit: {
    names: ["u/passport_help", "u/travelhacker99", "u/india_official", "u/visaquestions", "u/globetrotter42"],
    handles: ["u/passport_help", "u/travelhacker99", "u/india_official", "u/visaquestions", "u/globetrotter42"],
  },
  LinkedIn: {
    names: ["Ananya Krishnan", "Robert Chen", "Fatima Al-Rashid", "David Okafor", "Maria Santos"],
    handles: ["ananya-krishnan-hr", "robert-chen-attorney", "fatima-al-rashid", "david-okafor-mba", "maria-santos"],
  },
  Facebook: {
    names: ["Suresh Kumar", "Emily Davis", "Mohd Raza", "Tanaka Yuki", "Giulia Ferrari"],
    handles: ["suresh.kumar.official", "emily.davis.travel", "mohd.raza", "tanaka.yuki", "giulia.ferrari"],
  },
  Instagram: {
    names: ["@passportadventures", "@visavibes", "@travelwithmeera", "@passportphotos_official", "@worldtraveler_k"],
    handles: ["@passportadventures", "@visavibes", "@travelwithmeera", "@passportphotos_official", "@worldtraveler_k"],
  },
  YouTube: {
    names: ["Travel Secrets India", "Passport & Visa Guide", "The Wanderer Hub", "Visa Expert"],
    handles: ["TravelSecretsIndia", "PassportVisaGuide", "TheWandererHub", "VisaExpert"],
  },
  TikTok: {
    names: ["@passporttips", "@visahacks", "@travelwithraj", "@globaltravelbae"],
    handles: ["@passporttips", "@visahacks", "@travelwithraj", "@globaltravelbae"],
  },
};

const MOCK_CONTENT = [
  "Just received my renewed passport after only 12 days! The online application process was incredibly smooth this time. Tatkal service is worth every rupee if you need it urgently.",
  "WARNING: Scam agents are charging ₹5000-15000 to 'expedite' passport applications. The official fee is much lower. Please use official Passport Seva Kendra only!",
  "My passport appointment slot finally opened after 3 weeks of refreshing. PSK Pune is booking 6 weeks out. Tips: Check between 10-11 AM and 3-5 PM for cancellations.",
  "MEA announces new passport rules: biometric data mandatory for all applicants from next month. Applications without updated documents will be rejected.",
  "Lost my passport two days before my flight to London. Embassy was helpful — emergency travel document issued in 24 hours. Document: police FIR + airline ticket + old passport copy.",
  "Sharing my US passport renewal experience — Form DS-82, two photos, old passport, $130 fee. Took 8 weeks routine, 3 weeks expedited. Apply well in advance!",
  "Schengen visa refused again citing 'insufficient ties to home country'. Attached property documents, salary slips, leave letter — still rejected. Any advice?",
  "Finally got my passport after 47 days! The police verification took 35 days which was the bottleneck. Online status showed 'Under Process' the entire time.",
  "Government announces passport application backlog clearance drive — 50,000 additional appointments released in major cities. Check Passport Seva website.",
  "Applied for tatkal passport on Monday, verification done Tuesday, dispatched Wednesday, received Thursday. Absolutely amazing turnaround by the passport office!",
  "Indian passport ranks 85th globally in passport index. Visa-free access to 57 countries. Japan tops with 193 destinations. Here's how we can improve.",
  "Lost passport while travelling in Thailand. Process: report to local police, visit Indian embassy Bangkok, get emergency certificate, fly home, apply fresh passport.",
  "Anyone else facing issues with DigiLocker documents not being accepted at PSK? Getting 'document not verified' error despite Aadhaar being properly linked.",
  "Renewal done entirely online — uploaded documents from home, booked appointment, appeared at PSK, passport delivered to doorstep. The system works when it works!",
  "UK visa rejection after 3 applications. Hired an immigration lawyer — turns out my bank statements format was incorrect. Simple fix, approved in 10 days.",
  "My experience applying for Saudi Arabia work visa — passport validity minimum 6 months, 2 blank pages required. Medical done at approved centers only.",
  "Breaking: Canada announces 5-year multiple entry visa for Indian citizens. Processing time reduced to 30 days from 90. Game changer for Indian-Canadians!",
  "PSK staff were incredibly rude during my appointment. Refused to look at documents, kept asking for things not on the checklist. Escalated to grievance portal.",
  "Pro tip: If your passport police verification is delayed beyond 21 days, file a grievance on the Passport Seva website. Gets escalated within 48 hours.",
  "TikTok is full of 'passport photo hacks' that will get your application rejected. Stick to official specifications: white background, no glasses, 51x51mm.",
  "Dubai work visa declined — employer checked and my Indian passport didn't match the transliteration of my name on my labor card. Name inconsistency kills applications.",
  "Passionate about making passport processes simpler for first-generation applicants — sharing my complete step-by-step guide with document checklist.",
  "Philippines passport renewal takes 15 working days. Appointment required, no walk-ins. DFA Manila is most efficient. Bring originals + 2 photocopies of everything.",
  "Australian passport applicants: new biometric requirements from July. All applicants above 16 must appear in person. Online renewal discontinued for adults.",
  "Reddit thread summary: Most common reasons Indian passport applications get delayed — police verification, name discrepancy, wrong photo, incomplete address proof.",
  "Fresh passport for my newborn! Process: birth certificate, parents' passports, hospital discharge, HBVS form. Received in 21 days. So happy!",
  "URGENT: If you applied for passport between Jan-March, there may be a printing backlog. Track on DigiLocker. Expected delay: 2-3 extra weeks.",
  "My story: applied online June 1, appointment June 8, police verification June 14, dispatched June 16, received June 18. Total 18 days. Impressive!",
  "Does anyone know if passport photo requirements changed? The online portal says 'plain light background' but the PSK counter rejected mine saying 'must be white'.",
  "Volunteering at passport mela in rural Rajasthan — hundreds of first-time applicants, many elderly. Digital literacy gap is real. We need offline support centers.",
];

const REGIONS = ["India", "USA", "UK", "Canada", "Australia", "UAE", "Germany", "Global", "Pakistan", "France"];
const LANGUAGES = ["English", "Hindi", "Arabic", "Spanish", "French", "German", "Chinese", "Russian", "Punjabi", "Japanese"];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(hoursBack: number): string {
  const now = Date.now();
  const ago = hoursBack * 60 * 60 * 1000;
  return new Date(now - Math.random() * ago).toISOString();
}

async function fetchRedditPosts(): Promise<Array<{ content: string; author: string; handle: string; url: string; engagement: number; likes: number; comments: number; publishedAt: string }>> {
  try {
    const subreddits = ["passport", "travel", "india", "immigration", "visa"];
    const results = [];

    for (const sub of subreddits.slice(0, 2)) {
      const url = `https://www.reddit.com/r/${sub}/search.json?q=passport&sort=new&t=day&limit=10`;
      const res = await fetch(url, {
        headers: { "User-Agent": "PassportWatch/1.0" },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) continue;
      const data = (await res.json()) as { data?: { children?: Array<{ data: { selftext?: string; title?: string; author?: string; id?: string; permalink?: string; score?: number; num_comments?: number; ups?: number; created_utc?: number } }> } };
      const posts = data?.data?.children ?? [];

      for (const post of posts) {
        const d = post.data;
        const content = (d.selftext || d.title || "").trim();
        if (!content || content.length < 20) continue;

        results.push({
          content: content.substring(0, 800),
          author: d.author ? `u/${d.author}` : "u/redditor",
          handle: d.author ? `u/${d.author}` : "u/redditor",
          url: d.permalink ? `https://reddit.com${d.permalink}` : "",
          engagement: (d.score ?? 0) + (d.num_comments ?? 0),
          likes: d.ups ?? 0,
          comments: d.num_comments ?? 0,
          publishedAt: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : randomDate(24),
        });
      }
    }

    return results;
  } catch {
    return [];
  }
}

function generateMockPosts(count: number): Array<{
  platform: string; content: string; author: string; handle: string;
  url: string; engagement: number; likes: number; shares: number; comments: number; publishedAt: string;
}> {
  const posts = [];
  const platforms = PLATFORMS.filter(p => p !== "Reddit");

  for (let i = 0; i < count; i++) {
    const platform = randomFrom(platforms);
    const authorData = MOCK_AUTHORS[platform];
    const authorIdx = Math.floor(Math.random() * authorData.names.length);
    const content = randomFrom(MOCK_CONTENT);
    const likes = randomInt(0, 5000);
    const shares = randomInt(0, 1000);
    const comments = randomInt(0, 500);

    posts.push({
      platform,
      content,
      author: authorData.names[authorIdx],
      handle: authorData.handles[authorIdx],
      url: `https://${platform.toLowerCase().replace("/", "").replace(" ", "")}.com/post/${nanoid(8)}`,
      engagement: likes + shares + comments,
      likes,
      shares,
      comments,
      publishedAt: randomDate(24),
    });
  }

  return posts;
}

export async function scrapeAndProcess(): Promise<number> {
  logger.info("Starting scrape session");

  const [session] = await db.insert(scrapeSessionsTable).values({ status: "running", postCount: 0 }).returning();

  try {
    await db.delete(postsTable);

    const redditPosts = await fetchRedditPosts();
    logger.info({ count: redditPosts.length }, "Fetched Reddit posts");

    const mockPosts = generateMockPosts(60);

    const allRaw = [
      ...redditPosts.map(p => ({ ...p, platform: "Reddit", shares: 0 })),
      ...mockPosts,
    ];

    const filtered = allRaw.filter(p => !isGibberish(p.content));
    logger.info({ total: allRaw.length, filtered: filtered.length }, "Posts after gibberish filter");

    const texts = filtered.map(p => p.content);
    const summaries = await batchGenerateSummaries(texts);

    const processed = filtered.map((p, i) => {
      const category = categorize(p.content);
      const { sentiment, score } = analyzeSentiment(p.content);
      const language = detectLanguage(p.content);
      const region = detectRegion(p.content, p.author);
      const clusterId = generateClusterId(category, p.content);

      return {
        id: nanoid(),
        platform: p.platform,
        content: p.content,
        author: p.author,
        authorHandle: p.handle,
        publishedAt: p.publishedAt,
        category,
        sentiment,
        sentimentScore: score,
        language,
        region,
        engagement: p.engagement,
        likes: p.likes,
        shares: p.shares,
        comments: p.comments,
        summary: summaries[i] || p.content.substring(0, 100),
        isGibberish: false,
        clusterId,
        clusterSize: 1,
        url: p.url || null,
        mediaUrl: null,
      };
    });

    const clusterCounts: Record<string, number> = {};
    for (const p of processed) {
      if (p.clusterId) {
        clusterCounts[p.clusterId] = (clusterCounts[p.clusterId] ?? 0) + 1;
      }
    }
    for (const p of processed) {
      if (p.clusterId) {
        p.clusterSize = clusterCounts[p.clusterId];
      }
    }

    if (processed.length > 0) {
      const BATCH = 50;
      for (let i = 0; i < processed.length; i += BATCH) {
        await db.insert(postsTable).values(processed.slice(i, i + BATCH));
      }
    }

    await db
      .update(scrapeSessionsTable)
      .set({ status: "completed", postCount: processed.length, completedAt: new Date() })
      .where(eq(scrapeSessionsTable.id, session.id));

    logger.info({ count: processed.length }, "Scrape completed");
    return processed.length;
  } catch (err) {
    await db
      .update(scrapeSessionsTable)
      .set({ status: "failed", completedAt: new Date() })
      .where(eq(scrapeSessionsTable.id, session.id));
    throw err;
  }
}

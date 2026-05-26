import { openai } from "./openai-client.js";

export const CATEGORIES = [
  "Application",
  "Renewal",
  "Appointments",
  "Tatkal",
  "Visa",
  "Travel Issues",
  "Government Announcements",
  "Scams/Fraud",
  "News",
  "Personal Experiences",
] as const;

export type Category = (typeof CATEGORIES)[number];

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  Application: ["apply", "application", "new passport", "first passport", "applied", "applying", "applying for passport", "form", "documents required"],
  Renewal: ["renew", "renewal", "expir", "expired", "reissue", "reissuance", "reapply", "old passport"],
  Appointments: ["appointment", "schedule", "slot", "book", "booking", "queue", "waiting", "psc", "passport seva"],
  Tatkal: ["tatkal", "urgent", "emergency", "tatkaal", "fast track", "express", "same day"],
  Visa: ["visa", "stamp", "entry", "tourist visa", "work visa", "student visa", "schengen", "immigration"],
  "Travel Issues": ["lost passport", "stolen", "damaged", "delay", "stuck", "confiscated", "problem", "issue", "missing", "border"],
  "Government Announcements": ["government", "ministry", "official", "mea", "announce", "policy", "new rule", "regulation", "directive", "circular"],
  "Scams/Fraud": ["scam", "fraud", "fake", "phishing", "cheat", "money", "agent", "tout", "impersonat", "suspicious"],
  News: ["news", "report", "update", "breaking", "media", "journalism", "article", "published", "latest"],
  "Personal Experiences": ["got", "received", "finally", "experience", "sharing", "happy", "excited", "my passport", "story"],
};

const POSITIVE_WORDS = new Set([
  "good", "great", "excellent", "happy", "amazing", "fast", "quick", "smooth", "easy", "helpful",
  "approved", "received", "success", "perfect", "wonderful", "fantastic", "efficient", "resolved",
  "finally", "glad", "excited", "thrilled", "grateful", "thankful", "brilliant", "superb",
]);

const NEGATIVE_WORDS = new Set([
  "bad", "terrible", "awful", "slow", "delay", "delayed", "problem", "issue", "fail", "failed",
  "rejected", "denied", "lost", "stolen", "frustrat", "disappoint", "worst", "horrible",
  "nightmare", "scam", "fraud", "cheat", "stuck", "broken", "useless", "pathetic",
]);

export function categorize(text: string): Category {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[cat] = 0;
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        scores[cat] += kw.split(" ").length;
      }
    }
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return (best[1] > 0 ? best[0] : "Personal Experiences") as Category;
}

export function analyzeSentiment(text: string): { sentiment: "positive" | "negative" | "neutral"; score: number } {
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;

  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, "");
    if (POSITIVE_WORDS.has(clean)) score += 1;
    for (const neg of NEGATIVE_WORDS) {
      if (clean.includes(neg)) { score -= 1; break; }
    }
  }

  const normalized = Math.max(-1, Math.min(1, score / Math.max(words.length * 0.1, 1)));
  if (normalized > 0.05) return { sentiment: "positive", score: normalized };
  if (normalized < -0.05) return { sentiment: "negative", score: normalized };
  return { sentiment: "neutral", score: normalized };
}

export function isGibberish(text: string): boolean {
  if (text.length < 5) return true;
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return true;

  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / words.length;
  if (avgWordLen > 15 || avgWordLen < 2) return true;

  const letters = text.replace(/[^a-zA-Z]/g, "").length;
  const letterRatio = letters / text.length;
  if (letterRatio < 0.4) return true;

  const uniqueChars = new Set(text.toLowerCase().replace(/\s/g, "")).size;
  if (uniqueChars < 4) return true;

  const hasRepeatedPattern = /(.{3,})\1{3,}/.test(text);
  if (hasRepeatedPattern) return true;

  return false;
}

export function detectLanguage(text: string): string {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const chineseChars = (text.match(/[\u4E00-\u9FFF]/g) || []).length;
  const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
  const russianChars = (text.match(/[\u0400-\u04FF]/g) || []).length;
  const japaneseChars = (text.match(/[\u3040-\u30FF]/g) || []).length;

  if (arabicChars > 5) return "Arabic";
  if (chineseChars > 5) return "Chinese";
  if (hindiChars > 5) return "Hindi";
  if (russianChars > 5) return "Russian";
  if (japaneseChars > 5) return "Japanese";

  const spanish = ["visa", "pasaporte", "renovacion", "tramite", "solicitud", "gobierno"];
  const french = ["passeport", "renouvellement", "demande", "gouvernement", "rendez-vous"];
  const german = ["reisepass", "verlängerung", "antrag", "botschaft", "behörde"];
  const punjabi = ["passport", "ਪਾਸਪੋਰਟ", "ਵੀਜ਼ਾ"];

  const lower = text.toLowerCase();
  if (spanish.some(w => lower.includes(w))) return "Spanish";
  if (french.some(w => lower.includes(w))) return "French";
  if (german.some(w => lower.includes(w))) return "German";
  if (punjabi.some(w => lower.includes(w))) return "Punjabi";

  return "English";
}

export function detectRegion(text: string, author: string): string {
  const combined = (text + " " + author).toLowerCase();
  const regionMap: Record<string, string[]> = {
    "India": ["india", "indian", "delhi", "mumbai", "bangalore", "chennai", "hyderabad", "mea", "tatkal", "seva"],
    "USA": ["usa", "american", "us citizen", "state department", "washington"],
    "UK": ["uk", "british", "london", "england", "hmpo"],
    "Canada": ["canada", "canadian", "toronto", "ontario"],
    "Australia": ["australia", "australian", "sydney", "melbourne"],
    "Pakistan": ["pakistan", "pakistani", "karachi", "lahore", "islamabad"],
    "UAE": ["uae", "dubai", "abu dhabi", "emirates"],
    "Germany": ["germany", "german", "berlin", "münchen"],
    "France": ["france", "french", "paris"],
    "China": ["china", "chinese", "beijing", "shanghai"],
  };

  for (const [region, keywords] of Object.entries(regionMap)) {
    if (keywords.some(kw => combined.includes(kw))) return region;
  }
  return "Global";
}

export function generateClusterId(category: string, text: string): string {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 5).sort();
  const key = category + ":" + words.slice(0, 3).join("-");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).substring(0, 6);
}

export async function generateSummary(text: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 60,
      messages: [
        {
          role: "system",
          content: "You are a concise summarizer. Summarize the following social media post about passports in exactly 20-30 words. Be factual and neutral.",
        },
        { role: "user", content: text.substring(0, 500) },
      ],
    });
    return response.choices[0]?.message?.content?.trim() ?? text.substring(0, 100);
  } catch {
    return text.substring(0, 120) + (text.length > 120 ? "..." : "");
  }
}

export async function batchGenerateSummaries(texts: string[]): Promise<string[]> {
  const CONCURRENCY = 5;
  const results: string[] = new Array(texts.length).fill("");

  for (let i = 0; i < texts.length; i += CONCURRENCY) {
    const batch = texts.slice(i, i + CONCURRENCY);
    const summaries = await Promise.all(batch.map(t => generateSummary(t)));
    for (let j = 0; j < summaries.length; j++) {
      results[i + j] = summaries[j];
    }
    if (i + CONCURRENCY < texts.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return results;
}

const LANGUAGE_CODES: Record<string, string> = {
  Hindi: "hi",
  Spanish: "es",
  French: "fr",
  German: "de",
  Arabic: "ar",
  Chinese: "zh",
  Russian: "ru",
  Punjabi: "pa",
  Japanese: "ja",
  English: "en",
  Portuguese: "pt",
  Italian: "it",
  Korean: "ko",
  Turkish: "tr",
  Dutch: "nl",
};

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const langCode = LANGUAGE_CODES[targetLanguage];
  if (!langCode || langCode === "en") return text;

  const truncated = text.substring(0, 500);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncated)}&langpair=en|${langCode}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Translation API error: ${res.status}`);

  const data = (await res.json()) as {
    responseStatus: number;
    responseData?: { translatedText?: string };
    matches?: Array<{ translation?: string; quality?: number }>;
  };

  if (data.responseStatus !== 200) {
    throw new Error(`Translation failed: ${data.responseStatus}`);
  }

  const translated = data.responseData?.translatedText;
  if (!translated || translated.toUpperCase() === truncated.toUpperCase()) {
    throw new Error("Translation returned unchanged text");
  }

  return translated;
}

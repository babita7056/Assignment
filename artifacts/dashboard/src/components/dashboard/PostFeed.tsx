import { useState } from "react";
import {
  useListPosts,
  useTranslatePost,
  getListPostsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Search, Languages, ThumbsUp, Share2, MessageSquare,
  ChevronLeft, ChevronRight, ExternalLink, Layers, Filter
} from "lucide-react";

const PLATFORMS = ["Twitter/X", "Reddit", "LinkedIn", "Facebook", "Instagram", "YouTube", "TikTok"];
const CATEGORIES = ["Application", "Renewal", "Appointments", "Tatkal", "Visa", "Travel Issues", "Government Announcements", "Scams/Fraud", "News", "Personal Experiences"];
const SENTIMENTS = ["positive", "negative", "neutral"];
const LANGUAGES_LIST = ["English", "Hindi", "Punjabi", "Spanish", "French", "German", "Arabic", "Chinese", "Russian", "Japanese"];

const PLATFORM_COLORS: Record<string, string> = {
  "Twitter/X": "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Reddit: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  LinkedIn: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Facebook: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  Instagram: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  YouTube: "bg-red-500/10 text-red-400 border-red-500/20",
  TikTok: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  negative: "bg-red-500/10 text-red-400 border-red-500/20",
  neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return d.toLocaleDateString();
}

type Post = {
  id: string;
  platform: string;
  content: string;
  translatedContent?: string | null;
  translatedLanguage?: string | null;
  author: string;
  authorHandle: string;
  publishedAt: string;
  category: string;
  sentiment: string;
  language: string;
  region: string;
  engagement: number;
  likes: number;
  shares: number;
  comments: number;
  summary: string;
  clusterSize: number;
  clusterId?: string | null;
  url?: string | null;
};

function PostCard({ post }: { post: Post }) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [localTranslation, setLocalTranslation] = useState<{ text: string; lang: string } | null>(null);
  const queryClient = useQueryClient();
  const translateMutation = useTranslatePost();

  const handleTranslate = (targetLanguage: string) => {
    if (post.translatedContent && post.translatedLanguage === targetLanguage) {
      setLocalTranslation({ text: post.translatedContent, lang: targetLanguage });
      setShowTranslation(true);
      return;
    }
    translateMutation.mutate(
      { params: { id: post.id }, data: { targetLanguage } },
      {
        onSuccess: (data) => {
          setLocalTranslation({ text: data.translatedContent, lang: data.targetLanguage });
          setShowTranslation(true);
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        },
        onError: () => toast.error("Translation failed"),
      }
    );
  };

  const translation = localTranslation ?? (post.translatedContent && post.translatedLanguage
    ? { text: post.translatedContent, lang: post.translatedLanguage }
    : null);

  return (
    <Card className="bg-card border-border rounded-none shadow-none hover:border-primary/30 transition-colors duration-200 group">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center flex-wrap gap-2">
            <Badge variant="outline" className={`text-[10px] font-mono uppercase border ${PLATFORM_COLORS[post.platform] ?? "bg-muted text-muted-foreground"}`}>
              {post.platform}
            </Badge>
            <Badge variant="outline" className={`text-[10px] font-mono uppercase border ${SENTIMENT_COLORS[post.sentiment] ?? ""}`}>
              {post.sentiment}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono uppercase bg-primary/5 text-primary border-primary/20">
              {post.category}
            </Badge>
            {post.clusterSize > 1 && (
              <Badge variant="outline" className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border-amber-500/20">
                <Layers className="w-2.5 h-2.5 mr-1" />
                {post.clusterSize} similar
              </Badge>
            )}
          </div>
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">{formatTime(post.publishedAt)}</span>
        </div>

        <div>
          <p className="text-xs font-mono text-muted-foreground mb-1.5">
            <span className="text-foreground font-medium">{post.author}</span>{" "}
            <span className="opacity-60">{post.authorHandle}</span>
            {" · "}{post.language}{" · "}{post.region}
          </p>
          <p className="text-sm text-muted-foreground italic leading-relaxed border-l-2 border-primary/30 pl-3">
            {post.summary}
          </p>
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3">
          {post.content}
        </p>

        {showTranslation && translation && (
          <div className="bg-background border border-border p-3 rounded-sm">
            <p className="text-[10px] font-mono text-primary uppercase mb-1">Translated to {translation.lang}</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{translation.text}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {(post.likes ?? 0).toLocaleString()}</span>
            <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {(post.shares ?? 0).toLocaleString()}</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {(post.comments ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {post.url && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-mono" asChild>
                <a href={post.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-3 h-3 mr-1" /> Source
                </a>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-mono" disabled={translateMutation.isPending}>
                  <Languages className="w-3 h-3 mr-1" />
                  {translateMutation.isPending ? "..." : "Translate"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-mono text-xs">
                <DropdownMenuLabel className="text-[10px]">Target Language</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {LANGUAGES_LIST.map(lang => (
                  <DropdownMenuItem key={lang} onClick={() => handleTranslate(lang)} className="text-xs">
                    {lang}
                    {translation?.lang === lang && " (cached)"}
                  </DropdownMenuItem>
                ))}
                {showTranslation && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowTranslation(false)} className="text-xs text-muted-foreground">
                      Hide translation
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PostSkeleton() {
  return (
    <Card className="bg-card border-border rounded-none shadow-none">
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 bg-muted" />
          <Skeleton className="h-5 w-16 bg-muted" />
          <Skeleton className="h-5 w-24 bg-muted" />
        </div>
        <Skeleton className="h-4 w-48 bg-muted" />
        <Skeleton className="h-16 w-full bg-muted" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-12 bg-muted" />
          <Skeleton className="h-4 w-12 bg-muted" />
          <Skeleton className="h-4 w-12 bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PostFeed() {
  const [platform, setPlatform] = useState("");
  const [category, setCategory] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [language, setLanguage] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("publishedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [clustered, setClustered] = useState(false);
  const [page, setPage] = useState(1);

  const params = {
    platform: platform || undefined,
    category: category || undefined,
    sentiment: sentiment || undefined,
    language: language || undefined,
    search: search || undefined,
    sortBy,
    sortOrder,
    clustered: clustered ? "true" : undefined,
    page,
    limit: 10,
  };

  const { data, isLoading } = useListPosts(params, {
    query: { queryKey: getListPostsQueryKey(params) },
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v === "all" ? "" : v);
    setPage(1);
  };

  const handleExport = (format: "csv" | "pdf") => {
    const p = new URLSearchParams();
    p.set("format", format);
    if (platform) p.set("platform", platform);
    if (category) p.set("category", category);
    if (sentiment) p.set("sentiment", sentiment);
    if (language) p.set("language", language);
    if (search) p.set("search", search);
    window.open(`/api/posts/export?${p.toString()}`, "_blank");
  };

  const posts = data?.posts ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search posts, summaries, content..."
              className="pl-8 h-8 font-mono text-xs bg-background border-border rounded-none"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} size="sm" variant="outline" className="h-8 px-3 font-mono text-xs rounded-none border-border">
            Search
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

          <Select onValueChange={handleFilterChange(setPlatform)} value={platform || "all"}>
            <SelectTrigger className="h-7 w-36 font-mono text-[11px] bg-background border-border rounded-none">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent className="font-mono text-xs">
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select onValueChange={handleFilterChange(setCategory)} value={category || "all"}>
            <SelectTrigger className="h-7 w-44 font-mono text-[11px] bg-background border-border rounded-none">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="font-mono text-xs">
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select onValueChange={handleFilterChange(setSentiment)} value={sentiment || "all"}>
            <SelectTrigger className="h-7 w-32 font-mono text-[11px] bg-background border-border rounded-none">
              <SelectValue placeholder="Sentiment" />
            </SelectTrigger>
            <SelectContent className="font-mono text-xs">
              <SelectItem value="all">All Sentiments</SelectItem>
              {SENTIMENTS.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select onValueChange={handleFilterChange(setLanguage)} value={language || "all"}>
            <SelectTrigger className="h-7 w-32 font-mono text-[11px] bg-background border-border rounded-none">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent className="font-mono text-xs">
              <SelectItem value="all">All Languages</SelectItem>
              {LANGUAGES_LIST.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            onValueChange={v => { setSortBy(v.split(":")[0]); setSortOrder(v.split(":")[1]); setPage(1); }}
            value={`${sortBy}:${sortOrder}`}
          >
            <SelectTrigger className="h-7 w-36 font-mono text-[11px] bg-background border-border rounded-none">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="font-mono text-xs">
              <SelectItem value="publishedAt:desc">Newest First</SelectItem>
              <SelectItem value="publishedAt:asc">Oldest First</SelectItem>
              <SelectItem value="engagement:desc">Most Engagement</SelectItem>
              <SelectItem value="engagement:asc">Least Engagement</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-auto">
            <Switch
              id="clustered"
              checked={clustered}
              onCheckedChange={v => { setClustered(v); setPage(1); }}
              className="scale-75"
            />
            <Label htmlFor="clustered" className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider cursor-pointer">
              Cluster view
            </Label>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 font-mono text-[11px] rounded-none border-border">
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="font-mono text-xs">
              <DropdownMenuItem onClick={() => handleExport("csv")}>Export CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>Export Report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {total > 0 && (
          <p className="text-[10px] font-mono text-muted-foreground">
            {total.toLocaleString()} posts{clustered ? " (clustered)" : ""} — page {page} of {totalPages}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <PostSkeleton key={i} />)
          : posts.length === 0
            ? (
              <div className="h-48 border border-border bg-card flex items-center justify-center">
                <p className="text-muted-foreground font-mono text-sm">No posts match the current filters.</p>
              </div>
            )
            : posts.map(post => <PostCard key={post.id} post={post as Post} />)
        }
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 font-mono text-[11px] rounded-none border-border"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
          >
            <ChevronLeft className="w-3 h-3 mr-1" /> Previous
          </Button>
          <span className="text-[10px] font-mono text-muted-foreground">{page} / {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 font-mono text-[11px] rounded-none border-border"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
          >
            Next <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

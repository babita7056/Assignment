import {
  useGetPlatformBreakdown,
  useGetCategoryBreakdown,
  useGetSentimentBreakdown,
  useGetTimeline,
  getGetPlatformBreakdownQueryKey,
  getGetCategoryBreakdownQueryKey,
  getGetSentimentBreakdownQueryKey,
  getGetTimelineQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, LineChart, Line, CartesianGrid,
} from "recharts";

const PLATFORM_COLORS = ["#f59e0b", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fb923c", "#38bdf8"];
const CATEGORY_COLORS = ["#f59e0b", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fb923c", "#38bdf8", "#4ade80", "#e879f9", "#22d3ee"];
const SENTIMENT_PALETTE: Record<string, string> = { positive: "#34d399", negative: "#f87171", neutral: "#94a3b8" };

const tooltipStyle = {
  contentStyle: { background: "hsl(222 47% 11%)", border: "1px solid hsl(216 34% 17%)", borderRadius: 0, fontFamily: "monospace", fontSize: 11 },
  labelStyle: { color: "#94a3b8" },
  itemStyle: { color: "#f59e0b" },
};

function SectionTitle({ title }: { title: string }) {
  return <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{title}</p>;
}

export default function Analytics() {
  const { data: platforms, isLoading: loadingPlatforms } = useGetPlatformBreakdown({ query: { queryKey: getGetPlatformBreakdownQueryKey() } });
  const { data: categories, isLoading: loadingCategories } = useGetCategoryBreakdown({ query: { queryKey: getGetCategoryBreakdownQueryKey() } });
  const { data: sentiments, isLoading: loadingSentiments } = useGetSentimentBreakdown({ query: { queryKey: getGetSentimentBreakdownQueryKey() } });
  const { data: timeline, isLoading: loadingTimeline } = useGetTimeline({ query: { queryKey: getGetTimelineQueryKey() } });

  const platformData = (platforms ?? []).map(p => ({ name: p.platform, posts: p.count, engagement: p.engagement }));
  const categoryData = (categories ?? []).map(c => ({ name: c.category, count: c.count }));
  const sentimentData = (sentiments ?? []).map(s => ({
    name: s.sentiment.charAt(0).toUpperCase() + s.sentiment.slice(1),
    value: s.count,
    key: s.sentiment,
  }));
  const timelineData = (timeline ?? []).map(t => ({
    time: t.hour?.split(" ")[1] ?? t.hour,
    count: t.count,
  }));

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold font-mono tracking-tight text-foreground uppercase">Analytics Overview</h2>
        <p className="text-sm text-muted-foreground font-mono">Deep dive into platform distribution, category analysis, and temporal patterns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border rounded-none shadow-none">
          <CardHeader className="pb-2 pt-4 px-4"><SectionTitle title="Posts by Platform" /></CardHeader>
          <CardContent className="px-2 pb-4">
            {loadingPlatforms ? <Skeleton className="h-64 w-full bg-muted" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={platformData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 9, fontFamily: "monospace", fill: "#64748b" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fontFamily: "monospace", fill: "#94a3b8" }} width={72} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="posts" radius={0} maxBarSize={20}>
                    {platformData.map((_, i) => <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-none shadow-none">
          <CardHeader className="pb-2 pt-4 px-4"><SectionTitle title="Engagement by Platform" /></CardHeader>
          <CardContent className="px-2 pb-4">
            {loadingPlatforms ? <Skeleton className="h-64 w-full bg-muted" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={platformData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 9, fontFamily: "monospace", fill: "#64748b" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fontFamily: "monospace", fill: "#94a3b8" }} width={72} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="engagement" radius={0} maxBarSize={20} fill="#f59e0b" opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-none shadow-none">
          <CardHeader className="pb-2 pt-4 px-4"><SectionTitle title="Posts by Category" /></CardHeader>
          <CardContent className="px-2 pb-4">
            {loadingCategories ? <Skeleton className="h-64 w-full bg-muted" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 9, fontFamily: "monospace", fill: "#64748b" }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fontFamily: "monospace", fill: "#94a3b8" }} width={120} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="count" radius={0} maxBarSize={18}>
                    {categoryData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border rounded-none shadow-none">
          <CardHeader className="pb-2 pt-4 px-4"><SectionTitle title="Sentiment Breakdown" /></CardHeader>
          <CardContent className="px-2 pb-4">
            {loadingSentiments ? <Skeleton className="h-64 w-full bg-muted" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                    {sentimentData.map((entry, i) => (
                      <Cell key={i} fill={SENTIMENT_PALETTE[entry.key] ?? "#64748b"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle.contentStyle} itemStyle={tooltipStyle.itemStyle} />
                  <Legend
                    formatter={value => <span style={{ fontFamily: "monospace", fontSize: 10, color: "#94a3b8" }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card border-border rounded-none shadow-none">
          <CardHeader className="pb-2 pt-4 px-4"><SectionTitle title="Post Volume Timeline (Last 24h)" /></CardHeader>
          <CardContent className="px-2 pb-4">
            {loadingTimeline ? <Skeleton className="h-48 w-full bg-muted" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={timelineData} margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fontFamily: "monospace", fill: "#64748b" }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fontFamily: "monospace", fill: "#64748b" }} width={28} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

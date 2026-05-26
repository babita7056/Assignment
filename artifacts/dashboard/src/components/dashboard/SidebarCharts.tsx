import {
  useGetSentimentBreakdown,
  useGetTimeline,
  getGetSentimentBreakdownQueryKey,
  getGetTimelineQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const SENTIMENT_PALETTE: Record<string, string> = {
  positive: "#34d399",
  negative: "#f87171",
  neutral: "#94a3b8",
};

export function TimelineChart() {
  const { data, isLoading } = useGetTimeline({ query: { queryKey: getGetTimelineQueryKey() } });

  if (isLoading) return (
    <Card className="bg-card border-border rounded-none shadow-none">
      <CardHeader className="pb-2 pt-4 px-4">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Post Volume / 24h</p>
      </CardHeader>
      <CardContent className="px-4 pb-4"><Skeleton className="h-40 w-full bg-muted" /></CardContent>
    </Card>
  );

  const chartData = (data ?? []).map(d => ({
    time: d.hour?.split(" ")[1] ?? d.hour,
    count: d.count,
  }));

  return (
    <Card className="bg-card border-border rounded-none shadow-none">
      <CardHeader className="pb-2 pt-4 px-4">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Post Volume / 24h</p>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <XAxis dataKey="time" tick={{ fontSize: 9, fontFamily: "monospace", fill: "#64748b" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fontFamily: "monospace", fill: "#64748b" }} width={24} />
            <Tooltip
              contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(216 34% 17%)", borderRadius: 0, fontFamily: "monospace", fontSize: 11 }}
              labelStyle={{ color: "#94a3b8" }}
              itemStyle={{ color: "#f59e0b" }}
            />
            <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SentimentChart() {
  const { data, isLoading } = useGetSentimentBreakdown({ query: { queryKey: getGetSentimentBreakdownQueryKey() } });

  if (isLoading) return (
    <Card className="bg-card border-border rounded-none shadow-none">
      <CardHeader className="pb-2 pt-4 px-4">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Sentiment Distribution</p>
      </CardHeader>
      <CardContent className="px-4 pb-4"><Skeleton className="h-40 w-full bg-muted" /></CardContent>
    </Card>
  );

  const chartData = (data ?? []).map(d => ({
    name: d.sentiment.charAt(0).toUpperCase() + d.sentiment.slice(1),
    value: d.count,
    key: d.sentiment,
  }));

  return (
    <Card className="bg-card border-border rounded-none shadow-none">
      <CardHeader className="pb-2 pt-4 px-4">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Sentiment Distribution</p>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={SENTIMENT_PALETTE[entry.key] ?? "#64748b"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(216 34% 17%)", borderRadius: 0, fontFamily: "monospace", fontSize: 11 }}
              itemStyle={{ color: "#f59e0b" }}
            />
            <Legend
              formatter={(value) => <span style={{ fontFamily: "monospace", fontSize: 10, color: "#94a3b8" }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

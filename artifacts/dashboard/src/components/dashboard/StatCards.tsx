import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Globe, AlertTriangle, Activity, Database, Clock } from "lucide-react";

export function StatCards() {
  const { data: stats, isLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-card border-border rounded-none shadow-none">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-1/2 mb-2 bg-muted" />
              <Skeleton className="h-8 w-3/4 bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const items = [
    { label: "TOTAL INGESTED", value: stats.totalPosts.toLocaleString(), icon: Database, color: "text-blue-400" },
    { label: "LAST 24H", value: stats.postsLast24h.toLocaleString(), icon: Clock, color: "text-green-400" },
    { label: "ACTIVE PLATFORMS", value: stats.platforms.toString(), icon: Globe, color: "text-primary" },
    { label: "TOP CATEGORY", value: stats.topCategory, icon: FileText, color: "text-purple-400" },
    { label: "TOP SENTIMENT", value: stats.topSentiment.toUpperCase(), icon: AlertTriangle, color: stats.topSentiment === 'negative' ? "text-destructive" : "text-yellow-400" },
    { label: "AVG ENGAGEMENT", value: Math.round(stats.avgEngagement).toLocaleString(), icon: Activity, color: "text-cyan-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {items.map((item, i) => (
        <Card key={i} className="bg-card border-border rounded-none shadow-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <item.icon className="w-12 h-12" />
          </div>
          <CardContent className="p-4 relative z-10">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <item.icon className={`w-3 h-3 ${item.color}`} />
              {item.label}
            </p>
            <p className="text-xl font-mono font-bold tracking-tight text-foreground truncate">
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

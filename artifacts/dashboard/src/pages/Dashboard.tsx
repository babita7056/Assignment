import { StatCards } from "@/components/dashboard/StatCards";
import { PostFeed } from "@/components/dashboard/PostFeed";
import { TimelineChart, SentimentChart } from "@/components/dashboard/SidebarCharts";

export default function Dashboard() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold font-mono tracking-tight text-foreground uppercase">Operations Dashboard</h2>
        <p className="text-sm text-muted-foreground font-mono">Real-time global passport sentiment and issue tracking — last 24 hours.</p>
      </div>

      <StatCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <PostFeed />
        </div>
        <div className="space-y-4">
          <TimelineChart />
          <SentimentChart />
        </div>
      </div>
    </div>
  );
}

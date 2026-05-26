import { Download, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useRefreshPosts } from "@workspace/api-client-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const queryClient = useQueryClient();
  const refreshMutation = useRefreshPosts();

  const handleRefresh = () => {
    refreshMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("Intelligence feed updated", {
          description: "New data ingested from active sources."
        });
        queryClient.invalidateQueries();
      },
      onError: () => {
        toast.error("Failed to refresh feed", {
          description: "A connection error occurred. Try again."
        });
      }
    });
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    // In a real app we'd construct the URL with current filters
    const url = `/api/posts/export?format=${format}`;
    window.open(url, '_blank');
    toast.info(`Exporting ${format.toUpperCase()}`, {
      description: "Generating file..."
    });
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 z-10 shrink-0">
      <div className="flex items-center gap-2 md:pl-0 pl-10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">System Active</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 font-mono text-xs border-border bg-background">
              <Download className="w-3.5 h-3.5 mr-2" />
              EXPORT
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 font-mono text-xs">
            <DropdownMenuLabel>Data Format</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              Raw Data (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf')}>
              Intelligence Report (PDF)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="default" 
          size="sm" 
          className="h-8 font-mono text-xs"
          onClick={handleRefresh}
          disabled={refreshMutation.isPending}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          {refreshMutation.isPending ? 'SYNCING...' : 'FORCE SYNC'}
        </Button>
      </div>
    </header>
  );
}

import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, BarChart2, Shield, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Header } from "./Header";

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Operations", icon: Activity },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-card border-r border-border text-card-foreground">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <div>
          <h1 className="font-mono font-bold tracking-tight text-lg text-primary">PASSPORT_WATCH</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Global Comms Intel</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Views</div>
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors">
          <Settings className="w-4 h-4" />
          System Config
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex w-64 flex-col">
        <SidebarContent />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden absolute top-3 left-3 z-50">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-r-border">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </div>
  );
}

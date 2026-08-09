import { Link } from "@tanstack/react-router";
import { ImagePlus, MessageSquare, Radio } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-6 items-center justify-center rounded-[5px] bg-primary/15 ring-1 ring-primary/40">
            <Radio className="size-3.5 text-primary" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Autopilot</span>
          <span className="hidden text-xs text-muted-foreground md:inline">
            autonomous marketing operations
          </span>
        </div>
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-accent text-foreground" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <MessageSquare className="size-3.5" />
            Chat
          </Link>
          <Link
            to="/hub"
            activeProps={{ className: "bg-accent text-foreground" }}
            inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <Radio className="size-3.5" />
            Hub
          </Link>
        </nav>
      </header>
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}

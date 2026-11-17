import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, CreditCard, History, LayoutDashboard, Plus, Repeat } from "lucide-react";
import { useFinanceStore } from "@/lib/finance/store";
import { cn } from "@/lib/utils";
import logo from "@/assets/blue-rose-logo.png";
import avatar from "@/assets/davi-avatar.jpg.asset.json";
import { QuickAddProvider, useQuickAdd } from "./quick-add";

const NAV = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/calendario", label: "Calendário", icon: CalendarDays },
  { to: "/carteira", label: "Carteira", icon: CreditCard },
  { to: "/assinaturas", label: "Assinaturas", icon: Repeat },
  { to: "/transacoes", label: "Histórico", icon: History },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const state = useFinanceStore();
  if (!state) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="flex flex-col items-center gap-4">
          <img src={logo} alt="" width={64} height={64} className="h-16 w-16 animate-glow drop-shadow-[0_0_24px_var(--primary)]" />
          <p className="font-display text-sm tracking-[0.3em] text-muted-foreground">BLAUE ROSE</p>
        </div>
      </div>
    );
  }
  return (
    <QuickAddProvider>
      <ShellInner>{children}</ShellInner>
    </QuickAddProvider>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5">
      <img src={logo} alt="Blaue Rose" width={36} height={36} className="h-9 w-9 shrink-0 drop-shadow-[0_0_14px_var(--primary)]" />
      <span className="truncate font-display text-lg font-semibold tracking-tight">
        blaue<span className="text-kaiser">rose</span>
      </span>
    </Link>
  );
}

export function Avatar({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-block shrink-0 rounded-full p-[2px] bg-kaiser shadow-glow", className)}>
      <img src={avatar.url} alt="Davi" width={40} height={40} className="h-full w-full rounded-full object-cover" />
    </span>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const quick = useQuickAdd();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-dvh">
      {/* Desktop header */}
      <header className="sticky top-0 z-40 hidden border-b border-border/60 bg-background/60 backdrop-blur-xl md:block">
        <div className="mx-auto grid max-w-[1400px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 px-6 py-3.5">
          <Brand />
          <nav className="glass-strong mx-auto flex items-center gap-1 rounded-full p-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: n.to === "/" }}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-accent/40 hover:text-foreground data-[status=active]:bg-foreground data-[status=active]:text-background"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => quick.open()}
              className="bg-kaiser flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow press"
            >
              <Plus className="h-4 w-4" /> Lançar
            </button>
            <Avatar className="h-10 w-10" />
          </div>
        </div>
      </header>

      {/* Mobile header */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 pb-2 pt-5 md:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-11 w-11" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Olá,</p>
            <p className="truncate font-display text-base font-semibold">Davi</p>
          </div>
        </div>
        <img src={logo} alt="Blaue Rose" width={36} height={36} className="h-9 w-9 drop-shadow-[0_0_14px_var(--primary)]" />
      </header>

      <main className="mx-auto max-w-[1400px] px-4 pb-32 pt-3 md:px-6 md:pb-12 md:pt-6">
        <div key={pathname} className="animate-page">{children}</div>
      </main>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <nav className="flex flex-1 items-center justify-between rounded-full border border-border bg-popover/95 px-2 py-2 shadow-[var(--shadow-card)] backdrop-blur-xl">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                aria-label={n.label}
                activeOptions={{ exact: n.to === "/" }}
                className="group grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition-all duration-300 data-[status=active]:bg-primary/20 data-[status=active]:shadow-[0_0_18px_-4px_var(--neon)] data-[status=active]:text-neon"
              >
                <n.icon className="h-5 w-5" />
              </Link>
            ))}
          </nav>
          <button
            onClick={() => quick.open()}
            aria-label="Novo lançamento"
            className="bg-kaiser press grid h-16 w-16 shrink-0 place-items-center rounded-full text-primary-foreground shadow-glow"
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>
      </div>
    </div>
  );
}

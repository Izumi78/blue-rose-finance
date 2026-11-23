import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, CreditCard, History, LayoutDashboard, Plus, Repeat, Sparkles } from "lucide-react";
import { useFinanceStore } from "@/lib/finance/store";
import { QuickAddProvider, useQuickAdd } from "./quick-add";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/calendario", label: "Planejamento", icon: CalendarDays },
  { to: "/carteira", label: "Contas & reservas", icon: CreditCard },
  { to: "/assinaturas", label: "Recorrências", icon: Repeat },
  { to: "/transacoes", label: "Movimentações", icon: History },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const state = useFinanceStore();
  if (!state) return <div className="grid min-h-dvh place-items-center"><div className="text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-forest text-cream"><Sparkles /></div><p className="mt-3 text-xs tracking-[.22em] text-muted-foreground">FINANCIAL RESET</p></div>;
  return <QuickAddProvider><ShellInner>{children}</ShellInner></QuickAddProvider>;
}

function ShellInner({ children }: { children: ReactNode }) {
  const quick = useQuickAdd();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-dvh md:flex">
      <aside className="finance-sidebar hidden w-[236px] shrink-0 flex-col px-4 py-6 md:flex">
        <Link to="/" className="flex items-center gap-3 px-2">
          <span className="brand-mark grid h-10 w-10 place-items-center rounded-xl"><Sparkles className="h-5 w-5" /></span>
          <span><span className="block font-display text-base font-semibold tracking-tight">Financial Reset</span><span className="block text-[10px] tracking-[.18em] opacity-60">PERSONAL FINANCE</span></span>
        </Link>
        <p className="mt-9 px-3 text-[10px] font-semibold uppercase tracking-[.16em] opacity-45">Seu espaço</p>
        <nav className="mt-2 flex flex-col gap-1">
          {NAV.map((n) => <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="sidebar-link flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors data-[status=active]:active-sidebar"><n.icon className="h-[17px] w-[17px]" />{n.label}</Link>)}
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.05] p-3.5">
          <p className="text-xs font-medium">Um passo de cada vez.</p><p className="mt-1 text-[11px] leading-relaxed opacity-55">Clareza financeira começa com pequenas escolhas.</p>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="finance-header sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 md:px-8">
          <div className="flex min-w-0 items-center gap-3 md:hidden"><span className="brand-mark grid h-9 w-9 place-items-center rounded-xl"><Sparkles className="h-4 w-4" /></span><span className="truncate font-display text-sm font-semibold">Financial Reset</span></div>
          <div className="hidden md:block"><p className="text-xs text-muted-foreground">Seu espaço de organização</p><p className="font-medium">Finanças com mais clareza.</p></div>
          <button onClick={() => quick.open()} className="finance-add-button flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"><Plus className="h-4 w-4" />Novo lançamento</button>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 pb-28 pt-5 sm:px-6 md:px-8 md:pb-12 md:pt-7">
          <div key={pathname} className="animate-page">{children}</div>
        </main>
        <div className="finance-mobile-nav fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] md:hidden"><nav className="mx-auto flex max-w-lg items-center justify-around rounded-2xl px-1.5 py-2">
          {NAV.map((n) => <Link key={n.to} to={n.to} aria-label={n.label} activeOptions={{ exact: n.to === "/" }} className="grid h-11 w-11 place-items-center rounded-xl transition-colors data-[status=active]:active-sidebar"><n.icon className="h-[18px] w-[18px]" /></Link>)}
        </nav></div>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, ChevronRight, Crown, Minus, Plus, Repeat, ShieldCheck, Target, TrendingUp, Waves } from "lucide-react";
import heroRose from "@/assets/blue-rose-hero.jpg";
import { accountBalance, accountsByKind, diagnosis, freeMoney, monthlySubscriptions, nextChargeDate, position, toISODate, totals } from "@/lib/finance/logic";
import { formatBRL, formatPct } from "@/lib/format";
import { Panel, TxRow, useFinance } from "@/components/finance/ui-bits";
import { useQuickAdd } from "@/components/finance/quick-add";
import { CardStack } from "@/components/finance/card-stack";
import { ExpenseSplit, RevenueFlow } from "@/components/finance/charts";
import { cn } from "@/lib/utils";
import { FinancialAiPanel } from "@/components/finance/financial-ai-panel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão geral — Blaue Rose" },
      { name: "description", content: "Patrimônio, cartões, fluxo de receitas e despesas do Davi em um só painel." },
      { property: "og:title", content: "Meu painel — Blaue Rose" },
      { property: "og:description", content: "Patrimônio, cartões, fluxo de receitas e despesas do Davi em um só painel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const state = useFinance();
  const quick = useQuickAdd();
  const today = toISODate(new Date());
  const pos = position(state);
  const tot = totals(state);
  const free = freeMoney(state);
  const recent = [...state.transactions].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.createdAt - a.createdAt).slice(0, 6);

  return (
    <div className="space-y-5">
      <FinancialAiPanel />
      <div className="hidden items-end justify-between md:flex">
        <div>
          <p className="text-sm first-letter:uppercase text-muted-foreground">{format(parseISO(today), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
          <h1 className="mt-1 text-4xl font-medium">Meu painel</h1>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Crown className="h-4 w-4 text-royal" /> Seu progresso começa com clareza.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="stagger flex flex-col gap-5 lg:col-span-8">
          {/* Hero + income/expense */}
          <div className="order-1 grid gap-5 md:grid-cols-3">
            <section className="hero-sheen interactive-panel relative overflow-hidden rounded-3xl border border-border bg-card shadow-card md:col-span-2">
              
              
              <div className="relative flex h-full flex-col p-6">
                <p className="text-sm text-muted-foreground">Patrimônio total</p>
                <p className="tabular mt-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{formatBRL(pos.total)}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {free ? <Chip label="Livre · Nubank" value={free.balance} highlight /> : <span className="glass-strong rounded-full px-3 py-1.5 text-warning">Nubank não encontrado</span>}
                  <Chip label="Investido" value={pos.investimento} />
                  <Chip label="Reservado" value={pos.reservado} />
                  <Chip label="A receber" value={pos.receber} />
                  {pos.ajuste !== 0 && <Chip label="Ajuste de conciliação" value={pos.ajuste} />}
                </div>
                <div className="mt-6 hidden flex-wrap gap-2 md:flex">
                  <button onClick={() => quick.open({ type: "expense" })} className="press rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:shadow-glow">Novo gasto</button>
                  <button onClick={() => quick.open({ type: "income" })} className="glass-strong press rounded-full px-5 py-2.5 text-sm font-semibold hover:border-primary/40">Novo ganho</button>
                  <button onClick={() => quick.open({ type: "transfer" })} aria-label="Transferir" className="glass-strong press grid h-10 w-10 place-items-center rounded-full hover:border-primary/40"><ArrowLeftRight className="h-4 w-4" /></button>
                </div>
              </div>
            </section>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-1">
              <StatCard label="Entradas" value={tot.income} sign="+" hint="Total registrado" tone="up" />
              <StatCard label="Saídas" value={tot.expense} sign="−" hint="Total registrado" tone="down" />
            </div>
          </div>

          {/* Mobile quick actions */}
          <div className="order-2 grid grid-cols-4 gap-3 md:hidden">
            <QuickTile icon={Minus} label="Gasto" onClick={() => quick.open({ type: "expense" })} />
            <QuickTile icon={Plus} label="Ganho" onClick={() => quick.open({ type: "income" })} />
            <QuickTile icon={ArrowLeftRight} label="Transferir" onClick={() => quick.open({ type: "transfer" })} />
            <Link to="/assinaturas" className="flex flex-col items-center gap-2">
              <span className="glass-strong grid aspect-square w-full place-items-center rounded-2xl"><Repeat className="h-5 w-5" /></span>
              <span className="text-xs text-muted-foreground">Assinaturas</span>
            </Link>
          </div>

          <div className="order-4 grid gap-5 md:grid-cols-2">
            <RevenueFlow today={today} />
            <ExpenseSplit />
          </div>

          <div className="order-4">
            <Diagnosis />
          </div>

          <Panel
            className="order-3 md:order-5"
            title={<>Últimos lançamentos <sup className="text-xs text-muted-foreground">{state.transactions.length}</sup></>}
            action={<Link to="/transacoes" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">Ver tudo <ChevronRight className="h-4 w-4" /></Link>}
          >
            <div className="space-y-2">
              {recent.map((tx) => <TxRow key={tx.id} tx={tx} state={state} />)}
            </div>
          </Panel>
        </div>

        <aside className="stagger flex flex-col gap-5 lg:col-span-4">
          <Panel><CardStack /></Panel>
          <SubscriptionsPanel today={today} />
          <InvestmentsPanel />
        </aside>
      </div>
    </div>
  );
}

function Chip({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <span className={cn("glass-strong tabular rounded-full px-3 py-1.5", highlight && "border-neon/40 shadow-glow")}>
      <span className="text-muted-foreground">{label} </span>
      <span className="font-semibold">{formatBRL(value)}</span>
    </span>
  );
}

function StatCard({ label, value, sign, hint, tone }: { label: string; value: number; sign: string; hint: string; tone: "up" | "down" }) {
  const Icon = tone === "up" ? ArrowDownLeft : ArrowUpRight;
  return (
    <div className="glass interactive-panel flex flex-col justify-between rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={tone === "up" ? "grid h-8 w-8 place-items-center rounded-full bg-success/15 text-success" : "grid h-8 w-8 place-items-center rounded-full bg-royal/20 text-royal"}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4">
        <p className="tabular truncate font-display text-lg font-semibold sm:text-2xl">{sign}{formatBRL(value)}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function QuickTile({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="press flex flex-col items-center gap-2 rounded-2xl">
      <span className="glass-strong grid aspect-square w-full place-items-center rounded-2xl text-neon"><Icon className="h-5 w-5" /></span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </button>
  );
}

function Diagnosis() {
  const state = useFinance();
  const d = diagnosis(state);
  return (
    <Panel title={<span className="flex items-center gap-2"><Target className="h-4 w-4 text-neon" /> Diagnóstico de caixa</span>}>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-strong rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Maior despesa</p>
          <p className="mt-1 truncate font-semibold">{d.biggest?.description ?? "—"}</p>
          {d.biggest && <p className="tabular mt-1 text-sm text-neon">{formatPct(d.biggest.pct)} dos gastos</p>}
        </div>
        <div className="glass-strong rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Gastos recorrentes</p>
          <p className="mt-1 truncate font-semibold">{d.recurring?.category ?? "—"}</p>
          {d.recurring && <p className="tabular mt-1 text-sm text-warning">{formatBRL(d.recurring.amount)} pulverizados</p>}
        </div>
        <div className="glass-strong rounded-2xl p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Proteção de caixa</p>
          {d.reserved.length ? (
            d.reserved.map((r) => (
              <div key={r.name}>
                <p className="mt-1 truncate font-semibold">{r.name}</p>
                <p className="tabular mt-1 text-sm text-success">{formatBRL(r.balance)} isolado</p>
              </div>
            ))
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Nenhuma reserva separada.</p>
          )}
        </div>
      </div>
    </Panel>
  );
}

function SubscriptionsPanel({ today }: { today: string }) {
  const state = useFinance();
  const subs = state.subscriptions.filter((s) => s.active).sort((a, b) => nextChargeDate(a, today).localeCompare(nextChargeDate(b, today)));
  return (
    <Panel
      title={<>Assinaturas <sup className="text-xs text-muted-foreground">{subs.length}</sup></>}
      action={<Link to="/assinaturas" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">Gerenciar <ChevronRight className="h-4 w-4" /></Link>}
    >
      {subs.length === 0 ? (
        <Link to="/assinaturas" className="flex items-center gap-3 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground">
          <Crown className="h-5 w-5 text-royal" /> Cadastre Gemini Pro, streamings e ferramentas.
        </Link>
      ) : (
        <div className="space-y-2">
          {subs.slice(0, 4).map((s) => (
            <div key={s.id} className="glass-strong grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-2.5">
              <span className="bg-kaiser grid h-9 w-9 place-items-center rounded-full font-display text-sm font-semibold text-primary-foreground">{s.name.charAt(0)}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{s.name}</span>
                <span className="block text-xs text-muted-foreground">Próx. {format(parseISO(nextChargeDate(s, today)), "dd MMM", { locale: ptBR })}</span>
              </span>
              <span className="tabular text-sm font-bold">{formatBRL(s.amount)}</span>
            </div>
          ))}
          <p className="tabular pt-1 text-right text-xs text-muted-foreground">Total mensal: <span className="font-semibold text-foreground">{formatBRL(monthlySubscriptions(state))}</span></p>
        </div>
      )}
    </Panel>
  );
}

function InvestmentsPanel() {
  const state = useFinance();
  const inv = accountsByKind(state, "investimento");
  const rec = accountsByKind(state, "receber");
  const total = inv.reduce((s, a) => s + accountBalance(state, a.id), 0);
  return (
    <Panel
      title={<span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-neon" /> Investimentos</span>}
      action={<span className="tabular text-sm font-semibold">{formatBRL(total)}</span>}
    >
      <div className="space-y-2">
        {inv.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-muted-foreground">{a.name}</span>
            <span className="tabular font-semibold">{formatBRL(accountBalance(state, a.id))}</span>
          </div>
        ))}
        {rec.length > 0 && <div className="my-3 h-px bg-border" />}
        {rec.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 truncate text-muted-foreground"><Waves className="h-3.5 w-3.5 shrink-0 text-royal" />{a.name}</span>
            <span className="tabular font-semibold">{formatBRL(accountBalance(state, a.id))}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Flag } from "lucide-react";
import { dayTotals, isCountedDay, spendLevel, toISODate } from "@/lib/finance/logic";
import { formatBRL } from "@/lib/format";
import { CalendarLegend, FinanceCalendar } from "@/components/finance/finance-calendar";
import { LevelDot, Panel, useFinance } from "@/components/finance/ui-bits";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário financeiro — Blaue Rose" },
      { name: "description", content: "Veja dia a dia se o gasto foi seguro, médio ou alto e abra os lançamentos de cada data." },
      { property: "og:title", content: "Calendário financeiro — Blaue Rose" },
      { property: "og:description", content: "Veja dia a dia se o gasto foi seguro, médio ou alto e abra os lançamentos de cada data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const state = useFinance();
  const today = toISODate(new Date());
  const month = parseISO(today);
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
    .map(toISODate)
    .filter((d) => isCountedDay(d, state.startDate, today));
  const counts = { safe: 0, medium: 0, high: 0 };
  let spent = 0;
  for (const d of days) {
    const { expense } = dayTotals(state, d);
    spent += expense;
    counts[spendLevel(expense)] += 1;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-medium md:text-4xl">Calendário financeiro</h1>
        <p className="mt-1 text-sm text-muted-foreground">Toque em um dia para ver o resumo e os lançamentos.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-12">
        <Panel className="lg:col-span-8">
          <FinanceCalendar today={today} />
          <CalendarLegend className="mt-5" />
        </Panel>
        <aside className="flex flex-col gap-5 lg:col-span-4">
          <Panel title={<span className="inline-block first-letter:uppercase">{format(month, "MMMM", { locale: ptBR })} até agora</span>}>
            <p className="text-xs text-muted-foreground">Gasto no mês</p>
            <p className="tabular font-display text-3xl font-semibold">{formatBRL(spent)}</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {(["safe", "medium", "high"] as const).map((l) => (
                <div key={l} className="glass-strong rounded-2xl p-3 text-center">
                  <LevelDot level={l} className="h-2 w-2" />
                  <p className="tabular mt-1 font-display text-xl font-semibold">{counts[l]}</p>
                  <p className="text-[11px] text-muted-foreground">{l === "safe" ? "seguros" : l === "medium" ? "médios" : "altos"}</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Flag className="h-4 w-4 text-neon" /> Contagem iniciada em</p>
            <p className="mt-1 font-display text-lg font-semibold">{format(parseISO(state.startDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            <p className="mt-2 text-xs text-muted-foreground">O histórico anterior a essa data fica em “Histórico inicial”, sem dia marcado no calendário.</p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

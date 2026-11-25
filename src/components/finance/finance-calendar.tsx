import { useState } from "react";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Crown, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dayTotals, dayTransactions, isBillingDay, isCountedDay, SPEND_LIMITS, spendLevel, toISODate } from "@/lib/finance/logic";
import { financeActions } from "@/lib/finance/store";
import { formatBRL } from "@/lib/format";
import { LevelDot, TxRow, useFinance } from "./ui-bits";
import { useQuickAdd } from "./quick-add";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground", className)}>
      <span className="flex items-center gap-1.5"><LevelDot level="safe" /> Seguro (até {formatBRL(SPEND_LIMITS.safe)})</span>
      <span className="flex items-center gap-1.5"><LevelDot level="medium" /> Médio (até {formatBRL(SPEND_LIMITS.medium)})</span>
      <span className="flex items-center gap-1.5"><LevelDot level="high" /> Alto (acima)</span>
      <span className="flex items-center gap-1.5"><Crown className="h-3 w-3 text-royal" /> Assinatura</span>
    </div>
  );
}

export function FinanceCalendar({ today, compact = false }: { today: string; compact?: boolean }) {
  const state = useFinance();
  const [month, setMonth] = useState(() => startOfMonth(parseISO(today)));
  const [selected, setSelected] = useState<string | null>(null);
  const startMonth = startOfMonth(parseISO(state.startDate));
  const canPrev = month > startMonth;

  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) });
  const activeSubs = state.subscriptions.filter((s) => s.active);

  return (
    <div>
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="truncate font-display text-lg font-semibold first-letter:uppercase">{format(month, "MMMM yyyy", { locale: ptBR })}</h2>
        <div className="flex gap-1.5">
          <button disabled={!canPrev} onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Mês anterior" className="glass-strong grid h-9 w-9 place-items-center rounded-full disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Próximo mês" className="glass-strong grid h-9 w-9 place-items-center rounded-full">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {WEEKDAYS.map((d) => <div key={d} className="py-1.5">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {days.map((d) => {
          const iso = toISODate(d);
          const inMonth = isSameMonth(d, month);
          const counted = isCountedDay(iso, state.startDate, today);
          const beforeStart = iso < state.startDate;
          const { expense, income } = dayTotals(state, iso);
          const level = spendLevel(expense);
          const hasSub = activeSubs.some((s) => isBillingDay(s, iso));
          const isToday = iso === today;
          return (
            <button
              key={iso}
              disabled={beforeStart}
              onClick={() => setSelected(iso)}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl border border-transparent transition-all",
                compact ? "aspect-square" : "aspect-square sm:aspect-[1.15]",
                inMonth ? "text-foreground" : "text-muted-foreground/40",
                beforeStart ? "cursor-not-allowed opacity-25" : "hover:border-primary/40 hover:bg-accent/30",
                counted && inMonth && "bg-surface-2",
                isToday && "border-primary shadow-glow",
              )}
            >
              <span className={cn("tabular text-sm font-semibold", isToday && "text-neon")}>{d.getDate()}</span>
              {!compact && counted && inMonth && (expense > 0 || income > 0) && (
                <span className="tabular mt-0.5 hidden text-[10px] text-muted-foreground sm:block">
                  {expense > 0 ? `−${formatBRL(expense).replace("R$", "").trim()}` : `+${formatBRL(income).replace("R$", "").trim()}`}
                </span>
              )}
              <span className="mt-1 flex h-2 items-center gap-1">
                {counted && <LevelDot level={level} />}
                {hasSub && !beforeStart && <Crown className="h-2.5 w-2.5 text-royal" />}
              </span>
            </button>
          );
        })}
      </div>
      <DayDialog date={selected} today={today} onClose={() => setSelected(null)} />
    </div>
  );
}

function DayDialog({ date, today, onClose }: { date: string | null; today: string; onClose: () => void }) {
  const state = useFinance();
  const quick = useQuickAdd();
  const txs = date ? dayTransactions(state, date) : [];
  const t = date ? dayTotals(state, date) : { income: 0, expense: 0 };
  const counted = date ? isCountedDay(date, state.startDate, today) : false;
  const subs = date ? state.subscriptions.filter((s) => s.active && isBillingDay(s, date)) : [];
  const level = spendLevel(t.expense);

  return (
    <Dialog open={!!date} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="glass max-h-[90dvh] overflow-y-auto rounded-3xl bg-popover sm:max-w-md">
        {date && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display first-letter:uppercase">{format(parseISO(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                {counted ? (
                  <>
                    <LevelDot level={level} />
                    {level === "safe" ? "Dia de gasto seguro" : level === "medium" ? "Dia de gasto médio" : "Dia de grande gasto"}
                  </>
                ) : (
                  "Dia futuro"
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-2">
              <div className="glass-strong rounded-2xl p-3">
                <p className="text-[11px] text-muted-foreground">Entradas</p>
                <p className="tabular text-sm font-bold text-success">{formatBRL(t.income)}</p>
              </div>
              <div className="glass-strong rounded-2xl p-3">
                <p className="text-[11px] text-muted-foreground">Saídas</p>
                <p className="tabular text-sm font-bold">{formatBRL(t.expense)}</p>
              </div>
              <div className="glass-strong rounded-2xl p-3">
                <p className="text-[11px] text-muted-foreground">Saldo do dia</p>
                <p className="tabular text-sm font-bold">{formatBRL(t.income - t.expense)}</p>
              </div>
            </div>

            {subs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cobranças de assinatura</p>
                {subs.map((s) => {
                  const charged = s.lastChargedMonth === date.slice(0, 7);
                  return (
                    <div key={s.id} className="glass-strong flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5">
                      <span className="flex min-w-0 items-center gap-2 text-sm"><Crown className="h-4 w-4 shrink-0 text-royal" /><span className="truncate">{s.name}</span></span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="tabular text-sm font-semibold">{formatBRL(s.amount)}</span>
                        {!charged && date <= today && (
                          <Button size="sm" variant="outline" className="h-7 rounded-full text-xs" onClick={() => financeActions.chargeSubscription(s.id, date)}>Lançar</Button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lançamentos</p>
              {txs.length === 0 ? (
                <p className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">Nada registrado neste dia.</p>
              ) : (
                txs.map((tx) => <TxRow key={tx.id} tx={tx} state={state} />)
              )}
            </div>
            <Button
              className="bg-kaiser h-11 rounded-2xl font-semibold shadow-glow"
              onClick={() => {
                onClose();
                quick.open({ date });
              }}
            >
              <Plus className="h-4 w-4" /> Lançar neste dia
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

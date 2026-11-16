import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, CreditCard, Crown, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { monthlySubscriptions, nextChargeDate, toISODate } from "@/lib/finance/logic";
import { financeActions } from "@/lib/finance/store";
import type { Subscription } from "@/lib/finance/types";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SubscriptionDialog } from "@/components/finance/subscription-dialog";
import { accountName, Panel, useFinance } from "@/components/finance/ui-bits";

export const Route = createFileRoute("/assinaturas")({
  head: () => ({
    meta: [
      { title: "Assinaturas no cartão — Blaue Rose" },
      { name: "description", content: "Gerencie assinaturas recorrentes como Gemini Pro e streamings: valor, dia de cobrança e cartão." },
      { property: "og:title", content: "Assinaturas no cartão — Blaue Rose" },
      { property: "og:description", content: "Gerencie assinaturas recorrentes como Gemini Pro e streamings: valor, dia de cobrança e cartão." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubscriptionsPage,
});

function SubscriptionsPage() {
  const state = useFinance();
  const today = toISODate(new Date());
  const [editing, setEditing] = useState<Subscription | undefined>();
  const [open, setOpen] = useState(false);
  const subs = [...state.subscriptions].sort((a, b) => Number(b.active) - Number(a.active) || nextChargeDate(a, today).localeCompare(nextChargeDate(b, today)));
  const total = monthlySubscriptions(state);
  const thisMonth = today.slice(0, 7);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-medium md:text-4xl">Assinaturas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Inscrições recorrentes no cartão.</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setOpen(true); }} className="bg-kaiser rounded-full shadow-glow">
          <Plus className="h-4 w-4" /> Nova
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Panel className="sm:col-span-1">
          <p className="text-sm text-muted-foreground">Custo mensal</p>
          <p className="tabular font-display text-3xl font-semibold">{formatBRL(total)}</p>
          <p className="tabular mt-1 text-xs text-muted-foreground">{formatBRL(total * 12)} por ano</p>
        </Panel>
        <Panel className="sm:col-span-2">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Crown className="h-4 w-4 text-royal" /> Dica</p>
          <p className="mt-1 text-sm">No dia da cobrança, a assinatura aparece com uma coroa no calendário. Use “Lançar” para registrar o gasto do mês.</p>
        </Panel>
      </div>

      {subs.length === 0 ? (
        <button onClick={() => setOpen(true)} className="glass flex w-full flex-col items-center gap-3 rounded-3xl border-dashed p-10 text-center">
          <span className="bg-kaiser grid h-14 w-14 place-items-center rounded-full shadow-glow"><Crown className="h-6 w-6 text-primary-foreground" /></span>
          <span className="font-display text-lg">Nenhuma assinatura ainda</span>
          <span className="text-sm text-muted-foreground">Adicione Gemini Pro, streamings e ferramentas que cobram no cartão.</span>
        </button>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subs.map((s) => {
            const next = nextChargeDate(s, today);
            const charged = s.lastChargedMonth === thisMonth;
            return (
              <div key={s.id} className={cn("glass rounded-3xl p-5 transition-opacity", !s.active && "opacity-50")}>
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                  <span className="bg-kaiser grid h-11 w-11 place-items-center rounded-2xl font-display text-lg font-semibold text-primary-foreground shadow-glow">{s.name.charAt(0)}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.name}</p>
                    <p className="tabular text-sm text-muted-foreground">{formatBRL(s.amount)}/mês</p>
                  </div>
                  <Switch checked={s.active} onCheckedChange={(v) => financeActions.updateSubscription(s.id, { active: v })} aria-label="Ativa" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="glass-strong rounded-xl p-2.5">
                    <p className="flex items-center gap-1 text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> Cobra todo dia</p>
                    <p className="tabular mt-0.5 font-semibold">{String(s.billingDay).padStart(2, "0")} · próx. {format(parseISO(next), "dd/MM", { locale: ptBR })}</p>
                  </div>
                  <div className="glass-strong min-w-0 rounded-xl p-2.5">
                    <p className="flex items-center gap-1 text-muted-foreground"><CreditCard className="h-3.5 w-3.5" /> Cartão</p>
                    <p className="mt-0.5 truncate font-semibold">{accountName(state, s.accountId)}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    disabled={charged || !s.active}
                    className="flex-1 rounded-full"
                    onClick={() => { financeActions.chargeSubscription(s.id, today); toast.success(`${s.name} lançado em ${format(parseISO(today), "dd/MM")}`); }}
                  >
                    {charged ? "Lançado este mês" : "Lançar cobrança"}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => { setEditing(s); setOpen(true); }} aria-label="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <SubscriptionDialog open={open} onOpenChange={setOpen} sub={editing} />
    </div>
  );
}

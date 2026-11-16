import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { financeActions } from "@/lib/finance/store";
import { round2 } from "@/lib/finance/logic";
import type { Transaction, TxType } from "@/lib/finance/types";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TxRow, useFinance } from "@/components/finance/ui-bits";

export const Route = createFileRoute("/transacoes")({
  head: () => ({
    meta: [
      { title: "Histórico de lançamentos — Blaue Rose" },
      { name: "description", content: "Todas as entradas, saídas e transferências registradas, com busca e filtros." },
      { property: "og:title", content: "Histórico de lançamentos — Blaue Rose" },
      { property: "og:description", content: "Todas as entradas, saídas e transferências registradas, com busca e filtros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TransactionsPage,
});

const FILTERS: { value: TxType | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "expense", label: "Gastos" },
  { value: "income", label: "Ganhos" },
  { value: "transfer", label: "Transferências" },
];

function TransactionsPage() {
  const state = useFinance();
  const [filter, setFilter] = useState<TxType | "all">("all");
  const [q, setQ] = useState("");

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = state.transactions.filter(
      (t) => (filter === "all" || t.type === filter) && (!term || `${t.description} ${t.category}`.toLowerCase().includes(term)),
    );
    const map = new Map<string, Transaction[]>();
    for (const t of list) {
      const k = t.date ?? "hist";
      map.set(k, [...(map.get(k) ?? []), t]);
    }
    return [...map.entries()].sort(([a], [b]) => (a === "hist" ? 1 : b === "hist" ? -1 : b.localeCompare(a)));
  }, [state.transactions, filter, q]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-medium md:text-4xl">Histórico</h1>
        <p className="mt-1 text-sm text-muted-foreground">Entradas, saídas e transferências.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-full bg-muted p-1">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)} className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all", filter === f.value ? "bg-kaiser text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground")}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar lançamento" className="h-11 rounded-full pl-10" />
        </div>
      </div>

      {groups.length === 0 && <p className="glass rounded-3xl p-8 text-center text-sm text-muted-foreground">Nada encontrado.</p>}

      {groups.map(([key, txs]) => {
        const inc = round2(txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0));
        const out = round2(txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0));
        return (
          <section key={key} className="space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 px-1">
              <h2 className="truncate font-sans text-sm font-semibold first-letter:uppercase text-muted-foreground">
                {key === "hist" ? "Histórico inicial (antes do app)" : format(parseISO(key), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </h2>
              <p className="tabular text-xs text-muted-foreground">
                {inc > 0 && <span className="text-success">+{formatBRL(inc)} </span>}
                {out > 0 && <span>−{formatBRL(out)}</span>}
              </p>
            </div>
            <div className="space-y-2">
              {txs.map((tx) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  state={state}
                  trailing={
                    <button
                      aria-label="Excluir"
                      onClick={() => {
                        if (!confirm(`Excluir "${tx.description}"?`)) return;
                        financeActions.deleteTransaction(tx.id);
                        toast.success("Lançamento excluído");
                      }}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  }
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

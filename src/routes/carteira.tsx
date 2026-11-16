import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { accountBalance, position } from "@/lib/finance/logic";
import { financeActions } from "@/lib/finance/store";
import type { Account, AccountKind } from "@/lib/finance/types";
import { formatBRL } from "@/lib/format";
import { BankCard } from "@/components/finance/card-stack";
import { AccountDialog } from "@/components/finance/account-dialog";
import { useFinance } from "@/components/finance/ui-bits";

export const Route = createFileRoute("/carteira")({
  head: () => ({
    meta: [
      { title: "Carteira — Blaue Rose" },
      { name: "description", content: "Contas correntes, reservas, valores a receber e investimentos com saldo individual." },
      { property: "og:title", content: "Carteira — Blaue Rose" },
      { property: "og:description", content: "Contas correntes, reservas, valores a receber e investimentos com saldo individual." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WalletPage,
});

const GROUPS: { kind: AccountKind; title: string; hint: string }[] = [
  { kind: "corrente", title: "Dinheiro livre", hint: "Contas correntes" },
  { kind: "reservado", title: "Reservado", hint: "Separado, não usar no dia a dia" },
  { kind: "receber", title: "A receber", hint: "Dinheiro que vai voltar" },
  { kind: "investimento", title: "Investimentos", hint: "Cripto, Tesouro e afins" },
];

function WalletPage() {
  const state = useFinance();
  const pos = position(state);
  const [editing, setEditing] = useState<Account | undefined>();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-medium md:text-4xl">Carteira</h1>
          <p className="tabular mt-1 text-sm text-muted-foreground">Patrimônio total <span className="font-semibold text-foreground">{formatBRL(pos.total)}</span></p>
        </div>
        <Button onClick={() => { setEditing(undefined); setOpen(true); }} className="bg-kaiser rounded-full shadow-glow">
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>

      {GROUPS.map((g) => {
        const list = state.accounts.filter((a) => a.kind === g.kind);
        if (!list.length) return null;
        return (
          <section key={g.kind}>
            <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-medium">{g.title}</h2>
                <p className="text-xs text-muted-foreground">{g.hint}</p>
              </div>
              <p className="tabular font-display font-semibold">{formatBRL(pos[g.kind])}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {list.map((a) => (
                <button key={a.id} onClick={() => { setEditing(a); setOpen(true); }} className="text-left transition-transform hover:-translate-y-1">
                  <BankCard account={a} balance={accountBalance(state, a.id)} className="h-[170px]" />
                </button>
              ))}
            </div>
          </section>
        );
      })}

      <div className="flex justify-center pt-4">
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => {
            if (confirm("Restaurar os dados iniciais? Todos os lançamentos novos e assinaturas serão apagados.")) financeActions.resetAll();
          }}
        >
          <RotateCcw className="h-4 w-4" /> Restaurar dados iniciais
        </Button>
      </div>
      <AccountDialog open={open} onOpenChange={setOpen} account={editing} />
    </div>
  );
}

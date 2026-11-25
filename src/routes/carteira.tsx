import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Plus, RotateCcw, Scale, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { accountBalance, freeMoney, position, round2 } from "@/lib/finance/logic";
import { financeActions } from "@/lib/finance/store";
import type { Account, AccountKind } from "@/lib/finance/types";
import { formatBRL } from "@/lib/format";
import { BankCard } from "@/components/finance/card-stack";
import { AccountDialog } from "@/components/finance/account-dialog";
import { useFinance } from "@/components/finance/ui-bits";
import { cn } from "@/lib/utils";

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
  { kind: "corrente", title: "Contas correntes", hint: "Total agregado de todas as contas correntes" },
  { kind: "reservado", title: "Reservado", hint: "Separado, não usar no dia a dia" },
  { kind: "receber", title: "A receber", hint: "Dinheiro que vai voltar" },
  { kind: "investimento", title: "Investimentos", hint: "Cripto, Tesouro e afins" },
];

function WalletPage() {
  const state = useFinance();
  const pos = position(state);
  const [editing, setEditing] = useState<Account | undefined>();
  const [open, setOpen] = useState(false);
  const [allocOpen, setAllocOpen] = useState(false);
  const free = freeMoney(state);

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

      <div className="stagger grid gap-4 md:grid-cols-3">
        <section className="glass interactive-panel relative overflow-hidden rounded-3xl border-primary/30 p-5 shadow-glow">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/25 blur-3xl" />
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="h-4 w-4 text-neon" /> Dinheiro livre · Nubank</p>
          {free ? (
            <>
              <p className="tabular mt-2 font-display text-3xl font-semibold tracking-tight">{formatBRL(free.balance)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Somente o saldo do Nubank — as outras contas ficam abaixo.</p>
            </>
          ) : (
            <p className="mt-3 flex items-start gap-2 text-sm text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Conta Nubank não encontrada. Adicione uma conta “Nubank” para ver o dinheiro livre.
            </p>
          )}
        </section>
        <section className="glass interactive-panel rounded-3xl p-5">
          <p className="text-sm text-muted-foreground">Contas correntes</p>
          <p className="tabular mt-2 font-display text-2xl font-semibold">{formatBRL(pos.corrente)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Soma de {state.accounts.filter((a) => a.kind === "corrente").length} contas correntes (não é o dinheiro livre).</p>
        </section>
        <section className="glass interactive-panel rounded-3xl p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Scale className="h-4 w-4 text-royal" /> Ajuste de conciliação</p>
          <p className={cn("tabular mt-2 font-display text-2xl font-semibold", pos.ajuste < 0 && "text-warning")}>{formatBRL(pos.ajuste)}</p>
          {pos.ajuste !== 0 ? (
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Diferença de abertura, já incluída no patrimônio. Sem conta definida.</p>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setAllocOpen(true)}>Alocar em conta</Button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Ajuste já alocado em uma conta.</p>
          )}
        </section>
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
                <button key={a.id} aria-label={`Editar ${a.name}`} onClick={() => { setEditing(a); setOpen(true); }} className="card-lift rounded-[1.75rem] text-left">
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
      <AllocateDialog open={allocOpen} onOpenChange={setAllocOpen} />
    </div>
  );
}

/** Explicit, user-confirmed move of the opening adjustment into one account. */
function AllocateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const state = useFinance();
  const [target, setTarget] = useState<string>("");
  const adj = state.openingAdjustment ?? 0;
  const acc = state.accounts.find((a) => a.id === target);

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setTarget(""); }}>
      <DialogContent className="glass rounded-3xl bg-popover sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Alocar ajuste de conciliação</DialogTitle>
          <DialogDescription>
            O ajuste de {formatBRL(adj)} sai do “Ajuste de conciliação” e entra no saldo da conta escolhida. O patrimônio total não muda.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Conta</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Escolha a conta" /></SelectTrigger>
            <SelectContent>
              {state.accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {acc && (
            <p className="tabular pt-1 text-xs text-muted-foreground">
              {acc.name}: {formatBRL(accountBalance(state, acc.id))} → <span className="font-semibold text-foreground">{formatBRL(round2(accountBalance(state, acc.id) + adj))}</span>
            </p>
          )}
        </div>
        <Button
          disabled={!acc}
          className="bg-kaiser h-12 w-full rounded-2xl font-semibold shadow-glow"
          onClick={() => {
            if (!acc) return;
            financeActions.allocateAdjustment(acc.id);
            toast.success(`Ajuste alocado em ${acc.name}`);
            onOpenChange(false);
            setTarget("");
          }}
        >
          Confirmar alocação
        </Button>
      </DialogContent>
    </Dialog>
  );
}

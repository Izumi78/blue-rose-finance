import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { accountBalance } from "@/lib/finance/logic";
import type { Account } from "@/lib/finance/types";
import { formatBRL } from "@/lib/format";
import { CARD_THEME_CLASS, useFinance } from "./ui-bits";
import { AccountDialog } from "./account-dialog";

const KIND_LABEL: Record<Account["kind"], string> = {
  corrente: "Conta corrente",
  reservado: "Reservado",
  receber: "A receber",
  investimento: "Investimento",
};

export function BankCard({ account, balance, className }: { account: Account; balance: number; className?: string }) {
  return (
    <div className={cn(CARD_THEME_CLASS[account.theme], "relative overflow-hidden rounded-3xl border border-foreground/10 p-5 text-foreground", className)}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-foreground/10" />
      <div className="pointer-events-none absolute -right-2 -top-16 h-40 w-40 rounded-full border border-foreground/10" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold">{account.name}</p>
          <p className="text-xs text-foreground/70">{KIND_LABEL[account.kind]}</p>
        </div>
        {account.last4 && <span className="tabular shrink-0 text-xs text-foreground/70">•••• {account.last4}</span>}
      </div>
      <div className="relative mt-8">
        <p className="text-xs text-foreground/70">Saldo</p>
        <p className="tabular font-display text-2xl font-semibold">{formatBRL(balance)}</p>
        {account.note && <p className="mt-1 truncate text-xs text-foreground/70">{account.note}</p>}
      </div>
    </div>
  );
}

/** Stack of the accounts that hold money you can move (corrente + reservado). Click to cycle. */
export function CardStack() {
  const state = useFinance();
  const cards = state.accounts.filter((a) => a.kind === "corrente" || a.kind === "reservado");
  const [front, setFront] = useState(0);
  const [adding, setAdding] = useState(false);
  const n = cards.length;
  const ordered = n ? Array.from({ length: n }, (_, i) => cards[(front + i) % n]).filter((a): a is Account => !!a) : [];
  const visible = ordered.slice(0, 4);

  return (
    <div>
      <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="truncate text-base font-medium">
          Meus cartões <sup className="text-xs text-muted-foreground">{n}</sup>
        </h2>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background">
          Adicionar <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {n === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum cartão ainda.</p>
      ) : (
        <>
          <button
            onClick={() => setFront((f) => (f + 1) % n)}
            aria-label="Próximo cartão"
            className="relative block w-full text-left"
            style={{ height: `${180 + (visible.length - 1) * 26}px` }}
          >
            {visible
              .map((acc, i) => ({ acc, i }))
              .reverse()
              .map(({ acc, i }) => (
                <div
                  key={acc.id}
                  className="absolute inset-x-0 transition-all duration-500 ease-out"
                  style={{
                    top: `${(visible.length - 1 - i) * 26}px`,
                    transform: `scale(${1 - i * 0.05})`,
                    opacity: 1 - i * 0.12,
                    zIndex: 10 - i,
                  }}
                >
                  <BankCard account={acc} balance={accountBalance(state, acc.id)} className={cn("h-[180px]", i === 0 && "shadow-glow")} />
                </div>
              ))}
          </button>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              {cards.map((c, i) => (
                <button
                  key={c.id}
                  aria-label={c.name}
                  onClick={() => setFront(i)}
                  className={cn("h-1.5 rounded-full transition-all", i === front ? "w-6 bg-neon" : "w-1.5 bg-muted-foreground/40")}
                />
              ))}
            </div>
            <button onClick={() => setFront((f) => (f + 1) % n)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              Alternar <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
      <AccountDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}

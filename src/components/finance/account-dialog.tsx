import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { financeActions } from "@/lib/finance/store";
import { accountBalance, round2 } from "@/lib/finance/logic";
import type { Account, AccountKind, CardTheme } from "@/lib/finance/types";
import { formatNumber, parseAmount } from "@/lib/format";
import { CARD_THEME_CLASS, useFinance } from "./ui-bits";

const THEMES: CardTheme[] = ["kaiser", "royal", "abyss", "neon", "rose"];
const KINDS: { value: AccountKind; label: string }[] = [
  { value: "corrente", label: "Conta corrente (dinheiro livre)" },
  { value: "reservado", label: "Reservado" },
  { value: "receber", label: "Valor a receber" },
  { value: "investimento", label: "Investimento" },
];

/** Create a new account, or edit one (the balance field sets the current balance). */
export function AccountDialog({ open, onOpenChange, account }: { open: boolean; onOpenChange: (o: boolean) => void; account?: Account | undefined }) {
  const state = useFinance();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<AccountKind>("corrente");
  const [balance, setBalance] = useState("");
  const [note, setNote] = useState("");
  const [last4, setLast4] = useState("");
  const [theme, setTheme] = useState<CardTheme>("kaiser");

  useEffect(() => {
    if (open) {
      setName(account?.name ?? "");
      setKind(account?.kind ?? "corrente");
      setBalance(account ? formatNumber(accountBalance(state, account.id)) : "");
      setNote(account?.note ?? "");
      setLast4(account?.last4 ?? "");
      setTheme(account?.theme ?? "kaiser");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, account?.id]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = balance.trim() ? parseAmount(balance) : 0;
    if (!name.trim()) { toast.error("Dê um nome para a conta."); return; }
    if (!Number.isFinite(value)) { toast.error("Saldo inválido."); return; }
    const base = { name: name.trim(), kind, note: note.trim() || undefined, last4: last4.trim() || undefined, theme };
    if (account) {
      const delta = value - accountBalance(state, account.id);
      financeActions.updateAccount(account.id, { ...base, initialBalance: round2(account.initialBalance + delta) });
      toast.success("Conta atualizada");
    } else {
      financeActions.addAccount({ ...base, initialBalance: value });
      toast.success("Conta adicionada");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[92dvh] overflow-y-auto rounded-3xl bg-popover sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{account ? "Editar conta" : "Nova conta ou cartão"}</DialogTitle>
          <DialogDescription>{account ? "Ajuste o saldo atual se ele estiver diferente do app do banco." : "Adicione um banco, carteira ou investimento."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="acc-name">Nome</Label>
            <Input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Inter" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as AccountKind)}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-bal">Saldo atual (R$)</Label>
              <Input id="acc-bal" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="0,00" className="tabular h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-l4">Final</Label>
              <Input id="acc-l4" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))} placeholder="1234" className="tabular h-11 rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="acc-note">Observação</Label>
            <Input id="acc-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opcional" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Visual do cartão</Label>
            <div className="flex gap-2">
              {THEMES.map((t) => (
                <button type="button" key={t} aria-label={t} onClick={() => setTheme(t)} className={cn(CARD_THEME_CLASS[t], "h-10 w-14 rounded-xl border-2 transition-all", theme === t ? "border-neon shadow-glow" : "border-transparent")} />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {account && (
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-2xl"
                onClick={() => {
                  if (!confirm(`Remover "${account.name}"? Os lançamentos ficam no histórico.`)) return;
                  financeActions.deleteAccount(account.id);
                  onOpenChange(false);
                }}
              >
                Remover
              </Button>
            )}
            <Button type="submit" className="bg-kaiser h-12 flex-1 rounded-2xl font-semibold shadow-glow">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

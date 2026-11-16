import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { SUBSCRIPTION_TEMPLATES } from "@/lib/finance/categories";
import { financeActions } from "@/lib/finance/store";
import type { Subscription } from "@/lib/finance/types";
import { formatNumber, parseAmount } from "@/lib/format";
import { useFinance } from "./ui-bits";

const NONE = "__none__";

export function SubscriptionDialog({ open, onOpenChange, sub }: { open: boolean; onOpenChange: (o: boolean) => void; sub?: Subscription | undefined }) {
  const state = useFinance();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("10");
  const [accountId, setAccountId] = useState<string>(NONE);

  useEffect(() => {
    if (open) {
      setName(sub?.name ?? "");
      setAmount(sub ? formatNumber(sub.amount) : "");
      setDay(String(sub?.billingDay ?? 10));
      setAccountId(sub?.accountId ?? state.accounts.find((a) => a.id === "nubank")?.id ?? NONE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sub?.id]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseAmount(amount);
    const d = Number(day);
    if (!name.trim()) { toast.error("Informe o nome da assinatura."); return; }
    if (!Number.isFinite(value) || value <= 0) { toast.error("Informe o valor mensal."); return; }
    if (!Number.isInteger(d) || d < 1 || d > 31) { toast.error("Dia de cobrança entre 1 e 31."); return; }
    const data = { name: name.trim(), amount: value, billingDay: d, accountId: accountId === NONE ? null : accountId, category: "Assinaturas", active: sub?.active ?? true };
    if (sub) financeActions.updateSubscription(sub.id, data);
    else financeActions.addSubscription(data);
    toast.success(sub ? "Assinatura atualizada" : "Assinatura adicionada");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[92dvh] overflow-y-auto rounded-3xl bg-popover sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{sub ? "Editar assinatura" : "Nova assinatura"}</DialogTitle>
          <DialogDescription>Cobranças recorrentes no cartão, como Gemini Pro ou streamings.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!sub && (
            <div className="flex flex-wrap gap-1.5">
              {SUBSCRIPTION_TEMPLATES.map((t) => (
                <button type="button" key={t} onClick={() => setName(t)} className={cn("rounded-full border px-3 py-1 text-xs transition-all", name === t ? "border-primary bg-primary/20 text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
                  {t}
                </button>
              ))}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="sub-name">Nome</Label>
            <Input id="sub-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Gemini Pro" className="h-11 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sub-amount">Valor mensal (R$)</Label>
              <Input id="sub-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="tabular h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-day">Dia da cobrança</Label>
              <Input id="sub-day" inputMode="numeric" value={day} onChange={(e) => setDay(e.target.value.replace(/\D/g, "").slice(0, 2))} className="tabular h-11 rounded-xl" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Cartão vinculado</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Não especificado</SelectItem>
                {state.accounts.filter((a) => a.kind === "corrente").map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            {sub && (
              <Button type="button" variant="outline" className="h-12 rounded-2xl" onClick={() => { financeActions.deleteSubscription(sub.id); onOpenChange(false); toast.success("Assinatura removida"); }}>
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

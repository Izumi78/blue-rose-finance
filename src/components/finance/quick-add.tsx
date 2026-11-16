import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/finance/categories";
import { financeActions } from "@/lib/finance/store";
import { toISODate } from "@/lib/finance/logic";
import type { TxType } from "@/lib/finance/types";
import { parseAmount } from "@/lib/format";
import { categoryIcon, useFinance } from "./ui-bits";

interface OpenOpts { type?: TxType; date?: string }
const QuickAddCtx = createContext<{ open: (o?: OpenOpts) => void } | null>(null);

export function useQuickAdd() {
  const ctx = useContext(QuickAddCtx);
  if (!ctx) throw new Error("useQuickAdd outside provider");
  return ctx;
}

const NONE = "__none__";

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; opts: OpenOpts }>({ open: false, opts: {} });
  const open = useCallback((opts: OpenOpts = {}) => setState({ open: true, opts }), []);
  const value = useMemo(() => ({ open }), [open]);
  return (
    <QuickAddCtx.Provider value={value}>
      {children}
      <QuickAddDialog
        open={state.open}
        opts={state.opts}
        onOpenChange={(o) => setState((s) => ({ ...s, open: o }))}
      />
    </QuickAddCtx.Provider>
  );
}

const TYPES: { value: TxType; label: string }[] = [
  { value: "expense", label: "Gasto" },
  { value: "income", label: "Ganho" },
  { value: "transfer", label: "Transferir" },
];

function QuickAddDialog({ open, opts, onOpenChange }: { open: boolean; opts: OpenOpts; onOpenChange: (o: boolean) => void }) {
  const state = useFinance();
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [accountId, setAccountId] = useState<string>(NONE);
  const [toAccountId, setToAccountId] = useState<string>(NONE);
  const [date, setDate] = useState<string>(toISODate(new Date()));

  const movable = state.accounts.filter((a) => a.kind !== "investimento" || type === "transfer");
  const defaultAccount = state.accounts.find((a) => a.kind === "corrente")?.id ?? NONE;

  useEffect(() => {
    if (open) {
      const t = opts.type ?? "expense";
      setType(t);
      setAmount("");
      setDescription("");
      setCategory(t === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
      setAccountId(defaultAccount);
      setToAccountId(NONE);
      setDate(opts.date ?? toISODate(new Date()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, opts]);

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function changeType(t: TxType) {
    setType(t);
    if (t === "income") setCategory(INCOME_CATEGORIES[0]);
    if (t === "expense") setCategory(EXPENSE_CATEGORIES[0]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseAmount(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    if (type === "transfer") {
      if (accountId === NONE || toAccountId === NONE || accountId === toAccountId) {
        toast.error("Escolha duas contas diferentes para transferir.");
        return;
      }
    }
    financeActions.addTransaction({
      type,
      amount: value,
      description: description.trim() || (type === "transfer" ? "Transferência" : category),
      category: type === "transfer" ? "Transferência" : category,
      accountId: accountId === NONE ? null : accountId,
      toAccountId: type === "transfer" ? toAccountId : null,
      date,
    });
    toast.success(type === "income" ? "Ganho registrado" : type === "expense" ? "Gasto registrado" : "Transferência registrada");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[92dvh] overflow-y-auto rounded-3xl border-border bg-popover sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Novo lançamento</DialogTitle>
          <DialogDescription>Registre em segundos — o saldo da conta se atualiza sozinho.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-3 gap-1 rounded-full bg-muted p-1">
            {TYPES.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => changeType(t.value)}
                className={cn(
                  "rounded-full py-2 text-sm font-semibold transition-all",
                  type === t.value ? "bg-kaiser text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qa-amount">Valor</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="qa-amount"
                autoFocus
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="tabular h-14 rounded-2xl pl-12 font-display text-2xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="qa-desc">Descrição</Label>
            <Input id="qa-desc" placeholder={type === "expense" ? "Ex.: Lanche na padaria" : type === "income" ? "Ex.: Salário" : "Ex.: Reserva para o mês"} value={description} onChange={(e) => setDescription(e.target.value)} className="h-11 rounded-xl" />
          </div>

          {type !== "transfer" && (
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const Icon = categoryIcon(c);
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCategory(c)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        category === c ? "border-primary bg-primary/20 text-foreground shadow-glow" : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" /> {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className={cn("grid gap-3", type === "transfer" ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
            <div className="min-w-0 space-y-1.5">
              <Label>{type === "transfer" ? "De" : type === "income" ? "Entrou em" : "Saiu de"}</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {type !== "transfer" && <SelectItem value={NONE}>Não especificado</SelectItem>}
                  {movable.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {type === "transfer" && (
              <div className="min-w-0 space-y-1.5">
                <Label>Para</Label>
                <Select value={toAccountId} onValueChange={setToAccountId}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Escolha" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE} disabled>Escolha</SelectItem>
                    {state.accounts.filter((a) => a.id !== accountId).map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className={cn("min-w-0 space-y-1.5", type === "transfer" && "col-span-2")}>
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="h-11 w-full justify-start rounded-xl font-normal">
                    <CalendarIcon className="h-4 w-4" />
                    {format(parseISO(date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={parseISO(date)}
                    onSelect={(d) => d && setDate(toISODate(d))}
                    autoFocus
                    className={cn("pointer-events-auto p-3")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button type="submit" className="bg-kaiser h-12 w-full rounded-2xl text-base font-semibold shadow-glow">
            Salvar lançamento
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { toISODate, validateTransaction } from "@/lib/finance/logic";
import type { Transaction, TransactionInput, TxType } from "@/lib/finance/types";
import { formatNumber, parseAmount } from "@/lib/format";
import { categoryIcon, useFinance } from "./ui-bits";

/** Pass `tx` to edit an existing transaction instead of creating a new one. */
interface OpenOpts { type?: TxType; date?: string; tx?: Transaction }
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

  const editing = opts.tx;
  const isSeed = !!editing?.seed;
  const movable = state.accounts.filter((a) => a.kind !== "investimento" || type === "transfer" || a.id === editing?.accountId);
  const defaultAccount = state.accounts.find((a) => a.id === "nubank")?.id ?? state.accounts.find((a) => a.kind === "corrente")?.id ?? NONE;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(formatNumber(editing.amount));
      setDescription(editing.description);
      setCategory(editing.category);
      setAccountId(editing.accountId ?? NONE);
      setToAccountId(editing.toAccountId ?? NONE);
      setDate(editing.date ?? toISODate(new Date()));
      return;
    }
    const t = opts.type ?? "expense";
    setType(t);
    setAmount("");
    setDescription("");
    setCategory(t === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setAccountId(defaultAccount);
    setToAccountId(NONE);
    setDate(opts.date ?? toISODate(new Date()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, opts]);

  const baseCategories: readonly string[] = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  // Keep a custom/old category of the edited transaction selectable.
  const categories = editing && type === editing.type && !baseCategories.includes(editing.category) && editing.category !== "Transferência"
    ? [editing.category, ...baseCategories]
    : baseCategories;

  function changeType(t: TxType) {
    setType(t);
    if (t === "income") setCategory(INCOME_CATEGORIES[0]);
    if (t === "expense") setCategory(EXPENSE_CATEGORIES[0]);
    if (t !== "transfer" && accountId !== NONE && state.accounts.find((a) => a.id === accountId)?.kind === "investimento" && accountId !== editing?.accountId) {
      setAccountId(defaultAccount);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input: TransactionInput = {
      type,
      amount: parseAmount(amount),
      description: description.trim() || (type === "transfer" ? "Transferência" : category),
      category: type === "transfer" ? "Transferência" : category,
      accountId: accountId === NONE ? null : accountId,
      toAccountId: type === "transfer" && toAccountId !== NONE ? toAccountId : null,
      date,
    };
    const error = validateTransaction(input, state, { seed: isSeed });
    if (error) {
      toast.error(error);
      return;
    }
    if (editing) {
      financeActions.updateTransaction(editing.id, input);
      toast.success("Lançamento atualizado");
    } else {
      financeActions.addTransaction(input);
      toast.success(type === "income" ? "Ganho registrado" : type === "expense" ? "Gasto registrado" : "Transferência registrada");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[92dvh] overflow-y-auto rounded-3xl border-border bg-popover sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{editing ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          <DialogDescription>
            {isSeed
              ? "Histórico inicial: já está refletido nos saldos de abertura, então a edição muda só os totais e gráficos."
              : editing
                ? "Ajuste o que precisar — saldos e patrimônio se recalculam na hora."
                : "Registre em segundos — o saldo da conta se atualiza sozinho."}
          </DialogDescription>
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
                  {isSeed && type !== "transfer" && <SelectItem value={NONE}>Não especificado</SelectItem>}
                  {!isSeed && accountId === NONE && <SelectItem value={NONE} disabled>Escolha a conta</SelectItem>}
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
            {!isSeed && (
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
            )}
          </div>

          <Button type="submit" className="bg-kaiser h-12 w-full rounded-2xl text-base font-semibold shadow-glow">
            {editing ? "Salvar alterações" : "Salvar lançamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

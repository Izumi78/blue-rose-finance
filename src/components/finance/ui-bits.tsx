import type { ReactNode } from "react";
import {
  ArrowLeftRight, BookOpen, Briefcase, Bus, Car, Circle, Gift, HandCoins, HeartPulse, Home, Landmark,
  Repeat, Scissors, ShoppingCart, Smartphone, Sparkles, TrendingUp, Undo2, UtensilsCrossed, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceStore } from "@/lib/finance/store";
import type { CardTheme, FinanceState, Transaction } from "@/lib/finance/types";
import { formatBRL } from "@/lib/format";

export function useFinance(): FinanceState {
  const s = useFinanceStore();
  if (!s) throw new Error("useFinance must be used inside the hydrated app shell");
  return s;
}

const ICONS: Record<string, LucideIcon> = {
  "Alimentação e Lazer": UtensilsCrossed,
  "Mercado / Comércio": ShoppingCart,
  Transporte: Bus,
  "Educação / Habilitação": Car,
  "Faculdade / Materiais": BookOpen,
  "Cuidados Pessoais": Scissors,
  Presentes: Gift,
  Assinaturas: Repeat,
  "Empréstimos Concedidos": HandCoins,
  Saúde: HeartPulse,
  Casa: Home,
  Salário: Briefcase,
  Depósito: Landmark,
  "Ganho extra": Sparkles,
  Venda: Smartphone,
  Presente: Gift,
  "Vale Transporte": Bus,
  Devolução: Undo2,
  Rendimento: TrendingUp,
  Transferência: ArrowLeftRight,
};

export function categoryIcon(category: string): LucideIcon {
  return ICONS[category] ?? Circle;
}

export const CARD_THEME_CLASS: Record<CardTheme, string> = {
  royal: "card-royal",
  kaiser: "card-kaiser",
  abyss: "card-abyss",
  neon: "card-neon",
  rose: "card-rose",
};

export const CHART_COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)",
  "var(--neon)", "var(--royal)", "var(--muted-foreground)",
];

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("glass rounded-3xl p-5", className)}>
      {(title || action) && (
        <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="truncate text-base font-medium">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function accountName(state: FinanceState, id: string | null | undefined) {
  if (!id) return "Não especificado";
  return state.accounts.find((a) => a.id === id)?.name ?? "Conta removida";
}

export function TxRow({ tx, state, onClick, trailing }: { tx: Transaction; state: FinanceState; onClick?: () => void; trailing?: ReactNode }) {
  const Icon = categoryIcon(tx.type === "transfer" ? "Transferência" : tx.category);
  const sign = tx.type === "income" ? "+" : tx.type === "expense" ? "−" : "";
  const sub =
    tx.type === "transfer"
      ? `${accountName(state, tx.accountId)} → ${accountName(state, tx.toAccountId)}`
      : `${tx.category} · ${accountName(state, tx.accountId)}`;
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className="glass-strong grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-accent/40"
    >
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full border", tx.type === "income" ? "border-success/30 text-success" : tx.type === "expense" ? "border-primary/30 text-neon" : "border-royal/40 text-royal")}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{tx.description}</span>
        <span className="block truncate text-xs text-muted-foreground">{sub}</span>
      </span>
      <span className="flex items-center gap-2">
        <span className={cn("tabular text-sm font-bold", tx.type === "income" && "text-success", tx.type === "transfer" && "text-muted-foreground")}>
          {sign} {formatBRL(tx.amount)}
        </span>
        {trailing}
      </span>
    </Comp>
  );
}

export function LevelDot({ level, className }: { level: "safe" | "medium" | "high"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full",
        level === "safe" && "bg-success shadow-[0_0_8px_var(--success)]",
        level === "medium" && "bg-warning shadow-[0_0_8px_var(--warning)]",
        level === "high" && "bg-danger shadow-[0_0_8px_var(--danger)]",
        className,
      )}
    />
  );
}

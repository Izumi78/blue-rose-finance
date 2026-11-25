import { addMonths, format, parseISO, setDate, getDaysInMonth, isBefore } from "date-fns";
import { OPENING_ADJUSTMENT } from "./seed";
import type { Account, AccountKind, FinanceState, Subscription, Transaction, TransactionInput } from "./types";

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const toISODate = (d: Date) => format(d, "yyyy-MM-dd");

/** Daily spending limits (R$) for the calendar dots. */
export const SPEND_LIMITS = { safe: 30, medium: 100 } as const;
export type SpendLevel = "safe" | "medium" | "high";

/** Green up to R$30 (inclusive), orange up to R$100 (inclusive), red above. */
export function spendLevel(expense: number): SpendLevel {
  if (expense <= SPEND_LIMITS.safe) return "safe";
  if (expense <= SPEND_LIMITS.medium) return "medium";
  return "high";
}

export function accountBalance(state: FinanceState, accountId: string): number {
  const acc = state.accounts.find((a) => a.id === accountId);
  if (!acc) return 0;
  let bal = acc.initialBalance;
  for (const t of state.transactions) {
    if (t.seed) continue;
    if (t.type === "income" && t.accountId === accountId) bal += t.amount;
    if (t.type === "expense" && t.accountId === accountId) bal -= t.amount;
    if (t.type === "transfer") {
      if (t.accountId === accountId) bal -= t.amount;
      if (t.toAccountId === accountId) bal += t.amount;
    }
  }
  return round2(bal);
}

export interface Position {
  corrente: number;
  reservado: number;
  receber: number;
  investimento: number;
  /** Opening reconciliation adjustment not yet allocated to an account. */
  ajuste: number;
  total: number;
}

export function position(state: FinanceState): Position {
  const ajuste = state.openingAdjustment ?? 0;
  const p: Position = { corrente: 0, reservado: 0, receber: 0, investimento: 0, ajuste, total: ajuste };
  for (const a of state.accounts) {
    const b = accountBalance(state, a.id);
    p[a.kind] += b;
    p.total += b;
  }
  (Object.keys(p) as (keyof Position)[]).forEach((k) => (p[k] = round2(p[k])));
  return p;
}

/** "Dinheiro livre" is only the Nubank balance — never the sum of all current accounts. */
export const FREE_MONEY_ACCOUNT_ID = "nubank";

export function freeMoney(state: FinanceState): { account: Account; balance: number } | null {
  const account = state.accounts.find((a) => a.id === FREE_MONEY_ACCOUNT_ID);
  return account ? { account, balance: accountBalance(state, account.id) } : null;
}

/**
 * Upgrades a stored state. Adds the opening adjustment exactly once: a state that already
 * has the field (even 0 after allocation) is returned untouched. null = not a valid v1 state.
 */
export function migrateState(raw: unknown): { state: FinanceState; migrated: boolean } | null {
  if (!raw || typeof raw !== "object" || (raw as { version?: unknown }).version !== 1) return null;
  const s = raw as FinanceState;
  if (typeof s.openingAdjustment === "number" && Number.isFinite(s.openingAdjustment)) return { state: s, migrated: false };
  return { state: { ...s, openingAdjustment: OPENING_ADJUSTMENT }, migrated: true };
}

/** Moves the unallocated adjustment into an account. Net worth does not change. */
export function allocateAdjustment(state: FinanceState, accountId: string): FinanceState {
  const adj = state.openingAdjustment ?? 0;
  if (!adj || !state.accounts.some((a) => a.id === accountId)) return state;
  return {
    ...state,
    openingAdjustment: 0,
    accounts: state.accounts.map((a) => (a.id === accountId ? { ...a, initialBalance: round2(a.initialBalance + adj) } : a)),
  };
}

/** Returns an error message (pt-BR) or null when the transaction can be saved. */
export function validateTransaction(input: TransactionInput, state: FinanceState, opts: { seed?: boolean } = {}): string | null {
  if (!Number.isFinite(input.amount) || input.amount <= 0) return "Informe um valor maior que zero.";
  const exists = (id: string | null | undefined) => !!id && state.accounts.some((a) => a.id === id);
  if (input.type === "transfer") {
    if (!exists(input.accountId) || !exists(input.toAccountId) || input.accountId === input.toAccountId) {
      return "Escolha duas contas diferentes para transferir.";
    }
    return null;
  }
  if (opts.seed) return null;
  if (!exists(input.accountId)) return "Escolha a conta do lançamento.";
  return null;
}

/**
 * Edits a transaction in place: keeps id, createdAt and subscription link. Seed history stays
 * seed (date null) so it never changes balances and is never counted twice.
 */
export function editTransaction(state: FinanceState, id: string, input: TransactionInput): FinanceState {
  const cur = state.transactions.find((t) => t.id === id);
  if (!cur) return state;
  const next: Transaction = {
    ...cur,
    type: input.type,
    amount: round2(input.amount),
    description: input.description,
    category: input.category,
    accountId: input.accountId,
    toAccountId: input.type === "transfer" ? (input.toAccountId ?? null) : null,
    date: cur.seed ? null : input.date,
    id: cur.id,
    createdAt: cur.createdAt,
  };
  if (cur.seed) next.seed = true;
  return { ...state, transactions: state.transactions.map((t) => (t.id === id ? next : t)) };
}

export function accountsByKind(state: FinanceState, kind: AccountKind): Account[] {
  return state.accounts.filter((a) => a.kind === kind);
}

export function totals(state: FinanceState) {
  let income = 0;
  let expense = 0;
  for (const t of state.transactions) {
    if (t.type === "income") income += t.amount;
    if (t.type === "expense") expense += t.amount;
  }
  return { income: round2(income), expense: round2(expense) };
}

export interface CategorySlice {
  category: string;
  amount: number;
  count: number;
  pct: number;
}

export function expenseByCategory(state: FinanceState): CategorySlice[] {
  const map = new Map<string, { amount: number; count: number }>();
  let total = 0;
  for (const t of state.transactions) {
    if (t.type !== "expense") continue;
    total += t.amount;
    const cur = map.get(t.category) ?? { amount: 0, count: 0 };
    cur.amount += t.amount;
    cur.count += 1;
    map.set(t.category, cur);
  }
  return [...map.entries()]
    .map(([category, v]) => ({
      category,
      amount: round2(v.amount),
      count: v.count,
      pct: total > 0 ? (v.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function diagnosis(state: FinanceState) {
  const { expense } = totals(state);
  const expenses = state.transactions.filter((t) => t.type === "expense");
  const biggest = expenses.reduce<Transaction | null>((m, t) => (!m || t.amount > m.amount ? t : m), null);
  const slices = expenseByCategory(state);
  const recurring = [...slices]
    .filter((s) => !biggest || s.category !== biggest.category)
    .sort((a, b) => b.count - a.count || b.amount - a.amount)[0];
  const reserved = accountsByKind(state, "reservado");
  return {
    biggest: biggest
      ? { description: biggest.description, category: biggest.category, amount: biggest.amount, pct: expense > 0 ? (biggest.amount / expense) * 100 : 0 }
      : null,
    recurring: recurring ?? null,
    reserved: reserved.map((a) => ({ name: a.name, balance: accountBalance(state, a.id) })),
  };
}

export function dayTransactions(state: FinanceState, date: string): Transaction[] {
  return state.transactions
    .filter((t) => t.date === date)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function dayTotals(state: FinanceState, date: string) {
  let income = 0;
  let expense = 0;
  for (const t of state.transactions) {
    if (t.date !== date) continue;
    if (t.type === "income") income += t.amount;
    if (t.type === "expense") expense += t.amount;
  }
  return { income: round2(income), expense: round2(expense) };
}

/** A day is counted from the day the app started until today (inclusive). */
export function isCountedDay(date: string, startDate: string, today: string): boolean {
  return date >= startDate && date <= today;
}

export interface FlowBucket {
  key: string;
  label: string;
  income: number;
  expense: number;
}

export function monthlyFlow(state: FinanceState, today: string): FlowBucket[] {
  const buckets: FlowBucket[] = [];
  const seedIn = state.transactions.filter((t) => t.seed && t.type === "income").reduce((s, t) => s + t.amount, 0);
  const seedOut = state.transactions.filter((t) => t.seed && t.type === "expense").reduce((s, t) => s + t.amount, 0);
  if (seedIn || seedOut) buckets.push({ key: "hist", label: "Histórico", income: round2(seedIn), expense: round2(seedOut) });

  let cursor = parseISO(state.startDate.slice(0, 7) + "-01");
  const end = parseISO(today.slice(0, 7) + "-01");
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  while (!isBefore(end, cursor)) {
    const key = format(cursor, "yyyy-MM");
    let income = 0;
    let expense = 0;
    for (const t of state.transactions) {
      if (!t.date || !t.date.startsWith(key)) continue;
      if (t.type === "income") income += t.amount;
      if (t.type === "expense") expense += t.amount;
    }
    buckets.push({ key, label: months[cursor.getMonth()] ?? "", income: round2(income), expense: round2(expense) });
    cursor = addMonths(cursor, 1);
  }
  return buckets.slice(-6);
}

/** Next billing date (yyyy-MM-dd) on or after `today`. Days past the month's end fall on its last day. */
export function nextChargeDate(sub: Subscription, today: string): string {
  const t = parseISO(today);
  const inMonth = (d: Date) => setDate(d, Math.min(sub.billingDay, getDaysInMonth(d)));
  let candidate = inMonth(t);
  if (toISODate(candidate) < today) candidate = inMonth(addMonths(setDate(t, 1), 1));
  return toISODate(candidate);
}

export function isBillingDay(sub: Subscription, date: string): boolean {
  const d = parseISO(date);
  return d.getDate() === Math.min(sub.billingDay, getDaysInMonth(d));
}

export function monthlySubscriptions(state: FinanceState): number {
  return round2(state.subscriptions.filter((s) => s.active).reduce((s, x) => s + x.amount, 0));
}

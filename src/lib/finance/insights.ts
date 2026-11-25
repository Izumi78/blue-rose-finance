/**
 * Pure, read-only analytics for Blue Rose AI. Nothing here changes balances or state:
 * every function derives numbers from what the user registered in the app.
 */
import { differenceInCalendarDays, format, getDaysInMonth, parseISO, subDays } from "date-fns";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "./categories";
import { freeMoney, nextChargeDate, round2, type CategorySlice } from "./logic";
import type { Budget, Goal, PlannerState } from "./planner";
import type { FinanceState, Transaction } from "./types";
import { formatBRL, formatPct } from "@/lib/format";

export type PeriodKey = "month" | "7d" | "30d" | "historico" | "all";

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "month", label: "Este mês" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "historico", label: "Histórico inicial" },
  { key: "all", label: "Tudo" },
];

const monthOf = (d: string) => d.slice(0, 7);

/** Whether a transaction falls in the period. Seed history (no date) only counts in "historico" and "all". */
export function inPeriod(t: Transaction, key: PeriodKey, today: string): boolean {
  if (key === "all") return true;
  if (key === "historico") return !!t.seed;
  if (!t.date || t.date > today) return false;
  if (key === "month") return monthOf(t.date) === monthOf(today);
  const days = key === "7d" ? 7 : 30;
  return t.date >= format(subDays(parseISO(today), days - 1), "yyyy-MM-dd");
}

function slices(txs: Transaction[]): CategorySlice[] {
  const map = new Map<string, { amount: number; count: number }>();
  let total = 0;
  for (const t of txs) {
    total += t.amount;
    const cur = map.get(t.category) ?? { amount: 0, count: 0 };
    cur.amount += t.amount;
    cur.count += 1;
    map.set(t.category, cur);
  }
  return [...map.entries()]
    .map(([category, v]) => ({ category, amount: round2(v.amount), count: v.count, pct: total > 0 ? (v.amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

export interface PeriodReport {
  key: PeriodKey;
  income: number;
  expense: number;
  net: number;
  count: number;
  expenseCategories: CategorySlice[];
  incomeCategories: CategorySlice[];
}

/** Income/expense of a period, split by category. Transfers are excluded (they don't change net worth). */
export function periodReport(state: FinanceState, key: PeriodKey, today: string): PeriodReport {
  const txs = state.transactions.filter((t) => t.type !== "transfer" && inPeriod(t, key, today));
  const exp = txs.filter((t) => t.type === "expense");
  const inc = txs.filter((t) => t.type === "income");
  const expense = round2(exp.reduce((s, t) => s + t.amount, 0));
  const income = round2(inc.reduce((s, t) => s + t.amount, 0));
  return { key, income, expense, net: round2(income - expense), count: txs.length, expenseCategories: slices(exp), incomeCategories: slices(inc) };
}

export type Confidence = "baixa" | "média" | "alta";

export interface MonthProjection {
  month: string;
  /** First day counted this month: the 1st, or the day the app started if later. */
  trackingStart: string;
  daysElapsed: number;
  daysInMonth: number;
  /** Days after today until the end of the month. */
  daysRemaining: number;
  spentSoFar: number;
  avgDaily: number;
  projectedRemaining: number;
  projectedTotal: number;
  /** Active subscriptions still due this month (known commitments, not part of the average). */
  pendingSubscriptions: number;
  pendingSubscriptionCount: number;
  confidence: Confidence;
}

/** Subscriptions due later this month that were not launched yet. */
function pendingSubs(state: FinanceState, today: string) {
  const month = monthOf(today);
  const due = state.subscriptions.filter((s) => s.active && s.lastChargedMonth !== month && monthOf(nextChargeDate(s, today)) === month);
  return { amount: round2(due.reduce((s, x) => s + x.amount, 0)), count: due.length };
}

/**
 * Method: average daily spending registered since the start of the month (or since the app
 * started, if later) × days remaining. It is an estimate, never a certainty.
 */
export function monthProjection(state: FinanceState, today: string): MonthProjection {
  const month = monthOf(today);
  const monthStart = `${month}-01`;
  const trackingStart = state.startDate > monthStart ? state.startDate : monthStart;
  const daysElapsed = Math.max(1, differenceInCalendarDays(parseISO(today), parseISO(trackingStart)) + 1);
  const daysInMonth = getDaysInMonth(parseISO(today));
  const daysRemaining = daysInMonth - parseISO(today).getDate();
  const spentSoFar = round2(
    state.transactions
      .filter((t) => t.type === "expense" && !!t.date && t.date >= trackingStart && t.date <= today)
      .reduce((s, t) => s + t.amount, 0),
  );
  const avgDaily = round2(spentSoFar / daysElapsed);
  const projectedRemaining = round2((spentSoFar / daysElapsed) * daysRemaining);
  const pending = pendingSubs(state, today);
  return {
    month,
    trackingStart,
    daysElapsed,
    daysInMonth,
    daysRemaining,
    spentSoFar,
    avgDaily,
    projectedRemaining,
    projectedTotal: round2(spentSoFar + projectedRemaining),
    pendingSubscriptions: pending.amount,
    pendingSubscriptionCount: pending.count,
    confidence: daysElapsed < 7 ? "baixa" : daysElapsed < 14 ? "média" : "alta",
  };
}

export interface SpendingAllowance {
  free: number;
  pendingSubscriptions: number;
  available: number;
  /** Days left including today. */
  daysLeft: number;
  perDay: number;
}

/** (Dinheiro livre − assinaturas previstas no mês) ÷ dias restantes incluindo hoje. null without the free-money account. */
export function spendingAllowance(state: FinanceState, today: string): SpendingAllowance | null {
  const free = freeMoney(state);
  if (!free) return null;
  const pending = pendingSubs(state, today).amount;
  const daysLeft = getDaysInMonth(parseISO(today)) - parseISO(today).getDate() + 1;
  const available = round2(free.balance - pending);
  return { free: free.balance, pendingSubscriptions: pending, available, daysLeft, perDay: available > 0 ? round2(available / daysLeft) : 0 };
}

export type BudgetLevel = "ok" | "atencao" | "estourado";

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  pct: number;
  level: BudgetLevel;
}

/** Spending this month (dated expenses) against each category budget. ≥80% = atenção, >100% = estourado. */
export function budgetStatuses(state: FinanceState, planner: PlannerState, today: string): BudgetStatus[] {
  const month = monthOf(today);
  return planner.budgets.map((budget) => {
    const spent = round2(
      state.transactions
        .filter((t) => t.type === "expense" && t.category === budget.category && !!t.date && monthOf(t.date) === month && t.date <= today)
        .reduce((s, t) => s + t.amount, 0),
    );
    const pct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    return { budget, spent, remaining: round2(budget.limit - spent), pct, level: pct > 100 ? "estourado" : pct >= 80 ? "atencao" : "ok" };
  });
}

export interface GoalStatus {
  goal: Goal;
  pct: number;
  remaining: number;
  done: boolean;
  overdue: boolean;
  /** Amount to save per month/week to reach the target by the deadline (null without deadline). */
  perMonth: number | null;
  perWeek: number | null;
}

export function goalStatus(goal: Goal, today: string): GoalStatus {
  const remaining = round2(Math.max(0, goal.target - goal.saved));
  const done = remaining === 0;
  const pct = goal.target > 0 ? Math.min(100, (goal.saved / goal.target) * 100) : 0;
  if (!goal.deadline) return { goal, pct, remaining, done, overdue: false, perMonth: null, perWeek: null };
  const days = differenceInCalendarDays(parseISO(goal.deadline), parseISO(today));
  const overdue = !done && days < 0;
  if (done || overdue) return { goal, pct, remaining, done, overdue, perMonth: null, perWeek: null };
  const weeks = Math.max(1, Math.ceil((days + 1) / 7));
  const months = Math.max(1, Math.ceil((days + 1) / 30.44));
  return { goal, pct, remaining, done, overdue, perMonth: round2(remaining / months), perWeek: round2(remaining / weeks) };
}

/** Categories where spending is usually a choice — the only ones we suggest cutting. */
export const DISCRETIONARY = ["Alimentação e Lazer", "Presentes", "Cuidados Pessoais", "Assinaturas", "Outros"];
export const SUGGESTED_CUT = 0.2;

export interface SavingsSuggestion {
  id: string;
  title: string;
  /** Why, quoting the registered numbers. */
  justification: string;
  /** Estimated amount freed (R$), when it can be computed. */
  estimate: number | null;
}

export function savingsSuggestions(state: FinanceState, planner: PlannerState, today: string): SavingsSuggestion[] {
  const out: SavingsSuggestion[] = [];
  const all = periodReport(state, "all", today);

  for (const s of budgetStatuses(state, planner, today)) {
    if (s.level === "ok") continue;
    out.push({
      id: `budget-${s.budget.category}`,
      title: s.level === "estourado" ? `Orçamento de ${s.budget.category} estourado` : `Orçamento de ${s.budget.category} perto do limite`,
      justification: `Neste mês você registrou ${formatBRL(s.spent)} de um limite de ${formatBRL(s.budget.limit)} (${formatPct(s.pct)}).`,
      estimate: s.level === "estourado" ? round2(s.spent - s.budget.limit) : null,
    });
  }

  for (const c of all.expenseCategories.filter((x) => DISCRETIONARY.includes(x.category)).slice(0, 2)) {
    const estimate = round2(c.amount * SUGGESTED_CUT);
    if (estimate <= 0) continue;
    out.push({
      id: `cut-${c.category}`,
      title: `Reduzir ${Math.round(SUGGESTED_CUT * 100)}% em ${c.category}`,
      justification: `Você registrou ${c.count} lançamento${c.count === 1 ? "" : "s"} somando ${formatBRL(c.amount)} em ${c.category} (${formatPct(c.pct)} das saídas). Cortar ${Math.round(SUGGESTED_CUT * 100)}% liberaria cerca de ${formatBRL(estimate)} no mesmo período.`,
      estimate,
    });
  }

  const subs = state.subscriptions.filter((s) => s.active);
  if (subs.length > 0) {
    const monthly = round2(subs.reduce((s, x) => s + x.amount, 0));
    out.push({
      id: "subs",
      title: "Revisar assinaturas",
      justification: `${subs.length} assinatura${subs.length === 1 ? "" : "s"} ativa${subs.length === 1 ? "" : "s"} somam ${formatBRL(monthly)} por mês (${formatBRL(round2(monthly * 12))} por ano). Cancelar uma que você pouco usa libera o valor todo mês.`,
      estimate: null,
    });
  }

  const biggest = state.transactions.filter((t) => t.type === "expense").reduce<Transaction | null>((m, t) => (!m || t.amount > m.amount ? t : m), null);
  if (biggest && all.expense > 0 && biggest.amount / all.expense > 0.3) {
    out.push({
      id: "big",
      title: "Planejar gastos grandes com antecedência",
      justification: `Um único gasto em ${biggest.category} (${formatBRL(biggest.amount)}) concentra ${formatPct((biggest.amount / all.expense) * 100)} das saídas registradas. Separar um valor por mês antes de gastos desse porte evita apertos.`,
      estimate: null,
    });
  }

  const loans = all.expenseCategories.find((c) => c.category === "Empréstimos Concedidos");
  if (loans && loans.amount > 0) {
    out.push({
      id: "loans",
      title: "Combinar a devolução dos empréstimos",
      justification: `Você registrou ${formatBRL(loans.amount)} em empréstimos concedidos. Combinar uma data de devolução ajuda a planejar o caixa.`,
      estimate: null,
    });
  }
  return out;
}

export interface PlanItem {
  id: string;
  title: string;
  detail: string;
}

/** Up to 6 concrete actions for the next 7 days, each derived from registered data. */
export function weeklyPlan(state: FinanceState, planner: PlannerState, today: string): PlanItem[] {
  const items: PlanItem[] = [];
  const allowance = spendingAllowance(state, today);
  if (allowance) {
    items.push(
      allowance.available > 0
        ? {
            id: "daily",
            title: `Gastar até ${formatBRL(allowance.perDay)} por dia (${formatBRL(round2(allowance.perDay * Math.min(7, allowance.daysLeft)))} na semana)`,
            detail: `Estimativa: dinheiro livre ${formatBRL(allowance.free)} − assinaturas previstas ${formatBRL(allowance.pendingSubscriptions)}, dividido por ${allowance.daysLeft} dia${allowance.daysLeft === 1 ? "" : "s"} até o fim do mês.`,
          }
        : {
            id: "daily",
            title: "Segurar gastos não essenciais nesta semana",
            detail: `O dinheiro livre registrado (${formatBRL(allowance.free)}) não cobre as assinaturas previstas (${formatBRL(allowance.pendingSubscriptions)}).`,
          },
    );
  }

  for (const s of budgetStatuses(state, planner, today).filter((x) => x.level !== "ok").slice(0, 2)) {
    items.push({
      id: `b-${s.budget.category}`,
      title: s.level === "estourado" ? `Pausar gastos em ${s.budget.category}` : `Ir devagar em ${s.budget.category}`,
      detail: `Gasto no mês: ${formatBRL(s.spent)} de ${formatBRL(s.budget.limit)}.`,
    });
  }

  for (const g of planner.goals.map((x) => goalStatus(x, today)).filter((x) => !x.done && x.perWeek).slice(0, 2)) {
    items.push({
      id: `g-${g.goal.id}`,
      title: `Guardar ${formatBRL(g.perWeek ?? 0)} para “${g.goal.name}”`,
      detail: `Faltam ${formatBRL(g.remaining)} até o prazo — valor semanal para chegar lá.`,
    });
  }

  const top = periodReport(state, "all", today).expenseCategories.find((c) => DISCRETIONARY.includes(c.category));
  if (top && !planner.budgets.some((b) => b.category === top.category)) {
    items.push({
      id: "budget-top",
      title: `Criar um orçamento para ${top.category}`,
      detail: `É a categoria opcional com mais gastos registrados (${formatBRL(top.amount)}, ${top.count} lançamento${top.count === 1 ? "" : "s"}).`,
    });
  }

  const weekEnd = format(subDays(parseISO(today), -6), "yyyy-MM-dd");
  for (const s of state.subscriptions.filter((x) => x.active)) {
    const next = nextChargeDate(s, today);
    if (next <= weekEnd && s.lastChargedMonth !== monthOf(next)) {
      items.push({ id: `s-${s.id}`, title: `Reservar ${formatBRL(s.amount)} para ${s.name}`, detail: `Cobrança prevista em ${format(parseISO(next), "dd/MM")}.` });
    }
  }

  items.push({ id: "log", title: "Registrar cada gasto no mesmo dia", detail: "Assim o calendário, a projeção e as análises ficam fiéis ao que acontece." });
  return items.slice(0, 6);
}

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const EXPENSE_RULES: [RegExp, (typeof EXPENSE_CATEGORIES)[number]][] = [
  [/netflix|spotify|assinatura|gemini|chatgpt|prime video|disney|youtube|icloud|canva|crunchyroll/, "Assinaturas"],
  [/empresti/, "Empréstimos Concedidos"],
  [/autoescola|habilita|\bcnh\b|curso|aula/, "Educação / Habilitação"],
  [/faculdade|material|apostila|xerox|impress|acetato|lampada|bocal/, "Faculdade / Materiais"],
  [/lanche|pizza|cafe|padaria|restaurante|ifood|hamburg|acai|cacau|sorvete|cinema|lazer|bar\b|almoco|jantar/, "Alimentação e Lazer"],
  [/mercado|feira|atacad|comercio|hortifruti/, "Mercado / Comércio"],
  [/uber|\b99\b|onibus|passagem|recarga|metro|gasolina|combustivel|estacionamento|transporte/, "Transporte"],
  [/cabelo|barbe|salao|perfume|cosmetic|higiene|manicure/, "Cuidados Pessoais"],
  [/presente|aniversario|sacola/, "Presentes"],
  [/farmacia|remedio|medic|consulta|dentista|saude|exame/, "Saúde"],
  [/aluguel|conta de luz|energia|agua|internet|condominio|\bgas\b/, "Casa"],
];

const INCOME_RULES: [RegExp, (typeof INCOME_CATEGORIES)[number]][] = [
  [/salario|pagamento mensal/, "Salário"],
  [/vale.?transporte|\bvt\b/, "Vale Transporte"],
  [/devolu|reembolso|estorno/, "Devolução"],
  [/rendimento|juros|cdb|tesouro|dividend/, "Rendimento"],
  [/venda|vendi/, "Venda"],
  [/presente|aniversario/, "Presente"],
  [/extra|freela|bico/, "Ganho extra"],
  [/deposito|pix/, "Depósito"],
];

/** Keyword rules (no AI). Returns the matched category and the keyword that triggered it. */
export function suggestCategoryByRules(description: string, type: "income" | "expense"): { category: string; keyword: string } | null {
  const text = fold(description);
  for (const [re, category] of type === "income" ? INCOME_RULES : EXPENSE_RULES) {
    const m = text.match(re);
    if (m) return { category, keyword: m[0] };
  }
  return null;
}

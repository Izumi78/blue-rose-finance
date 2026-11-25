import { round2 } from "./logic";

/** Monthly spending cap for one expense category. One budget per category. */
export interface Budget {
  id: string;
  category: string;
  limit: number;
}

/** Savings goal. `saved` is tracked by the user here and never moves account balances. */
export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  /** yyyy-MM-dd or null (no deadline). */
  deadline: string | null;
  createdAt: number;
}

export interface PlannerState {
  version: 1;
  budgets: Budget[];
  goals: Goal[];
}

export const PLANNER_LIMITS = { maxBudgets: 20, maxGoals: 10, nameMax: 60, maxAmount: 10_000_000 } as const;

export const emptyPlanner = (): PlannerState => ({ version: 1, budgets: [], goals: [] });

const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isAmount = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= PLANNER_LIMITS.maxAmount;

/**
 * Reads a stored planner. Keeps every well-formed budget/goal the user created; malformed
 * entries are skipped (they cannot be shown safely). null = nothing usable stored.
 */
export function migratePlanner(raw: unknown): PlannerState | null {
  if (!raw || typeof raw !== "object" || (raw as { version?: unknown }).version !== 1) return null;
  const r = raw as { budgets?: unknown; goals?: unknown };
  const budgets: Budget[] = [];
  const seen = new Set<string>();
  for (const b of Array.isArray(r.budgets) ? r.budgets : []) {
    if (!b || typeof b !== "object") continue;
    const { id, category, limit } = b as Record<string, unknown>;
    if (typeof id !== "string" || typeof category !== "string" || !isAmount(limit) || seen.has(category)) continue;
    seen.add(category);
    budgets.push({ id, category, limit });
  }
  const goals: Goal[] = [];
  for (const g of Array.isArray(r.goals) ? r.goals : []) {
    if (!g || typeof g !== "object") continue;
    const { id, name, target, saved, deadline, createdAt } = g as Record<string, unknown>;
    if (typeof id !== "string" || typeof name !== "string" || !isAmount(target) || !isAmount(saved)) continue;
    goals.push({ id, name, target, saved, deadline: isDate(deadline) ? deadline : null, createdAt: typeof createdAt === "number" ? createdAt : 0 });
  }
  return { version: 1, budgets, goals };
}

/** Returns an error message (pt-BR) or null. */
export function validateBudget(input: { category: string; limit: number }, planner: PlannerState, editingId?: string): string | null {
  if (!input.category.trim()) return "Escolha a categoria.";
  if (!Number.isFinite(input.limit) || input.limit <= 0) return "Informe um limite maior que zero.";
  if (input.limit > PLANNER_LIMITS.maxAmount) return "Limite alto demais.";
  const isNew = !editingId && !planner.budgets.some((b) => b.category === input.category);
  if (isNew && planner.budgets.length >= PLANNER_LIMITS.maxBudgets) return `Máximo de ${PLANNER_LIMITS.maxBudgets} orçamentos.`;
  return null;
}

/** Creates or updates the budget of a category — never two budgets for the same category. */
export function upsertBudget(planner: PlannerState, input: { category: string; limit: number }, newId: string): PlannerState {
  const limit = round2(input.limit);
  const existing = planner.budgets.find((b) => b.category === input.category);
  if (existing) {
    return { ...planner, budgets: planner.budgets.map((b) => (b.id === existing.id ? { ...b, limit } : b)) };
  }
  return { ...planner, budgets: [...planner.budgets, { id: newId, category: input.category, limit }] };
}

export function removeBudget(planner: PlannerState, id: string): PlannerState {
  return { ...planner, budgets: planner.budgets.filter((b) => b.id !== id) };
}

export interface GoalInput {
  name: string;
  target: number;
  saved: number;
  deadline: string | null;
}

export function validateGoal(input: GoalInput, planner: PlannerState, editingId?: string): string | null {
  const name = input.name.trim();
  if (!name) return "Dê um nome à meta.";
  if (name.length > PLANNER_LIMITS.nameMax) return `Nome com até ${PLANNER_LIMITS.nameMax} caracteres.`;
  if (!Number.isFinite(input.target) || input.target <= 0) return "Informe um valor-alvo maior que zero.";
  if (!isAmount(input.target)) return "Valor-alvo alto demais.";
  if (!Number.isFinite(input.saved) || input.saved < 0) return "O valor guardado não pode ser negativo.";
  if (!isAmount(input.saved)) return "Valor guardado alto demais.";
  if (input.deadline !== null && !isDate(input.deadline)) return "Data limite inválida.";
  if (!editingId && planner.goals.length >= PLANNER_LIMITS.maxGoals) return `Máximo de ${PLANNER_LIMITS.maxGoals} metas.`;
  return null;
}

export function addGoal(planner: PlannerState, input: GoalInput, id: string, createdAt: number): PlannerState {
  const goal: Goal = { id, name: input.name.trim(), target: round2(input.target), saved: round2(input.saved), deadline: input.deadline, createdAt };
  return { ...planner, goals: [...planner.goals, goal] };
}

export function updateGoal(planner: PlannerState, id: string, input: GoalInput): PlannerState {
  return {
    ...planner,
    goals: planner.goals.map((g) =>
      g.id === id ? { ...g, name: input.name.trim(), target: round2(input.target), saved: round2(input.saved), deadline: input.deadline } : g,
    ),
  };
}

/** Adds (or, if negative, removes) money from a goal's saved amount; never below zero. */
export function contributeToGoal(planner: PlannerState, id: string, amount: number): PlannerState {
  if (!Number.isFinite(amount) || amount === 0) return planner;
  return {
    ...planner,
    goals: planner.goals.map((g) => (g.id === id ? { ...g, saved: Math.max(0, round2(g.saved + amount)) } : g)),
  };
}

export function removeGoal(planner: PlannerState, id: string): PlannerState {
  return { ...planner, goals: planner.goals.filter((g) => g.id !== id) };
}

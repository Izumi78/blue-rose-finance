import { useSyncExternalStore } from "react";
import {
  addGoal, contributeToGoal, emptyPlanner, migratePlanner, removeBudget, removeGoal, updateGoal, upsertBudget,
  type GoalInput, type PlannerState,
} from "./planner";

/** Separate key: budgets/goals never touch the finance state or its migration. */
export const PLANNER_STORAGE_KEY = "blue-rose:planner:v1";

let state: PlannerState | null = null;
const listeners = new Set<() => void>();
const EMPTY = emptyPlanner();

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function load(): PlannerState {
  try {
    const raw = window.localStorage.getItem(PLANNER_STORAGE_KEY);
    if (raw) return migratePlanner(JSON.parse(raw)) ?? emptyPlanner();
  } catch {
    /* unreadable: start empty, persisted only on the user's next action */
  }
  return emptyPlanner();
}

function persist(next: PlannerState) {
  try {
    window.localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked */
  }
}

function getSnapshot(): PlannerState {
  if (typeof window === "undefined") return EMPTY;
  if (!state) state = load();
  return state;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PLANNER_STORAGE_KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function update(fn: (s: PlannerState) => PlannerState) {
  state = fn(getSnapshot());
  persist(state);
  listeners.forEach((l) => l());
}

export function usePlanner(): PlannerState {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export const plannerActions = {
  upsertBudget(input: { category: string; limit: number }) {
    update((s) => upsertBudget(s, input, uid()));
  },
  removeBudget(id: string) {
    update((s) => removeBudget(s, id));
  },
  addGoal(input: GoalInput) {
    update((s) => addGoal(s, input, uid(), Date.now()));
  },
  updateGoal(id: string, input: GoalInput) {
    update((s) => updateGoal(s, id, input));
  },
  contribute(id: string, amount: number) {
    update((s) => contributeToGoal(s, id, amount));
  },
  removeGoal(id: string) {
    update((s) => removeGoal(s, id));
  },
  /** Test helper: forget the in-memory copy so the next read comes from storage. */
  _resetForTests() {
    state = null;
  },
};

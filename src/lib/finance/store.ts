import { useSyncExternalStore } from "react";
import { createSeedState } from "./seed";
import { allocateAdjustment, editTransaction, migrateState, toISODate } from "./logic";
import type { Account, FinanceState, Subscription, Transaction, TransactionInput } from "./types";

const STORAGE_KEY = "blaue-rose:finance:v1";

let state: FinanceState | null = null;
const listeners = new Set<() => void>();

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function load(): FinanceState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const result = migrateState(JSON.parse(raw));
      if (result) {
        // Saved data is never discarded: only missing fields are added, then persisted once.
        if (result.migrated) persist(result.state);
        return result.state;
      }
    }
  } catch {
    /* corrupted storage: start fresh */
  }
  const fresh = createSeedState(toISODate(new Date()));
  persist(fresh);
  return fresh;
}

function persist(next: FinanceState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked */
  }
}

function getSnapshot(): FinanceState | null {
  if (typeof window === "undefined") return null;
  if (!state) state = load();
  return state;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
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

function update(fn: (s: FinanceState) => FinanceState) {
  const cur = getSnapshot();
  if (!cur) return;
  state = fn(cur);
  persist(state);
  listeners.forEach((l) => l());
}

/** null during server render / before hydration. */
export function useFinanceStore(): FinanceState | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export const financeActions = {
  addTransaction(tx: Omit<Transaction, "id" | "createdAt">) {
    update((s) => ({ ...s, transactions: [{ ...tx, id: uid(), createdAt: Date.now() }, ...s.transactions] }));
  },
  /** Edits only the editable fields; id and createdAt are preserved. */
  updateTransaction(id: string, input: TransactionInput) {
    update((s) => editTransaction(s, id, input));
  },
  /** Moves the opening reconciliation adjustment into an account (net worth unchanged). */
  allocateAdjustment(accountId: string) {
    update((s) => allocateAdjustment(s, accountId));
  },
  deleteTransaction(id: string) {
    update((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));
  },
  addAccount(acc: Omit<Account, "id">) {
    update((s) => ({ ...s, accounts: [...s.accounts, { ...acc, id: uid() }] }));
  },
  updateAccount(id: string, patch: Partial<Account>) {
    update((s) => ({ ...s, accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  },
  deleteAccount(id: string) {
    update((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== id) }));
  },
  addSubscription(sub: Omit<Subscription, "id">) {
    update((s) => ({ ...s, subscriptions: [...s.subscriptions, { ...sub, id: uid() }] }));
  },
  updateSubscription(id: string, patch: Partial<Subscription>) {
    update((s) => ({ ...s, subscriptions: s.subscriptions.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  },
  deleteSubscription(id: string) {
    update((s) => ({ ...s, subscriptions: s.subscriptions.filter((x) => x.id !== id) }));
  },
  chargeSubscription(id: string, date: string) {
    update((s) => {
      const sub = s.subscriptions.find((x) => x.id === id);
      if (!sub) return s;
      const tx: Transaction = {
        id: uid(),
        type: "expense",
        amount: sub.amount,
        description: `Assinatura · ${sub.name}`,
        category: "Assinaturas",
        accountId: sub.accountId,
        date,
        subscriptionId: sub.id,
        createdAt: Date.now(),
      };
      return {
        ...s,
        transactions: [tx, ...s.transactions],
        subscriptions: s.subscriptions.map((x) => (x.id === id ? { ...x, lastChargedMonth: date.slice(0, 7) } : x)),
      };
    });
  },
  /** Restores the initial data, including the opening reconciliation adjustment. */
  resetAll() {
    state = createSeedState(toISODate(new Date()));
    persist(state);
    listeners.forEach((l) => l());
  },
};

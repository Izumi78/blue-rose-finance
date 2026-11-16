export type AccountKind = "corrente" | "reservado" | "receber" | "investimento";
export type CardTheme = "royal" | "kaiser" | "abyss" | "neon" | "rose";
export type TxType = "income" | "expense" | "transfer";

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  /** Balance at the moment the app started tracking. Live balance = this + tracked movements. */
  initialBalance: number;
  note?: string | undefined;
  theme: CardTheme;
  last4?: string | undefined;
}

export interface Transaction {
  id: string;
  type: TxType;
  /** Always positive; the type says the direction. */
  amount: number;
  description: string;
  category: string;
  accountId: string | null;
  toAccountId?: string | null | undefined;
  /** yyyy-MM-dd. null = history registered before the app started (no exact date). */
  date: string | null;
  /** History that is already reflected in the initial balances. */
  seed?: boolean | undefined;
  subscriptionId?: string | undefined;
  createdAt: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingDay: number;
  accountId: string | null;
  category: string;
  active: boolean;
  /** yyyy-MM of the last month it was launched as an expense. */
  lastChargedMonth?: string | undefined;
}

export interface FinanceState {
  version: 1;
  startDate: string;
  accounts: Account[];
  transactions: Transaction[];
  subscriptions: Subscription[];
}

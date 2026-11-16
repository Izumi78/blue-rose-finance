import type { Account, FinanceState, Transaction } from "./types";

export const SEED_ACCOUNTS: Account[] = [
  { id: "btg", name: "BTG Banking", kind: "corrente", initialBalance: 900.46, note: "Venda do celular: 300,46 + Depósito: 600,00", theme: "abyss" },
  { id: "nubank", name: "Nubank", kind: "corrente", initialBalance: 416.9, note: "Saldo conferido diretamente no aplicativo", theme: "kaiser" },
  { id: "picpay", name: "PicPay", kind: "corrente", initialBalance: 31.37, note: "Saldo remanescente após empréstimo", theme: "neon" },
  { id: "btg-inv", name: "BTG Investimentos", kind: "corrente", initialBalance: 14.46, note: "Saldo parado em conta", theme: "royal" },
  { id: "recargapay", name: "Vale Transporte · RecargaPay", kind: "reservado", initialBalance: 44.83, note: "Isolado — proteção de caixa", theme: "rose" },
  { id: "irmao", name: "Empréstimo ao Irmão", kind: "receber", initialBalance: 50, note: "Valor a receber", theme: "royal" },
  { id: "btc", name: "Bitcoin (Binance)", kind: "investimento", initialBalance: 151.31, theme: "kaiser" },
  { id: "tesouro-2032", name: "Tesouro Prefixado 2032", kind: "investimento", initialBalance: 28.77, theme: "abyss" },
  { id: "tesouro-2028", name: "Tesouro Prefixado 2028", kind: "investimento", initialBalance: 15.93, theme: "neon" },
];

type SeedTx = Omit<Transaction, "id" | "seed" | "date" | "createdAt">;

const SEED_INCOMES: SeedTx[] = [
  { type: "income", amount: 600, description: "Depósito / Entrada recente", category: "Depósito", accountId: "btg" },
  { type: "income", amount: 600, description: "Depósito / Entrada recente", category: "Depósito", accountId: "nubank" },
  { type: "income", amount: 450, description: "Salário (Dia 07)", category: "Salário", accountId: "nubank" },
  { type: "income", amount: 300.46, description: "Venda do celular (1ª parcela)", category: "Venda", accountId: "btg" },
  { type: "income", amount: 100, description: "Ganho extra (antes do empréstimo)", category: "Ganho extra", accountId: "nubank" },
  { type: "income", amount: 100, description: "Ganho extra recente (não especificado)", category: "Ganho extra", accountId: null },
  { type: "income", amount: 84, description: "Vale Transporte recebido (Dia 07)", category: "Vale Transporte", accountId: "recargapay" },
  { type: "income", amount: 80, description: "Presente de Aniversário", category: "Presente", accountId: "nubank" },
  { type: "income", amount: 50, description: "Ganho extra", category: "Ganho extra", accountId: "nubank" },
  { type: "income", amount: 50, description: "Presente do Pai", category: "Presente", accountId: "nubank" },
  { type: "income", amount: 50, description: "Devolução parcial (Irmão)", category: "Devolução", accountId: "nubank" },
];

const SEED_EXPENSES: SeedTx[] = [
  { type: "expense", amount: 450, description: "Autoescola (Habilitação)", category: "Educação / Habilitação", accountId: null },
  { type: "expense", amount: 186.05, description: "Lanches, pizzas, Cacau Show, cafés e padarias", category: "Alimentação e Lazer", accountId: null },
  { type: "expense", amount: 100, description: "Empréstimo ao irmão (50 Nubank + 50 PicPay)", category: "Empréstimos Concedidos", accountId: null },
  { type: "expense", amount: 77.5, description: "Bocal, lâmpada, acetato", category: "Faculdade / Materiais", accountId: null },
  { type: "expense", amount: 70, description: "Recargas e passagens", category: "Transporte", accountId: null },
  { type: "expense", amount: 45.4, description: "Livro e sacola", category: "Presentes", accountId: null },
  { type: "expense", amount: 37, description: "Corte de cabelo", category: "Cuidados Pessoais", accountId: null },
  { type: "expense", amount: 32.45, description: "Mercado / Comércio", category: "Mercado / Comércio", accountId: null },
];

export function createSeedState(startDate: string): FinanceState {
  const now = Date.now();
  const transactions: Transaction[] = [...SEED_INCOMES, ...SEED_EXPENSES].map((t, i) => ({
    ...t,
    id: `seed-${i}`,
    seed: true,
    date: null,
    createdAt: now - i,
  }));
  return {
    version: 1,
    startDate,
    accounts: SEED_ACCOUNTS.map((a) => ({ ...a })),
    transactions,
    subscriptions: [],
  };
}

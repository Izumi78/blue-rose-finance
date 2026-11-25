import { describe, expect, it } from "vitest";
import { createSeedState } from "./seed";
import {
  accountBalance, allocateAdjustment, diagnosis, editTransaction, freeMoney, migrateState, nextChargeDate, position,
  spendLevel, totals, isCountedDay, validateTransaction,
} from "./logic";
import type { FinanceState, Subscription, Transaction } from "./types";

const seed = () => createSeedState("2026-11-16");

describe("posição inicial", () => {
  it("contas correntes somam R$ 1.363,19", () => expect(position(seed()).corrente).toBe(1363.19));
  it("total investido é R$ 196,01", () => expect(position(seed()).investimento).toBe(196.01));
  it("patrimônio total de abertura é R$ 1.347,67", () => expect(position(seed()).total).toBe(1347.67));
  it("ajuste de conciliação de abertura é −R$ 306,36", () => expect(position(seed()).ajuste).toBe(-306.36));
  it("vale transporte isolado é R$ 44,83", () => expect(position(seed()).reservado).toBe(44.83));
  it("entradas somam R$ 2.464,46 e saídas R$ 998,40", () => expect(totals(seed())).toEqual({ income: 2464.46, expense: 998.4 }));
  it("histórico inicial não altera saldos das contas", () => expect(accountBalance(seed(), "nubank")).toBe(416.9));
});

describe("diagnóstico", () => {
  it("maior despesa é a autoescola com 45,1% dos gastos", () => {
    const d = diagnosis(seed());
    expect(d.biggest?.description).toMatch(/Autoescola/);
    expect(Number(d.biggest?.pct.toFixed(1))).toBe(45.1);
  });
  it("gasto recorrente aponta Alimentação e Lazer", () => expect(diagnosis(seed()).recurring?.category).toBe("Alimentação e Lazer"));
});

describe("indicador do calendário", () => {
  it("até R$ 30 é verde", () => expect(spendLevel(30)).toBe("safe"));
  it("acima de R$ 30 até R$ 100 é laranja", () => expect(spendLevel(30.01)).toBe("medium"));
  it("R$ 100 ainda é laranja", () => expect(spendLevel(100)).toBe("medium"));
  it("acima de R$ 100 é vermelho", () => expect(spendLevel(100.01)).toBe("high"));
  it("dias antes do início não contam", () => expect(isCountedDay("2026-11-15", "2026-11-16", "2026-11-20")).toBe(false));
  it("dias futuros não contam", () => expect(isCountedDay("2026-11-21", "2026-11-16", "2026-11-20")).toBe(false));
});

describe("lançamentos", () => {
  it("gasto reduz e transferência move saldo entre contas", () => {
    const s: FinanceState = seed();
    s.transactions.push(
      { id: "a", type: "expense", amount: 16.9, description: "x", category: "Outros", accountId: "nubank", date: "2026-11-16", createdAt: 1 },
      { id: "b", type: "transfer", amount: 100, description: "y", category: "Transferência", accountId: "btg", toAccountId: "picpay", date: "2026-11-16", createdAt: 2 },
    );
    expect(accountBalance(s, "nubank")).toBe(400);
    expect(accountBalance(s, "btg")).toBe(800.46);
    expect(accountBalance(s, "picpay")).toBe(131.37);
    expect(position(s).total).toBe(1330.77);
  });
});

describe("assinaturas", () => {
  const sub: Subscription = { id: "s", name: "Gemini Pro", amount: 96.99, billingDay: 31, accountId: "nubank", category: "Assinaturas", active: true };
  it("cobrança do dia 31 cai no último dia em meses curtos", () => expect(nextChargeDate(sub, "2026-11-16")).toBe("2026-11-30"));
  it("se o dia já passou, vai para o mês seguinte", () => expect(nextChargeDate({ ...sub, billingDay: 5 }, "2026-11-16")).toBe("2026-12-05"));
});

const tx = (p: Partial<Transaction> & Pick<Transaction, "id" | "type" | "amount">): Transaction => ({
  description: "x", category: "Outros", accountId: "nubank", date: "2026-11-16", createdAt: 1, ...p,
});

describe("dinheiro livre", () => {
  it("é somente o saldo do Nubank: R$ 416,90 na abertura", () => expect(freeMoney(seed())?.balance).toBe(416.9));
  it("não usa outra conta quando o Nubank não existe", () => {
    const s = seed();
    s.accounts = s.accounts.filter((a) => a.id !== "nubank");
    expect(freeMoney(s)).toBeNull();
  });
});

describe("movimento de saldo", () => {
  it("novo ganho de R$ 50 no Nubank sobe o saldo para R$ 466,90 e o patrimônio para R$ 1.397,67", () => {
    const s = seed();
    s.transactions.push(tx({ id: "g", type: "income", amount: 50 }));
    expect(accountBalance(s, "nubank")).toBe(466.9);
    expect(position(s).total).toBe(1397.67);
  });
  it("novo gasto de R$ 16,90 no Nubank baixa o saldo para R$ 400,00 e o patrimônio para R$ 1.330,77", () => {
    const s = seed();
    s.transactions.push(tx({ id: "e", type: "expense", amount: 16.9 }));
    expect(accountBalance(s, "nubank")).toBe(400);
    expect(position(s).total).toBe(1330.77);
  });
  it("transferência de R$ 100 do BTG para o Nubank não altera o patrimônio", () => {
    const s = seed();
    s.transactions.push(tx({ id: "t", type: "transfer", amount: 100, accountId: "btg", toAccountId: "nubank" }));
    expect(accountBalance(s, "btg")).toBe(800.46);
    expect(accountBalance(s, "nubank")).toBe(516.9);
    expect(position(s).total).toBe(1347.67);
  });
});

describe("edição de lançamento", () => {
  const withExpense = () => {
    const s = seed();
    s.transactions.unshift(tx({ id: "e", type: "expense", amount: 16.9, createdAt: 42 }));
    return s;
  };
  it("mudar o valor de R$ 16,90 para R$ 30 recalcula saldo e patrimônio", () => {
    const s = editTransaction(withExpense(), "e", { type: "expense", amount: 30, description: "x", category: "Outros", accountId: "nubank", date: "2026-11-16" });
    expect(accountBalance(s, "nubank")).toBe(386.9);
    expect(position(s).total).toBe(1317.67);
  });
  it("mudar a conta devolve o valor ao Nubank e tira do PicPay", () => {
    const s = editTransaction(withExpense(), "e", { type: "expense", amount: 16.9, description: "x", category: "Outros", accountId: "picpay", date: "2026-11-16" });
    expect(accountBalance(s, "nubank")).toBe(416.9);
    expect(accountBalance(s, "picpay")).toBe(14.47);
  });
  it("trocar gasto por ganho inverte o efeito no saldo", () => {
    const s = editTransaction(withExpense(), "e", { type: "income", amount: 16.9, description: "x", category: "Outros", accountId: "nubank", date: "2026-11-16" });
    expect(accountBalance(s, "nubank")).toBe(433.8);
  });
  it("edita o mesmo lançamento sem duplicar e mantém id e data de criação", () => {
    const before = withExpense();
    const s = editTransaction(before, "e", { type: "expense", amount: 30, description: "y", category: "Outros", accountId: "nubank", date: "2026-11-17" });
    expect(s.transactions).toHaveLength(before.transactions.length);
    expect(s.transactions.find((t) => t.id === "e")).toMatchObject({ id: "e", createdAt: 42, amount: 30, description: "y" });
  });
  it("editar histórico inicial mantém seed e sem data e não mexe nos saldos", () => {
    const s = editTransaction(seed(), "seed-0", { type: "income", amount: 700, description: "Depósito", category: "Depósito", accountId: "btg", date: "2026-11-16" });
    const t = s.transactions.find((x) => x.id === "seed-0");
    expect(t?.seed).toBe(true);
    expect(t?.date).toBeNull();
    expect(accountBalance(s, "btg")).toBe(900.46);
    expect(totals(s).income).toBe(2564.46);
  });
});

describe("validação de lançamento", () => {
  const base = { type: "expense" as const, amount: 10, description: "x", category: "Outros", date: "2026-11-16" };
  it("gasto novo sem conta é recusado", () => expect(validateTransaction({ ...base, accountId: null }, seed())).not.toBeNull());
  it("gasto novo com conta é aceito", () => expect(validateTransaction({ ...base, accountId: "nubank" }, seed())).toBeNull());
  it("transferência para a mesma conta é recusada", () =>
    expect(validateTransaction({ ...base, type: "transfer", accountId: "btg", toAccountId: "btg" }, seed())).not.toBeNull());
  it("valor zero é recusado", () => expect(validateTransaction({ ...base, amount: 0, accountId: "nubank" }, seed())).not.toBeNull());
});

describe("ajuste de conciliação", () => {
  it("é aplicado no estado salvo que ainda não tem ajuste", () => {
    const old = { ...seed() } as Partial<FinanceState>;
    delete old.openingAdjustment;
    const r = migrateState(old);
    expect(r?.migrated).toBe(true);
    expect(r?.state.openingAdjustment).toBe(-306.36);
    expect(position(r!.state).total).toBe(1347.67);
  });
  it("não é aplicado de novo depois de salvo", () => {
    const once = migrateState({ ...seed(), openingAdjustment: undefined })!.state;
    const twice = migrateState(JSON.parse(JSON.stringify(once)));
    expect(twice?.migrated).toBe(false);
    expect(twice?.state.openingAdjustment).toBe(-306.36);
  });
  it("ajuste já alocado (zero) não volta", () => expect(migrateState({ ...seed(), openingAdjustment: 0 })?.state.openingAdjustment).toBe(0));
  it("migração mantém lançamentos já salvos", () => {
    const old = { ...seed(), openingAdjustment: undefined, transactions: [tx({ id: "keep", type: "expense", amount: 5 })] };
    expect(migrateState(old)?.state.transactions.map((t) => t.id)).toEqual(["keep"]);
  });
  it("alocar no Nubank baixa o Nubank para R$ 110,54 e mantém o patrimônio", () => {
    const s = allocateAdjustment(seed(), "nubank");
    expect(accountBalance(s, "nubank")).toBe(110.54);
    expect(s.openingAdjustment).toBe(0);
    expect(position(s).total).toBe(1347.67);
  });
});

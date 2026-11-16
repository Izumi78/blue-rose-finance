import { describe, expect, it } from "vitest";
import { createSeedState } from "./seed";
import { accountBalance, diagnosis, nextChargeDate, position, spendLevel, totals, isCountedDay } from "./logic";
import type { FinanceState, Subscription } from "./types";

const seed = () => createSeedState("2026-11-16");

describe("posição inicial", () => {
  it("total livre é R$ 1.363,19", () => expect(position(seed()).corrente).toBe(1363.19));
  it("total investido é R$ 196,01", () => expect(position(seed()).investimento).toBe(196.01));
  it("patrimônio total é R$ 1.654,03", () => expect(position(seed()).total).toBe(1654.03));
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
    expect(position(s).total).toBe(1637.13);
  });
});

describe("assinaturas", () => {
  const sub: Subscription = { id: "s", name: "Gemini Pro", amount: 96.99, billingDay: 31, accountId: "nubank", category: "Assinaturas", active: true };
  it("cobrança do dia 31 cai no último dia em meses curtos", () => expect(nextChargeDate(sub, "2026-11-16")).toBe("2026-11-30"));
  it("se o dia já passou, vai para o mês seguinte", () => expect(nextChargeDate({ ...sub, billingDay: 5 }, "2026-11-16")).toBe("2026-12-05"));
});

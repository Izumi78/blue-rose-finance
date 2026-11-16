const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const num = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatBRL = (v: number) => brl.format(v);
export const formatNumber = (v: number) => num.format(v);
export const formatPct = (v: number) =>
  `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(v)}%`;

/** Accepts "12,50", "1.234,56", "12.5" and returns a number (NaN if invalid). */
export function parseAmount(input: string): number {
  const s = input.trim().replace(/[R$\s]/g, "");
  if (!s) return NaN;
  let normalized = s;
  if (s.includes(",")) normalized = s.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { expenseByCategory, monthlyFlow, totals } from "@/lib/finance/logic";
import { formatBRL, formatPct } from "@/lib/format";
import { CHART_COLORS, Panel, useFinance } from "./ui-bits";

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="tabular flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: {formatBRL(p.value)}
        </p>
      ))}
    </div>
  );
}

export function RevenueFlow({ today }: { today: string }) {
  const state = useFinance();
  const data = monthlyFlow(state, today);
  return (
    <Panel
      title="Fluxo de receitas"
      action={
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Entradas</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-royal" />Saídas</span>
        </div>
      }
    >
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={6} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--accent)", opacity: 0.25, radius: 12 } as object} />
            <Bar dataKey="income" name="Entradas" fill="var(--primary)" radius={[12, 12, 12, 12]} maxBarSize={44} />
            <Bar dataKey="expense" name="Saídas" fill="var(--royal)" radius={[12, 12, 12, 12]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function ExpenseSplit() {
  const state = useFinance();
  const slices = expenseByCategory(state);
  const { expense } = totals(state);
  return (
    <Panel title="Distribuição de despesas">
      <div className="grid items-center gap-5 sm:grid-cols-[11rem_minmax(0,1fr)]">
        <div className="relative mx-auto h-44 w-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={slices} dataKey="amount" nameKey="category" innerRadius="68%" outerRadius="100%" paddingAngle={3} cornerRadius={8} stroke="none">
                {slices.map((s, i) => <Cell key={s.category} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="tabular font-display text-lg font-semibold">{formatBRL(expense)}</p>
            </div>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {slices.map((s, i) => (
            <li key={s.category} className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">{s.category}</p>
              <p className="tabular flex items-center gap-1.5 text-sm font-semibold">
                <span className="h-3 w-1 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                {formatPct(s.pct)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

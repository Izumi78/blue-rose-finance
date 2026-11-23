import { useState } from "react";
import { Sparkles, ArrowUp, ChartNoAxesCombined, Wallet, Target, FileText } from "lucide-react";
import { toast } from "sonner";

const SUGGESTIONS = [
  { label: "Analisar meus gastos", icon: ChartNoAxesCombined },
  { label: "Organizar uma meta", icon: Target },
  { label: "Registrar uma despesa", icon: Wallet },
  { label: "Criar relatório", icon: FileText },
];

export function FinancialAiPanel() {
  const [prompt, setPrompt] = useState("");
  return (
    <section className="financial-ai-card relative overflow-hidden rounded-[1.7rem] p-5 sm:p-7">
      <div className="relative z-10">
        <div className="flex items-center gap-2 text-sm font-medium tracking-wide">
          <Sparkles className="h-4 w-4" />
          FINANCIAL AI
          <span className="ai-status ml-1 rounded-full px-2 py-1 text-[10px] uppercase tracking-wider">Em configuração</span>
        </div>
        <h2 className="mt-4 max-w-2xl font-display text-2xl font-medium leading-tight sm:text-3xl">Organize sua vida financeira.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed opacity-75">Conte o que precisa. Sua assistente poderá organizar receitas, despesas, metas e relatórios em um só lugar.</p>
        <form className="ai-input-shell mt-5 flex items-end gap-2 rounded-2xl p-2" onSubmit={(e) => { e.preventDefault(); if (!prompt.trim()) return; toast.info("A interface está pronta. A conexão com o serviço de IA ainda precisa ser configurada — nenhum dado foi enviado."); }}>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} placeholder="Ex.: gastei R$ 85 no mercado ontem..." className="min-h-[52px] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:opacity-50" />
          <button type="submit" aria-label="Enviar mensagem" className="ai-send grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform hover:scale-[1.03] active:scale-95"><ArrowUp className="h-5 w-5" /></button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map(({ label, icon: Icon }) => <button key={label} type="button" onClick={() => setPrompt(label)} className="ai-suggestion inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs transition-colors"><Icon className="h-3.5 w-3.5" />{label}</button>)}
        </div>
        <p className="mt-3 text-[11px] opacity-55">Assistente visual em preparação · suas mensagens não são enviadas neste estágio.</p>
      </div>
    </section>
  );
}

import { Sparkles } from "lucide-react";

/**
 * Espaço reservado para inteligência operacional (apoio à decisão).
 * Conteúdo simulado — nenhuma decisão automática de segurança é tomada.
 */
export function AssistantCard({ hints }: { hints: string[] }) {
  return (
    <section className="border-b border-border px-3 py-2">
      <h2 className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-widest uppercase">
        <Sparkles className="h-3.5 w-3.5 text-info" /> Assistente operacional
      </h2>
      <ul className="mt-1.5 space-y-1">
        {hints.map((hint) => (
          <li key={hint} className="font-mono text-[10.5px] leading-snug text-muted-foreground">
            • {hint}
          </li>
        ))}
      </ul>
      <p className="mt-1.5 font-mono text-[9px] tracking-wider text-muted-foreground/70 uppercase">
        Apoio à decisão — sem comando automático de equipamentos
      </p>
    </section>
  );
}

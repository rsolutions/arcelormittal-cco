import type { CcoState, SelectedObject, Signal } from "@/lib/cco/types";
import { DIAGRAM_MAIN_Y, REFERENCE_YARDS, diagramX } from "./referenceLayout";

export function ReferenceDiagram({ state, selected, onSelect }: {
  state: CcoState;
  selected: SelectedObject | null;
  onSelect: (selection: SelectedObject) => void;
}) {
  return <g>
    {REFERENCE_YARDS.map((layout, index) => {
      const yard = state.yards.find((item) => item.name === layout.name);
      if (!yard) return null;
      const left = diagramX(layout.left);
      const right = diagramX(layout.right);
      const center = (left + right) / 2;
      const bottom = DIAGRAM_MAIN_Y + diagramX(layout.depth);
      const isSelected = selected?.kind === "PATIO" && selected.id === yard.id;
      const firstSignal = state.signals[index * 2];
      const secondSignal = state.signals[index * 2 + 1];
      const selectYard = () => onSelect({ kind: "PATIO", id: yard.id });
      return <g key={yard.id}>
        <g role="button" aria-label={`Pátio ${layout.name}`} tabIndex={0} className="cursor-pointer" onClick={selectYard}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") selectYard(); }}>
          <title>{layout.name}</title>
          <rect x={left + 12} y={DIAGRAM_MAIN_Y + 10} width={right - left - 24} height={diagramX(80)} fill="transparent" />
          {layout.depth > 0 ? <>
            <path d={`M ${left} ${DIAGRAM_MAIN_Y} L ${left + diagramX(13)} ${bottom} H ${right - diagramX(13)} L ${right} ${DIAGRAM_MAIN_Y}`}
              fill="none" stroke="transparent" strokeWidth={22} />
            <path d={`M ${left} ${DIAGRAM_MAIN_Y} L ${left + diagramX(13)} ${bottom} H ${right - diagramX(13)} L ${right} ${DIAGRAM_MAIN_Y}`}
              fill="none" stroke={isSelected ? "var(--diagram-free)" : "var(--rail)"} strokeWidth={2.5} />
          </> : <path d={`M ${diagramX(394)} ${DIAGRAM_MAIN_Y - diagramX(15)} H ${diagramX(401)} L ${diagramX(410)} ${DIAGRAM_MAIN_Y}`}
            fill="none" stroke={isSelected ? "var(--diagram-free)" : "var(--rail)"} strokeWidth={2.5} />}
          <text x={center} y={DIAGRAM_MAIN_Y + diagramX(75)} textAnchor="middle" fontFamily="var(--font-sans)"
            fontSize={15} fill="var(--foreground)">{layout.name}</text>
        </g>
        <DiagramSignal x={left} y={DIAGRAM_MAIN_Y + 5} signal={firstSignal} onSelect={onSelect} />
        <DiagramSignal x={right} y={DIAGRAM_MAIN_Y + 5} signal={secondSignal} onSelect={onSelect} />
        {layout.depth === 35 && <>
          <DiagramSignal x={left + diagramX(12)} y={bottom - 32} signal={firstSignal} onSelect={onSelect} />
          <DiagramSignal x={right - diagramX(12)} y={bottom - 32} signal={secondSignal} onSelect={onSelect} />
        </>}
      </g>;
    })}
  </g>;
}

function DiagramSignal({ x, y, signal, onSelect }: {
  x: number; y: number; signal: Signal | undefined; onSelect: (selection: SelectedObject) => void;
}) {
  if (!signal) return null;
  const blocked = signal.aspect !== "VERDE" || signal.status !== "ONLINE";
  const select = () => onSelect({ kind: "SINAL", id: signal.id });
  return <g transform={`translate(${x} ${y})`} role="button" tabIndex={0}
    aria-label={`${signal.id} — ${blocked ? "Bloqueio" : "Livre"}`} className="cursor-pointer"
    onClick={select} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") select(); }}>
    <title>{signal.id} — {blocked ? "Bloqueio" : "Livre"} — {signal.direction}</title>
    <rect x={-10} y={-5} width={20} height={48} fill="transparent" />
    <path d="M 0 25 V 38 M -4 35 H 4 M -4 38 H 4" stroke="var(--rail)" strokeWidth={2} />
    <rect x={-6} y={0} width={12} height={27} rx={3} fill="var(--surface-2)" stroke="var(--border-strong)" />
    <circle cy={7} r={4.5} fill="var(--diagram-blocked)" opacity={blocked ? 1 : 0.28} />
    <circle cy={20} r={4.5} fill="var(--diagram-free)" opacity={blocked ? 0.28 : 1} />
    <path d={signal.direction === "LESTE" ? "M -5 44 H 5 M 1 40 L 5 44 L 1 48" : "M 5 44 H -5 M -1 40 L -5 44 L -1 48"}
      stroke="var(--muted-foreground)" strokeWidth={1.5} fill="none" />
  </g>;
}
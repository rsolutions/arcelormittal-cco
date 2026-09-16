import { Pause, Play, RotateCcw, Search } from "lucide-react";
import type { ScenarioId, ViewMode } from "@/lib/cco/types";
import type { MapFilters } from "./RailwayMap";

const VIEW_MODES: { id: ViewMode; label: string; hint: string }[] = [
  { id: "OPERACIONAL", label: "Visão operacional", hint: "F1" },
  { id: "ALARMES", label: "Visão de alarmes", hint: "F2" },
  { id: "INFRAESTRUTURA", label: "Visão de infraestrutura", hint: "F3" },
];

const SCENARIOS: { id: ScenarioId; label: string }[] = [
  { id: "NORMAL", label: "01 — Operação normal" },
  { id: "ATRASO", label: "02 — Atraso de trem" },
  { id: "FALHA_SINAL", label: "03 — Falha de sinal" },
  { id: "TRECHO_OCUPADO", label: "04 — Trecho ocupado" },
  { id: "PERDA_COMUNICACAO", label: "05 — Perda de comunicação" },
  { id: "INTERDICAO", label: "06 — Interdição de trecho" },
];

const LINES: { id: MapFilters["line"]; label: string }[] = [
  { id: "ALL", label: "Toda a linha" },
  { id: "L1", label: "Corredor principal" },
];

const TOGGLES: { key: keyof MapFilters; label: string }[] = [
  { key: "trains", label: "Trens" },
  { key: "stations", label: "Estações" },
  { key: "signals", label: "Sinais" },
  { key: "switches", label: "AMVs" },
  { key: "alarms", label: "Alarmes" },
  { key: "onlyOffline", label: "Equip. offline" },
  { key: "onlyOccupied", label: "Trechos ocupados" },
];

export function ControlBar({
  viewMode,
  onViewMode,
  filters,
  onFilters,
  search,
  onSearch,
  running,
  live,
  scenario,
  onStart,
  onPause,
  onReset,
  onLive,
  onScenario,
}: {
  viewMode: ViewMode;
  onViewMode: (mode: ViewMode) => void;
  filters: MapFilters;
  onFilters: (filters: MapFilters) => void;
  search: string;
  onSearch: (value: string) => void;
  running: boolean;
  live: boolean;
  scenario: ScenarioId;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onLive: (live: boolean) => void;
  onScenario: (scenario: ScenarioId) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2">
      <div className="flex overflow-hidden rounded border border-border-strong">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onViewMode(mode.id)}
            className={`px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors ${
              viewMode === mode.id
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground hover:bg-surface-2 hover:text-foreground"
            }`}
          >
            {mode.label}
            <span className="ml-1.5 opacity-60">{mode.hint}</span>
          </button>
        ))}
      </div>

      <label className="relative flex min-w-64 flex-1 items-center">
        <Search className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar trem, estação, sinal ou KM..."
          className="w-full rounded border border-border bg-background py-1.5 pr-2 pl-7 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
        />
      </label>

      <select
        aria-label="Filtrar linha"
        value={filters.line}
        onChange={(e) => onFilters({ ...filters, line: e.target.value as MapFilters["line"] })}
        className="rounded border border-border bg-surface-2 px-2 py-1.5 font-mono text-[10px] tracking-wider text-foreground uppercase"
      >
        {LINES.map((line) => (
          <option key={line.id} value={line.id}>
            {line.label}
          </option>
        ))}
      </select>

      <div className="flex flex-wrap items-center gap-1">
        {TOGGLES.map((toggle) => {
          const active = Boolean(filters[toggle.key]);
          return (
            <button
              key={toggle.key}
              type="button"
              onClick={() => onFilters({ ...filters, [toggle.key]: !active })}
              className={`rounded border px-2 py-1 font-mono text-[10px] tracking-wider uppercase transition-colors ${
                active
                  ? "border-primary/60 bg-primary/15 text-foreground"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {toggle.label}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <select
          aria-label="Cenário de simulação"
          value={scenario}
          onChange={(e) => onScenario(e.target.value as ScenarioId)}
          className="rounded border border-border bg-surface-2 px-2 py-1.5 font-mono text-[10px] tracking-wider text-foreground uppercase"
        >
          {SCENARIOS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onLive(!live)}
          className={`rounded border px-2 py-1.5 font-mono text-[10px] tracking-wider uppercase transition-colors ${
            live
              ? "border-clear/60 bg-clear/15 text-clear"
              : "border-border bg-surface text-muted-foreground"
          }`}
        >
          Simulação ao vivo
        </button>

        {running ? (
          <button
            type="button"
            onClick={onPause}
            className="flex items-center gap-1 rounded border border-border-strong bg-surface px-2.5 py-1.5 font-mono text-[10px] tracking-wider uppercase hover:bg-surface-2"
          >
            <Pause className="h-3.5 w-3.5" /> Pausar
          </button>
        ) : (
          <button
            type="button"
            onClick={onStart}
            className="flex items-center gap-1 rounded border border-clear/60 bg-clear/15 px-2.5 py-1.5 font-mono text-[10px] tracking-wider text-clear uppercase"
          >
            <Play className="h-3.5 w-3.5" /> Iniciar
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 rounded border border-border-strong bg-surface px-2.5 py-1.5 font-mono text-[10px] tracking-wider uppercase hover:bg-surface-2"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Resetar
        </button>
      </div>
    </div>
  );
}

import { Crosshair, X } from "lucide-react";
import { formatClock, formatKm } from "@/lib/cco/geometry";
import { LINE_LABELS } from "@/lib/cco/network";
import { signalAspect, yardSignals } from "@/lib/cco/route-state";
import type { AccessLevel, CcoState, SelectedObject } from "@/lib/cco/types";
import { switchService, trackService } from "@/services";
import { aspectColor, severityColor, severityLabel, switchColor, trackColor } from "./map/palette";

export function DetailPanel({
  state,
  selected,
  accessLevel,
  onClose,
  onSelect,
  onLocate,
}: {
  state: CcoState;
  selected: SelectedObject | null;
  accessLevel: AccessLevel;
  onClose: () => void;
  onSelect: (selection: SelectedObject) => void;
  onLocate: (selection: SelectedObject) => void;
}) {
  const canCommand = accessLevel !== "OPERADOR";

  return (
    <aside className="flex h-full w-full min-h-0 flex-col border-l border-border bg-surface">
      <header className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <h2 className="font-mono text-[11px] font-semibold tracking-widest uppercase">
          Detalhes do objeto
        </h2>
        {selected ? (
          <>
            <button
              type="button"
              onClick={() => onLocate(selected)}
              className="ml-auto flex items-center gap-1 rounded border border-border-strong px-2 py-0.5 font-mono text-[9px] tracking-widest uppercase hover:bg-surface-2"
            >
              <Crosshair className="h-3 w-3" /> Localizar
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar painel"
              className="rounded border border-border p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {!selected ? (
          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
            Selecione um trem, pátio, sinal, AMV, trecho ou alarme no mapa para ver os detalhes
            operacionais.
          </p>
        ) : null}

        {selected?.kind === "TREM" ? <TrainDetails state={state} id={selected.id} /> : null}
        {selected?.kind === "SINAL" ? (
          <SignalDetails state={state} id={selected.id} onSelect={onSelect} />
        ) : null}
        {selected?.kind === "ESTACAO" ? (
          <StationDetails state={state} id={selected.id} onSelect={onSelect} />
        ) : null}
        {selected?.kind === "AMV" ? (
          <SwitchDetails state={state} id={selected.id} canCommand={canCommand} />
        ) : null}
        {selected?.kind === "TRECHO" ? (
          <SegmentDetails state={state} id={selected.id} canCommand={canCommand} />
        ) : null}
        {selected?.kind === "PATIO" ? (
          <YardDetails state={state} id={selected.id} onSelect={onSelect} />
        ) : null}
        {selected?.kind === "ALARME" ? (
          <AlarmDetails state={state} id={selected.id} onSelect={onSelect} />
        ) : null}
      </div>
    </aside>
  );
}

function Title({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="tech-label">{label}</p>
      <p className="font-mono text-sm font-semibold" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/60 py-1">
      <span className="tech-label">{label}</span>
      <span className="font-mono text-[11px] tabular-nums" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  );
}

function TrainDetails({ state, id }: { state: CcoState; id: string }) {
  const train = state.trains.find((t) => t.id === id);
  if (!train) return null;
  const station = state.stations.find((s) => s.id === train.nextStation);
  return (
    <div className="space-y-2">
      <Title label="Trem" value={`TREM ${train.id}`} />
      <Row label="Prefixo" value={train.prefix} />
      <Row label="Linha" value={LINE_LABELS[train.line]} />
      <Row label="Sentido" value={`→ ${train.direction}`} />
      <Row label="Velocidade" value={`${train.speed} km/h`} />
      <Row label="Posição" value={formatKm(train.km)} />
      <Row label="Trecho" value={train.segmentId} />
      <Row label="Próxima estação" value={station?.name ?? train.nextStation} />
      <Row
        label="Atraso"
        value={`+${Math.round(train.delay)} min`}
        color={train.delay >= 3 ? "var(--state-caution)" : "var(--state-clear)"}
      />
      <Row label="Composição" value={`${train.cars} vagões`} />
      <Row label="Origem / destino" value={`${train.origin} → ${train.destination}`} />
      <Row label="Status" value={train.status.replace("_", " ")} />
      <Row label="Atualizado" value={formatClock(train.lastUpdate || state.clock)} />
    </div>
  );
}

function SignalDetails({
  state,
  id,
  onSelect,
}: {
  state: CcoState;
  id: string;
  onSelect: (selection: SelectedObject) => void;
}) {
  const signal = state.signals.find((s) => s.id === id);
  if (!signal) return null;
  const aspect = signalAspect(signal);
  const yard = state.yards.find((item) => item.id === signal.yardId);
  return (
    <div className="space-y-2">
      {yard ? (
        <button
          type="button"
          onClick={() => onSelect({ kind: "PATIO", id: yard.id })}
          className="font-mono text-[10px] text-primary hover:underline"
        >
          Voltar ao pátio {yard.name}
        </button>
      ) : null}
      <Title label="Sinal / controladora" value={`SINAL ${signal.label ?? signal.id}`} />
      <Row label="Identificação técnica" value={signal.id} />
      {yard ? <Row label="Pátio" value={yard.name} /> : null}
      <div className="flex items-center gap-2 rounded border border-border bg-surface-2 px-3 py-2">
        <span
          className={`h-4 w-4 rounded-full ${aspect === "VERMELHO" ? "signal-stop" : ""}`}
          style={{ backgroundColor: aspectColor[aspect], color: aspectColor[aspect] }}
        />
        <span className="font-mono text-sm font-semibold" style={{ color: aspectColor[aspect] }}>
          {aspect}
        </span>
      </div>
      <Row label="Localização" value={formatKm(signal.km)} />
      <Row label="Sentido" value={signal.direction} />
      <Row label="Linha" value={LINE_LABELS[signal.line]} />
      <Row label="Protege o trecho" value={signal.protects} />
      <Row label="Comunicação" value={signal.status} color={aspectColor[aspect]} />
      <Row label="Última atualização" value={formatClock(signal.lastUpdate || state.clock)} />
      <Row label="Último evento" value={signal.lastEvent} />
    </div>
  );
}

function StationDetails({
  state,
  id,
  onSelect,
}: {
  state: CcoState;
  id: string;
  onSelect: (selection: SelectedObject) => void;
}) {
  const station = state.stations.find((s) => s.id === id);
  if (!station) return null;
  const arrivals = state.trains
    .filter((t) => t.nextStation === station.id)
    .concat(state.trains.filter((t) => t.nextStation !== station.id))
    .slice(0, 4);

  return (
    <div className="space-y-2">
      <Title label="Estação" value={station.name.toUpperCase()} />
      <Row label="Código" value={station.code} />
      <Row label="Localização" value={formatKm(station.km)} />
      <Row label="Linha" value={LINE_LABELS[station.line]} />
      <Row label="Plataformas" value={String(station.platforms)} />
      <Row
        label="Status"
        value={station.status}
        color={station.status === "OPERACIONAL" ? "var(--state-clear)" : "var(--state-caution)"}
      />
      <p className="tech-label pt-2">Tabela operacional — próximos trens</p>
      <table className="w-full">
        <thead>
          <tr className="text-left">
            {["Trem", "Previsto", "Real", "Atraso"].map((h) => (
              <th key={h} className="tech-label pb-1">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {arrivals.map((train, index) => {
            const eta = state.clock + (index + 1) * 6 * 60000;
            return (
              <tr key={train.id} className="border-t border-border/60">
                <td className="py-1">
                  <button
                    type="button"
                    onClick={() => onSelect({ kind: "TREM", id: train.id })}
                    className="font-mono text-[11px] text-foreground hover:underline"
                  >
                    {train.id}
                  </button>
                </td>
                <td className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {formatClock(eta)}
                </td>
                <td className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {formatClock(eta + train.delay * 60000)}
                </td>
                <td
                  className="font-mono text-[11px] tabular-nums"
                  style={{
                    color: train.delay >= 3 ? "var(--state-caution)" : "var(--state-clear)",
                  }}
                >
                  +{Math.round(train.delay)} min
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SwitchDetails({
  state,
  id,
  canCommand,
}: {
  state: CcoState;
  id: string;
  canCommand: boolean;
}) {
  const item = state.switches.find((s) => s.id === id);
  if (!item) return null;
  return (
    <div className="space-y-2">
      <Title label="AMV / desvio" value={item.id} color={switchColor[item.status]} />
      <Row label="Identificação no projeto" value={item.label ?? item.id} />
      {item.crossoverType ? (
        <Row
          label="Tipo"
          value={item.crossoverType === "MANUAL" ? "Manual Crossover" : "Spring Crossover"}
        />
      ) : null}
      {item.yardName ? <Row label="Pátio" value={item.yardName} /> : null}
      <Row label="Localização" value={formatKm(item.km)} />
      <Row label="Linha" value={LINE_LABELS[item.line]} />
      <Row label="Posição" value={item.position} color={switchColor[item.status]} />
      <Row label="Estado" value={item.status.replace("_", " ")} />
      <Row label="Ocupação" value={item.occupancy ? `Trem ${item.occupancy}` : "Livre"} />
      <Row label="Última atualização" value={formatClock(item.lastUpdate || state.clock)} />
      <button
        type="button"
        disabled={!canCommand}
        onClick={() => switchService.toggle(item.id)}
        className="mt-2 w-full rounded border border-border-strong bg-surface-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase hover:bg-accent disabled:opacity-40"
      >
        Simular {item.position === "NORMAL" ? "reverso" : "normal"}
      </button>
      {!canCommand ? (
        <p className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
          Perfil OPERADOR não possui permissão de comando
        </p>
      ) : null}
    </div>
  );
}

function SegmentDetails({
  state,
  id,
  canCommand,
}: {
  state: CcoState;
  id: string;
  canCommand: boolean;
}) {
  const segment = state.segments.find((s) => s.id === id);
  if (!segment) return null;
  return (
    <div className="space-y-2">
      <Title label="Trecho de via" value={segment.id} color={trackColor[segment.status]} />
      <Row label="Descrição" value={segment.name} />
      <Row label="Linha" value={LINE_LABELS[segment.line]} />
      <Row label="Extensão" value={`${formatKm(segment.startKm)} → ${formatKm(segment.endKm)}`} />
      <Row
        label="Estado"
        value={segment.status.replace("_", " ")}
        color={trackColor[segment.status]}
      />
      <Row label="Ocupação" value={segment.occupancy ? `Trem ${segment.occupancy}` : "Livre"} />
      <Row label="Velocidade máx." value={`${segment.speedLimit} km/h`} />
      <Row label="Última atualização" value={formatClock(segment.lastUpdate || state.clock)} />
      <div className="grid grid-cols-2 gap-1 pt-2">
        {(["NORMAL", "BLOQUEADO", "MANUTENCAO", "FALHA"] as const).map((status) => (
          <button
            key={status}
            type="button"
            disabled={!canCommand}
            onClick={() => trackService.setStatus(segment.id, status)}
            className="rounded border border-border-strong bg-surface-2 px-2 py-1.5 font-mono text-[9px] tracking-widest uppercase hover:bg-accent disabled:opacity-40"
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}

function YardDetails({
  state,
  id,
  onSelect,
}: {
  state: CcoState;
  id: string;
  onSelect: (selection: SelectedObject) => void;
}) {
  const yard = state.yards.find((y) => y.id === id);
  if (!yard) return null;
  const signals = yardSignals(yard, state.signals);
  const offline = signals.some((signal) => signal.status === "OFFLINE");
  const failed = signals.some((signal) => signal.status === "FALHA");
  return (
    <div className="space-y-2">
      <Title label="Pátio" value={yard.name.toUpperCase()} />
      <Row label="Localização" value={formatKm(yard.km)} />
      <Row
        label="Status"
        value={offline ? "COMUNICAÇÃO PARCIAL" : failed ? "FALHA DE EQUIPAMENTO" : "OPERACIONAL"}
        color={offline ? "var(--route-gray)" : failed ? "var(--signal-red)" : "var(--route-blue)"}
      />
      <h3 className="tech-label pt-3">Sinais do pátio</h3>
      <ul className="space-y-2">
        {signals.map((signal) => {
          const aspect = signalAspect(signal);
          const color = aspectColor[aspect];
          const route = signal.direction === "OESTE" ? "Via principal definida" : "Desvio definido";
          return (
            <li key={signal.id}>
              <button
                type="button"
                onClick={() => onSelect({ kind: "SINAL", id: signal.id })}
                aria-label={`Ver sinal ${signal.label ?? signal.id} do pátio ${yard.name}`}
                className="w-full rounded border border-border bg-surface-2 p-3 text-left transition-colors hover:border-border-strong"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full ${aspect === "VERMELHO" ? "signal-stop" : ""}`}
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-mono text-sm font-semibold">
                    {signal.label ?? signal.id}
                  </span>
                  <span className="ml-auto font-mono text-[10px] font-semibold" style={{ color }}>
                    {aspect}
                  </span>
                </div>
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                  {aspect === "AZUL"
                        ? route
                    : aspect === "CINZA"
                      ? "Sem sinal do equipamento"
                      : "Rota não definida"}
                </p>
                <div className="mt-2 flex justify-between gap-2 font-mono text-[9px] text-muted-foreground">
                  <span>
                    {signal.id} · {signal.status === "OFFLINE" ? "DESCONECTADO" : signal.status}
                  </span>
                  <span>{formatClock(signal.lastUpdate || state.clock)}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AlarmDetails({
  state,
  id,
  onSelect,
}: {
  state: CcoState;
  id: string;
  onSelect: (selection: SelectedObject) => void;
}) {
  const alarm = state.alarms.find((a) => a.id === id);
  if (!alarm) return null;
  return (
    <div className="space-y-2">
      <Title
        label="Alarme"
        value={severityLabel[alarm.severity]}
        color={severityColor[alarm.severity]}
      />
      <Row label="Descrição" value={alarm.description} />
      <Row label="Tipo" value={alarm.type.replace(/_/g, " ")} />
      <Row label="Horário" value={formatClock(alarm.timestamp)} />
      <Row
        label="Reconhecido"
        value={alarm.acknowledged ? `Sim (${alarm.acknowledgedBy ?? "ADMIN"})` : "Não"}
      />
      <Row label="Resolvido" value={alarm.resolved ? "Sim" : "Não"} />
      <button
        type="button"
        onClick={() => onSelect({ kind: alarm.objectKind, id: alarm.objectId })}
        className="mt-2 w-full rounded border border-border-strong bg-surface-2 px-3 py-2 font-mono text-[10px] tracking-widest uppercase hover:bg-accent"
      >
        Abrir objeto {alarm.objectId}
      </button>
    </div>
  );
}

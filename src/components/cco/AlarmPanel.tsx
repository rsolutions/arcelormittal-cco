import { BellOff, Check, CircleCheck, Crosshair } from "lucide-react";
import { useMemo, useState } from "react";
import { formatClock, formatDate } from "@/lib/cco/geometry";
import type { Alarm, AlarmSeverity } from "@/lib/cco/types";
import { alarmService } from "@/services";
import { severityColor, severityLabel } from "./map/palette";

type SortMode = "SEVERIDADE" | "RECENTES";

export function AlarmPanel({
  alarms,
  onLocate,
  onSelectAlarm,
  selectedId,
}: {
  alarms: Alarm[];
  onLocate: (alarm: Alarm) => void;
  onSelectAlarm: (alarm: Alarm) => void;
  selectedId?: string | null;
}) {
  const [severity, setSeverity] = useState<AlarmSeverity | "TODOS">("TODOS");
  const [sort, setSort] = useState<SortMode>("RECENTES");
  const [status, setStatus] = useState<"TODOS" | "ATIVOS" | "RESOLVIDOS">("TODOS");

  const visible = useMemo(() => {
    const list = alarms
      .filter((a) => status === "TODOS" || (status === "RESOLVIDOS" ? a.resolved : !a.resolved))
      .filter((a) => (severity === "TODOS" ? true : a.severity === severity));
    return [...list].sort((a, b) =>
      sort === "SEVERIDADE"
        ? alarmService.severityRank(a) - alarmService.severityRank(b) || b.timestamp - a.timestamp
        : b.timestamp - a.timestamp,
    );
  }, [alarms, severity, status, sort]);

  const pending = alarms.filter((a) => !a.resolved && !a.acknowledged).length;

  return (
    <section className="flex h-full min-h-0 flex-col border-t border-border bg-surface">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-1.5">
        <h2 className="font-mono text-[11px] font-semibold tracking-widest uppercase">
          Ocorrências
        </h2>
        <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {alarms.length} emitido(s) · {pending} pendente(s)
        </span>
        <div className="ml-auto flex items-center gap-1">
          {(["TODOS", "CRITICO", "ALTO", "MEDIO", "INFO"] as const).map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={severity === level}
              onClick={() => setSeverity(level)}
              className={`rounded border px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase ${
                severity === level
                  ? "border-primary/60 bg-primary/15 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {level === "TODOS" ? "Todos" : severityLabel[level]}
            </button>
          ))}
          <select
            aria-label="Ordenar alertas"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            className="rounded border border-border bg-surface-2 px-2 py-1 font-mono text-[10px] text-foreground"
          >
            <option value="RECENTES">Mais recentes</option>
            <option value="SEVERIDADE">Severidade</option>
          </select>
          <select
            aria-label="Estado dos alertas"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="rounded border border-border bg-surface-2 px-2 py-1 font-mono text-[10px] text-foreground"
          >
            <option value="TODOS">Todos os estados</option>
            <option value="ATIVOS">Ativos</option>
            <option value="RESOLVIDOS">Resolvidos</option>
          </select>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 px-5 text-center">
            <CircleCheck className="h-8 w-8 text-primary" />
            <p className="font-mono text-xs text-foreground">
              {alarms.length ? "Nenhum alerta corresponde aos filtros." : "Nenhum alerta emitido."}
            </p>
            <p className="text-xs text-muted-foreground">
              {alarms.length
                ? "Ajuste a severidade ou o estado para consultar outras ocorrências."
                : "Novas ocorrências dos equipamentos aparecerão aqui automaticamente."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((alarm) => (
              <li
                key={alarm.id}
                className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 ${
                  selectedId === alarm.id ? "bg-surface-2" : ""
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    alarm.severity === "CRITICO" &&
                    !alarm.resolved &&
                    !alarm.acknowledged &&
                    !alarm.muted
                      ? "pulse-critical lamp"
                      : ""
                  }`}
                  style={{
                    backgroundColor: severityColor[alarm.severity],
                    color: severityColor[alarm.severity],
                  }}
                />
                <span
                  className="w-16 font-mono text-[10px] font-semibold tracking-wider"
                  style={{ color: severityColor[alarm.severity] }}
                >
                  {severityLabel[alarm.severity]}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                  {formatDate(alarm.timestamp)} · {formatClock(alarm.timestamp)}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectAlarm(alarm)}
                  className="min-w-40 flex-1 text-left font-mono text-[11px] text-foreground hover:underline"
                >
                  {alarm.description}
                </button>
                <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-muted-foreground">
                  {alarm.objectKind} {alarm.objectId}
                </span>
                <span
                  className={`rounded border border-border px-1.5 py-0.5 font-mono text-[9px] ${alarm.resolved ? "text-muted-foreground" : "text-foreground"}`}
                >
                  {alarm.resolved ? "Resolvido" : alarm.acknowledged ? "Reconhecido" : "Ativo"}
                </span>
                <div className="flex items-center gap-1">
                  <IconAction
                    label="Localizar no mapa"
                    onClick={() => onLocate(alarm)}
                    icon={<Crosshair className="h-3 w-3" />}
                  />
                  <IconAction
                    label={alarm.acknowledged ? "Reconhecido" : "Reconhecer alarme"}
                    active={alarm.acknowledged}
                    onClick={() => alarmService.acknowledge(alarm.id)}
                    icon={<Check className="h-3 w-3" />}
                  />
                  <IconAction
                    label={alarm.muted ? "Reativar som" : "Silenciar alarme"}
                    active={alarm.muted}
                    onClick={() => alarmService.mute(alarm.id)}
                    icon={<BellOff className="h-3 w-3" />}
                  />
                  <button
                    type="button"
                    onClick={() => alarmService.resolve(alarm.id)}
                    disabled={alarm.resolved}
                    className="rounded border border-border px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-muted-foreground uppercase hover:text-foreground disabled:opacity-40"
                  >
                    Resolver
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function IconAction({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
        active
          ? "border-clear/60 bg-clear/15 text-clear"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
    </button>
  );
}

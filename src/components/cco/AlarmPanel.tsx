import { BellOff, Check, Crosshair, ListFilter } from "lucide-react";
import { useMemo, useState } from "react";
import { formatClock } from "@/lib/cco/geometry";
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
  const [sort, setSort] = useState<SortMode>("SEVERIDADE");
  const [showResolved, setShowResolved] = useState(false);

  const visible = useMemo(() => {
    const list = alarms
      .filter((a) => (showResolved ? true : !a.resolved))
      .filter((a) => (severity === "TODOS" ? true : a.severity === severity));
    return [...list].sort((a, b) =>
      sort === "SEVERIDADE"
        ? alarmService.severityRank(a) - alarmService.severityRank(b) || b.timestamp - a.timestamp
        : b.timestamp - a.timestamp,
    );
  }, [alarms, severity, showResolved, sort]);

  const pending = alarms.filter((a) => !a.resolved && !a.acknowledged).length;

  return (
    <section className="flex h-full min-h-0 flex-col border-t border-border bg-surface">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-1.5">
        <h2 className="font-mono text-[11px] font-semibold tracking-widest uppercase">
          Painel de alarmes
        </h2>
        <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {pending} pendente(s)
        </span>
        <div className="ml-auto flex items-center gap-1">
          {(["TODOS", "CRITICO", "ALTO", "MEDIO", "INFO"] as const).map((level) => (
            <button
              key={level}
              type="button"
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
          <button
            type="button"
            onClick={() => setSort(sort === "SEVERIDADE" ? "RECENTES" : "SEVERIDADE")}
            className="flex items-center gap-1 rounded border border-border px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-muted-foreground uppercase hover:text-foreground"
          >
            <ListFilter className="h-3 w-3" /> {sort}
          </button>
          <button
            type="button"
            onClick={() => setShowResolved(!showResolved)}
            className={`rounded border px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase ${
              showResolved
                ? "border-primary/60 bg-primary/15 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Histórico
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="px-3 py-4 font-mono text-[11px] text-muted-foreground">
            Nenhum alarme ativo — operação sem ocorrências.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((alarm) => (
              <li
                key={alarm.id}
                className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-1.5 ${
                  selectedId === alarm.id ? "bg-surface-2" : ""
                } ${alarm.resolved ? "opacity-50" : ""}`}
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    alarm.severity === "CRITICO" && !alarm.acknowledged && !alarm.muted
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
                  {formatClock(alarm.timestamp)}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectAlarm(alarm)}
                  className="flex-1 truncate text-left font-mono text-[11px] text-foreground hover:underline"
                >
                  {alarm.description}
                </button>
                <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-muted-foreground">
                  {alarm.objectKind} {alarm.objectId}
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

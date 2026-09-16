import { Link } from "@tanstack/react-router";
import { Radio, ServerCog, Database, Cpu, TrainFront } from "lucide-react";
import { formatClock, formatDate } from "@/lib/cco/geometry";
import type { AccessLevel, Connectivity } from "@/lib/cco/types";
import { useHydrated } from "@/hooks/useCco";

const statusColor: Record<string, string> = {
  ONLINE: "var(--state-clear)",
  SINCRONIZADOS: "var(--state-clear)",
  DEGRADADO: "var(--state-caution)",
  SINCRONIZANDO: "var(--state-caution)",
  OFFLINE: "var(--state-danger)",
  DESATUALIZADOS: "var(--state-danger)",
};

export function CcoHeader({
  connectivity,
  clock,
  operator,
  accessLevel,
  onAccessLevelChange,
  criticalAlarms,
}: {
  connectivity: Connectivity;
  clock: number;
  operator: string;
  accessLevel: AccessLevel;
  onAccessLevelChange: (level: AccessLevel) => void;
  criticalAlarms: number;
}) {
  const hydrated = useHydrated();
  const operationStatus =
    criticalAlarms > 0
      ? { label: "OPERAÇÃO EM ATENÇÃO", color: "var(--state-danger)" }
      : connectivity.overall === "DEGRADADO"
        ? { label: "OPERAÇÃO DEGRADADA", color: "var(--state-caution)" }
        : { label: "OPERAÇÃO NORMAL", color: "var(--state-clear)" };

  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border bg-surface px-4 py-2">
      <div className="flex items-center gap-3">
        <TrainFront className="h-6 w-6 text-primary" />
        <div>
          <p className="font-mono text-sm font-bold tracking-[0.18em] text-foreground">
            CCO CENTRAL
          </p>
          <p className="tech-label">Ferrovia Vale Aurora — Malha Norte/Sul</p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded border border-border bg-surface-2 px-3 py-1">
        <span
          className="h-2.5 w-2.5 rounded-full lamp"
          style={{ backgroundColor: operationStatus.color, color: operationStatus.color }}
        />
        <span className="font-mono text-[11px] font-semibold tracking-widest">
          {operationStatus.label}
        </span>
      </div>

      <div className="font-mono text-sm tabular-nums">
        <span className="text-muted-foreground">{hydrated ? formatDate(clock) : "--/--/----"}</span>
        <span className="mx-2 text-border-strong">—</span>
        <span className="text-foreground">{hydrated ? formatClock(clock) : "--:--:--"}</span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <StatusChip icon={<Radio className="h-3.5 w-3.5" />} label="Comunicação" value={connectivity.comms} />
        <StatusChip icon={<ServerCog className="h-3.5 w-3.5" />} label="Servidor" value={connectivity.server} />
        <StatusChip icon={<Database className="h-3.5 w-3.5" />} label="Banco" value={connectivity.database} />
        <StatusChip icon={<Cpu className="h-3.5 w-3.5" />} label="Dispositivos" value={connectivity.devices} />
        <StatusChip label="Dados" value={connectivity.sync} />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <Link
          to="/historico"
          className="rounded border border-border-strong px-2.5 py-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
        >
          Histórico (F4)
        </Link>
        <div className="text-right">
          <p className="font-mono text-[11px] text-foreground">{operator}</p>
          <select
            aria-label="Nível de acesso"
            value={accessLevel}
            onChange={(e) => onAccessLevelChange(e.target.value as AccessLevel)}
            className="mt-0.5 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
          >
            <option value="OPERADOR">Operador</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="ADMINISTRADOR">Administrador</option>
          </select>
        </div>
      </div>
    </header>
  );
}

function StatusChip({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: statusColor[value] ?? "var(--state-offline)" }}
      />
      {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      <span className="tech-label">{label}:</span>
      <span className="font-mono text-[10px] tracking-wider text-foreground">{value}</span>
    </span>
  );
}

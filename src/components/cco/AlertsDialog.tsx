import { Bell } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Alarm, SelectedObject } from "@/lib/cco/types";
import { AlarmPanel } from "./AlarmPanel";

export function AlertsDialog({
  alarms,
  onSelect,
}: {
  alarms: Alarm[];
  onSelect: (selection: SelectedObject) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = alarms.filter((alarm) => !alarm.resolved);
  const critical = active.some((alarm) => alarm.severity === "CRITICO");
  const locate = (alarm: Alarm) => {
    setOpen(false);
    onSelect({ kind: alarm.objectKind, id: alarm.objectId });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Alertas: ${active.length} ativo(s)`}
          className={`flex min-h-9 items-center gap-2 rounded border px-3 font-mono text-[11px] font-bold tracking-widest uppercase shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
            critical
              ? "border-danger bg-danger text-white hover:bg-danger/85"
              : active.length
                ? "border-caution bg-caution text-background hover:bg-caution/85"
                : "border-primary bg-primary text-primary-foreground hover:bg-primary/85"
          }`}
        >
          <Bell className={`h-4 w-4 ${critical ? "lamp" : ""}`} />
          Alertas
          <span className="min-w-5 rounded bg-background/20 px-1.5 py-0.5 text-center tabular-nums">
            {active.length}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="flex h-[min(680px,85dvh)] w-[calc(100%_-_2rem)] max-w-5xl flex-col gap-0 overflow-hidden border-border-strong bg-surface p-0">
        <DialogHeader className="shrink-0 px-5 py-4 pr-12">
          <DialogTitle className="flex items-center gap-2 font-mono text-sm tracking-widest uppercase">
            <Bell className="h-4 w-4 text-primary" /> Alertas dos equipamentos
          </DialogTitle>
          <DialogDescription className="text-xs">
            Ocorrências da malha, atualizadas ao vivo. Localize o equipamento para consultar seus
            detalhes.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1">
          <AlarmPanel alarms={alarms} onLocate={locate} onSelectAlarm={locate} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

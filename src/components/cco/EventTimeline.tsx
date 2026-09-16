import { formatClock } from "@/lib/cco/geometry";
import type { OperationalEvent } from "@/lib/cco/types";
import { severityColor } from "./map/palette";

export function EventTimeline({
  events,
  onFocus,
}: {
  events: OperationalEvent[];
  onFocus: (event: OperationalEvent) => void;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-border px-3 py-1.5">
        <h2 className="font-mono text-[11px] font-semibold tracking-widest uppercase">
          Eventos recentes
        </h2>
      </header>
      <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
        {events.slice(0, 40).map((event) => (
          <li key={event.id}>
            <button
              type="button"
              onClick={() => onFocus(event)}
              className="flex w-full items-start gap-2 px-3 py-1.5 text-left transition-colors hover:bg-surface-2"
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: severityColor[event.severity] }}
              />
              <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                {formatClock(event.timestamp)}
              </span>
              <span className="flex-1 font-mono text-[10.5px] text-foreground">{event.message}</span>
            </button>
          </li>
        ))}
        {events.length === 0 ? (
          <li className="px-3 py-3 font-mono text-[10px] text-muted-foreground">
            Aguardando eventos...
          </li>
        ) : null}
      </ul>
    </section>
  );
}

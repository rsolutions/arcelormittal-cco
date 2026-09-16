import { pointAt } from "./geometry";
import type { CcoState, ObjectKind, Point } from "./types";

/** Resolve the map coordinate of any operational object (for LOCALIZAR / focus). */
export function locateObject(
  state: CcoState,
  kind: ObjectKind,
  id: string,
): Point | null {
  switch (kind) {
    case "TREM":
      return state.trains.find((t) => t.id === id)?.position ?? null;
    case "SINAL":
      return state.signals.find((s) => s.id === id)?.position ?? null;
    case "ESTACAO":
      return state.stations.find((s) => s.id === id)?.position ?? null;
    case "AMV":
      return state.switches.find((s) => s.id === id)?.point ?? null;
    case "PATIO": {
      const yard = state.yards.find((y) => y.id === id);
      return yard ? { x: yard.position.x + yard.width / 2, y: yard.position.y } : null;
    }
    case "TRECHO": {
      const segment = state.segments.find((s) => s.id === id);
      return segment ? pointAt(segment.points, 0.5) : null;
    }
    case "ALARME": {
      const alarm = state.alarms.find((a) => a.id === id);
      return alarm ? locateObject(state, alarm.objectKind, alarm.objectId) : null;
    }
    default:
      return null;
  }
}

/** Best-effort kind inference from an object id (used by search and events). */
export function inferKind(id: string): ObjectKind {
  if (id.startsWith("S-")) return "SINAL";
  if (id.startsWith("T-")) return "TRECHO";
  if (id.startsWith("AMV")) return "AMV";
  if (id.startsWith("EST")) return "ESTACAO";
  if (id.startsWith("PAT")) return "PATIO";
  return "TREM";
}

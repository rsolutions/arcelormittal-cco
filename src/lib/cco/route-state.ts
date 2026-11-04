import type { Point, Signal, TrackSegment, Yard } from "./types";

export type RouteTone = "AZUL" | "BRANCA" | "CINZA";

export interface RouteSpan {
  points: Point[];
  tone: RouteTone;
}

/** Equipment disconnection is the only reason for a grey signal. */
export function signalAspect(signal: Signal): Signal["aspect"] {
  if (signal.status === "OFFLINE") return "CINZA";
  if (signal.status === "FALHA") return "VERMELHO";
  return signal.aspect === "CINZA" ? "VERMELHO" : signal.aspect;
}

/** A stop withdraws the route; a missing indication makes it unknown. */
export function routeTone(signals: readonly Signal[]): RouteTone {
  if (!signals.length) return "BRANCA";
  const aspects = signals.map(signalAspect);
  if (aspects.includes("VERMELHO")) return "BRANCA";
  if (aspects.includes("CINZA")) return "CINZA";
  return "AZUL";
}

export function yardSignals(yard: Yard, signals: readonly Signal[]): Signal[] {
  return signals
    .filter((signal) => signal.yardId === yard.id)
    .sort((a, b) => {
      if (a.direction !== b.direction) return a.direction === "LESTE" ? -1 : 1;
      return (a.label ?? a.id).localeCompare(b.label ?? b.id, "pt-BR", { numeric: true });
    });
}

/** Left-side entry signals define sidings, independently of the westbound main route. */
export function yardTrackTone(
  yard: Yard,
  trackIndex: number,
  signals: readonly Signal[],
): RouteTone {
  const labels = yard.layout?.trackSignalLabels[trackIndex] ?? [];
  return routeTone(
    yardSignals(yard, signals).filter((signal) => labels.includes(signal.label ?? "")),
  );
}

/** Right-to-left routes use the principal track and the consecutive right-side signals. */
export function mainRouteSpans(segment: TrackSegment, signals: readonly Signal[]): RouteSpan[] {
  const start = segment.points[0];
  const end = segment.points.at(-1);
  if (!start || !end) return [];
  const mainSignals = signals
    .filter((signal) => signal.line === segment.line && signal.direction === "OESTE")
    .sort((a, b) => a.position.x - b.position.x);
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const boundaries = [
    ...new Set([
      minX,
      ...mainSignals
        .map((signal) => signal.anchor?.x ?? signal.position.x)
        .filter((x) => x > minX && x < maxX),
      maxX,
    ]),
  ].sort((a, b) => a - b);
  return boundaries.slice(0, -1).map((x, index) => {
    const nextX = boundaries[index + 1]!;
    const middle = (x + nextX) / 2;
    const left = mainSignals.filter((signal) => signal.position.x <= middle).at(-1);
    const right = mainSignals.find((signal) => signal.position.x >= middle);
    let tone = routeTone([left, right].filter((signal): signal is Signal => Boolean(signal)));
    if (["BLOQUEADO", "MANUTENCAO", "FALHA"].includes(segment.status)) tone = "BRANCA";
    if (segment.status === "SEM_COMUNICACAO") tone = "CINZA";
    const at = (px: number): Point => ({
      x: px,
      y: start.y + (end.y - start.y) * (end.x === start.x ? 0 : (px - start.x) / (end.x - start.x)),
    });
    return { points: [at(x), at(nextX)], tone };
  });
}

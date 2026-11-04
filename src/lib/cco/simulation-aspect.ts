import type { Signal, TrackSegment } from "./types";

/** Demo policy: ordinary traffic stays blue; explicit restrictions withdraw routes. */
export function simulatedSignalAspect(
  signal: Signal,
  protectedSegment: TrackSegment | undefined,
): Signal["aspect"] {
  if (signal.status === "OFFLINE") return "CINZA";
  if (signal.status === "FALHA" || !protectedSegment) return "VERMELHO";
  return protectedSegment.status === "NORMAL" || protectedSegment.status === "OCUPADO"
    ? "AZUL"
    : "VERMELHO";
}

import type { Point } from "./types";

export function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
}

/** Point at normalized progress (0..1) along a polyline. */
export function pointAt(points: Point[], t: number): Point {
  const clamped = Math.min(1, Math.max(0, t));
  const target = polylineLength(points) * clamped;
  let walked = 0;
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (walked + len >= target || i === points.length - 1) {
      const local = len === 0 ? 0 : (target - walked) / len;
      return { x: a.x + (b.x - a.x) * local, y: a.y + (b.y - a.y) * local };
    }
    walked += len;
  }
  return points[points.length - 1]!;
}

/** Heading in degrees at normalized progress. */
export function headingAt(points: Point[], t: number): number {
  const a = pointAt(points, Math.max(0, t - 0.02));
  const b = pointAt(points, Math.min(1, t + 0.02));
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

export function pathFrom(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

export function formatKm(km: number): string {
  const whole = Math.floor(km);
  const meters = Math.round((km - whole) * 1000);
  return `KM ${whole}+${String(meters).padStart(3, "0")}`;
}

export function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour12: false });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("pt-BR");
}

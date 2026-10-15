import type { Point, YardLayout } from "./types";

/** S/E drawings: coordinates preserve topology and symbol clearance, not a metre scale. */
export function projectYardLayout(index: number, origin: number, mainY: number): YardLayout {
  const p = (x: number, y: number): Point => ({ x: origin + x, y: mainY + y });
  const layout: YardLayout = {
    tracks: [], switches: [], signals: [], dimensions: [],
    labelPoint: p(115, 190), sheet: index + 4,
  };
  const key = (x: number, y: number, bx: number, by: number, label: string) => {
    layout.switches.push({ point: p(x, y), branch: p(bx, by), label, labelPoint: p(x + 5, y + 22) });
  };
  const signal = (x: number, y: number, label: string, right = false) => {
    layout.signals.push({ label, point: p(x, y + (right ? -25 : 25)), anchor: p(x, y),
      labelPoint: p(x, y + (right ? -41 : 43)), direction: right ? "OESTE" : "LESTE" });
  };
  const dimension = (x1: number, x2: number, y: number, label: string) => {
    layout.dimensions.push({ from: p(x1, y), to: p(x2, y), label });
  };
  if (index === 5) {
    // Green Hill has only an upper dead-end branch, never a lower passing loop.
    layout.tracks.push([p(100, -65), p(125, -65), p(160, 0)]);
    key(160, 0, 149, -20, "SC1");
    signal(190, 0, "1D", true);
    dimension(160, 190, -105, "5 m");
    return layout;
  }
  layout.tracks.push([p(65, 0), p(95, 65), p(160, 65), p(190, 0)]);
  key(65, 0, 76, 24, "SC1");
  key(190, 0, 179, 24, "SC1");
  const doubleEntry = [1, 2, 3, 7].includes(index);
  signal(doubleEntry ? 12 : 35, 0, "1E");
  if (doubleEntry) signal(40, 0, "2E");
  signal(220, 0, "1D", true);
  dimension(doubleEntry ? 40 : 35, 65, -65, "5 m");
  dimension(190, 220, -65, "5 m");
  if (doubleEntry) dimension(12, 40, 105, "800 m");
  if (index === 1) {
    // Gae Peter Town: a second loop connected at both ends to the first siding.
    layout.tracks.push([p(105, 65), p(120, 130), p(135, 130), p(150, 65)]);
    key(105, 65, 111, 90, "MC1");
    key(150, 65, 144, 90, "MC1");
    dimension(65, 105, 155, "150 m");
    dimension(150, 220, 175, "1500 m");
  } else if ([2, 3, 4, 6, 7].includes(index)) {
    const start = index === 3 ? 105 : index === 7 ? 135 : 120;
    layout.tracks.push([p(start, 65), p(start + 30, 130), p(start + 52, 130)]);
    key(start, 65, start + 11, 89, "MC1");
    if (index !== 3) {
      signal(start - 27, 100, [2, 7].includes(index) ? "3E" : "2E");
      dimension(start - 27, start, 169, "5 m");
    }
    const distances: Record<number, string> = { 2: "1100 m", 3: "200 m", 4: "800 m", 6: "500 m", 7: "1000 m" };
    dimension(65, start, 205, distances[index] ?? "");
    layout.labelPoint = p(115, 240);
  }
  return layout;
}
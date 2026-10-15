import type { Point, YardLayout } from "./types";

/** AML sheets 4–13 are S/E. Clearances are drawing units, never metres.
 * The small breaks at the turnouts are intentional, as on the individual sheets.
 * Devices stand beside the rail; their symbol is not the turnout endpoint.
 */
export function projectYardLayout(index: number, origin: number, mainY: number): YardLayout {
  const p = (x: number, y: number): Point => ({ x: origin + x, y: mainY + y });
  const layout: YardLayout = {
    tracks: [], switches: [], signals: [], dimensions: [],
    labelPoint: p(120, 245), sheet: index + 4,
  };
  const key = (x: number, y: number, bx: number, by: number, sx: number, sy: number, label: string, manual = false) => {
    layout.switches.push({ point: p(x, y), branch: p(bx, by), symbolPoint: p(sx, sy),
      label, labelPoint: p(sx, sy - 13), crossoverType: manual ? "MANUAL" : "SPRING" });
  };
  // Signal bases are beside their respective approach, not attached to another track.
  const signal = (x: number, y: number, label: string, right = false) => {
    layout.signals.push({ label, point: p(x, y), anchor: p(x, y + (right ? 14 : -14)),
      labelPoint: p(x, y + (right ? -15 : 19)), direction: right ? "OESTE" : "LESTE" });
  };
  const dimension = (x1: number, x2: number, y: number, label: string) => {
    layout.dimensions.push({ from: p(x1, y), to: p(x2, y), label });
  };
  if (index === 5) {
    layout.tracks.push([p(110, -80), p(130, -80), p(160, -7), p(180, -7)]);
    key(160, -7, 150, -31, 174, 22, "SC1");
    signal(220, -24, "1D", true);
    dimension(174, 220, -57, "5 m");
    return layout;
  }
  // Standard passing track: distinct main line, turnout clearance and full lower lane.
  layout.tracks.push([p(52, 7), p(70, 7), p(100, 80), p(175, 80), p(205, 7), p(220, 7)]);
  key(70, 7, 80, 31, 61, 25, "SC1");
  key(205, 7, 195, 31, 215, 25, "SC1");
  const doubleEntry = [1, 2, 3, 7].includes(index);
  signal(doubleEntry ? 5 : 31, 25, "1E");
  if (doubleEntry) signal(35, 25, "2E");
  signal(241, -24, "1D", true);
  dimension(doubleEntry ? 35 : 31, 61, -57, "5 m");
  dimension(215, 241, -57, "5 m");
  if (doubleEntry) dimension(5, 35, 178, "800 m");
  if (index === 1) {
    // Separate lower crossover drawing with a break below the passing track.
    layout.tracks.push([p(116, 88), p(128, 160), p(143, 160), p(158, 88)]);
    key(116, 88, 120, 112, 103, 108, "MC1", true);
    key(158, 88, 153, 112, 170, 108, "MC1", true);
    dimension(61, 103, 198, "150 m");
    dimension(170, 215, 220, "1500 m");
  } else if ([2, 3, 4, 6, 7].includes(index)) {
    // The manual turnout starts on the lower track, never on the main line.
    const start = index === 3 ? 115 : index === 7 ? 157 : 148;
    layout.tracks.push([p(start - 15, 88), p(start, 88), p(start + 30, 160), p(start + 51, 160)]);
    key(start, 88, start + 10, 112, start - 12, 108, "MC1", true);
    if (index !== 3) {
      signal(start - 28, 134, [2, 7].includes(index) ? "3E" : "2E");
      dimension(start - 28, start - 12, 188, "5 m");
    }
    const distances: Record<number, string> = { 2: "1100 m", 3: "200 m", 4: "800 m", 6: "500 m", 7: "1000 m" };
    dimension(61, start - 12, 220, distances[index] ?? "");
  }
  return layout;
}
import type { Point } from "./types";

// Presentation coordinates only: the operating corridor and simulation stay continuous.
export const SCHEMATIC_ROWS = [
  {
    id: "upper",
    label: "01 · MOKRA — BAKHON",
    startX: 0,
    endX: 1450,
    offset: { x: 0, y: -120 },
  },
  {
    id: "lower",
    label: "02 · GREEN HILL — SANNIQUELLE",
    startX: 1450,
    endX: 2900,
    offset: { x: -1450, y: 320 },
  },
] as const;

export const SCHEMATIC_VIEWBOX = { x: -60, y: 60, width: 1640, height: 900 };

/** Project an operational coordinate into its displayed row, including object focus. */
export function projectSchematicPoint(point: Point): Point {
  const row = point.x < SCHEMATIC_ROWS[0].endX ? SCHEMATIC_ROWS[0] : SCHEMATIC_ROWS[1];
  return { x: point.x + row.offset.x, y: point.y + row.offset.y };
}

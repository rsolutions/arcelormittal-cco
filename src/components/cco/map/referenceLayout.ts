/** Presentation coordinates traced from the approved schematic, independent of simulation geometry. */
export const DIAGRAM_MAIN_Y = 320;
export const REFERENCE_YARDS = [
  { name: "MOKRA", left: 12, right: 70, depth: 19 },
  { name: "GAE PETER TOWN", left: 89, right: 148, depth: 35 },
  { name: "BLEZI", left: 168, right: 225, depth: 19 },
  { name: "GREBO", left: 246, right: 304, depth: 35 },
  { name: "BAKHON", left: 317, right: 375, depth: 19 },
  { name: "GREEN HILL", left: 396, right: 443, depth: 0 },
  { name: "YILA", left: 443, right: 502, depth: 35 },
  { name: "TROPOI", left: 524, right: 582, depth: 35 },
  { name: "KITOMA", left: 607, right: 666, depth: 19 },
  { name: "SANNIQUELLE", left: 683, right: 742, depth: 19 },
] as const;
export const diagramX = (x: number) => x * 1600 / 755;
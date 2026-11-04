/**
 * ArcelorMittal Liberia demonstration corridor.
 * Pure geometry + initial states — no runtime logic here.
 */
import { pointAt } from "./geometry";
import { projectYardLayout } from "./yard-layouts";
import type {
  Alarm,
  KmMarker,
  LineId,
  Point,
  RailSwitch,
  Signal,
  Station,
  TrackSegment,
  Train,
  Yard,
} from "./types";

export const MAP_VIEWBOX = { x: 0, y: 40, width: 2900, height: 620 };

const MAIN_Y = 320;
const MAIN_START = 45;
const MAIN_END = 2855;

function seg(
  id: string,
  name: string,
  startKm: number,
  endKm: number,
  points: Point[],
  speedLimit: number,
): TrackSegment {
  return {
    id,
    name,
    line: "L1",
    startKm,
    endKm,
    points,
    status: "NORMAL",
    occupancy: null,
    speedLimit,
    lastUpdate: 0,
  };
}

const p = (x: number, y: number): Point => ({ x, y });

const nodes = [
  MAIN_START,
  ...Array.from({ length: 10 }, (_, index) => 180 + index * 280),
  MAIN_END,
];
const kms = [0, 25, 43, 88, 106, 152, 170, 216, 234, 280, 297, 300];

export const SEGMENTS: TrackSegment[] = nodes
  .slice(0, -1)
  .map((x, index) =>
    seg(
      `T-${String(index + 1).padStart(2, "0")}`,
      `Trecho KM ${kms[index]} → KM ${kms[index + 1]}`,
      kms[index] ?? 0,
      kms[index + 1] ?? 300,
      [p(x, MAIN_Y), p(nodes[index + 1] ?? MAIN_END, MAIN_Y)],
      index === 0 || index === nodes.length - 2 ? 50 : 70,
    ),
  );

export const SEGMENT_MAP: Record<string, TrackSegment> = Object.fromEntries(
  SEGMENTS.map((segment) => [segment.id, segment]),
);

// The named operating points are yards, not passenger stations.
export const STATIONS: Station[] = [];

interface YardSeed {
  id: string;
  name: string;
  km: number;
  x: number;
  depth: number;
  tracksInUse: number;
  tracksTotal: number;
}

const YARD_SEEDS: YardSeed[] = [
  { id: "PAT-MOK", name: "MOKRA", km: 25, x: 110, depth: 36, tracksInUse: 2, tracksTotal: 3 },
  {
    id: "PAT-GPT",
    name: "GAE PETER TOWN",
    km: 88,
    x: 260,
    depth: 68,
    tracksInUse: 3,
    tracksTotal: 4,
  },
  { id: "PAT-BLE", name: "BLEZI", km: 152, x: 410, depth: 36, tracksInUse: 2, tracksTotal: 3 },
  { id: "PAT-GRE", name: "GREBO", km: 216, x: 560, depth: 68, tracksInUse: 3, tracksTotal: 4 },
  { id: "PAT-BAK", name: "BAKHON", km: 280, x: 710, depth: 36, tracksInUse: 2, tracksTotal: 3 },
  { id: "PAT-GRH", name: "GREEN HILL", km: 43, x: 860, depth: 36, tracksInUse: 3, tracksTotal: 4 },
  { id: "PAT-YIL", name: "YILA", km: 106, x: 1010, depth: 68, tracksInUse: 2, tracksTotal: 3 },
  { id: "PAT-TRO", name: "TROPOI", km: 170, x: 1160, depth: 36, tracksInUse: 3, tracksTotal: 4 },
  { id: "PAT-KIT", name: "KITOMA", km: 234, x: 1310, depth: 36, tracksInUse: 2, tracksTotal: 3 },
  {
    id: "PAT-SAN",
    name: "SANNIQUELLE",
    km: 297,
    x: 1460,
    depth: 36,
    tracksInUse: 3,
    tracksTotal: 4,
  },
];

export const YARDS: Yard[] = YARD_SEEDS.map((yard, index) => {
  const origin = 60 + index * 280;
  const layout = projectYardLayout(index, origin, MAIN_Y);
  return {
    id: yard.id,
    name: yard.name,
    km: yard.km,
    position: p(origin, MAIN_Y),
    width: 240,
    height: 245,
    tracksInUse: yard.tracksInUse,
    tracksTotal: yard.tracksTotal,
    layout,
  };
});

function segmentAtX(x: number): TrackSegment {
  const segment =
    SEGMENTS.find((item) => {
      const first = item.points[0];
      const last = item.points.at(-1);
      return first && last && x >= first.x && x <= last.x;
    }) ?? SEGMENTS[0];
  if (!segment) throw new Error("Operating corridor has no segments");
  return segment;
}

// IDs remain stable; project markings and placement come from each yard layout.
let signalNumber = 101;
export const SIGNALS: Signal[] = YARDS.flatMap((yard) =>
  (yard.layout?.signals ?? []).map((item) => {
    const segment = segmentAtX(item.anchor.x);
    return {
      id: `S-${signalNumber++}`,
      label: item.label,
      yardId: yard.id,
      km: yard.km,
      direction: item.direction,
      line: "L1" as const,
      aspect: "AZUL" as const,
      status: "ONLINE" as const,
      segmentId: segment.id,
      protects: segment.id,
      position: item.point,
      anchor: item.anchor,
      labelPoint: item.labelPoint,
      lastUpdate: 0,
      lastEvent: `Inicialização — ${yard.name}, sinal ${item.label}`,
    };
  }),
);
let switchNumber = 1;
export const SWITCHES: RailSwitch[] = YARDS.flatMap((yard) =>
  (yard.layout?.switches ?? []).map((item) => ({
    id: `AMV-${String(switchNumber++).padStart(2, "0")}`,
    label: item.label,
    labelPoint: item.labelPoint,
    symbolPoint: item.symbolPoint,
    crossoverType: item.crossoverType,
    yardName: yard.name,
    km: yard.km,
    line: "L1" as const,
    position: "NORMAL" as const,
    status: "NORMAL" as const,
    occupancy: null,
    point: item.point,
    branch: item.branch,
    lastUpdate: 0,
  })),
);

export const KM_MARKERS: KmMarker[] = [
  { km: 0, position: p(MAIN_START, MAIN_Y) },
  { km: 50, position: p(513, MAIN_Y) },
  { km: 100, position: p(982, MAIN_Y) },
  { km: 150, position: p(1450, MAIN_Y) },
  { km: 200, position: p(1918, MAIN_Y) },
  { km: 250, position: p(2387, MAIN_Y) },
  { km: 300, position: p(MAIN_END, MAIN_Y) },
];

export interface RouteStep {
  segmentId: string;
  reverse: boolean;
}

const allSegmentIds = SEGMENTS.map((segment) => segment.id);
const fwd = (ids: string[]): RouteStep[] => ids.map((segmentId) => ({ segmentId, reverse: false }));
const rev = (ids: string[]): RouteStep[] =>
  [...ids].reverse().map((segmentId) => ({ segmentId, reverse: true }));

export const ROUTES: Record<string, RouteStep[]> = {
  CORREDOR_LESTE: fwd(allSegmentIds),
  CORREDOR_OESTE: rev(allSegmentIds),
};

export interface TrainSeed {
  id: string;
  prefix: string;
  line: Train["line"];
  direction: Train["direction"];
  routeId: keyof typeof ROUTES;
  routeIndex: number;
  progress: number;
  speed: number;
  cars: number;
  origin: string;
  destination: string;
}

export const TRAIN_SEEDS: TrainSeed[] = [
  {
    id: "3021",
    prefix: "AML-3021",
    line: "L1",
    direction: "LESTE",
    routeId: "CORREDOR_LESTE",
    routeIndex: 1,
    progress: 0.35,
    speed: 58,
    cars: 42,
    origin: "MOKRA",
    destination: "SANNIQUELLE",
  },
  {
    id: "4012",
    prefix: "AML-4012",
    line: "L1",
    direction: "LESTE",
    routeId: "CORREDOR_LESTE",
    routeIndex: 4,
    progress: 0.6,
    speed: 52,
    cars: 38,
    origin: "GAE PETER TOWN",
    destination: "BAKHON",
  },
  {
    id: "2020",
    prefix: "AML-2020",
    line: "L1",
    direction: "OESTE",
    routeId: "CORREDOR_OESTE",
    routeIndex: 1,
    progress: 0.4,
    speed: 46,
    cars: 50,
    origin: "SANNIQUELLE",
    destination: "MOKRA",
  },
  {
    id: "5110",
    prefix: "AML-5110",
    line: "L1",
    direction: "LESTE",
    routeId: "CORREDOR_LESTE",
    routeIndex: 7,
    progress: 0.5,
    speed: 61,
    cars: 44,
    origin: "BLEZI",
    destination: "KITOMA",
  },
  {
    id: "6204",
    prefix: "AML-6204",
    line: "L1",
    direction: "OESTE",
    routeId: "CORREDOR_OESTE",
    routeIndex: 5,
    progress: 0.3,
    speed: 48,
    cars: 54,
    origin: "GREBO",
    destination: "GREEN HILL",
  },
  {
    id: "7301",
    prefix: "AML-7301",
    line: "L1",
    direction: "OESTE",
    routeId: "CORREDOR_OESTE",
    routeIndex: 8,
    progress: 0.2,
    speed: 35,
    cars: 36,
    origin: "SANNIQUELLE",
    destination: "YILA",
  },
];

export const INITIAL_ALARMS: Alarm[] = [];

const eastboundYards = [...YARD_SEEDS].sort((a, b) => a.km - b.km).map((yard) => yard.name);

export const STATION_ORDER: Record<string, string[]> = {
  CORREDOR_LESTE: eastboundYards,
  CORREDOR_OESTE: [...eastboundYards].reverse(),
};

export const LINE_LABELS: Record<LineId, string> = {
  L1: "Corredor Principal",
  L2: "Corredor Principal",
  RN: "Corredor Principal",
};

/**
 * ArcelorMittal Liberia demonstration corridor.
 * Pure geometry + initial states — no runtime logic here.
 */
import { pointAt } from "./geometry";
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

export const MAP_VIEWBOX = { x: 0, y: 40, width: 1600, height: 620 };

const MAIN_Y = 320;
const MAIN_START = 45;
const MAIN_END = 1555;

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

const nodes = [MAIN_START, 170, 260, 490, 580, 810, 900, 1130, 1220, 1450, 1535, MAIN_END];
const kms = [0, 25, 43, 88, 106, 152, 170, 216, 234, 280, 297, 300];

export const SEGMENTS: TrackSegment[] = nodes.slice(0, -1).map((x, index) =>
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
  side: "ABOVE" | "BELOW";
  tracksInUse: number;
  tracksTotal: number;
}

const YARD_SEEDS: YardSeed[] = [
  { id: "PAT-MOK", name: "MOKRA", km: 25, x: 170, side: "ABOVE", tracksInUse: 2, tracksTotal: 3 },
  { id: "PAT-GPT", name: "GAE PETER TOWN", km: 88, x: 490, side: "ABOVE", tracksInUse: 3, tracksTotal: 4 },
  { id: "PAT-BLE", name: "BLEZI", km: 152, x: 810, side: "ABOVE", tracksInUse: 2, tracksTotal: 3 },
  { id: "PAT-GRE", name: "GREBO", km: 216, x: 1130, side: "ABOVE", tracksInUse: 3, tracksTotal: 4 },
  { id: "PAT-BAK", name: "BAKHON", km: 280, x: 1450, side: "ABOVE", tracksInUse: 2, tracksTotal: 3 },
  { id: "PAT-GRH", name: "GREEN HILL", km: 43, x: 260, side: "BELOW", tracksInUse: 3, tracksTotal: 4 },
  { id: "PAT-YIL", name: "YILA", km: 106, x: 580, side: "BELOW", tracksInUse: 2, tracksTotal: 3 },
  { id: "PAT-TRO", name: "TROPOI", km: 170, x: 900, side: "BELOW", tracksInUse: 3, tracksTotal: 4 },
  { id: "PAT-KIT", name: "KITOMA", km: 234, x: 1220, side: "BELOW", tracksInUse: 2, tracksTotal: 3 },
  { id: "PAT-SAN", name: "SANNIQUELLE", km: 297, x: 1535, side: "BELOW", tracksInUse: 3, tracksTotal: 4 },
];

export const YARDS: Yard[] = YARD_SEEDS.map((yard) => ({
  id: yard.id,
  name: yard.name,
  km: yard.km,
  position: p(yard.x - 62, yard.side === "ABOVE" ? 185 : 385),
  width: 124,
  height: 72,
  tracksInUse: yard.tracksInUse,
  tracksTotal: yard.tracksTotal,
}));

interface SignalSeed {
  id: string;
  km: number;
  direction: Signal["direction"];
  segmentId: string;
  protects: string;
  t: number;
  offset: number;
}

const SIGNAL_SEEDS: SignalSeed[] = SEGMENTS.slice(0, -1).flatMap((segment, index) => {
  const next = SEGMENTS[index + 1] ?? segment;
  const currentNumber = index * 2 + 1;
  return [
    {
      id: `S-${String(101 + currentNumber - 1)}`,
      km: segment.endKm - 2,
      direction: "LESTE" as const,
      segmentId: segment.id,
      protects: next.id,
      t: 0.82,
      offset: -24,
    },
    {
      id: `S-${String(102 + currentNumber - 1)}`,
      km: segment.startKm + 2,
      direction: "OESTE" as const,
      segmentId: segment.id,
      protects: segment.id,
      t: 0.18,
      offset: 24,
    },
  ];
});

export const SIGNALS: Signal[] = SIGNAL_SEEDS.map((seed) => {
  const segment = SEGMENT_MAP[seed.segmentId];
  const base = segment ? pointAt(segment.points, seed.t) : p(MAIN_START, MAIN_Y);
  return {
    id: seed.id,
    km: seed.km,
    direction: seed.direction,
    line: "L1",
    aspect: "VERDE",
    status: "ONLINE",
    segmentId: seed.segmentId,
    protects: seed.protects,
    position: { x: base.x, y: base.y + seed.offset },
    lastUpdate: 0,
    lastEvent: "Inicialização — aspecto VERDE",
  } satisfies Signal;
});

export const SWITCHES: RailSwitch[] = YARD_SEEDS.map((yard, index) => ({
  id: `AMV-${String(index + 1).padStart(2, "0")}`,
  km: yard.km,
  line: "L1",
  position: "NORMAL",
  status: "NORMAL",
  occupancy: null,
  point: p(yard.x, MAIN_Y),
  branch: p(yard.x + 34, yard.side === "ABOVE" ? MAIN_Y - 42 : MAIN_Y + 42),
  lastUpdate: 0,
}));

export const KM_MARKERS: KmMarker[] = [
  { km: 0, position: p(MAIN_START, MAIN_Y) },
  { km: 50, position: p(295, MAIN_Y) },
  { km: 100, position: p(545, MAIN_Y) },
  { km: 150, position: p(795, MAIN_Y) },
  { km: 200, position: p(1045, MAIN_Y) },
  { km: 250, position: p(1295, MAIN_Y) },
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
  { id: "3021", prefix: "AML-3021", line: "L1", direction: "LESTE", routeId: "CORREDOR_LESTE", routeIndex: 1, progress: 0.35, speed: 58, cars: 42, origin: "MOKRA", destination: "SANNIQUELLE" },
  { id: "4012", prefix: "AML-4012", line: "L1", direction: "LESTE", routeId: "CORREDOR_LESTE", routeIndex: 4, progress: 0.6, speed: 52, cars: 38, origin: "GAE PETER TOWN", destination: "BAKHON" },
  { id: "2020", prefix: "AML-2020", line: "L1", direction: "OESTE", routeId: "CORREDOR_OESTE", routeIndex: 1, progress: 0.4, speed: 46, cars: 50, origin: "SANNIQUELLE", destination: "MOKRA" },
  { id: "5110", prefix: "AML-5110", line: "L1", direction: "LESTE", routeId: "CORREDOR_LESTE", routeIndex: 7, progress: 0.5, speed: 61, cars: 44, origin: "BLEZI", destination: "KITOMA" },
  { id: "6204", prefix: "AML-6204", line: "L1", direction: "OESTE", routeId: "CORREDOR_OESTE", routeIndex: 5, progress: 0.3, speed: 48, cars: 54, origin: "GREBO", destination: "GREEN HILL" },
  { id: "7301", prefix: "AML-7301", line: "L1", direction: "OESTE", routeId: "CORREDOR_OESTE", routeIndex: 8, progress: 0.2, speed: 35, cars: 36, origin: "SANNIQUELLE", destination: "YILA" },
];

export const INITIAL_ALARMS: Alarm[] = [];

const eastboundYards = YARD_SEEDS.sort((a, b) => a.km - b.km).map((yard) => yard.name);

export const STATION_ORDER: Record<string, string[]> = {
  CORREDOR_LESTE: eastboundYards,
  CORREDOR_OESTE: [...eastboundYards].reverse(),
};

export const LINE_LABELS: Record<LineId, string> = {
  L1: "Corredor Principal",
  L2: "Corredor Principal",
  RN: "Corredor Principal",
};
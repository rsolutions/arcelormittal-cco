/**
 * Fictional demonstration network (malha de demonstração).
 * Pure geometry + initial states — no runtime logic here.
 */
import { pointAt } from "./geometry";
import type {
  Alarm,
  KmMarker,
  Point,
  RailSwitch,
  Signal,
  Station,
  TrackSegment,
  Train,
  Yard,
} from "./types";

export const MAP_VIEWBOX = { x: 0, y: 40, width: 1600, height: 620 };

const L1_Y = 180;
const L2_Y = 400;

function seg(
  id: string,
  name: string,
  line: TrackSegment["line"],
  startKm: number,
  endKm: number,
  points: Point[],
  speedLimit: number,
): TrackSegment {
  return {
    id,
    name,
    line,
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

export const SEGMENTS: TrackSegment[] = [
  // LINHA 1 — Norte (principal)
  seg("T-01", "Aurora → Km 118", "L1", 102, 118, [p(120, L1_Y), p(280, L1_Y)], 80),
  seg("T-02", "Km 118 → Central", "L1", 118, 148, [p(280, L1_Y), p(460, L1_Y)], 80),
  seg("T-03", "Central → Km 168", "L1", 148, 168, [p(460, L1_Y), p(650, L1_Y)], 70),
  seg("T-04", "Km 168 → Industrial", "L1", 168, 186, [p(650, L1_Y), p(800, L1_Y)], 70),
  seg("T-05", "Industrial → Km 204", "L1", 186, 204, [p(800, L1_Y), p(980, L1_Y)], 80),
  seg("T-06", "Km 204 → Vale", "L1", 204, 220, [p(980, L1_Y), p(1140, L1_Y)], 80),
  seg("T-07", "Vale → Km 238", "L1", 220, 238, [p(1140, L1_Y), p(1290, L1_Y)], 90),
  seg("T-08", "Km 238 → Terminal Norte", "L1", 238, 256, [p(1290, L1_Y), p(1450, L1_Y)], 60),
  // LINHA 2 — Sul (principal)
  seg("T-09", "Portal → Km 120", "L2", 100, 120, [p(120, L2_Y), p(330, L2_Y)], 80),
  seg("T-10", "Km 120 → Serra", "L2", 120, 140, [p(330, L2_Y), p(520, L2_Y)], 80),
  seg("T-11", "Serra → Km 162", "L2", 140, 162, [p(520, L2_Y), p(740, L2_Y)], 75),
  seg("T-12", "Km 162 → Mirante", "L2", 162, 190, [p(740, L2_Y), p(960, L2_Y)], 75),
  seg("T-13", "Mirante → Km 210", "L2", 190, 210, [p(960, L2_Y), p(1160, L2_Y)], 85),
  seg("T-14", "Km 210 → Terminal Sul", "L2", 210, 240, [p(1160, L2_Y), p(1410, L2_Y)], 60),
  // Desvios de pátio / linhas secundárias
  seg("T-15", "Desvio Pátio Norte", "L1", 200, 206, [p(980, L1_Y), p(1030, 120), p(1140, 120)], 30),
  seg("T-16", "Desvio Pátio Sul", "L2", 160, 166, [p(740, L2_Y), p(790, 470), p(900, 470)], 30),
  // RAMAL OESTE
  seg("T-17", "Central → Entroncamento Oeste", "RN", 148, 156, [p(430, L1_Y), p(360, 250)], 50),
  seg("T-18", "Entroncamento → Km 168", "RN", 156, 168, [p(360, 250), p(360, 430)], 60),
  seg("T-19", "Pátio Oeste (desvio)", "RN", 168, 172, [p(360, 430), p(300, 470), p(210, 470)], 30),
  seg("T-20", "Oeste → Km 182", "RN", 168, 182, [p(360, 430), p(360, 540), p(250, 540)], 55),
  seg("T-21", "Km 182 → Terminal Oeste", "RN", 182, 188, [p(250, 540), p(130, 540)], 40),
  // Entroncamentos entre linhas
  seg(
    "T-22",
    "Entroncamento Industrial (L1↔L2)",
    "L1",
    186,
    192,
    [p(800, L1_Y), p(870, 250), p(870, 330), p(960, L2_Y)],
    40,
  ),
  seg(
    "T-23",
    "Ligação Vale (L1↔L2)",
    "L1",
    238,
    244,
    [p(1290, L1_Y), p(1340, 250), p(1340, 330), p(1290, L2_Y)],
    40,
  ),
];

export const SEGMENT_MAP: Record<string, TrackSegment> = Object.fromEntries(
  SEGMENTS.map((s) => [s.id, s]),
);

export const STATIONS: Station[] = [
  {
    id: "EST-AUR",
    name: "Estação Aurora",
    code: "AUR",
    km: 102,
    line: "L1",
    platforms: 2,
    status: "OPERACIONAL",
    position: p(120, L1_Y),
    lastUpdate: 0,
  },
  {
    id: "EST-CEN",
    name: "Estação Central",
    code: "CEN",
    km: 148,
    line: "L1",
    platforms: 4,
    status: "OPERACIONAL",
    position: p(460, L1_Y),
    lastUpdate: 0,
  },
  {
    id: "EST-IND",
    name: "Estação Industrial",
    code: "IND",
    km: 186,
    line: "L1",
    platforms: 3,
    status: "OPERACIONAL",
    position: p(800, L1_Y),
    lastUpdate: 0,
  },
  {
    id: "EST-VAL",
    name: "Estação Vale",
    code: "VAL",
    km: 220,
    line: "L1",
    platforms: 2,
    status: "OPERACIONAL",
    position: p(1140, L1_Y),
    lastUpdate: 0,
  },
  {
    id: "EST-TNO",
    name: "Terminal Norte",
    code: "TNO",
    km: 256,
    line: "L1",
    platforms: 3,
    status: "OPERACIONAL",
    position: p(1450, L1_Y),
    lastUpdate: 0,
  },
  {
    id: "EST-POR",
    name: "Estação Portal",
    code: "POR",
    km: 100,
    line: "L2",
    platforms: 2,
    status: "OPERACIONAL",
    position: p(120, L2_Y),
    lastUpdate: 0,
  },
  {
    id: "EST-SER",
    name: "Estação Serra",
    code: "SER",
    km: 140,
    line: "L2",
    platforms: 2,
    status: "OPERACIONAL",
    position: p(520, L2_Y),
    lastUpdate: 0,
  },
  {
    id: "EST-MIR",
    name: "Estação Mirante",
    code: "MIR",
    km: 190,
    line: "L2",
    platforms: 3,
    status: "OPERACIONAL",
    position: p(960, L2_Y),
    lastUpdate: 0,
  },
  {
    id: "EST-TSU",
    name: "Terminal Sul",
    code: "TSU",
    km: 240,
    line: "L2",
    platforms: 2,
    status: "OPERACIONAL",
    position: p(1410, L2_Y),
    lastUpdate: 0,
  },
  {
    id: "EST-OES",
    name: "Estação Oeste",
    code: "OES",
    km: 168,
    line: "RN",
    platforms: 2,
    status: "OPERACIONAL",
    position: p(360, 430),
    lastUpdate: 0,
  },
  {
    id: "EST-TOE",
    name: "Terminal Oeste",
    code: "TOE",
    km: 188,
    line: "RN",
    platforms: 2,
    status: "OPERACIONAL",
    position: p(130, 540),
    lastUpdate: 0,
  },
];

export const YARDS: Yard[] = [
  {
    id: "PAT-NOR",
    name: "Pátio Norte",
    km: 204,
    position: p(1020, 84),
    width: 170,
    height: 30,
    tracksInUse: 4,
    tracksTotal: 6,
  },
  {
    id: "PAT-SUL",
    name: "Pátio Sul",
    km: 162,
    position: p(780, 490),
    width: 160,
    height: 30,
    tracksInUse: 2,
    tracksTotal: 5,
  },
  {
    id: "PAT-OES",
    name: "Pátio Oeste",
    km: 170,
    position: p(190, 440),
    width: 140,
    height: 28,
    tracksInUse: 3,
    tracksTotal: 4,
  },
];

interface SignalSeed {
  id: string;
  km: number;
  direction: Signal["direction"];
  line: Signal["line"];
  segmentId: string;
  protects: string;
  t: number;
  offset: number;
}

const SIGNAL_SEEDS: SignalSeed[] = [
  { id: "S-101", km: 116, direction: "NORTE", line: "L1", segmentId: "T-01", protects: "T-02", t: 0.9, offset: -22 },
  { id: "S-102", km: 145.3, direction: "NORTE", line: "L1", segmentId: "T-02", protects: "T-03", t: 0.92, offset: -22 },
  { id: "S-103", km: 166, direction: "NORTE", line: "L1", segmentId: "T-03", protects: "T-04", t: 0.9, offset: -22 },
  { id: "S-104", km: 184, direction: "NORTE", line: "L1", segmentId: "T-04", protects: "T-05", t: 0.9, offset: -22 },
  { id: "S-105", km: 202, direction: "NORTE", line: "L1", segmentId: "T-05", protects: "T-06", t: 0.9, offset: -22 },
  { id: "S-106", km: 218, direction: "NORTE", line: "L1", segmentId: "T-06", protects: "T-07", t: 0.9, offset: -22 },
  { id: "S-107", km: 236, direction: "NORTE", line: "L1", segmentId: "T-07", protects: "T-08", t: 0.9, offset: -22 },
  { id: "S-108", km: 150, direction: "SUL", line: "L1", segmentId: "T-03", protects: "T-02", t: 0.1, offset: 24 },
  { id: "S-109", km: 188, direction: "SUL", line: "L1", segmentId: "T-05", protects: "T-04", t: 0.1, offset: 24 },
  { id: "S-201", km: 118, direction: "LESTE", line: "L2", segmentId: "T-09", protects: "T-10", t: 0.9, offset: -22 },
  { id: "S-202", km: 138, direction: "LESTE", line: "L2", segmentId: "T-10", protects: "T-11", t: 0.9, offset: -22 },
  { id: "S-203", km: 160, direction: "LESTE", line: "L2", segmentId: "T-11", protects: "T-12", t: 0.9, offset: -22 },
  { id: "S-204", km: 188, direction: "LESTE", line: "L2", segmentId: "T-12", protects: "T-13", t: 0.9, offset: -22 },
  { id: "S-205", km: 208, direction: "LESTE", line: "L2", segmentId: "T-13", protects: "T-14", t: 0.9, offset: -22 },
  { id: "S-206", km: 142, direction: "OESTE", line: "L2", segmentId: "T-11", protects: "T-10", t: 0.1, offset: 24 },
  { id: "S-301", km: 155, direction: "OESTE", line: "RN", segmentId: "T-17", protects: "T-18", t: 0.85, offset: 26 },
  { id: "S-302", km: 166, direction: "OESTE", line: "RN", segmentId: "T-18", protects: "T-20", t: 0.9, offset: 26 },
  { id: "S-303", km: 180, direction: "OESTE", line: "RN", segmentId: "T-20", protects: "T-21", t: 0.9, offset: -26 },
];

export const SIGNALS: Signal[] = SIGNAL_SEEDS.map((s) => {
  const base = pointAt(SEGMENT_MAP[s.segmentId].points, s.t);
  const vertical = s.line === "RN" && s.segmentId === "T-18";
  return {
    id: s.id,
    km: s.km,
    direction: s.direction,
    line: s.line,
    aspect: "VERDE",
    status: "ONLINE",
    segmentId: s.segmentId,
    protects: s.protects,
    position: vertical
      ? { x: base.x + s.offset, y: base.y }
      : { x: base.x, y: base.y + s.offset },
    lastUpdate: 0,
    lastEvent: "Inicialização — aspecto VERDE",
  } satisfies Signal;
});

export const SWITCHES: RailSwitch[] = [
  { id: "AMV-01", km: 148, line: "L1", position: "NORMAL", status: "NORMAL", occupancy: null, point: p(430, L1_Y), branch: p(392, 217), lastUpdate: 0 },
  { id: "AMV-02", km: 186, line: "L1", position: "NORMAL", status: "NORMAL", occupancy: null, point: p(800, L1_Y), branch: p(838, 218), lastUpdate: 0 },
  { id: "AMV-03", km: 204, line: "L1", position: "NORMAL", status: "NORMAL", occupancy: null, point: p(980, L1_Y), branch: p(1015, 148), lastUpdate: 0 },
  { id: "AMV-04", km: 238, line: "L1", position: "NORMAL", status: "NORMAL", occupancy: null, point: p(1290, L1_Y), branch: p(1325, 220), lastUpdate: 0 },
  { id: "AMV-05", km: 162, line: "L2", position: "NORMAL", status: "NORMAL", occupancy: null, point: p(740, L2_Y), branch: p(775, 438), lastUpdate: 0 },
  { id: "AMV-06", km: 190, line: "L2", position: "NORMAL", status: "NORMAL", occupancy: null, point: p(960, L2_Y), branch: p(925, 362), lastUpdate: 0 },
  { id: "AMV-07", km: 168, line: "RN", position: "NORMAL", status: "NORMAL", occupancy: null, point: p(360, 430), branch: p(322, 452), lastUpdate: 0 },
  { id: "AMV-08", km: 182, line: "RN", position: "NORMAL", status: "NORMAL", occupancy: null, point: p(250, 540), branch: p(285, 512), lastUpdate: 0 },
];

export const KM_MARKERS: KmMarker[] = [
  { km: 110, position: p(200, L1_Y) },
  { km: 160, position: p(560, L1_Y) },
  { km: 195, position: p(890, L1_Y) },
  { km: 230, position: p(1215, L1_Y) },
  { km: 110, position: p(225, L2_Y) },
  { km: 150, position: p(630, L2_Y) },
  { km: 200, position: p(1060, L2_Y) },
  { km: 175, position: p(360, 490) },
];

export interface RouteStep {
  segmentId: string;
  reverse: boolean;
}

const fwd = (ids: string[]): RouteStep[] => ids.map((segmentId) => ({ segmentId, reverse: false }));
const rev = (ids: string[]): RouteStep[] =>
  [...ids].reverse().map((segmentId) => ({ segmentId, reverse: true }));

export const ROUTES: Record<string, RouteStep[]> = {
  L1_NORTE: fwd(["T-01", "T-02", "T-03", "T-04", "T-05", "T-06", "T-07", "T-08"]),
  L1_SUL: rev(["T-01", "T-02", "T-03", "T-04", "T-05", "T-06", "T-07", "T-08"]),
  L2_LESTE: fwd(["T-09", "T-10", "T-11", "T-12", "T-13", "T-14"]),
  L2_OESTE: rev(["T-09", "T-10", "T-11", "T-12", "T-13", "T-14"]),
  RAMAL_OESTE: fwd(["T-17", "T-18", "T-20", "T-21"]),
  CRUZAMENTO: fwd(["T-01", "T-02", "T-03", "T-04", "T-22", "T-13", "T-14"]),
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
  { id: "3021", prefix: "CGN-3021", line: "L1", direction: "NORTE", routeId: "L1_NORTE", routeIndex: 2, progress: 0.35, speed: 78, cars: 42, origin: "Estação Aurora", destination: "Terminal Norte" },
  { id: "4012", prefix: "PAX-4012", line: "L1", direction: "NORTE", routeId: "L1_NORTE", routeIndex: 5, progress: 0.6, speed: 66, cars: 8, origin: "Estação Central", destination: "Terminal Norte" },
  { id: "2020", prefix: "CGN-2020", line: "L1", direction: "SUL", routeId: "L1_SUL", routeIndex: 1, progress: 0.4, speed: 54, cars: 60, origin: "Terminal Norte", destination: "Estação Aurora" },
  { id: "5110", prefix: "PAX-5110", line: "L2", direction: "LESTE", routeId: "L2_LESTE", routeIndex: 1, progress: 0.5, speed: 72, cars: 6, origin: "Estação Portal", destination: "Terminal Sul" },
  { id: "6204", prefix: "CGN-6204", line: "L2", direction: "OESTE", routeId: "L2_OESTE", routeIndex: 2, progress: 0.3, speed: 48, cars: 54, origin: "Terminal Sul", destination: "Estação Portal" },
  { id: "7301", prefix: "MAN-7301", line: "RN", direction: "OESTE", routeId: "RAMAL_OESTE", routeIndex: 1, progress: 0.2, speed: 35, cars: 12, origin: "Estação Central", destination: "Terminal Oeste" },
];

export const INITIAL_ALARMS: Alarm[] = [];

export const STATION_ORDER: Record<string, string[]> = {
  L1_NORTE: ["EST-AUR", "EST-CEN", "EST-IND", "EST-VAL", "EST-TNO"],
  L1_SUL: ["EST-TNO", "EST-VAL", "EST-IND", "EST-CEN", "EST-AUR"],
  L2_LESTE: ["EST-POR", "EST-SER", "EST-MIR", "EST-TSU"],
  L2_OESTE: ["EST-TSU", "EST-MIR", "EST-SER", "EST-POR"],
  RAMAL_OESTE: ["EST-CEN", "EST-OES", "EST-TOE"],
  CRUZAMENTO: ["EST-AUR", "EST-CEN", "EST-IND", "EST-MIR", "EST-TSU"],
};

export const LINE_LABELS: Record<string, string> = {
  L1: "Linha 1 — Norte",
  L2: "Linha 2 — Sul",
  RN: "Ramal Oeste",
};

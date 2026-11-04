import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mainRouteSpans,
  routeTone,
  signalAspect,
  yardSignals,
  yardTrackTone,
} from "./route-state.ts";
import { projectYardLayout } from "./yard-layouts.ts";
import { simulatedSignalAspect } from "./simulation-aspect.ts";
import type { Signal, TrackSegment, Yard } from "./types";

const signal = (overrides: Partial<Signal> = {}): Signal => ({
  id: "S-TEST",
  yardId: "PAT-BLE",
  label: "1D",
  km: 0,
  direction: "OESTE",
  line: "L1",
  aspect: "AZUL",
  status: "ONLINE",
  segmentId: "T-TEST",
  protects: "T-TEST",
  position: { x: 100, y: 296 },
  anchor: { x: 100, y: 310 },
  lastUpdate: 0,
  lastEvent: "Teste",
  ...overrides,
});
const segment: TrackSegment = {
  id: "T-TEST",
  name: "Referência",
  line: "L1",
  startKm: 0,
  endKm: 1,
  points: [
    { x: 0, y: 320 },
    { x: 400, y: 320 },
  ],
  status: "NORMAL",
  occupancy: null,
  speedLimit: 70,
  lastUpdate: 0,
};
const yard: Yard = {
  id: "PAT-BLE",
  name: "BLEZI",
  km: 152,
  position: { x: 620, y: 320 },
  width: 240,
  height: 245,
  tracksInUse: 2,
  tracksTotal: 3,
  layout: projectYardLayout(2, 620, 320),
};
const bleziSignals = yard.layout!.signals.map((item, index) =>
  signal({
    id: `S-BLE-${index}`,
    label: item.label,
    direction: item.direction,
    position: item.point,
    anchor: item.anchor,
  }),
);

test("ordinary simulated traffic keeps signals and their routes blue", () => {
  const occupied = { ...segment, status: "OCUPADO" as const, occupancy: "3021" };
  const signals = bleziSignals.map((item) => ({
    ...item,
    aspect: simulatedSignalAspect(item, occupied),
  }));
  assert(signals.every((item) => item.aspect === "AZUL"));
  assert(mainRouteSpans(occupied, signals).every((span) => span.tone === "AZUL"));
  assert.equal(yardTrackTone(yard, 0, signals), "AZUL");
  assert.equal(yardTrackTone(yard, 1, signals), "AZUL");
});

test("simulation still highlights explicit restrictions, failures and disconnections", () => {
  for (const status of ["BLOQUEADO", "MANUTENCAO", "FALHA", "SEM_COMUNICACAO"] as const) {
    assert.equal(simulatedSignalAspect(signal(), { ...segment, status }), "VERMELHO");
  }
  assert.equal(simulatedSignalAspect(signal({ status: "FALHA" }), segment), "VERMELHO");
  assert.equal(simulatedSignalAspect(signal({ status: "OFFLINE" }), segment), "CINZA");
  assert.equal(simulatedSignalAspect(signal(), undefined), "VERMELHO");
});

test("only disconnected equipment is shown as grey; a connected failure is red", () => {
  assert.equal(signalAspect(signal({ status: "OFFLINE", aspect: "AZUL" })), "CINZA");
  assert.equal(signalAspect(signal({ status: "FALHA", aspect: "AZUL" })), "VERMELHO");
  assert.equal(signalAspect(signal({ status: "ONLINE", aspect: "CINZA" })), "VERMELHO");
});

test("blue-to-blue is blue, a red indication withdraws the route, missing communication is grey", () => {
  assert.equal(routeTone([signal(), signal()]), "AZUL");
  assert.equal(routeTone([signal(), signal({ aspect: "VERMELHO" })]), "BRANCA");
  assert.equal(routeTone([signal({ aspect: "VERMELHO" }), signal()]), "BRANCA");
  assert.equal(routeTone([signal(), signal({ status: "OFFLINE" })]), "CINZA");
  assert.equal(routeTone([]), "BRANCA");
});

test("main route is split at consecutive right-side signals, never at a siding signal", () => {
  const signals = [
    signal(),
    signal({
      id: "S-2",
      position: { x: 200, y: 296 },
      anchor: { x: 200, y: 310 },
      aspect: "VERMELHO",
    }),
    signal({ id: "S-3", position: { x: 300, y: 296 }, anchor: { x: 300, y: 310 } }),
    signal({
      id: "S-E",
      direction: "LESTE",
      position: { x: 150, y: 345 },
      anchor: { x: 150, y: 331 },
    }),
  ];
  const spans = mainRouteSpans(segment, signals);
  assert.deepEqual(
    spans.map((span) => span.tone),
    ["AZUL", "BRANCA", "BRANCA", "AZUL"],
  );
  assert.deepEqual(
    spans.map((span) => span.points.map((point) => point.x)),
    [
      [0, 100],
      [100, 200],
      [200, 300],
      [300, 400],
    ],
  );
  assert(spans.every((span) => span.points.every((point) => point.y === 320)));
  assert.equal(
    mainRouteSpans({ ...segment, status: "SEM_COMUNICACAO" }, signals)[0]!.tone,
    "CINZA",
  );
  assert(
    mainRouteSpans({ ...segment, status: "MANUTENCAO" }, signals).every(
      (span) => span.tone === "BRANCA",
    ),
  );
});

test("a red entry signal withdraws only the siding; right-to-left remains on the main route", () => {
  const signals = bleziSignals.map((item) =>
    item.label === "1E" ? { ...item, aspect: "VERMELHO" as const } : item,
  );
  assert.equal(yardTrackTone(yard, 0, signals), "BRANCA");
  assert(
    mainRouteSpans(
      {
        ...segment,
        points: [
          { x: 620, y: 320 },
          { x: 880, y: 320 },
        ],
      },
      signals,
    ).every((span) => span.tone === "AZUL"),
  );
  assert.equal(yardTrackTone(yard, 0, bleziSignals), "AZUL");
  assert.equal(
    yardTrackTone(
      yard,
      0,
      bleziSignals.map((item) =>
        item.label === "2E" ? { ...item, status: "OFFLINE" as const } : item,
      ),
    ),
    "CINZA",
  );
});

test("BLEZI exposes exactly its 1E, 2E, 3E and 1D; 3E controls its own spur", () => {
  const signals = [...bleziSignals, signal({ id: "OTHER", yardId: "PAT-OTHER" })];
  assert.deepEqual(
    yardSignals(yard, signals).map((item) => item.label),
    ["1E", "2E", "3E", "1D"],
  );
  const restricted = signals.map((item) =>
    item.label === "3E" ? { ...item, aspect: "VERMELHO" as const } : item,
  );
  assert.equal(yardTrackTone(yard, 0, restricted), "AZUL");
  assert.equal(yardTrackTone(yard, 1, restricted), "BRANCA");
});

test("yard tracks retain their original drawing clearances and documented dimensions", () => {
  for (let index = 0; index < 10; index++) {
    const layout = projectYardLayout(index, 60 + index * 280, 320);
    assert.equal(layout.trackSignalLabels.length, layout.tracks.length);
    assert(layout.dimensions.length > 0);
    assert.equal(layout.tracks[0]!.at(-1)!.y, index === 5 ? 313 : 327);
    if (index !== 5) assert.equal(layout.tracks[0]![0]!.y, 327);
    if (layout.tracks[1]) assert.equal(layout.tracks[1][0]!.y - 400, 8);
    assert(layout.switches.every((item) => [313, 327, 408].includes(item.point.y)));
  }
});

test("BLEZI and the other manual spurs use the same left-hand entry as Grebo", () => {
  const reference = projectYardLayout(3, 0, 320).tracks[1];
  for (const index of [2, 4, 6, 7]) {
    const layout = projectYardLayout(index, 0, 320);
    assert.deepEqual(layout.tracks[1], reference);
    const manual = layout.switches.find((item) => item.crossoverType === "MANUAL")!;
    assert.equal(manual.point.x, 115);
    assert.equal(manual.symbolPoint.x, 103);
  }
});

test("Gae Peter Town has horizontal lead-ins on both sides of its double manual crossover", () => {
  const points = projectYardLayout(1, 0, 320).tracks[1]!;
  assert.equal(points.length, 6);
  assert.equal(points[0]!.y, points[1]!.y);
  assert.equal(points.at(-1)!.y, points.at(-2)!.y);
  assert(points[0]!.x < points[1]!.x);
  assert(points.at(-1)!.x > points.at(-2)!.x);
  assert.equal(points[0]!.x, 100);
  assert.equal(points[0]!.y - 400, 8);
});

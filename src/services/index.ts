/**
 * Service layer — the single seam between UI and data source.
 *
 * Today every service reads from `simulationService` (mock data). To integrate a
 * real CCO backend, reimplement these functions against REST / WebSocket / MQTT
 * / SCADA / CTC / TMS. No component imports mock data directly.
 */
import type { Alarm, CcoState, ScenarioId, TrackSegment } from "@/lib/cco/types";
import { simulationService } from "./simulationService";

export { simulationService };

export const ccoStore = {
  subscribe: simulationService.subscribe,
  getSnapshot: simulationService.getSnapshot,
  onEvent: simulationService.onEvent,
};

export const trainService = {
  list: (state: CcoState) => state.trains,
  byId: (state: CcoState, id: string) => state.trains.find((t) => t.id === id),
  delayed: (state: CcoState) => state.trains.filter((t) => t.delay >= 3),
};

export const signalService = {
  list: (state: CcoState) => state.signals,
  byId: (state: CcoState, id: string) => state.signals.find((s) => s.id === id),
  offline: (state: CcoState) => state.signals.filter((s) => s.status !== "ONLINE"),
};

export const trackService = {
  list: (state: CcoState) => state.segments,
  byId: (state: CcoState, id: string) => state.segments.find((s) => s.id === id),
  occupied: (state: CcoState) => state.segments.filter((s) => s.status === "OCUPADO"),
  setStatus: (id: string, status: TrackSegment["status"]) =>
    simulationService.setSegmentStatus(id, status),
};

export const switchService = {
  list: (state: CcoState) => state.switches,
  byId: (state: CcoState, id: string) => state.switches.find((s) => s.id === id),
  toggle: (id: string) => simulationService.toggleSwitch(id),
};

export const stationService = {
  list: (state: CcoState) => state.stations,
  byId: (state: CcoState, id: string) => state.stations.find((s) => s.id === id),
};

export const alarmService = {
  list: (state: CcoState) => state.alarms,
  active: (state: CcoState) => state.alarms.filter((a) => !a.resolved),
  byId: (state: CcoState, id: string) => state.alarms.find((a) => a.id === id),
  acknowledge: (id: string) => simulationService.acknowledgeAlarm(id),
  mute: (id: string) => simulationService.muteAlarm(id),
  resolve: (id: string) => simulationService.resolveAlarm(id),
  severityRank: (alarm: Alarm) =>
    ({ CRITICO: 0, ALTO: 1, MEDIO: 2, INFO: 3 })[alarm.severity],
};

export const controlService = {
  start: () => simulationService.start(),
  pause: () => simulationService.pause(),
  reset: () => simulationService.reset(),
  setLive: (live: boolean) => simulationService.setLive(live),
  setScenario: (scenario: ScenarioId) => simulationService.setScenario(scenario),
};

/**
 * simulationService — motor de simulação operacional.
 *
 * This is the ONLY module that mutates operational state. UI reads immutable
 * snapshots through `subscribe`/`getSnapshot`, exactly as it would read from a
 * future WebSocket/MQTT gateway (CTC / SCADA / TMS). Replacing this file with a
 * real transport requires no UI changes.
 */
import { pointAt } from "@/lib/cco/geometry";
import {
  KM_MARKERS,
  ROUTES,
  SEGMENTS,
  SIGNALS,
  STATIONS,
  STATION_ORDER,
  SWITCHES,
  TRAIN_SEEDS,
  YARDS,
  type RouteStep,
} from "@/lib/cco/network";
import type {
  Alarm,
  AlarmSeverity,
  CcoRealtimeEvent,
  CcoState,
  ObjectKind,
  ScenarioId,
  Signal,
  TrackSegment,
  Train,
} from "@/lib/cco/types";

const TICK_MS = 1000;
const TIME_SCALE = 40; // simulated seconds per real second (visible movement)

let counter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter += 1)}`;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildInitialState(): CcoState {
  const segments = clone(SEGMENTS);
  const trains: Train[] = TRAIN_SEEDS.map((seed) => {
    const route = ROUTES[seed.routeId];
    const step = route[seed.routeIndex];
    const segment = segments.find((s) => s.id === step.segmentId)!;
    const t = step.reverse ? 1 - seed.progress : seed.progress;
    const stations = STATION_ORDER[seed.routeId];
    return {
      id: seed.id,
      prefix: seed.prefix,
      line: seed.line,
      direction: seed.direction,
      speed: seed.speed,
      km: segment.startKm + (segment.endKm - segment.startKm) * seed.progress,
      status: "EM_CIRCULACAO",
      delay: 0,
      nextStation: stations[Math.min(stations.length - 1, seed.routeIndex + 1)],
      origin: seed.origin,
      destination: seed.destination,
      cars: seed.cars,
      position: pointAt(segment.points, t),
      segmentId: step.segmentId,
      routeIndex: seed.routeIndex,
      progress: seed.progress,
      lastUpdate: 0,
    } satisfies Train;
  });

  return {
    clock: Date.now(),
    running: true,
    live: true,
    scenario: "NORMAL",
    trains,
    signals: clone(SIGNALS),
    segments,
    stations: clone(STATIONS),
    switches: clone(SWITCHES),
    yards: clone(YARDS),
    markers: clone(KM_MARKERS),
    alarms: [],
    events: [],
    audit: [],
    connectivity: {
      overall: "ONLINE",
      server: "ONLINE",
      comms: "ONLINE",
      database: "ONLINE",
      devices: "ONLINE",
      sync: "SINCRONIZADOS",
    },
    kpis: {
      trainsRunning: trains.length,
      trainsDelayed: 0,
      segmentsOccupied: 0,
      criticalAlarms: 0,
      devicesOffline: 0,
      stationsOperational: `${STATIONS.length}/${STATIONS.length}`,
      averageSpeed: 0,
      punctuality: 96.4,
    },
    assistant: [],
  };
}

type Listener = () => void;
type EventListener = (event: CcoRealtimeEvent) => void;

class SimulationEngine {
  private state: CcoState = buildInitialState();
  private listeners = new Set<Listener>();
  private eventListeners = new Set<EventListener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private routeOf = new Map<string, RouteStep[]>();
  private routeIdOf = new Map<string, string>();

  constructor() {
    TRAIN_SEEDS.forEach((seed) => {
      this.routeOf.set(seed.id, ROUTES[seed.routeId]);
      this.routeIdOf.set(seed.id, seed.routeId);
    });
    this.recompute();
    this.log("Sistema CCO inicializado — dados simulados", "SISTEMA", "ALARME", "INFO");
  }

  // ----- store API -------------------------------------------------------
  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    this.ensureStarted();
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.state;

  onEvent = (listener: EventListener) => {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  };

  ensureStarted() {
    if (typeof window === "undefined" || this.timer) return;
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  private emit() {
    this.state = { ...this.state };
    this.listeners.forEach((l) => l());
  }

  private publish(name: CcoRealtimeEvent["name"], payload: unknown) {
    const event: CcoRealtimeEvent = { name, payload, timestamp: Date.now() };
    this.eventListeners.forEach((l) => l(event));
  }

  // ----- logging ---------------------------------------------------------
  private log(
    message: string,
    objectId: string,
    objectKind: ObjectKind,
    severity: AlarmSeverity = "INFO",
  ) {
    this.state.events = [
      { id: uid("evt"), timestamp: Date.now(), message, objectId, objectKind, severity },
      ...this.state.events,
    ].slice(0, 120);
  }

  private raiseAlarm(
    type: string,
    severity: AlarmSeverity,
    objectId: string,
    objectKind: ObjectKind,
    description: string,
  ) {
    const duplicate = this.state.alarms.find(
      (a) => a.objectId === objectId && a.type === type && !a.resolved,
    );
    if (duplicate) return;
    const alarm: Alarm = {
      id: uid("alm"),
      type,
      severity,
      objectId,
      objectKind,
      description,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false,
      muted: false,
    };
    this.state.alarms = [alarm, ...this.state.alarms].slice(0, 80);
    this.log(description, objectId, objectKind, severity);
    this.publish("ALARM_CREATED", alarm);
  }

  private audit(action: string, objectId: string, result: string, operator = "ADMIN") {
    this.state.audit = [
      { id: uid("aud"), timestamp: Date.now(), operator, action, objectId, result },
      ...this.state.audit,
    ].slice(0, 200);
  }

  // ----- simulation ------------------------------------------------------
  private tick() {
    this.state.clock = Date.now();
    if (this.state.running) {
      this.moveTrains();
      this.applyScenarioTick();
      this.randomEvents();
    }
    this.recompute();
    this.emit();
  }

  private segment(id: string): TrackSegment {
    return this.state.segments.find((s) => s.id === id)!;
  }

  private moveTrains() {
    const dtHours = (TICK_MS / 1000) * TIME_SCALE / 3600;
    this.state.trains.forEach((train) => {
      const route = this.routeOf.get(train.id)!;
      const step = route[train.routeIndex];
      const segment = this.segment(step.segmentId);
      const blocked =
        segment.status === "BLOQUEADO" ||
        segment.status === "MANUTENCAO" ||
        segment.status === "FALHA";

      const nextStep = route[(train.routeIndex + 1) % route.length];
      const nextSegment = this.segment(nextStep.segmentId);
      const nextBusy =
        (nextSegment.occupancy && nextSegment.occupancy !== train.id) ||
        nextSegment.status === "BLOQUEADO" ||
        nextSegment.status === "MANUTENCAO";

      if (blocked) {
        train.speed = 0;
        train.status = "RETIDO";
      } else if (nextBusy && train.progress > 0.88) {
        train.speed = 0;
        train.status = "RETIDO";
        train.delay += 0.2;
      } else {
        const target = Math.min(segment.speedLimit, this.state.live ? 40 + Math.random() * 55 : 60);
        train.speed = Math.round(train.speed + (target - train.speed) * 0.25);
        train.status = train.delay >= 3 ? "ATRASADO" : "EM_CIRCULACAO";
      }

      const kmLength = Math.max(1, Math.abs(segment.endKm - segment.startKm));
      train.progress += (train.speed * dtHours) / kmLength;

      if (train.progress >= 1) {
        train.progress = 0;
        train.routeIndex = (train.routeIndex + 1) % route.length;
        const newStep = route[train.routeIndex];
        train.segmentId = newStep.segmentId;
        const stations = STATION_ORDER[this.routeIdOf.get(train.id)!];
        train.nextStation = stations[Math.min(stations.length - 1, train.routeIndex + 1)];
        this.log(
          `Trem ${train.id} entrou no trecho ${newStep.segmentId}`,
          train.id,
          "TREM",
          "INFO",
        );
        this.publish("TRACK_OCCUPANCY_CHANGED", { segmentId: newStep.segmentId, trainId: train.id });
      }

      const activeStep = route[train.routeIndex];
      const activeSegment = this.segment(activeStep.segmentId);
      train.segmentId = activeStep.segmentId;
      const t = activeStep.reverse ? 1 - train.progress : train.progress;
      train.position = pointAt(activeSegment.points, t);
      train.km =
        activeSegment.startKm + (activeSegment.endKm - activeSegment.startKm) * train.progress;
      train.lastUpdate = Date.now();
      this.publish("TRAIN_POSITION_UPDATED", { id: train.id, km: train.km, speed: train.speed });
    });
  }

  private randomEvents() {
    if (Math.random() < 0.04) {
      const train = this.state.trains[Math.floor(Math.random() * this.state.trains.length)];
      train.delay = Math.round((train.delay + 1 + Math.random() * 2) * 10) / 10;
      if (train.delay >= 4) {
        this.raiseAlarm(
          "ATRASO",
          "MEDIO",
          train.id,
          "TREM",
          `Atraso Trem ${train.id} — +${Math.round(train.delay)} min`,
        );
      }
    }
    if (Math.random() < 0.02) {
      const signal = this.state.signals[Math.floor(Math.random() * this.state.signals.length)];
      if (signal.status === "ONLINE") {
        signal.status = "OFFLINE";
        signal.aspect = "CINZA";
        signal.lastUpdate = Date.now();
        signal.lastEvent = "Perda de comunicação";
        this.raiseAlarm(
          "SEM_COMUNICACAO",
          "ALTO",
          signal.id,
          "SINAL",
          `Perda de comunicação com o sinal ${signal.id}`,
        );
        this.publish("DEVICE_OFFLINE", { id: signal.id });
      }
    }
    if (Math.random() < 0.05) {
      const offline = this.state.signals.filter((s) => s.status === "OFFLINE");
      const target = offline[Math.floor(Math.random() * offline.length)];
      if (target) {
        target.status = "ONLINE";
        target.lastUpdate = Date.now();
        target.lastEvent = "Comunicação restabelecida";
        this.log(`Comunicação restabelecida — ${target.id}`, target.id, "SINAL", "INFO");
        this.state.alarms = this.state.alarms.map((a) =>
          a.objectId === target.id && a.type === "SEM_COMUNICACAO" ? { ...a, resolved: true } : a,
        );
        this.publish("DEVICE_ONLINE", { id: target.id });
      }
    }
  }

  private applyScenarioTick() {
    if (this.state.scenario === "ATRASO") {
      const train = this.state.trains.find((t) => t.id === "3021");
      if (train) {
        train.delay = Math.round((train.delay + 0.4) * 10) / 10;
        if (train.delay > 5 && Math.random() < 0.2) {
          this.raiseAlarm(
            "ATRASO_PROGRESSIVO",
            "ALTO",
            train.id,
            "TREM",
            `Atraso progressivo Trem ${train.id} — +${Math.round(train.delay)} min`,
          );
        }
      }
    }
  }

  /** Derived state: occupancy, aspects, switch occupancy, KPIs, assistant. */
  private recompute() {
    const occupancy = new Map<string, string>();
    this.state.trains.forEach((t) => occupancy.set(t.segmentId, t.id));

    this.state.segments.forEach((segment) => {
      const train = occupancy.get(segment.id) ?? null;
      segment.occupancy = train;
      const forced =
        segment.status === "BLOQUEADO" ||
        segment.status === "MANUTENCAO" ||
        segment.status === "FALHA" ||
        segment.status === "SEM_COMUNICACAO";
      if (!forced) segment.status = train ? "OCUPADO" : "NORMAL";
      if (train) segment.lastUpdate = Date.now();
    });

    this.state.signals.forEach((signal) => {
      const previous = signal.aspect;
      signal.aspect = this.aspectFor(signal);
      if (previous !== signal.aspect) {
        signal.lastUpdate = Date.now();
        signal.lastEvent = `Mudança para ${signal.aspect}`;
        this.log(
          `${signal.id} alterado para ${signal.aspect}`,
          signal.id,
          "SINAL",
          signal.aspect === "VERMELHO" ? "MEDIO" : "INFO",
        );
        this.publish("SIGNAL_CHANGED", { id: signal.id, aspect: signal.aspect });
      }
    });

    this.state.switches.forEach((sw) => {
      if (sw.status === "FALHA" || sw.status === "SEM_COMUNICACAO") return;
      const near = this.state.trains.find((t) => Math.abs(t.km - sw.km) < 1.5 && t.line === sw.line);
      sw.occupancy = near ? near.id : null;
      sw.status = near ? "OCUPADO" : sw.position;
    });

    const trains = this.state.trains;
    const delayed = trains.filter((t) => t.delay >= 3).length;
    const offline =
      this.state.signals.filter((s) => s.status !== "ONLINE").length +
      this.state.switches.filter((s) => s.status === "SEM_COMUNICACAO" || s.status === "FALHA")
        .length;
    const criticalAlarms = this.state.alarms.filter(
      (a) => a.severity === "CRITICO" && !a.resolved,
    ).length;
    const operational = this.state.stations.filter((s) => s.status === "OPERACIONAL").length;

    this.state.kpis = {
      trainsRunning: trains.filter((t) => t.status !== "PARADO").length,
      trainsDelayed: delayed,
      segmentsOccupied: this.state.segments.filter((s) => s.status === "OCUPADO").length,
      criticalAlarms,
      devicesOffline: offline,
      stationsOperational: `${operational}/${this.state.stations.length}`,
      averageSpeed: Math.round(trains.reduce((sum, t) => sum + t.speed, 0) / trains.length),
      punctuality: Math.max(
        70,
        Math.round((100 - (delayed / Math.max(1, trains.length)) * 26) * 10) / 10,
      ),
    };

    const degraded = offline > 0 || criticalAlarms > 0;
    this.state.connectivity = {
      overall: criticalAlarms > 1 ? "DEGRADADO" : degraded ? "DEGRADADO" : "ONLINE",
      server: "ONLINE",
      comms: offline > 2 ? "DEGRADADO" : "ONLINE",
      database: "ONLINE",
      devices: offline > 0 ? "DEGRADADO" : "ONLINE",
      sync: this.state.running ? "SINCRONIZADOS" : "DESATUALIZADOS",
    };

    const hints: string[] = [];
    if (criticalAlarms) hints.push(`${criticalAlarms} alarme(s) crítico(s) exigem ação imediata.`);
    if (delayed)
      hints.push(
        `${delayed} trem(ns) com atraso relevante — maior: Trem ${
          [...trains].sort((a, b) => b.delay - a.delay)[0].id
        } +${Math.round([...trains].sort((a, b) => b.delay - a.delay)[0].delay)} min.`,
      );
    if (offline) hints.push(`${offline} equipamento(s) sem comunicação na malha.`);
    const held = trains.filter((t) => t.status === "RETIDO");
    if (held.length)
      hints.push(`Trem ${held[0].id} retido aguardando liberação de trecho à frente.`);
    if (!hints.length) hints.push("Circulação estável — nenhum evento crítico previsto.");
    this.state.assistant = hints.slice(0, 4);
  }

  private aspectFor(signal: Signal): Signal["aspect"] {
    if (signal.status === "OFFLINE") return "CINZA";
    if (signal.status === "FALHA") return "VERMELHO";
    const protects = this.state.segments.find((s) => s.id === signal.protects);
    if (!protects) return "VERDE";
    if (protects.status === "OCUPADO" || protects.status === "BLOQUEADO") return "VERMELHO";
    if (protects.status === "MANUTENCAO" || protects.status === "FALHA") return "VERMELHO";
    const occupiedAhead = this.state.segments.find(
      (s) => s.line === protects.line && s.startKm > protects.endKm && s.status === "OCUPADO",
    );
    if (occupiedAhead && occupiedAhead.startKm - protects.endKm < 20) return "AMARELO";
    return "VERDE";
  }

  // ----- operator commands ----------------------------------------------
  start() {
    this.state.running = true;
    this.audit("Iniciar simulação", "SISTEMA", "Confirmado");
    this.log("Simulação iniciada", "SISTEMA", "ALARME", "INFO");
    this.emit();
  }

  pause() {
    this.state.running = false;
    this.audit("Pausar simulação", "SISTEMA", "Confirmado");
    this.log("Simulação pausada", "SISTEMA", "ALARME", "INFO");
    this.emit();
  }

  reset() {
    const audit = this.state.audit;
    this.state = buildInitialState();
    this.state.audit = audit;
    this.audit("Resetar simulação", "SISTEMA", "Confirmado");
    this.log("Simulação reiniciada — cenário OPERAÇÃO NORMAL", "SISTEMA", "ALARME", "INFO");
    this.recompute();
    this.emit();
  }

  setLive(live: boolean) {
    this.state.live = live;
    this.audit(live ? "Ativar simulação ao vivo" : "Desativar simulação ao vivo", "SISTEMA", "Confirmado");
    this.emit();
  }

  setScenario(scenario: ScenarioId) {
    const audit = this.state.audit;
    const alarms = this.state.alarms;
    this.state = buildInitialState();
    this.state.audit = audit;
    this.state.alarms = alarms.map((a) => ({ ...a, resolved: true }));
    this.state.scenario = scenario;

    switch (scenario) {
      case "ATRASO": {
        const train = this.state.trains.find((t) => t.id === "3021");
        if (train) {
          train.delay = 4;
          train.status = "ATRASADO";
        }
        this.raiseAlarm("ATRASO", "MEDIO", "3021", "TREM", "Atraso Trem 3021 — +04 min");
        break;
      }
      case "FALHA_SINAL": {
        const signal = this.state.signals.find((s) => s.id === "S-105");
        if (signal) {
          signal.status = "FALHA";
          signal.aspect = "VERMELHO";
          signal.lastEvent = "Falha interna detectada";
          signal.lastUpdate = Date.now();
        }
        this.raiseAlarm("FALHA_EQUIPAMENTO", "CRITICO", "S-105", "SINAL", "Falha de sinal S-105");
        break;
      }
      case "TRECHO_OCUPADO": {
        const segment = this.state.segments.find((s) => s.id === "T-14");
        if (segment) segment.status = "FALHA";
        this.raiseAlarm(
          "OCUPACAO_INESPERADA",
          "ALTO",
          "T-14",
          "TRECHO",
          "Ocupação inesperada — Trecho T-14",
        );
        break;
      }
      case "PERDA_COMUNICACAO": {
        const signal = this.state.signals.find((s) => s.id === "S-303");
        if (signal) {
          signal.status = "OFFLINE";
          signal.aspect = "CINZA";
          signal.lastEvent = "Perda de comunicação";
        }
        const sw = this.state.switches.find((s) => s.id === "AMV-07");
        if (sw) sw.status = "SEM_COMUNICACAO";
        this.raiseAlarm(
          "SEM_COMUNICACAO",
          "ALTO",
          "S-303",
          "SINAL",
          "Equipamento S-303 sem comunicação",
        );
        break;
      }
      case "INTERDICAO": {
        const segment = this.state.segments.find((s) => s.id === "T-19");
        if (segment) segment.status = "MANUTENCAO";
        this.raiseAlarm(
          "INTERDICAO",
          "MEDIO",
          "T-19",
          "TRECHO",
          "Trecho T-19 interditado para manutenção",
        );
        break;
      }
      default:
        break;
    }

    this.audit(`Aplicar cenário ${scenario}`, "SISTEMA", "Confirmado");
    this.recompute();
    this.emit();
  }

  acknowledgeAlarm(id: string, operator = "ADMIN") {
    const alarm = this.state.alarms.find((a) => a.id === id);
    if (!alarm) return;
    alarm.acknowledged = true;
    alarm.acknowledgedBy = operator;
    this.audit("Reconhecimento de alarme", alarm.objectId, "Confirmado", operator);
    this.emit();
  }

  muteAlarm(id: string) {
    const alarm = this.state.alarms.find((a) => a.id === id);
    if (!alarm) return;
    alarm.muted = !alarm.muted;
    this.audit(alarm.muted ? "Silenciar alarme" : "Reativar alarme", alarm.objectId, "Confirmado");
    this.emit();
  }

  resolveAlarm(id: string) {
    const alarm = this.state.alarms.find((a) => a.id === id);
    if (!alarm) return;
    alarm.resolved = true;
    alarm.acknowledged = true;
    this.audit("Marcar alarme como resolvido", alarm.objectId, "Resolvido");
    this.log(`Alarme resolvido — ${alarm.description}`, alarm.objectId, alarm.objectKind, "INFO");
    this.publish("ALARM_RESOLVED", alarm);
    this.emit();
  }

  toggleSwitch(id: string) {
    const sw = this.state.switches.find((s) => s.id === id);
    if (!sw) return;
    if (sw.status === "OCUPADO" || sw.status === "SEM_COMUNICACAO") {
      this.audit("Comando AMV", id, "Rejeitado — AMV ocupado/sem comunicação");
      this.log(`Comando rejeitado — ${id} ocupado ou sem comunicação`, id, "AMV", "MEDIO");
      this.emit();
      return;
    }
    sw.position = sw.position === "NORMAL" ? "REVERSO" : "NORMAL";
    sw.status = sw.position;
    sw.lastUpdate = Date.now();
    this.audit("Alteração de AMV", id, `Confirmado ${sw.position}`);
    this.log(`${id} confirmado ${sw.position}`, id, "AMV", "INFO");
    this.publish("SWITCH_POSITION_CHANGED", { id, position: sw.position });
    this.emit();
  }

  setSegmentStatus(id: string, status: TrackSegment["status"]) {
    const segment = this.state.segments.find((s) => s.id === id);
    if (!segment) return;
    segment.status = status;
    segment.lastUpdate = Date.now();
    this.audit("Alteração de estado de trecho", id, `Confirmado ${status}`);
    this.log(`Trecho ${id} alterado para ${status}`, id, "TRECHO", "MEDIO");
    this.recompute();
    this.emit();
  }
}

export const simulationService = new SimulationEngine();

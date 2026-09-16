/**
 * Domain model for the railway CCO.
 *
 * These shapes mirror what a future REST/WebSocket/MQTT gateway (CTC, SCADA,
 * TMS, interlocking) is expected to deliver. UI components must only depend on
 * these types — never on the simulation internals.
 */

export type LineId = "L1" | "L2" | "RN";

export type Direction = "NORTE" | "SUL" | "LESTE" | "OESTE";

export type TrackStatus =
  | "NORMAL"
  | "OCUPADO"
  | "BLOQUEADO"
  | "MANUTENCAO"
  | "FALHA"
  | "SEM_COMUNICACAO";

export type SignalAspect = "VERDE" | "AMARELO" | "VERMELHO" | "CINZA";

export type DeviceStatus = "ONLINE" | "OFFLINE" | "FALHA";

export type SwitchPosition = "NORMAL" | "REVERSO";

export type SwitchStatus = "NORMAL" | "REVERSO" | "OCUPADO" | "FALHA" | "SEM_COMUNICACAO";

export type TrainStatus = "EM_CIRCULACAO" | "PARADO" | "EM_ESTACAO" | "ATRASADO" | "RETIDO";

export type AlarmSeverity = "CRITICO" | "ALTO" | "MEDIO" | "INFO";

export type AccessLevel = "OPERADOR" | "SUPERVISOR" | "ADMINISTRADOR";

export type ViewMode = "OPERACIONAL" | "INFRAESTRUTURA" | "ALARMES";

export type ObjectKind = "TREM" | "ESTACAO" | "SINAL" | "AMV" | "TRECHO" | "PATIO" | "ALARME";

export interface Point {
  x: number;
  y: number;
}

export interface TrackSegment {
  id: string;
  name: string;
  line: LineId;
  startKm: number;
  endKm: number;
  points: Point[];
  status: TrackStatus;
  occupancy: string | null; // train id
  speedLimit: number;
  lastUpdate: number;
}

export interface Signal {
  id: string;
  km: number;
  direction: Direction;
  line: LineId;
  aspect: SignalAspect;
  status: DeviceStatus;
  segmentId: string;
  protects: string; // next segment id
  position: Point;
  lastUpdate: number;
  lastEvent: string;
}

export interface Station {
  id: string;
  name: string;
  code: string;
  km: number;
  line: LineId;
  platforms: number;
  status: "OPERACIONAL" | "RESTRITA" | "INOPERANTE";
  position: Point;
  lastUpdate: number;
}

export interface RailSwitch {
  id: string;
  km: number;
  line: LineId;
  position: SwitchPosition;
  status: SwitchStatus;
  occupancy: string | null;
  point: Point;
  branch: Point;
  lastUpdate: number;
}

export interface Yard {
  id: string;
  name: string;
  km: number;
  position: Point;
  width: number;
  height: number;
  tracksInUse: number;
  tracksTotal: number;
}

export interface KmMarker {
  km: number;
  position: Point;
}

export interface Train {
  id: string;
  prefix: string;
  line: LineId;
  direction: Direction;
  speed: number;
  km: number;
  status: TrainStatus;
  delay: number; // minutes
  nextStation: string;
  origin: string;
  destination: string;
  cars: number;
  position: Point;
  segmentId: string;
  routeIndex: number;
  progress: number;
  lastUpdate: number;
}

export interface Alarm {
  id: string;
  type: string;
  severity: AlarmSeverity;
  objectId: string;
  objectKind: ObjectKind;
  description: string;
  timestamp: number;
  acknowledged: boolean;
  acknowledgedBy?: string;
  resolved: boolean;
  muted: boolean;
}

export interface OperationalEvent {
  id: string;
  timestamp: number;
  message: string;
  objectId: string;
  objectKind: ObjectKind;
  severity: AlarmSeverity;
}

export interface AuditEntry {
  id: string;
  timestamp: number;
  operator: string;
  action: string;
  objectId: string;
  result: string;
}

export interface Connectivity {
  overall: "ONLINE" | "DEGRADADO" | "OFFLINE";
  server: "ONLINE" | "DEGRADADO" | "OFFLINE";
  comms: "ONLINE" | "DEGRADADO" | "OFFLINE";
  database: "ONLINE" | "DEGRADADO" | "OFFLINE";
  devices: "ONLINE" | "DEGRADADO" | "OFFLINE";
  sync: "SINCRONIZADOS" | "SINCRONIZANDO" | "DESATUALIZADOS";
}

export interface Kpis {
  trainsRunning: number;
  trainsDelayed: number;
  segmentsOccupied: number;
  criticalAlarms: number;
  devicesOffline: number;
  stationsOperational: string;
  averageSpeed: number;
  punctuality: number;
}

export type ScenarioId =
  | "NORMAL"
  | "ATRASO"
  | "FALHA_SINAL"
  | "TRECHO_OCUPADO"
  | "PERDA_COMUNICACAO"
  | "INTERDICAO";

export interface CcoState {
  clock: number;
  running: boolean;
  live: boolean;
  scenario: ScenarioId;
  trains: Train[];
  signals: Signal[];
  segments: TrackSegment[];
  stations: Station[];
  switches: RailSwitch[];
  yards: Yard[];
  markers: KmMarker[];
  alarms: Alarm[];
  events: OperationalEvent[];
  audit: AuditEntry[];
  connectivity: Connectivity;
  kpis: Kpis;
  assistant: string[];
}

/** Realtime event names the future WebSocket/MQTT bridge will publish. */
export type CcoEventName =
  | "TRAIN_POSITION_UPDATED"
  | "SIGNAL_CHANGED"
  | "TRACK_OCCUPANCY_CHANGED"
  | "SWITCH_POSITION_CHANGED"
  | "ALARM_CREATED"
  | "ALARM_RESOLVED"
  | "DEVICE_OFFLINE"
  | "DEVICE_ONLINE";

export interface CcoRealtimeEvent<T = unknown> {
  name: CcoEventName;
  payload: T;
  timestamp: number;
}

export interface SelectedObject {
  kind: ObjectKind;
  id: string;
}

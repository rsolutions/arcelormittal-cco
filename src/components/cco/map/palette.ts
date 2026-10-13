import type {
  AlarmSeverity,
  SignalAspect,
  SwitchStatus,
  TrackStatus,
  TrainStatus,
} from "@/lib/cco/types";

/** All map colors resolve to design-system state tokens. */
export const trackColor: Record<TrackStatus, string> = {
  NORMAL: "var(--state-info)",
  OCUPADO: "var(--state-danger)",
  BLOQUEADO: "var(--state-offline)",
  MANUTENCAO: "var(--state-maint)",
  FALHA: "var(--state-high)",
  SEM_COMUNICACAO: "var(--state-offline)",
};

/** Signals and switch sensors communicate in blue (livre) or red (restrição). */
export const aspectColor: Record<SignalAspect, string> = {
  VERDE: "var(--state-info)",
  AMARELO: "var(--state-danger)",
  VERMELHO: "var(--state-danger)",
  CINZA: "var(--state-offline)",
};

export const switchColor: Record<SwitchStatus, string> = {
  NORMAL: "var(--state-info)",
  REVERSO: "var(--state-danger)",
  OCUPADO: "var(--state-danger)",
  FALHA: "var(--state-danger)",
  SEM_COMUNICACAO: "var(--state-offline)",
};

export const trainColor: Record<TrainStatus, string> = {
  EM_CIRCULACAO: "var(--state-info)",
  EM_ESTACAO: "var(--state-info)",
  PARADO: "var(--state-offline)",
  ATRASADO: "var(--state-caution)",
  RETIDO: "var(--state-high)",
};

export const severityColor: Record<AlarmSeverity, string> = {
  CRITICO: "var(--state-danger)",
  ALTO: "var(--state-high)",
  MEDIO: "var(--state-caution)",
  INFO: "var(--state-info)",
};

export const severityClass: Record<AlarmSeverity, string> = {
  CRITICO: "text-danger",
  ALTO: "text-high",
  MEDIO: "text-caution",
  INFO: "text-info",
};

export const severityLabel: Record<AlarmSeverity, string> = {
  CRITICO: "CRÍTICO",
  ALTO: "ALTO",
  MEDIO: "MÉDIO",
  INFO: "INFO",
};

import type {
  AlarmSeverity,
  SignalAspect,
  SwitchStatus,
  TrackStatus,
  TrainStatus,
} from "@/lib/cco/types";
import type { RouteTone } from "@/lib/cco/route-state";

export const routeColor: Record<RouteTone, string> = {
  AZUL: "var(--route-blue)",
  BRANCA: "var(--route-white)",
  CINZA: "var(--route-gray)",
};

/** All map colors resolve to design-system state tokens. */
export const trackColor: Record<TrackStatus, string> = {
  NORMAL: "var(--route-blue)",
  OCUPADO: "var(--route-white)",
  BLOQUEADO: "var(--route-white)",
  MANUTENCAO: "var(--route-white)",
  FALHA: "var(--route-white)",
  SEM_COMUNICACAO: "var(--route-gray)",
};

/** Signals and switch sensors communicate in blue (livre) or red (restrição). */
export const aspectColor: Record<SignalAspect, string> = {
  AZUL: "var(--route-blue)",
  VERMELHO: "var(--signal-red)",
  CINZA: "var(--route-gray)",
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

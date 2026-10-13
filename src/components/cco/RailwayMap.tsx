import { Crosshair, Maximize2, Minus, Plus } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import type { CcoState, SelectedObject, ViewMode } from "@/lib/cco/types";
import { DEFAULT_VIEWPORT, viewBoxString, zoomViewport, type Viewport } from "@/lib/cco/viewport";
import { ReferenceDiagram } from "./map/ReferenceDiagram";

export interface MapFilters {
  line: "ALL" | "L1" | "L2" | "RN";
  trains: boolean;
  stations: boolean;
  signals: boolean;
  switches: boolean;
  alarms: boolean;
  onlyOffline: boolean;
  onlyOccupied: boolean;
}
interface Props {
  state: CcoState;
  filters: MapFilters;
  viewMode: ViewMode;
  selected: SelectedObject | null;
  onSelect: (selection: SelectedObject) => void;
  viewport: Viewport;
  onViewportChange: (viewport: Viewport) => void;
}

export function RailwayMap({ state, selected, onSelect, viewport, onViewportChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; vp: Viewport } | null>(null);
  return <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-[var(--diagram-background)]">
    <svg className="h-full w-full touch-none select-none" role="img" aria-label="Mapa sinótico ArcelorMittal Libéria"
      viewBox={viewBoxString(viewport)} preserveAspectRatio="xMidYMid meet"
      onPointerDown={(event) => {
        if ((event.target as Element).closest('[role="button"]')) return;
        dragRef.current = { x: event.clientX, y: event.clientY, vp: viewport };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!drag || !rect) return;
        const scale = Math.max(drag.vp.w / rect.width, drag.vp.h / rect.height);
        onViewportChange({ ...drag.vp, x: drag.vp.x - (event.clientX - drag.x) * scale,
          y: drag.vp.y - (event.clientY - drag.y) * scale });
      }}
      onPointerUp={() => { dragRef.current = null; }}
      onPointerCancel={() => { dragRef.current = null; }}
      onWheel={(event) => onViewportChange(zoomViewport(viewport, event.deltaY > 0 ? 1.12 : 0.89))}>
      <ReferenceDiagram state={state} selected={selected} onSelect={onSelect} />
    </svg>
    <div className="absolute right-3 top-3 flex gap-1">
      <MapButton label="Ampliar mapa" onClick={() => onViewportChange(zoomViewport(viewport, 0.8))}><Plus /></MapButton>
      <MapButton label="Reduzir mapa" onClick={() => onViewportChange(zoomViewport(viewport, 1.25))}><Minus /></MapButton>
      <MapButton label="Centralizar mapa" onClick={() => onViewportChange({ ...viewport,
        x: DEFAULT_VIEWPORT.x + (DEFAULT_VIEWPORT.w - viewport.w) / 2,
        y: DEFAULT_VIEWPORT.y + (DEFAULT_VIEWPORT.h - viewport.h) / 2 })}><Crosshair /></MapButton>
      <MapButton label="Visão geral" onClick={() => onViewportChange(DEFAULT_VIEWPORT)}><Maximize2 /></MapButton>
    </div>
    <div className="pointer-events-none absolute bottom-4 left-4 flex gap-5 text-xs text-[var(--diagram-ink)]">
      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[var(--diagram-free)]" />Livre</span>
      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[var(--diagram-blocked)]" />Bloqueio</span>
    </div>
  </div>;
}
function MapButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return <Button variant="outline" size="icon" title={label} aria-label={label} onClick={onClick}>{children}</Button>;
}

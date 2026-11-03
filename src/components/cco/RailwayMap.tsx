import { Crosshair, Maximize2, Minus, Plus } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { locateObject } from "@/lib/cco/locate";
import { projectSchematicPoint, SCHEMATIC_ROWS } from "@/lib/cco/schematic-layout";
import type { CcoState, SelectedObject, ViewMode } from "@/lib/cco/types";
import { DEFAULT_VIEWPORT, viewBoxString, zoomViewport, type Viewport } from "@/lib/cco/viewport";
import {
  AlarmMarker,
  KilometerMarker,
  SignalLamp,
  StationNode,
  SwitchNode,
  TrackSegmentShape,
  TrainMarker,
  YardShape,
} from "./map/MapElements";
import { severityColor } from "./map/palette";

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

export function RailwayMap({
  state,
  filters,
  viewMode,
  selected,
  onSelect,
  viewport,
  onViewportChange,
}: Props) {
  const clipId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; vp: Viewport } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; lines: string[] } | null>(null);

  const isSelected = (kind: SelectedObject["kind"], id: string) =>
    selected?.kind === kind && selected.id === id;

  const inLine = (line: string) => filters.line === "ALL" || filters.line === line;

  const handleHover = useCallback((lines: string[] | null, event?: React.MouseEvent) => {
    if (!lines || !event) {
      setTooltip(null);
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    setTooltip({
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
      lines,
    });
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY, vp: viewport };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    const scale = drag.vp.w / rect.width;
    onViewportChange({
      ...drag.vp,
      x: drag.vp.x - (e.clientX - drag.x) * scale,
      y: drag.vp.y - (e.clientY - drag.y) * scale,
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    onViewportChange(zoomViewport(viewport, e.deltaY > 0 ? 1.12 : 0.89));
  };

  const detailed = viewport.w < 1000;
  const activeAlarms = state.alarms.filter((a) => !a.resolved);
  const showTrains = filters.trains && viewMode !== "ALARMES";
  const dimNonAlarm = viewMode === "ALARMES";
  const dimTrains = viewMode === "INFRAESTRUTURA";

  return (
    <div className="relative h-full w-full overflow-hidden bg-background" ref={containerRef}>
      <svg
        className="h-full w-full touch-none select-none"
        viewBox={viewBoxString(viewport)}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        role="img"
        aria-label="Mapa sinótico da malha ferroviária"
      >
        <defs>
          {SCHEMATIC_ROWS.map((row) => (
            <clipPath key={row.id} id={`${clipId}-${row.id}`}>
              <rect x={row.startX} y={180} width={row.endX - row.startX} height={440} />
            </clipPath>
          ))}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="var(--border)"
              strokeWidth="0.5"
              opacity="0.35"
            />
          </pattern>
        </defs>
        <rect
          x={DEFAULT_VIEWPORT.x - 400}
          y={DEFAULT_VIEWPORT.y - 400}
          width={DEFAULT_VIEWPORT.w + 800}
          height={DEFAULT_VIEWPORT.h + 800}
          fill="url(#grid)"
        />

        {/* Both rows show the same continuous corridor with a visual break only. */}
        {SCHEMATIC_ROWS.map((row) => (
          <g key={row.id} data-corridor-row={row.id}>
            <text
              x={45}
              y={210 + row.offset.y}
              fontSize={14}
              fontFamily="var(--font-mono)"
              letterSpacing={1.5}
              fill="var(--muted-foreground)"
            >
              {row.label}
            </text>
            <g
              transform={`translate(${row.offset.x} ${row.offset.y})`}
              clipPath={`url(#${clipId}-${row.id})`}
            >
              {/* yards */}
              {filters.stations &&
                state.yards.map((yard) => (
                  <YardShape
                    key={yard.id}
                    yard={yard}
                    detailed={detailed}
                    selected={isSelected("PATIO", yard.id)}
                    onSelect={() => onSelect({ kind: "PATIO", id: yard.id })}
                    onHover={handleHover}
                  />
                ))}

              {/* track segments */}
              {state.segments
                .filter((s) => inLine(s.line))
                .filter((s) => (filters.onlyOccupied ? s.status === "OCUPADO" : true))
                .map((segment) => (
                  <TrackSegmentShape
                    key={segment.id}
                    segment={segment}
                    selected={isSelected("TRECHO", segment.id)}
                    dimmed={dimNonAlarm && segment.status === "NORMAL"}
                    onSelect={() => onSelect({ kind: "TRECHO", id: segment.id })}
                    onHover={handleHover}
                  />
                ))}

              {/* switches */}
              {filters.switches &&
                state.switches
                  .filter((s) => inLine(s.line))
                  .filter((s) =>
                    filters.onlyOffline
                      ? s.status === "SEM_COMUNICACAO" || s.status === "FALHA"
                      : true,
                  )
                  .map((item) => (
                    <SwitchNode
                      key={item.id}
                      item={item}
                      detailed={detailed}
                      selected={isSelected("AMV", item.id)}
                      dimmed={
                        dimNonAlarm && item.status !== "FALHA" && item.status !== "SEM_COMUNICACAO"
                      }
                      onSelect={() => onSelect({ kind: "AMV", id: item.id })}
                      onHover={handleHover}
                    />
                  ))}

              {/* stations */}
              {filters.stations &&
                state.stations
                  .filter((s) => inLine(s.line))
                  .map((station) => (
                    <StationNode
                      key={station.id}
                      station={station}
                      selected={isSelected("ESTACAO", station.id)}
                      dimmed={dimNonAlarm}
                      onSelect={() => onSelect({ kind: "ESTACAO", id: station.id })}
                      onHover={handleHover}
                    />
                  ))}

              {/* signals */}
              {filters.signals &&
                state.signals
                  .filter((s) => inLine(s.line))
                  .filter((s) => (filters.onlyOffline ? s.status !== "ONLINE" : true))
                  .map((signal) => (
                    <SignalLamp
                      key={signal.id}
                      signal={signal}
                      detailed={detailed}
                      selected={isSelected("SINAL", signal.id)}
                      dimmed={dimNonAlarm && signal.status === "ONLINE"}
                      onSelect={() => onSelect({ kind: "SINAL", id: signal.id })}
                      onHover={handleHover}
                    />
                  ))}

              {/* trains */}
              {showTrains &&
                state.trains
                  .filter((t) => inLine(t.line))
                  .map((train) => (
                    <TrainMarker
                      key={train.id}
                      train={train}
                      segment={state.segments.find((s) => s.id === train.segmentId)}
                      selected={isSelected("TREM", train.id)}
                      dimmed={dimTrains}
                      onSelect={() => onSelect({ kind: "TREM", id: train.id })}
                      onHover={handleHover}
                    />
                  ))}

              {/* alarm markers */}
              {filters.alarms &&
                activeAlarms.slice(0, 12).map((alarm) => {
                  const position = locateObject(state, alarm.objectKind, alarm.objectId);
                  if (!position) return null;
                  return (
                    <AlarmMarker
                      key={alarm.id}
                      position={position}
                      color={severityColor[alarm.severity]}
                      critical={alarm.severity === "CRITICO"}
                    />
                  );
                })}
            </g>
          </g>
        ))}

        {/* Keep boundary labels whole instead of clipping them at the row break. */}
        {state.markers.map((marker, i) => (
          <KilometerMarker
            key={`${marker.km}-${i}`}
            marker={{ ...marker, position: projectSchematicPoint(marker.position) }}
          />
        ))}

        {SCHEMATIC_ROWS.map((row, index) => {
          const x = (index === 0 ? row.endX : row.startX) + row.offset.x;
          const y = 320 + row.offset.y;
          return (
            <g
              key={row.id}
              pointerEvents="none"
              aria-label={`Continuidade A — ${index === 0 ? "segue na faixa inferior" : "vem da faixa superior"}`}
            >
              <circle
                cx={x}
                cy={y}
                r={14}
                fill="var(--surface)"
                stroke="var(--state-info)"
                strokeWidth={1.5}
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontSize={12}
                fontFamily="var(--font-mono)"
                fill="var(--state-info)"
              >
                A
              </text>
              <path
                d={
                  index === 0
                    ? `M ${x - 34} ${y - 5} L ${x - 26} ${y} L ${x - 34} ${y + 5}`
                    : `M ${x + 26} ${y - 5} L ${x + 34} ${y} L ${x + 26} ${y + 5}`
                }
                fill="none"
                stroke="var(--state-info)"
                strokeWidth={2}
              />
            </g>
          );
        })}
      </svg>

      {/* zoom / navigation controls */}
      <div className="absolute right-3 top-3 flex flex-col gap-1">
        <MapButton label="Zoom in" onClick={() => onViewportChange(zoomViewport(viewport, 0.8))}>
          <Plus className="h-4 w-4" />
        </MapButton>
        <MapButton label="Zoom out" onClick={() => onViewportChange(zoomViewport(viewport, 1.25))}>
          <Minus className="h-4 w-4" />
        </MapButton>
        <MapButton
          label="Centralizar mapa"
          onClick={() =>
            onViewportChange({
              ...viewport,
              x: DEFAULT_VIEWPORT.x + (DEFAULT_VIEWPORT.w - viewport.w) / 2,
              y: DEFAULT_VIEWPORT.y + (DEFAULT_VIEWPORT.h - viewport.h) / 2,
            })
          }
        >
          <Crosshair className="h-4 w-4" />
        </MapButton>
        <MapButton label="Ajustar à tela" onClick={() => onViewportChange(DEFAULT_VIEWPORT)}>
          <Maximize2 className="h-4 w-4" />
        </MapButton>
      </div>

      <button
        type="button"
        onClick={() => onViewportChange(DEFAULT_VIEWPORT)}
        className="absolute bottom-3 right-3 rounded border border-border-strong bg-surface px-3 py-1.5 font-mono text-[10px] tracking-widest text-foreground uppercase transition-colors hover:bg-surface-2"
      >
        Visão geral
      </button>

      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-x-4 gap-y-1 rounded border border-border bg-surface/90 px-3 py-2">
        <span className="font-mono text-[9px] text-muted-foreground">SC1 · Spring Crossover</span>
        <span className="font-mono text-[9px] text-muted-foreground">MC1 · Manual Crossover</span>
        <Legend color="var(--rail)" label="Normal" />
        <Legend color="var(--state-danger)" label="Ocupado" />
        <Legend color="var(--state-maint)" label="Manutenção" />
        <Legend color="var(--state-high)" label="Falha" />
        <Legend color="var(--state-offline)" label="Sem comunicação" />
        <Legend color="var(--state-clear)" label="Sinal liberado" />
        <Legend color="var(--state-caution)" label="Sinal atenção" />
      </div>

      {tooltip ? (
        <div
          className="pointer-events-none absolute z-20 min-w-40 rounded border border-border-strong bg-popover/95 px-3 py-2 shadow-lg"
          style={{
            left: Math.min(tooltip.x + 14, (containerRef.current?.clientWidth ?? 800) - 220),
            top: Math.max(8, tooltip.y - 10),
          }}
        >
          <p className="font-mono text-[11px] font-semibold tracking-wider text-foreground">
            {tooltip.lines[0]}
          </p>
          {tooltip.lines.slice(1).map((line) => (
            <p key={line} className="font-mono text-[10px] text-muted-foreground">
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MapButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded border border-border-strong bg-surface text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
        {label}
      </span>
    </span>
  );
}

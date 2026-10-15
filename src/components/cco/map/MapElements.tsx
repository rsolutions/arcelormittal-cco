import { pathFrom, pointAt, headingAt, formatKm } from "@/lib/cco/geometry";
import type {
  KmMarker,
  RailSwitch,
  Signal,
  Station,
  TrackSegment,
  Train,
  Yard,
} from "@/lib/cco/types";
import { aspectColor, switchColor, trackColor, trainColor } from "./palette";

export interface MapItemProps {
  onSelect: () => void;
  onHover: (lines: string[] | null, event?: React.MouseEvent) => void;
  selected: boolean;
  dimmed?: boolean;
  detailed?: boolean;
}

/** RailwayLine / TrackSegment */
export function TrackSegmentShape({
  segment,
  onSelect,
  onHover,
  selected,
  dimmed,
}: MapItemProps & { segment: TrackSegment }) {
  const d = pathFrom(segment.points);
  const color = trackColor[segment.status];
  const occupied = segment.status === "OCUPADO";
  return (
    <g
      opacity={dimmed ? 0.35 : 1}
      className="cursor-pointer"
      onClick={onSelect}
      onMouseMove={(e) =>
        onHover(
          [
            `TRECHO ${segment.id}`,
            segment.name,
            `Estado: ${segment.status.replace("_", " ")}`,
            `VMA: ${segment.speedLimit} km/h`,
            segment.occupancy ? `Ocupado por: Trem ${segment.occupancy}` : "Sem ocupação",
          ],
          e,
        )
      }
      onMouseLeave={() => onHover(null)}
    >
      <path d={d} stroke="transparent" strokeWidth={16} fill="none" />
      <path d={d} stroke="var(--rail-dim)" strokeWidth={9} fill="none" strokeLinecap="round" />
      <path
        d={d}
        stroke={color}
        strokeWidth={selected ? 7 : 5}
        fill="none"
        strokeLinecap="round"
        className={occupied ? "occupied-flow" : undefined}
        strokeDasharray={
          segment.status === "BLOQUEADO" || segment.status === "MANUTENCAO" ? "6 6" : undefined
        }
      />
      {selected ? (
        <path d={d} stroke="var(--foreground)" strokeWidth={1} fill="none" strokeDasharray="2 4" />
      ) : null}
      {segment.status === "NORMAL"
        ? [0.3, 0.7].map((t) => {
            const pt = pointAt(segment.points, t);
            return (
              <polygon
                key={t}
                points={`${pt.x - 5},${pt.y} ${pt.x + 2},${pt.y - 4} ${pt.x + 2},${pt.y + 4}`}
                fill="var(--foreground)"
                opacity={0.6}
                pointerEvents="none"
              />
            );
          })
        : null}
    </g>
  );
}

/** Signal / controladora — luminous indicator */
export function SignalLamp({
  signal,
  onSelect,
  onHover,
  selected,
  dimmed,
  detailed,
}: MapItemProps & { signal: Signal }) {
  const color = aspectColor[signal.aspect];
  const critical = signal.status === "FALHA";
  return (
    <g
      opacity={dimmed ? 0.4 : 1}
      className="cursor-pointer"
      data-signal={signal.id}
      aria-label={`Sinal ${signal.label ?? signal.id}`}
      onClick={onSelect}
      onMouseMove={(e) =>
        onHover(
          [
            `SINAL ${signal.id}`,
            `Projeto: ${signal.label ?? signal.id}`,
            formatKm(signal.km),
            `Aspecto: ${signal.aspect}`,
            `Sentido: ${signal.direction}`,
            `Comunicação: ${signal.status}`,
          ],
          e,
        )
      }
      onMouseLeave={() => onHover(null)}
    >
      <line
        x1={signal.position.x}
        y1={signal.position.y}
        x2={signal.position.x}
        y2={signal.anchor?.y ?? (signal.position.y > 320 ? signal.position.y - 14 : signal.position.y + 14)}
        stroke="var(--border-strong)"
        strokeWidth={1.5}
      />
      <circle
        cx={signal.position.x}
        cy={signal.position.y}
        r={selected ? 8 : 6}
        fill="var(--background)"
        stroke="var(--border-strong)"
        strokeWidth={1.5}
      />
      <circle
        cx={signal.position.x}
        cy={signal.position.y}
        r={4}
        fill={color}
        color={color}
        className={critical ? "lamp-strong pulse-critical" : "lamp"}
      />
      {signal.label || detailed || selected ? <text
        x={signal.labelPoint?.x ?? signal.position.x}
        y={signal.labelPoint?.y ?? signal.position.y + (signal.position.y < 320 ? -12 : 18)}
        textAnchor="middle"
        fontSize={9}
        fontFamily="var(--font-mono)"
        fill="var(--muted-foreground)"
      >
        {signal.label ?? signal.id}
      </text> : null}
    </g>
  );
}

/** Station */
export function StationNode({
  station,
  onSelect,
  onHover,
  selected,
  dimmed,
}: MapItemProps & { station: Station }) {
  const color =
    station.status === "OPERACIONAL"
      ? "var(--state-clear)"
      : station.status === "RESTRITA"
        ? "var(--state-caution)"
        : "var(--state-danger)";
  return (
    <g
      opacity={dimmed ? 0.45 : 1}
      className="cursor-pointer"
      data-switch={item.id}
      aria-label={`${item.label ?? item.id} — ${item.crossoverType === "MANUAL" ? "Manual Crossover" : "Spring Crossover"}`}
      onClick={onSelect}
      onMouseMove={(e) =>
        onHover(
          [
            station.name,
            `Código: ${station.code}`,
            formatKm(station.km),
            `Plataformas: ${station.platforms}`,
            `Status: ${station.status}`,
          ],
          e,
        )
      }
      onMouseLeave={() => onHover(null)}
    >
      <rect
        x={station.position.x - 9}
        y={station.position.y - 9}
        width={18}
        height={18}
        rx={2}
        fill="var(--surface-2)"
        stroke={selected ? "var(--foreground)" : color}
        strokeWidth={selected ? 2 : 1.5}
      />
      <rect
        x={station.position.x - 4}
        y={station.position.y - 4}
        width={8}
        height={8}
        fill={color}
      />
      <text
        x={station.position.x}
        y={station.position.y - 16}
        textAnchor="middle"
        fontSize={11}
        fontFamily="var(--font-mono)"
        fill="var(--foreground)"
        letterSpacing={0.5}
      >
        {station.code}
      </text>
      <text
        x={station.position.x}
        y={station.position.y + 26}
        textAnchor="middle"
        fontSize={8.5}
        fill="var(--muted-foreground)"
      >
        {station.name.replace("Estação ", "")}
      </text>
    </g>
  );
}

/** AMV / Switch */
export function SwitchNode({
  item,
  onSelect,
  onHover,
  selected,
  dimmed,
  detailed,
}: MapItemProps & { item: RailSwitch }) {
  const color = switchColor[item.status];
  return (
    <g
      opacity={dimmed ? 0.45 : 1}
      className="cursor-pointer"
      onClick={onSelect}
      onMouseMove={(e) =>
        onHover(
          [
            `AMV ${item.id}`,
            `${item.label ?? item.id} — ${item.crossoverType === "MANUAL" ? "Manual Crossover" : "Spring Crossover"}`,
            formatKm(item.km),
            `Posição: ${item.position}`,
            `Estado: ${item.status.replace("_", " ")}`,
            item.occupancy ? `Ocupado por: Trem ${item.occupancy}` : "Livre",
          ],
          e,
        )
      }
      onMouseLeave={() => onHover(null)}
    >
      {!item.symbolPoint ? <line
        x1={item.point.x}
        y1={item.point.y}
        x2={item.branch.x}
        y2={item.branch.y}
        stroke={color}
        strokeWidth={item.position === "REVERSO" ? 4 : 2}
        strokeLinecap="round"
      /> : null}
      {item.symbolPoint ? <g transform={`translate(${item.symbolPoint.x} ${item.symbolPoint.y})`}>
        <rect x={-5} y={-3} width={10} height={6} fill="var(--background)" stroke={color} strokeWidth={1.2} />
        <path d={item.crossoverType === "MANUAL" ? "M -3 5 H 3" : "M 0 4 V 7 L -2 8 L 2 10 L -2 12 L 2 14"}
          fill="none" stroke={color} strokeWidth={1} />
      </g> : null}
      <circle
        cx={item.symbolPoint?.x ?? item.point.x}
        cy={item.symbolPoint?.y ?? item.point.y}
        r={item.symbolPoint ? (selected ? 2.5 : 1.5) : (selected ? 6 : 4.5)}
        fill={color}
        stroke={selected ? "var(--foreground)" : "var(--background)"}
        strokeWidth={1.5}
        color={color}
        className={item.status === "FALHA" ? "lamp-strong pulse-critical" : "lamp"}
      />
      {item.label || detailed || selected ? <text
        x={item.labelPoint?.x ?? item.branch.x + 6}
        y={item.labelPoint?.y ?? item.branch.y + 4}
        textAnchor={item.labelPoint ? "middle" : "start"}
        fontSize={8}
        fontFamily="var(--font-mono)"
        fill="var(--muted-foreground)"
      >
        {item.label ?? item.id}
      </text> : null}
    </g>
  );
}

/** Train marker riding the track */
export function TrainMarker({
  train,
  segment,
  onSelect,
  onHover,
  selected,
  dimmed,
}: MapItemProps & { train: Train; segment?: TrackSegment | undefined }) {
  const angle = segment ? headingAt(segment.points, train.progress) : 0;
  const color = trainColor[train.status];
  return (
    <g
      opacity={dimmed ? 0.4 : 1}
      className="cursor-pointer"
      onClick={onSelect}
      onMouseMove={(e) =>
        onHover(
          [
            `TREM ${train.id}`,
            `${train.prefix} — ${train.cars} vagões`,
            `Sentido ${train.direction}`,
            `${train.speed} km/h — ${formatKm(train.km)}`,
            `Próxima: ${train.nextStation}`,
            `Atraso: +${Math.round(train.delay)} min`,
          ],
          e,
        )
      }
      onMouseLeave={() => onHover(null)}
      style={{ transition: "transform 900ms linear" }}
      transform={`translate(${train.position.x} ${train.position.y})`}
    >
      <g transform={`rotate(${angle})`}>
        <rect
          x={-14}
          y={-6}
          width={28}
          height={12}
          rx={2}
          fill="var(--surface-2)"
          stroke={selected ? "var(--foreground)" : color}
          strokeWidth={selected ? 2 : 1.5}
        />
        <rect x={-11} y={-3.5} width={7} height={7} fill={color} />
        <rect x={-1} y={-3.5} width={5} height={7} fill="var(--rail)" opacity={0.7} />
        <rect x={6} y={-3.5} width={5} height={7} fill="var(--rail)" opacity={0.7} />
        <polygon points="14,-6 20,0 14,6" fill={color} color={color} className="lamp" />
      </g>
      <text
        x={0}
        y={-12}
        textAnchor="middle"
        fontSize={10}
        fontFamily="var(--font-mono)"
        fill="var(--foreground)"
      >
        {train.id}
      </text>
      <text
        x={0}
        y={20}
        textAnchor="middle"
        fontSize={8}
        fontFamily="var(--font-mono)"
        fill={color}
      >
        {train.speed} km/h
      </text>
    </g>
  );
}

/** Yard geometry, device placement and dimensions share the PDF layout. */
export function YardShape({ yard, onSelect, onHover, selected, detailed }: MapItemProps & { yard: Yard }) {
  const layout = yard.layout;
  const tracks = layout?.tracks ?? [yard.siding ?? []];
  const label = layout?.labelPoint ?? { x: yard.position.x + yard.width / 2, y: yard.position.y + 142 };
  return (
    <g className="cursor-pointer" data-yard={yard.id} role="button" aria-label={`Pátio ${yard.name}`}
      onClick={onSelect} onMouseMove={(event) => onHover([yard.name, `Projeto AML · folha ${layout?.sheet ?? "—"}`, formatKm(yard.km)], event)}
      onMouseLeave={() => onHover(null)}>
      <rect x={yard.position.x} y={yard.position.y - 110} width={yard.width} height={380} fill="transparent" />
      {tracks.map((points, index) => <g key={index}>
        <path d={pathFrom(points)} stroke="transparent" strokeWidth={20} fill="none" />
        <path d={pathFrom(points)} stroke="var(--rail-dim)" strokeWidth={5} fill="none" />
        <path d={pathFrom(points)} stroke="var(--state-info)" strokeWidth={selected ? 4 : 3} fill="none" />
      </g>)}
      <text x={label.x} y={label.y} textAnchor="middle" fontSize={detailed ? 12 : 22}
        fontFamily="var(--font-mono)" fontWeight={600} fill={selected ? "var(--foreground)" : "var(--muted-foreground)"}>
        {yard.name}
      </text>
      {detailed && layout ? <g pointerEvents="none">
        {layout.dimensions.map((dimension, index) => <g key={index} data-dimension={dimension.label}>
          <line x1={dimension.from.x} y1={dimension.from.y} x2={dimension.to.x} y2={dimension.to.y} stroke="var(--muted-foreground)" strokeWidth={0.7} />
          {[dimension.from, dimension.to].map((point, end) => <path key={end}
            d={`M ${point.x} ${point.y - 4} L ${point.x} ${point.y + 4} M ${point.x + (end ? -4 : 4)} ${point.y - 3} L ${point.x} ${point.y} L ${point.x + (end ? -4 : 4)} ${point.y + 3}`}
            stroke="var(--muted-foreground)" strokeWidth={0.7} fill="none" />)}
          <text x={(dimension.from.x + dimension.to.x) / 2} y={dimension.from.y - 7}
            textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill="var(--muted-foreground)">{dimension.label}</text>
        </g>)}
        <text x={label.x} y={label.y + 19} textAnchor="middle" fontSize={8} fontFamily="var(--font-mono)" fill="var(--muted-foreground)">
          AML-SIG-MKS-0001 · FOLHA {layout.sheet}/13 · S/E
        </text>
      </g> : null}
    </g>
  );
}

/** Kilometer marker */
export function KilometerMarker({ marker }: { marker: KmMarker }) {
  return (
    <g pointerEvents="none">
      <line
        x1={marker.position.x}
        y1={marker.position.y - 7}
        x2={marker.position.x}
        y2={marker.position.y + 7}
        stroke="var(--border-strong)"
        strokeWidth={1}
      />
      <text
        x={marker.position.x}
        y={marker.position.y + 20}
        textAnchor="middle"
        fontSize={7.5}
        fontFamily="var(--font-mono)"
        fill="var(--muted-foreground)"
      >
        KM {marker.km}
      </text>
    </g>
  );
}

/** Alarm marker attached to a map object */
export function AlarmMarker({
  position,
  color,
  critical,
}: {
  position: { x: number; y: number };
  color: string;
  critical: boolean;
}) {
  return (
    <g pointerEvents="none" transform={`translate(${position.x} ${position.y})`}>
      <circle
        r={13}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        color={color}
        className={critical ? "lamp-strong pulse-critical" : "lamp"}
      />
      <polygon points="0,-19 5,-10 -5,-10" fill={color} />
    </g>
  );
}

export function pointOnSegment(segment: TrackSegment, t: number) {
  return pointAt(segment.points, t);
}

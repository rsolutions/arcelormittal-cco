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
}: MapItemProps & { signal: Signal }) {
  const color = aspectColor[signal.aspect];
  const critical = signal.status === "FALHA";
  return (
    <g
      opacity={dimmed ? 0.4 : 1}
      className="cursor-pointer"
      onClick={onSelect}
      onMouseMove={(e) =>
        onHover(
          [
            `SINAL ${signal.id}`,
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
        y2={signal.position.y > 300 && signal.line !== "L1" ? signal.position.y - 10 : signal.position.y + 10}
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
      <text
        x={signal.position.x}
        y={signal.position.y + (signal.position.y < 300 ? -12 : 18)}
        textAnchor="middle"
        fontSize={9}
        fontFamily="var(--font-mono)"
        fill="var(--muted-foreground)"
      >
        {signal.id}
      </text>
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
      <line
        x1={item.point.x}
        y1={item.point.y}
        x2={item.branch.x}
        y2={item.branch.y}
        stroke={color}
        strokeWidth={item.position === "REVERSO" ? 4 : 2}
        strokeLinecap="round"
      />
      <circle
        cx={item.point.x}
        cy={item.point.y}
        r={selected ? 6 : 4.5}
        fill={color}
        stroke={selected ? "var(--foreground)" : "var(--background)"}
        strokeWidth={1.5}
        color={color}
        className={item.status === "FALHA" ? "lamp-strong pulse-critical" : "lamp"}
      />
      <text
        x={item.branch.x + 6}
        y={item.branch.y + 4}
        fontSize={8}
        fontFamily="var(--font-mono)"
        fill="var(--muted-foreground)"
      >
        {item.id}
      </text>
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
}: MapItemProps & { train: Train; segment?: TrackSegment }) {
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

/** Yard */
export function YardShape({
  yard,
  onSelect,
  onHover,
  selected,
}: MapItemProps & { yard: Yard }) {
  return (
    <g
      className="cursor-pointer"
      onClick={onSelect}
      onMouseMove={(e) =>
        onHover(
          [
            yard.name,
            formatKm(yard.km),
            `Linhas em uso: ${yard.tracksInUse}/${yard.tracksTotal}`,
          ],
          e,
        )
      }
      onMouseLeave={() => onHover(null)}
    >
      <rect
        x={yard.position.x}
        y={yard.position.y}
        width={yard.width}
        height={yard.height}
        rx={3}
        fill="var(--surface-2)"
        stroke={selected ? "var(--foreground)" : "var(--border-strong)"}
        strokeDasharray="4 3"
      />
      {Array.from({ length: yard.tracksTotal }).map((_, i) => (
        <line
          key={i}
          x1={yard.position.x + 8}
          y1={yard.position.y + 6 + (i * (yard.height - 12)) / (yard.tracksTotal - 1 || 1)}
          x2={yard.position.x + yard.width - 8}
          y2={yard.position.y + 6 + (i * (yard.height - 12)) / (yard.tracksTotal - 1 || 1)}
          stroke={i < yard.tracksInUse ? "var(--state-danger)" : "var(--rail-dim)"}
          strokeWidth={2}
        />
      ))}
      <text
        x={yard.position.x + yard.width / 2}
        y={yard.position.y - 5}
        textAnchor="middle"
        fontSize={9}
        fontFamily="var(--font-mono)"
        fill="var(--muted-foreground)"
      >
        {yard.name.toUpperCase()}
      </text>
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

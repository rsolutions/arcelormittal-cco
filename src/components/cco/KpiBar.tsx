import type { Kpis } from "@/lib/cco/types";

interface Item {
  label: string;
  value: string;
  tone?: "normal" | "caution" | "danger" | "info";
}

const toneColor: Record<string, string> = {
  normal: "var(--state-clear)",
  caution: "var(--state-caution)",
  danger: "var(--state-danger)",
  info: "var(--foreground)",
};

export function KpiBar({ kpis }: { kpis: Kpis }) {
  const items: Item[] = [
    { label: "Trens em circulação", value: String(kpis.trainsRunning).padStart(2, "0"), tone: "info" },
    {
      label: "Trens atrasados",
      value: String(kpis.trainsDelayed).padStart(2, "0"),
      tone: kpis.trainsDelayed > 0 ? "caution" : "normal",
    },
    { label: "Trechos ocupados", value: String(kpis.segmentsOccupied).padStart(2, "0"), tone: "info" },
    {
      label: "Alarmes críticos",
      value: String(kpis.criticalAlarms).padStart(2, "0"),
      tone: kpis.criticalAlarms > 0 ? "danger" : "normal",
    },
    {
      label: "Equip. offline",
      value: String(kpis.devicesOffline).padStart(2, "0"),
      tone: kpis.devicesOffline > 0 ? "caution" : "normal",
    },
    { label: "Pátios operacionais", value: kpis.stationsOperational, tone: "normal" },
    { label: "Velocidade média", value: `${kpis.averageSpeed} km/h`, tone: "info" },
    {
      label: "Pontualidade",
      value: `${kpis.punctuality.toFixed(1).replace(".", ",")}%`,
      tone: kpis.punctuality < 90 ? "caution" : "normal",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4 xl:grid-cols-8">
      {items.map((item) => (
        <div key={item.label} className="bg-surface px-3 py-1.5">
          <p className="tech-label truncate">{item.label}</p>
          <p
            className="font-mono text-lg leading-tight font-semibold tabular-nums"
            style={{ color: toneColor[item.tone ?? "info"] }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { severityColor, severityLabel } from "@/components/cco/map/palette";
import { useCco, useHydrated } from "@/hooks/useCco";
import { formatClock, formatDate } from "@/lib/cco/geometry";
import type { AlarmSeverity, ObjectKind } from "@/lib/cco/types";

const TITLE = "Histórico Operacional — CCO Ferroviário";
const DESCRIPTION =
  "Consulta de eventos, alarmes e auditoria de ações do Centro de Controle Operacional ferroviário, com filtros por período, tipo, severidade e objeto.";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

const KINDS: (ObjectKind | "TODOS")[] = [
  "TODOS",
  "TREM",
  "ESTACAO",
  "SINAL",
  "AMV",
  "TRECHO",
  "ALARME",
];

function HistoryPage() {
  const state = useCco();
  const hydrated = useHydrated();
  const [tab, setTab] = useState<"EVENTOS" | "ALARMES" | "AUDITORIA">("EVENTOS");
  const [term, setTerm] = useState("");
  const [kind, setKind] = useState<ObjectKind | "TODOS">("TODOS");
  const [severity, setSeverity] = useState<AlarmSeverity | "TODOS">("TODOS");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const inRange = (timestamp: number) => {
    if (from && timestamp < new Date(from).getTime()) return false;
    if (to && timestamp > new Date(to).getTime() + 86_400_000) return false;
    return true;
  };

  const matches = (text: string) => text.toUpperCase().includes(term.trim().toUpperCase());

  const events = useMemo(
    () =>
      state.events.filter(
        (e) =>
          inRange(e.timestamp) &&
          (kind === "TODOS" || e.objectKind === kind) &&
          (severity === "TODOS" || e.severity === severity) &&
          (matches(e.message) || matches(e.objectId)),
      ),
    [state.events, kind, severity, term, from, to],
  );

  const alarms = useMemo(
    () =>
      state.alarms.filter(
        (a) =>
          inRange(a.timestamp) &&
          (kind === "TODOS" || a.objectKind === kind) &&
          (severity === "TODOS" || a.severity === severity) &&
          (matches(a.description) || matches(a.objectId)),
      ),
    [state.alarms, kind, severity, term, from, to],
  );

  const audit = useMemo(
    () =>
      state.audit.filter(
        (a) => inRange(a.timestamp) && (matches(a.action) || matches(a.objectId) || matches(a.operator)),
      ),
    [state.audit, term, from, to],
  );

  return (
    <div className="min-h-screen bg-background px-4 py-4">
      <header className="flex flex-wrap items-center gap-4 border-b border-border pb-3">
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded border border-border-strong px-2.5 py-1 font-mono text-[10px] tracking-widest uppercase hover:bg-surface-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Painel sinótico
        </Link>
        <h1 className="font-mono text-sm font-bold tracking-[0.18em] uppercase">
          Histórico operacional
        </h1>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground tabular-nums">
          {hydrated ? `${formatDate(state.clock)} — ${formatClock(state.clock)}` : "--/--/---- --:--:--"}
        </span>
      </header>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="flex overflow-hidden rounded border border-border-strong">
          {(["EVENTOS", "ALARMES", "AUDITORIA"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase ${
                tab === item
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <Field label="Data inicial">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded border border-border bg-surface px-2 py-1 font-mono text-[11px]"
          />
        </Field>
        <Field label="Data final">
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded border border-border bg-surface px-2 py-1 font-mono text-[11px]"
          />
        </Field>
        <Field label="Tipo de objeto">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as ObjectKind | "TODOS")}
            className="rounded border border-border bg-surface px-2 py-1 font-mono text-[11px] uppercase"
          >
            {KINDS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Severidade">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as AlarmSeverity | "TODOS")}
            className="rounded border border-border bg-surface px-2 py-1 font-mono text-[11px] uppercase"
          >
            {(["TODOS", "CRITICO", "ALTO", "MEDIO", "INFO"] as const).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pesquisar">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Objeto, trem, sinal, operador..."
            className="w-64 rounded border border-border bg-surface px-2 py-1 font-mono text-[11px]"
          />
        </Field>
      </div>

      <div className="panel mt-3 overflow-x-auto">
        {tab === "EVENTOS" ? (
          <Table headers={["Horário", "Severidade", "Objeto", "Evento"]}>
            {events.map((event) => (
              <tr key={event.id} className="border-t border-border">
                <Cell>{formatClock(event.timestamp)}</Cell>
                <Cell color={severityColor[event.severity]}>{severityLabel[event.severity]}</Cell>
                <Cell>
                  {event.objectKind} {event.objectId}
                </Cell>
                <Cell>{event.message}</Cell>
              </tr>
            ))}
          </Table>
        ) : null}

        {tab === "ALARMES" ? (
          <Table headers={["Horário", "Severidade", "Objeto", "Descrição", "Reconhecido", "Resolvido"]}>
            {alarms.map((alarm) => (
              <tr key={alarm.id} className="border-t border-border">
                <Cell>{formatClock(alarm.timestamp)}</Cell>
                <Cell color={severityColor[alarm.severity]}>{severityLabel[alarm.severity]}</Cell>
                <Cell>
                  {alarm.objectKind} {alarm.objectId}
                </Cell>
                <Cell>{alarm.description}</Cell>
                <Cell>{alarm.acknowledged ? `Sim — ${alarm.acknowledgedBy ?? "ADMIN"}` : "Não"}</Cell>
                <Cell>{alarm.resolved ? "Sim" : "Não"}</Cell>
              </tr>
            ))}
          </Table>
        ) : null}

        {tab === "AUDITORIA" ? (
          <Table headers={["Horário", "Operador", "Ação", "Objeto", "Resultado"]}>
            {audit.map((entry) => (
              <tr key={entry.id} className="border-t border-border">
                <Cell>{formatClock(entry.timestamp)}</Cell>
                <Cell>{entry.operator}</Cell>
                <Cell>{entry.action}</Cell>
                <Cell>{entry.objectId}</Cell>
                <Cell>{entry.result}</Cell>
              </tr>
            ))}
          </Table>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="tech-label">{label}</span>
      {children}
    </label>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full min-w-3xl">
      <thead className="bg-surface-2">
        <tr>
          {headers.map((header) => (
            <th key={header} className="tech-label px-3 py-2 text-left">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Cell({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <td
      className="px-3 py-1.5 font-mono text-[11px] whitespace-nowrap"
      style={color ? { color } : undefined}
    >
      {children}
    </td>
  );
}

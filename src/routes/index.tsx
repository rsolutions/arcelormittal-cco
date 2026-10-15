import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AlarmPanel } from "@/components/cco/AlarmPanel";
import { AssistantCard } from "@/components/cco/AssistantCard";
import { CcoHeader } from "@/components/cco/CcoHeader";
import { ControlBar } from "@/components/cco/ControlBar";
import { DetailPanel } from "@/components/cco/DetailPanel";
import { EventTimeline } from "@/components/cco/EventTimeline";
import { KpiBar } from "@/components/cco/KpiBar";
import { RailwayMap, type MapFilters } from "@/components/cco/RailwayMap";
import { BootScreen } from "@/components/cco/BootScreen";
import { useCco, useHydrated } from "@/hooks/useCco";
import { locateObject } from "@/lib/cco/locate";
import type { AccessLevel, SelectedObject, ViewMode } from "@/lib/cco/types";
import { DEFAULT_VIEWPORT, centerOn, zoomViewport, type Viewport } from "@/lib/cco/viewport";
import { controlService } from "@/services";

const TITLE = "Painel Sinótico CCO — ArcelorMittal Libéria";
const DESCRIPTION =
  "Painel sinótico ferroviário da ArcelorMittal Libéria com pátios, trens em movimento, sinais, AMVs, alarmes e simulação operacional.";

export const Route = createFileRoute("/")({
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
  component: CcoPanel,
});

const INITIAL_FILTERS: MapFilters = {
  line: "ALL",
  trains: true,
  stations: true,
  signals: true,
  switches: true,
  alarms: true,
  onlyOffline: false,
  onlyOccupied: false,
};

function CcoPanel() {
  const state = useCco();
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("OPERACIONAL");
  const [filters, setFilters] = useState<MapFilters>(INITIAL_FILTERS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SelectedObject | null>(null);
  const [viewport, setViewport] = useState<Viewport>(DEFAULT_VIEWPORT);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("ADMINISTRADOR");

  const focus = useCallback(
    (selection: SelectedObject) => {
      const point = locateObject(state, selection.kind, selection.id);
      if (point) setViewport((current) => selection.kind === "PATIO"
        ? { x: point.x - 200, y: point.y - 125, w: 400, h: 440 }
        : centerOn(current, point, 620));
    },
    [state],
  );

  const selectAndFocus = useCallback(
    (selection: SelectedObject) => {
      setSelected(selection);
      focus(selection);
    },
    [focus],
  );

  const runSearch = useCallback(() => {
    const term = search.trim().toUpperCase();
    if (!term) return;
    const train = state.trains.find((t) => t.id.includes(term) || t.prefix.toUpperCase().includes(term));
    if (train) return selectAndFocus({ kind: "TREM", id: train.id });
    const signal = state.signals.find((s) => s.id.toUpperCase().includes(term));
    if (signal) return selectAndFocus({ kind: "SINAL", id: signal.id });
    const station = state.stations.find(
      (s) => s.name.toUpperCase().includes(term) || s.code.includes(term),
    );
    if (station) return selectAndFocus({ kind: "ESTACAO", id: station.id });
    const sw = state.switches.find((s) => s.id.toUpperCase().includes(term));
    if (sw) return selectAndFocus({ kind: "AMV", id: sw.id });
    const yard = state.yards.find(
      (item) => item.name.toUpperCase().includes(term) || item.id.toUpperCase().includes(term),
    );
    if (yard) return selectAndFocus({ kind: "PATIO", id: yard.id });
    const segment = state.segments.find((s) => s.id.toUpperCase().includes(term));
    if (segment) return selectAndFocus({ kind: "TRECHO", id: segment.id });
    const km = Number(term.replace(/[^0-9]/g, ""));
    if (!Number.isNaN(km) && km > 0) {
      const byKm = state.segments.find((s) => km >= s.startKm && km <= s.endKm);
      if (byKm) selectAndFocus({ kind: "TRECHO", id: byKm.id });
    }
  }, [search, selectAndFocus, state]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const key = event.key;
      if (key === "F1") {
        event.preventDefault();
        setViewMode("OPERACIONAL");
      } else if (key === "F2") {
        event.preventDefault();
        setViewMode("ALARMES");
      } else if (key === "F3") {
        event.preventDefault();
        setViewMode("INFRAESTRUTURA");
      } else if (key === "F4") {
        event.preventDefault();
        navigate({ to: "/historico" });
      } else if (key === "+" || key === "=") {
        setViewport((vp) => zoomViewport(vp, 0.8));
      } else if (key === "-") {
        setViewport((vp) => zoomViewport(vp, 1.25));
      } else if (key === "Escape") {
        setSelected(null);
      } else if (key === "Home") {
        setViewport(DEFAULT_VIEWPORT);
      } else if (key === "Enter" && document.activeElement?.tagName !== "INPUT") {
        runSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, runSearch]);

  if (!hydrated) {
    return <BootScreen title={TITLE} subtitle={DESCRIPTION} />;
  }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-background">
      <CcoHeader
        connectivity={state.connectivity}
        clock={state.clock}
        operator="ADMIN"
        accessLevel={accessLevel}
        onAccessLevelChange={setAccessLevel}
        criticalAlarms={state.kpis.criticalAlarms}
      />
      <KpiBar kpis={state.kpis} />
      <ControlBar
        viewMode={viewMode}
        onViewMode={setViewMode}
        filters={filters}
        onFilters={setFilters}
        search={search}
        onSearch={setSearch}
        running={state.running}
        live={state.live}
        scenario={state.scenario}
        onStart={controlService.start}
        onPause={controlService.pause}
        onReset={() => {
          controlService.reset();
          setSelected(null);
          setViewport(DEFAULT_VIEWPORT);
        }}
        onLive={controlService.setLive}
        onScenario={(scenario) => controlService.setScenario(scenario)}
      />

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <RailwayMap
              state={state}
              filters={filters}
              viewMode={viewMode}
              selected={selected}
              onSelect={(selection) =>
                (selection.kind === "TREM" || selection.kind === "PATIO") ? selectAndFocus(selection) : setSelected(selection)
              }
              viewport={viewport}
              onViewportChange={setViewport}
            />
          </div>
          <div className="h-56 shrink-0">
            <AlarmPanel
              alarms={state.alarms}
              selectedId={selected?.kind === "ALARME" ? selected.id : null}
              onSelectAlarm={(alarm) => setSelected({ kind: "ALARME", id: alarm.id })}
              onLocate={(alarm) => selectAndFocus({ kind: alarm.objectKind, id: alarm.objectId })}
            />
          </div>
        </div>

        <div className="flex w-[340px] min-h-0 shrink-0 flex-col border-l border-border bg-surface 2xl:w-[380px]">
          <AssistantCard hints={state.assistant} />
          <div className="min-h-0 flex-1 overflow-hidden">
            <DetailPanel
              state={state}
              selected={selected}
              accessLevel={accessLevel}
              onClose={() => setSelected(null)}
              onSelect={setSelected}
              onLocate={focus}
            />
          </div>
          <div className="h-64 shrink-0 border-t border-border">
            <EventTimeline
              events={state.events}
              onFocus={(event) => selectAndFocus({ kind: event.objectKind, id: event.objectId })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

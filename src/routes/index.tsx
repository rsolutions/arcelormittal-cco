import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { CcoHeader } from "@/components/cco/CcoHeader";
import { DetailPanel } from "@/components/cco/DetailPanel";
import { RailwayMap, type MapFilters } from "@/components/cco/RailwayMap";
import { BootScreen } from "@/components/cco/BootScreen";
import { useCco, useHydrated } from "@/hooks/useCco";
import { locateObject } from "@/lib/cco/locate";
import { projectSchematicPoint } from "@/lib/cco/schematic-layout";
import type { AccessLevel, SelectedObject } from "@/lib/cco/types";
import { DEFAULT_VIEWPORT, centerOn, zoomViewport, type Viewport } from "@/lib/cco/viewport";

const TITLE = "Painel Sinótico CCO — ArcelorMittal Libéria";
const DESCRIPTION =
  "Painel sinótico ferroviário da ArcelorMittal Libéria com pátios, rotas, sinais, AMVs e simulação operacional.";

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
  const [selected, setSelected] = useState<SelectedObject | null>(null);
  const [viewport, setViewport] = useState<Viewport>(DEFAULT_VIEWPORT);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("ADMINISTRADOR");

  const focus = useCallback(
    (selection: SelectedObject) => {
      const location = locateObject(state, selection.kind, selection.id);
      const point = location ? projectSchematicPoint(location) : null;
      if (point)
        setViewport((current) =>
          selection.kind === "PATIO"
            ? { x: point.x - 200, y: point.y - 125, w: 400, h: 440 }
            : centerOn(current, point, 620),
        );
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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        document.querySelector('[role="dialog"]') ||
        (event.target instanceof HTMLElement &&
          (event.target.matches("input, textarea, select") || event.target.isContentEditable))
      )
        return;
      const key = event.key;
      if (key === "F4") {
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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

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
        alarms={state.alarms}
        onSelectAlert={selectAndFocus}
      />

      <main className="relative flex min-h-0 flex-1">
        <div className="min-h-0 min-w-0 flex-1">
          <RailwayMap
            state={state}
            filters={INITIAL_FILTERS}
            viewMode="OPERACIONAL"
            selected={selected}
            onSelect={(selection) =>
              selection.kind === "TREM" || selection.kind === "PATIO"
                ? selectAndFocus(selection)
                : setSelected(selection)
            }
            viewport={viewport}
            onViewportChange={setViewport}
          />
        </div>

        {selected ? (
          <section
            aria-label="Informações do objeto selecionado"
            className="absolute inset-y-0 right-0 z-10 flex min-h-0 w-[min(340px,100%)] shrink-0 flex-col border-l border-border bg-surface shadow-xl sm:static sm:shadow-none 2xl:w-[380px]"
          >
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
          </section>
        ) : null}
      </main>
    </div>
  );
}

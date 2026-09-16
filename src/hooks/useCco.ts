import { useEffect, useState, useSyncExternalStore } from "react";
import { ccoStore, simulationService } from "@/services";
import type { CcoState } from "@/lib/cco/types";

/** Subscribes the UI to the operational snapshot (mock today, gateway tomorrow). */
export function useCco(): CcoState {
  useEffect(() => {
    simulationService.ensureStarted();
  }, []);
  return useSyncExternalStore(ccoStore.subscribe, ccoStore.getSnapshot, ccoStore.getSnapshot);
}

/** True only after hydration — used for clock rendering to avoid SSR mismatch. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

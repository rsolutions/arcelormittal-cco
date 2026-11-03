import { SCHEMATIC_VIEWBOX } from "./schematic-layout";
import type { Point } from "./types";

export interface Viewport {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const DEFAULT_VIEWPORT: Viewport = {
  x: SCHEMATIC_VIEWBOX.x,
  y: SCHEMATIC_VIEWBOX.y,
  w: SCHEMATIC_VIEWBOX.width,
  h: SCHEMATIC_VIEWBOX.height,
};

const MIN_W = 260;
const MAX_W = SCHEMATIC_VIEWBOX.width * 1.4;

export function zoomViewport(vp: Viewport, factor: number): Viewport {
  const cx = vp.x + vp.w / 2;
  const cy = vp.y + vp.h / 2;
  const w = Math.min(MAX_W, Math.max(MIN_W, vp.w * factor));
  const h = (w / vp.w) * vp.h;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

export function centerOn(vp: Viewport, point: Point, zoom?: number): Viewport {
  const base = zoom ? { ...vp, w: zoom, h: (zoom / vp.w) * vp.h } : vp;
  return { ...base, x: point.x - base.w / 2, y: point.y - base.h / 2 };
}

export function viewBoxString(vp: Viewport): string {
  return `${vp.x} ${vp.y} ${vp.w} ${vp.h}`;
}

import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

let configured = false;

/** MapLibre6 requires an explicit bundler worker. Vite owns the Pages-safe asset URL. */
export function prepareMapLibre() {
  if (configured) return;
  setWorkerUrl(workerUrl);
  configured = true;
}

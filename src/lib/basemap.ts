// Pure helpers for the static terrain image drawn under a route map. The image is a
// USGS The National Map topographic export (public domain), fetched once by
// scripts/fetch-basemap.ts and served from public/maps. Visitors never contact a map
// service.
//
// The export is in Web Mercator, the layer's native projection, so labels are not
// stretched. The route map uses a local equirectangular projection with the same
// east-west scale factor; across a few miles the two differ by well under a pixel.

export type Bounds = [west: number, south: number, east: number, north: number];

const R = 6_378_137;
const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export const toMercator = (lon: number, lat: number): [number, number] => [
  R * toRad(lon),
  R * Math.log(Math.tan(Math.PI / 4 + toRad(lat) / 2)),
];
export const fromMercator = (x: number, y: number): [number, number] => [
  toDeg(x / R),
  toDeg(2 * Math.atan(Math.exp(y / R)) - Math.PI / 2),
];

/** True when `outer` fully contains `inner`. */
export const covers = (outer: Bounds, inner: Bounds) =>
  outer[0] <= inner[0] && outer[1] <= inner[1] && outer[2] >= inner[2] && outer[3] >= inner[3];

/**
 * A Web Mercator export box around a map's view bounds, with a small margin, sized so
 * its pixel aspect matches the box exactly (ArcGIS would otherwise widen the extent).
 */
export function basemapRequest(view: Bounds, { width = 1600, margin = 0.02 } = {}) {
  const [w, s, e, n] = view;
  const padLon = (e - w) * margin;
  const padLat = (n - s) * margin;
  const [x1, y1] = toMercator(w - padLon, s - padLat);
  const [x2, rawY2] = toMercator(e + padLon, n + padLat);
  const height = Math.round((width * (rawY2 - y1)) / (x2 - x1));
  const y2 = y1 + (height * (x2 - x1)) / width;
  const [west, south] = fromMercator(x1, y1);
  const [east, north] = fromMercator(x2, y2);
  return {
    mercator: [x1, y1, x2, y2] as const,
    width,
    height,
    bounds: [west, south, east, north] as Bounds,
  };
}

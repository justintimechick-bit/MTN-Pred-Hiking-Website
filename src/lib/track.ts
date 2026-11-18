// Pure GPS-track helpers shared by the local importer, the route map, and tests.
// Only latitude/longitude pairs survive: timestamps, elevation, names, waypoints,
// and device metadata are never parsed, so they cannot reach public content.

export type Point = [lon: number, lat: number];
export type Segment = Point[];

const EARTH_RADIUS_M = 6_371_008.8;
const METERS_PER_MILE = 1609.344;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function distanceMeters([lon1, lat1]: Point, [lon2, lat2]: Point) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const segmentMeters = (segment: Segment) =>
  segment.reduce((sum, point, i) => (i ? sum + distanceMeters(segment[i - 1], point) : 0), 0);

/** Recorded track points (`trkpt`) grouped by `trkseg`. Planned route points and waypoints are ignored. */
export function parseGpxTrack(xml: string): Segment[] {
  const attr = (attrs: string, name: string) =>
    Number(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`).exec(attrs)?.[1]);
  const segments: Segment[] = [];
  for (const [, body] of xml.matchAll(/<(?:\w+:)?trkseg\b[^>]*>([\s\S]*?)<\/(?:\w+:)?trkseg>/g)) {
    const segment: Segment = [];
    for (const [, attrs] of body.matchAll(/<(?:\w+:)?trkpt\b([^>]*)>/g)) {
      const lat = attr(attrs, "lat");
      const lon = attr(attrs, "lon");
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lon) <= 180
      )
        segment.push([lon, lat]);
    }
    if (segment.length >= 2) segments.push(segment);
  }
  return segments;
}

/** Drop the first `startM` and last `endM` meters, e.g. a recording started at a car or campsite. */
export function trimSegment(segment: Segment, startM: number, endM: number): Segment {
  const cut = (points: Segment, meters: number) => {
    let walked = 0;
    let i = 0;
    while (i < points.length - 1 && walked < meters) {
      walked += distanceMeters(points[i], points[i + 1]);
      i++;
    }
    return meters > 0 ? points.slice(i) : points;
  };
  return cut(cut(segment, startM).reverse(), endM).reverse();
}

/** Iterative Douglas-Peucker in local meters; endpoints are always kept. */
export function simplifySegment(segment: Segment, toleranceM: number): Segment {
  if (segment.length < 3) return segment;
  const lat0 = toRad(segment[0][1]);
  const xy = segment.map(([lon, lat]) => [
    toRad(lon) * Math.cos(lat0) * EARTH_RADIUS_M,
    toRad(lat) * EARTH_RADIUS_M,
  ]);
  const keep = new Uint8Array(segment.length);
  keep[0] = keep[segment.length - 1] = 1;
  const stack: [number, number][] = [[0, segment.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop() as [number, number];
    const [ax, ay] = xy[a];
    const [bx, by] = xy[b];
    const len = Math.hypot(bx - ax, by - ay);
    let worst = -1;
    let worstDist = 0;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = xy[i];
      const d = len
        ? Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len
        : Math.hypot(px - ax, py - ay);
      if (d > worstDist) {
        worstDist = d;
        worst = i;
      }
    }
    if (worst > 0 && worstDist > toleranceM) {
      keep[worst] = 1;
      stack.push([a, worst], [worst, b]);
    }
  }
  return segment.filter((_, i) => keep[i]);
}

/** Five decimals is about one meter: enough for a trail line, no false survey precision. */
export const roundSegment = (segment: Segment): Segment =>
  segment.map(([lon, lat]) => [Number(lon.toFixed(5)), Number(lat.toFixed(5))]);

export type ProjectedMap = {
  width: number;
  height: number;
  paths: string[];
  start: [number, number];
  finish: [number, number];
  isLoop: boolean;
  scaleBar: { px: number; label: string };
  /** Longitude/latitude to viewBox pixels. */
  project: (point: Point) => [number, number];
  /** The whole viewBox as [west, south, east, north] degrees. */
  bounds: [number, number, number, number];
};

/** Fit segments into an SVG viewBox using a local equirectangular projection (north up). */
export function projectSegments(
  segments: Segment[],
  { width = 800, height = 520, padding = 48 } = {},
): ProjectedMap {
  const all = segments.flat();
  if (all.length < 2) throw new Error("A route map needs at least two points");
  const lons = all.map((p) => p[0]);
  const lats = all.map((p) => p[1]);
  const [minLon, maxLon, minLat, maxLat] = [
    Math.min(...lons),
    Math.max(...lons),
    Math.min(...lats),
    Math.max(...lats),
  ];
  const kx = Math.cos(toRad((minLat + maxLat) / 2));
  const spanX = Math.max((maxLon - minLon) * kx, 1e-6);
  const spanY = Math.max(maxLat - minLat, 1e-6);
  const scale = Math.min((width - padding * 2) / spanX, (height - padding * 2) / spanY);
  const offX = (width - spanX * scale) / 2;
  const offY = (height - spanY * scale) / 2;
  const project = ([lon, lat]: Point): [number, number] => [
    Number((offX + (lon - minLon) * kx * scale).toFixed(1)),
    Number((offY + (maxLat - lat) * scale).toFixed(1)),
  ];
  const paths = segments.map((segment) =>
    segment.map((p, i) => `${i ? "L" : "M"}${project(p).join(" ")}`).join(""),
  );
  const first = segments[0][0];
  const last = segments.at(-1)?.at(-1) as Point;
  // Pixels per mile: one projected degree of latitude is about 111.2 km.
  const pxPerMile = (scale * METERS_PER_MILE) / ((Math.PI / 180) * EARTH_RADIUS_M);
  const miles = [0.1, 0.25, 0.5, 1, 2, 5, 10, 20].filter((m) => m * pxPerMile <= width * 0.22);
  const scaleMiles = miles.at(-1) ?? 0.1;
  return {
    width,
    height,
    paths,
    start: project(first),
    finish: project(last),
    isLoop: distanceMeters(first, last) < 150,
    scaleBar: { px: Number((scaleMiles * pxPerMile).toFixed(1)), label: `${scaleMiles} mi` },
    project,
    bounds: [
      minLon - offX / (kx * scale),
      maxLat - (height - offY) / scale,
      minLon + (width - offX) / (kx * scale),
      maxLat + offY / scale,
    ],
  };
}

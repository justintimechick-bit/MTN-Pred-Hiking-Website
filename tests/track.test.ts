import { test } from "node:test";
import assert from "node:assert/strict";
import data from "../src/content/public/content.json";
import { basemapSchema, basemapsSchema, contentSchema, trackSchema } from "../src/lib/schema";
import { basemapRequest, covers, fromMercator, toMercator } from "../src/lib/basemap";
import {
  parseGpxTrack,
  projectSegments,
  roundSegment,
  segmentMeters,
  simplifySegment,
  trimSegment,
  type Segment,
} from "../src/lib/track";

// Synthetic coordinates only: a straight line in open ocean, not any real hike.
const gpx = `<?xml version="1.0"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" creator="synthetic">
  <metadata><name>Synthetic</name><time>2001-01-01T00:00:00Z</time></metadata>
  <wpt lat="1.5" lon="-30.5"><name>Synthetic waypoint</name></wpt>
  <rte><rtept lat="9" lon="9"/></rte>
  <trk><name>Synthetic track</name><trkseg>
    <trkpt lat="1.000001" lon="-30.000001"><ele>10</ele><time>2001-01-01T00:00:00Z</time></trkpt>
    <trkpt lon="-30.001" lat="1.000"><ele>11</ele></trkpt>
    <trkpt lat="1.000" lon="-30.002"/>
  </trkseg><trkseg><trkpt lat="1" lon="-30.01"/></trkseg></trk>
</gpx>`;

test("GPX parsing keeps only recorded track coordinates", () => {
  const segments = parseGpxTrack(gpx);
  assert.equal(segments.length, 1, "single-point segments, routes and waypoints are dropped");
  assert.deepEqual(roundSegment(segments[0]), [
    [-30, 1],
    [-30.001, 1],
    [-30.002, 1],
  ]);
  assert.ok(!JSON.stringify(segments).includes("2001"));
});

const line: Segment = Array.from({ length: 101 }, (_, i) => [-30 + i * 0.0001, 1]);

test("simplification keeps endpoints and drops collinear points", () => {
  const zigzag: Segment = [...line.slice(0, 50), [-29.995, 1.001], ...line.slice(51)];
  const simple = simplifySegment(zigzag, 5);
  assert.deepEqual(simple[0], zigzag[0]);
  assert.deepEqual(simple.at(-1), zigzag.at(-1));
  assert.ok(
    simple.some(([, lat]) => lat === 1.001),
    "real turns survive",
  );
  assert.ok(simple.length <= 5);
});

test("privacy trims remove the requested distance from each end", () => {
  const total = segmentMeters(line);
  const trimmed = trimSegment(line, 200, 300);
  assert.ok(Math.abs(total - segmentMeters(trimmed) - 500) < 15);
  assert.deepEqual(trimSegment(line, 0, 0), line);
});

test("track schema fails closed on timestamps, elevation, extra fields and false precision", () => {
  const track = {
    tripId: "t-001",
    source: "recorded-gps",
    timestampsRemoved: true,
    segments: [line],
  };
  assert.equal(trackSchema.safeParse(track).success, true);
  assert.equal(trackSchema.safeParse({ ...track, time: "2001-01-01" }).success, false);
  assert.equal(
    trackSchema.safeParse({
      ...track,
      segments: [
        [
          [-30, 1, 10],
          [-30.1, 1, 11],
        ],
      ],
    }).success,
    false,
  );
  assert.equal(
    trackSchema.safeParse({
      ...track,
      segments: [
        [
          [-30.0000001, 1],
          [-30.1, 1],
        ],
      ],
    }).success,
    false,
  );
  assert.equal(trackSchema.safeParse({ ...track, timestampsRemoved: false }).success, false);
});

test("published routes must cite OpenStreetMap and cannot pose as recordings", () => {
  const route = {
    tripId: "t-001",
    source: "published-route",
    dataSource: "openstreetmap",
    segments: [line],
  };
  assert.equal(trackSchema.safeParse(route).success, true);
  assert.equal(trackSchema.safeParse({ ...route, dataSource: "alltrails" }).success, false);
  assert.equal(trackSchema.safeParse({ ...route, timestampsRemoved: true }).success, false);
  assert.equal(trackSchema.safeParse({ ...route, source: "recorded-gps" }).success, false);
});

test("every approved trip route file parses and belongs to its trip", async () => {
  const { readFile } = await import("node:fs/promises");
  for (const trip of contentSchema.parse(data).trips.filter((entry) => entry.track)) {
    const track = trackSchema.parse(
      JSON.parse(await readFile(`src/content/public/tracks/${trip.track}`, "utf8")),
    );
    assert.equal(track.tripId, trip.id);
    // A drawn route that strays far from the documented distance is the wrong route.
    const miles = track.segments.reduce((n, s) => n + segmentMeters(s), 0) / 1609.344;
    if (trip.distanceMiles)
      assert.ok(
        Math.abs(miles - trip.distanceMiles) / trip.distanceMiles < 0.1,
        `${trip.id} route is ${miles.toFixed(1)} mi vs documented ${trip.distanceMiles}`,
      );
  }
});

test("trips only reference a track named for their own ID", () => {
  const trip = { ...data.trips[0], track: `${data.trips[0].id}.json` };
  assert.equal(contentSchema.safeParse({ ...data, trips: [trip] }).success, true);
  assert.equal(
    contentSchema.safeParse({ ...data, trips: [{ ...trip, track: "t-999.json" }] }).success,
    false,
  );
});

test("projection fits the viewBox, detects loops, and picks a sane scale bar", () => {
  const map = projectSegments([line]);
  assert.equal(map.isLoop, false);
  assert.ok(map.start[0] >= 0 && map.finish[0] <= map.width);
  assert.ok(map.scaleBar.px > 0 && map.scaleBar.px <= map.width * 0.22);
  const loop = projectSegments([[...line, line[0]]]);
  assert.equal(loop.isLoop, true);
  // The reported bounds are exactly the viewBox corners.
  const [w, s, e, n] = map.bounds;
  const near = (a: number[], b: number[]) => a.every((v, i) => Math.abs(v - b[i]) <= 0.1);
  assert.ok(near(map.project([w, n]), [0, 0]));
  assert.ok(near(map.project([e, s]), [map.width, map.height]));
});

test("basemap requests cover the map with an exact pixel aspect", () => {
  const view = projectSegments([line]).bounds;
  const request = basemapRequest(view, { width: 1600 });
  assert.ok(covers(request.bounds, view));
  const [x1, y1, x2, y2] = request.mercator;
  assert.ok(Math.abs((x2 - x1) / (y2 - y1) - request.width / request.height) < 1e-9);
  const [lon, lat] = fromMercator(...toMercator(-30.5, 1.25));
  assert.ok(Math.abs(lon + 30.5) < 1e-9 && Math.abs(lat - 1.25) < 1e-9);
});

test("basemap manifest fails closed on stray files, sources and fields", () => {
  const entry = {
    tripId: "t-001",
    filename: "t-001.webp",
    source: "usgs-national-map",
    layer: "USGSTopo",
    metadataRemoved: true,
    bounds: [-30.1, 0.9, -29.9, 1.1],
    width: 1600,
    height: 1040,
  };
  assert.equal(basemapsSchema.safeParse([entry]).success, true);
  assert.equal(basemapsSchema.safeParse([entry, entry]).success, false);
  assert.equal(basemapSchema.safeParse({ ...entry, filename: "t-002.webp" }).success, false);
  assert.equal(basemapSchema.safeParse({ ...entry, source: "google" }).success, false);
  assert.equal(basemapSchema.safeParse({ ...entry, bounds: [-29.9, 0.9, -30.1, 1.1] }).success, false);
  assert.equal(basemapSchema.safeParse({ ...entry, label: "x" }).success, false);
});

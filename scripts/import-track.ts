// Local, manual tool: converts owner-supplied GPX recordings into a coordinates-only
// public track. It is never run by the build. Raw GPX stays outside the repository.
//
//   npm run import:track -- t-007 ~/path/a.gpx [~/path/b.gpx ...] [--trim-start 200] [--trim-end 200]
//
// Files are joined in the order given; each recording segment stays separate on the map.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import data from "../src/content/public/content.json";
import { contentSchema, trackSchema } from "../src/lib/schema";
import {
  parseGpxTrack,
  roundSegment,
  segmentMeters,
  simplifySegment,
  trimSegment,
} from "../src/lib/track";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    "trim-start": { type: "string", default: "0" },
    "trim-end": { type: "string", default: "0" },
    tolerance: { type: "string", default: "6" },
    force: { type: "boolean", default: false },
  },
});
const [tripId, ...files] = positionals;
const trimStart = Number(values["trim-start"]);
const trimEnd = Number(values["trim-end"]);
const tolerance = Number(values.tolerance);
if (!tripId || files.length === 0 || ![trimStart, trimEnd, tolerance].every((n) => n >= 0))
  throw new Error(
    "Usage: npm run import:track -- t-### file.gpx [more.gpx] [--trim-start m] [--trim-end m]",
  );

const trip = contentSchema.parse(data).trips.find((entry) => entry.id === tripId);
if (!trip) throw new Error(`No public trip record with ID ${tripId}`);
const repo = path.resolve(".");
for (const file of files)
  if (path.resolve(file).startsWith(`${repo}${path.sep}`))
    throw new Error("Keep raw GPX recordings outside the repository");
const output = path.join("src/content/public/tracks", `${tripId}.json`);
if (existsSync(output) && !values.force)
  throw new Error(`${output} already exists; pass --force to replace it`);

const raw = [];
for (const file of files) {
  const found = parseGpxTrack(await readFile(file, "utf8"));
  if (found.length === 0) throw new Error(`No recorded track points in ${path.basename(file)}`);
  raw.push(...found);
}
// Privacy trims apply to the whole trip: the very start and very end only.
const segments = raw
  .map((segment, i) =>
    trimSegment(segment, i === 0 ? trimStart : 0, i === raw.length - 1 ? trimEnd : 0),
  )
  .map((segment) => roundSegment(simplifySegment(segment, tolerance)))
  .filter((segment) => segment.length >= 2);

const track = trackSchema.parse({
  tripId,
  source: "recorded-gps",
  timestampsRemoved: true,
  segments,
});
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(track)}\n`);

const before = raw.reduce((n, s) => n + s.length, 0);
const after = segments.reduce((n, s) => n + s.length, 0);
const miles = segments.reduce((n, s) => n + segmentMeters(s), 0) / 1609.344;
console.log(
  [
    `Wrote ${output}: ${segments.length} segment(s), ${before} → ${after} points.`,
    `Recorded track length ≈ ${miles.toFixed(1)} mi (documented route: ${trip.distanceMiles ?? "not recorded"} mi). Not published as a metric.`,
    "Only coordinates were kept: no timestamps, elevation, names, or waypoints.",
    `Review the map with npm run dev. To approve publication, set "track": "${tripId}.json" on ${tripId} in content.json.`,
    "Until then, validation fails on the unreferenced track file.",
  ].join("\n"),
);

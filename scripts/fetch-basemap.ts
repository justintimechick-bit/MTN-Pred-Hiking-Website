// Local, manual tool: fetches a static topographic image to draw under a trip's route
// map. It is never run by the build, and visitors never contact a map service.
//
//   npm run fetch:basemap -- t-007 [t-006 ...] [--force]
//
// Source: USGS The National Map, USGSTopo layer (public domain). Only the map's
// bounding box is sent to USGS. The image is re-encoded as WebP without metadata.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import sharp from "sharp";
import data from "../src/content/public/content.json";
import { basemapRequest } from "../src/lib/basemap";
import { basemapSchema, basemapsSchema, contentSchema, trackSchema } from "../src/lib/schema";
import { projectSegments } from "../src/lib/track";

const LAYER = "USGSTopo";
const SERVICE = `https://basemap.nationalmap.gov/arcgis/rest/services/${LAYER}/MapServer/export`;
const MANIFEST = "src/content/public/basemaps.json";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { force: { type: "boolean", default: false } },
});
if (positionals.length === 0)
  throw new Error("Usage: npm run fetch:basemap -- t-### [t-### ...] [--force]");

const content = contentSchema.parse(data);
const manifest = basemapsSchema.parse(JSON.parse(await readFile(MANIFEST, "utf8")));

for (const tripId of positionals) {
  const trip = content.trips.find((entry) => entry.id === tripId);
  if (!trip?.track) throw new Error(`${tripId} has no approved route track to draw a basemap for`);
  const output = path.join("public/maps", `${tripId}.webp`);
  if ((existsSync(output) || manifest.some((m) => m.tripId === tripId)) && !values.force)
    throw new Error(`${tripId} already has a basemap; pass --force to replace it`);

  const track = trackSchema.parse(
    JSON.parse(await readFile(`src/content/public/tracks/${trip.track}`, "utf8")),
  );
  const request = basemapRequest(projectSegments(track.segments).bounds);
  const url = new URL(SERVICE);
  url.search = new URLSearchParams({
    bbox: request.mercator.join(","),
    bboxSR: "3857",
    imageSR: "3857",
    size: `${request.width},${request.height}`,
    format: "png",
    transparent: "false",
    f: "image",
  }).toString();
  const response = await fetch(url, { headers: { "User-Agent": "route-basemap-fetch/1.0" } });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/"))
    throw new Error(`USGS export failed for ${tripId}: HTTP ${response.status}`);

  const image = sharp(Buffer.from(await response.arrayBuffer()));
  const { width, height } = await image.metadata();
  if (width !== request.width || height !== request.height)
    throw new Error(`USGS returned ${width}×${height}, expected ${request.width}×${request.height}`);
  await mkdir(path.dirname(output), { recursive: true });
  // sharp writes no EXIF/IPTC/XMP unless asked to keep it.
  await image.webp({ quality: 78 }).toFile(output);

  const entry = basemapSchema.parse({
    tripId,
    filename: `${tripId}.webp`,
    source: "usgs-national-map",
    layer: LAYER,
    metadataRemoved: true,
    bounds: request.bounds.map((n) => Number(n.toFixed(6))),
    width,
    height,
  });
  const next = [...manifest.filter((m) => m.tripId !== tripId), entry].sort((a, b) =>
    a.tripId.localeCompare(b.tripId),
  );
  manifest.splice(0, manifest.length, ...next);
  console.log(`Wrote ${output} (${width}×${height}) from USGS ${LAYER}.`);
}
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Updated ${MANIFEST}. Review the maps with npm run dev, then run npm run check.`);

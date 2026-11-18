import { readdir, readFile, lstat } from "node:fs/promises";
import path from "node:path";
import data from "../src/content/public/content.json";
import basemapData from "../src/content/public/basemaps.json";
import { basemapsSchema, contentSchema, trackSchema } from "../src/lib/schema";
import { covers } from "../src/lib/basemap";
import { projectSegments } from "../src/lib/track";
import { site } from "../src/config/site";
import sharp from "sharp";

const content = contentSchema.parse(data);
const basemaps = basemapsSchema.parse(basemapData);
const photoIds = new Set(content.photos.map((photo) => photo.id));
for (const id of [site.heroPhotoId, site.crewPhotoId]) {
  if (id && !photoIds.has(id)) throw new Error("Site configuration references an unapproved photo");
}
for (const link of site.socialLinks) {
  if (new URL(link.url).protocol !== "https:")
    throw new Error("Social accounts require approved HTTPS URLs");
}
if (
  site.goal &&
  (!Number.isInteger(site.goal.year) ||
    site.goal.targetMiles <= 0 ||
    !Number.isFinite(site.goal.targetMiles))
)
  throw new Error("Goal requires a valid year and positive target");

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const filename = path.join(directory, entry.name);
    if ((await lstat(filename)).isSymbolicLink())
      throw new Error("Public directories cannot contain symlinks");
    files.push(...(entry.isDirectory() ? await walk(filename) : [filename]));
  }
  return files;
}
const allowedPublic = new Set([
  "public/images/.gitkeep",
  ...content.photos.map((photo) => `public/images/${photo.filename}`),
  ...basemaps.map((map) => `public/maps/${map.filename}`),
]);
for (const filename of await walk("public")) {
  if (!allowedPublic.has(filename))
    throw new Error(
      "Unexpected public asset. Only explicitly approved photo derivatives are allowed.",
    );
}
for (const photo of content.photos) {
  await lstat(`public/images/${photo.filename}`);
  const metadata = await sharp(`public/images/${photo.filename}`).metadata();
  if (metadata.exif || metadata.iptc || metadata.xmp)
    throw new Error("Remove identifying metadata from every public photo derivative");
  if (metadata.width !== photo.width || metadata.height !== photo.height)
    throw new Error("Photo inventory dimensions do not match the derivative");
}
const allowedRecaps = new Set([
  "src/content/public/recaps/.gitkeep",
  ...content.trips.flatMap((trip) =>
    trip.recap ? [`src/content/public/recaps/${trip.recap}`] : [],
  ),
]);
for (const filename of await walk("src/content/public/recaps")) {
  if (!allowedRecaps.has(filename))
    throw new Error("Unexpected recap file; reference only approved recaps in public trip data");
}
for (const trip of content.trips)
  if (trip.recap) {
    const recap = await readFile(`src/content/public/recaps/${trip.recap}`, "utf8");
    if (/<\/?[a-z!]|TODO|TBD|FIXME|data:|javascript:/i.test(recap))
      throw new Error(
        "Recaps must contain reviewed Markdown without HTML or editorial placeholders",
      );
  }
const allowedTracks = new Set([
  "src/content/public/tracks/.gitkeep",
  ...content.trips.flatMap((trip) =>
    trip.track ? [`src/content/public/tracks/${trip.track}`] : [],
  ),
]);
for (const filename of await walk("src/content/public/tracks")) {
  if (!allowedTracks.has(filename))
    throw new Error(
      `Unapproved track file ${filename}; reference it with "track" on its trip only after owner approval`,
    );
}
for (const map of basemaps) {
  const trip = content.trips.find((entry) => entry.id === map.tripId);
  if (!trip?.track) throw new Error(`Basemap ${map.filename} has no approved route track`);
  const metadata = await sharp(`public/maps/${map.filename}`).metadata();
  if (metadata.exif || metadata.iptc || metadata.xmp)
    throw new Error("Remove metadata from every basemap image");
  if (metadata.width !== map.width || metadata.height !== map.height)
    throw new Error(`Basemap ${map.filename} dimensions do not match its manifest entry`);
  const track = trackSchema.parse(
    JSON.parse(await readFile(`src/content/public/tracks/${trip.track}`, "utf8")),
  );
  if (!covers(map.bounds, projectSegments(track.segments).bounds))
    throw new Error(`Basemap ${map.filename} no longer covers its route map; refetch it`);
}
let trackCount = 0;
for (const trip of content.trips)
  if (trip.track) {
    const raw = await readFile(`src/content/public/tracks/${trip.track}`, "utf8");
    if (/"(time|ele|name|desc|cmt|wpt)"|\d{4}-\d{2}-\d{2}T/i.test(raw))
      throw new Error("Tracks must contain coordinates only, without timestamps or waypoints");
    const track = trackSchema.parse(JSON.parse(raw));
    if (track.tripId !== trip.id) throw new Error(`Track ${trip.track} belongs to another trip`);
    trackCount++;
  }
console.log(
  `Public content valid: ${content.trips.length} trip records, ${content.profiles.length} approved profiles, ${content.photos.length} approved photos, ${trackCount} approved route tracks, ${basemaps.length} route basemaps. No source attachments read.`,
);

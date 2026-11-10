import { readdir, readFile, lstat } from "node:fs/promises";
import path from "node:path";
import data from "../src/content/public/content.json";
import { contentSchema } from "../src/lib/schema";
import { site } from "../src/config/site";
import sharp from "sharp";

const content = contentSchema.parse(data);
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
console.log(
  `Public content valid: ${content.trips.length} trip records, ${content.profiles.length} approved profiles, ${content.photos.length} approved photos. No source attachments read.`,
);

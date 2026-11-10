import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import data from "../src/content/public/content.json";
import { contentSchema } from "../src/lib/schema";
import { publishedTrips, aggregateTrips } from "../src/lib/trips";
import { canIndex, site } from "../src/config/site";

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? walk(path.join(directory, entry.name))
          : [path.join(directory, entry.name)],
      ),
    )
  ).flat();
}
const files = (await walk(".next/server/app")).filter((filename) =>
  /\.(html|rsc|body)$/.test(filename),
);
assert.ok(files.length > 0, "Build the application before auditing public output");
const traceFiles = (await walk(".next")).filter((filename) => filename.endsWith(".nft.json"));
for (const filename of traceFiles) {
  const trace = JSON.parse(await readFile(filename, "utf8")) as { files: string[] };
  assert.ok(
    !trace.files.some((file) =>
      /\.(xlsx|xls|xlsm|csv|tsv)$|Basecamp.*\.html|Website_Research_and_Prompts\.md/i.test(file),
    ),
    "Source attachment included in deployment tracing",
  );
}
// This is an operational-field check, not a surname list or a substitute for approval.
const forbidden =
  /\.xlsx|Roster Sheet|Basecamp \(Copy\)|emergency.?contact|shirt.?size|gear.?needs|roster.?completion|dues|prodeals|deals tracker|kickoff message|TODO|FIXME/iu;
for (const filename of files)
  assert.ok(
    !forbidden.test(await readFile(filename, "utf8")),
    "Unexpected private-source, operations, or editorial content in public output",
  );
const home = await readFile(".next/server/app/index.html", "utf8");
const totals = aggregateTrips(contentSchema.parse(data).trips);
for (const value of [
  totals.distanceMiles.toFixed(1),
  totals.elevationGainFt.toLocaleString("en-US"),
  "Documented route miles",
  "Listed elevation gain",
])
  assert.ok(home.includes(value), `Missing approved home metric: ${value}`);
assert.equal(
  home.includes('href="mailto:'),
  Boolean(site.groupEmail),
  "Unconfigured email action must be absent",
);
assert.equal(
  /name="robots" content="[^"]*noindex/.test(home),
  !canIndex,
  "Indexing must match explicit launch configuration",
);
assert.equal(
  home.includes('rel="canonical"'),
  Boolean(site.domain),
  "Never fabricate a canonical domain",
);
assert.ok(
  !home.includes("http://localhost:3000"),
  "No fallback localhost domain may appear in public metadata",
);
for (const trip of contentSchema
  .parse(data)
  .trips.filter(
    (trip) => trip.publicationState !== "published" || trip.tripState !== "completed",
  )) {
  assert.ok(
    !files.includes(`.next/server/app/adventures/${trip.slug}.html`),
    "Unpublished trip route was generated",
  );
  assert.ok(!home.includes(`/adventures/${trip.slug}`), "Unpublished trip linked from home output");
}
const trips = publishedTrips(contentSchema.parse(data).trips);
for (const trip of trips) {
  const html = await readFile(`.next/server/app/adventures/${trip.slug}.html`, "utf8");
  assert.ok(
    html.includes(trip.title.replaceAll("&", "&amp;")),
    "Published adventure missing from build",
  );
  assert.ok(
    html.includes(`dateTime="${trip.month}"`) || html.includes(`datetime="${trip.month}"`),
    "Trip must preserve month precision",
  );
  assert.ok(!new RegExp(`${trip.month}-\\d{2}`).test(html), "Trip contains an invented exact day");
}
console.log(
  `Audited ${files.length} rendered public artifacts, ${traceFiles.length} deployment traces, and all ${trips.length} trip pages. Raw attachments were not read.`,
);

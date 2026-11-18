# Mountain Predators website

A photography-led public journal for an Atlanta hiking and backpacking crew. Built with Next.js App Router, TypeScript, plain CSS, and validated local content. Pages are prerendered with ordinary Next.js builds; no static-export configuration, database, authentication, or CMS is required.

## Local setup

Use Node 24 (`nvm use` if you use nvm), then:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. To review a production build locally:

```sh
npm run build
npm start
```

Run `npm run check` before a release. It runs Biome lint, TypeScript, 19 content and route-map tests, content/asset validation, the production build, and a rendered-output audit. `npm run audit:output` requires an existing build. Font files are self-hosted; building does not fetch Google Fonts. The pinned dependencies and lockfile are intentional. Biome provides linting without the incompatible ESLint plugin dependency chain.

## Content and privacy

`src/content/public/content.json` is the explicit public allowlist. It contains only approved public trip records, approved profiles, and approved photo inventories. It is parsed with strict schemas before rendering. Unknown fields fail validation instead of being passed through to browsers.

The workbook and historical Basecamp HTML remain untouched local source attachments. They are ignored by Git and Vercel uploads, excluded from build tracing, and never imported by website code or validation. Do not force-add ignored files, put attachments in `public`, or upload this entire working directory as an archive. The supplied research markdown is also ignored. Public asset validation permits only explicitly declared photo derivatives. No source attachments were transferred to external services.

Hiker names must contain approved first names or trail names only. Use stable IDs such as `m-0001`, including when two members share a first name. Never use surname initials. This rule applies to visible copy, filenames, URLs, metadata, alt text, captions, image metadata, structured data, and downloads. Review all free text manually: a schema cannot determine whether an approved-looking trail name is really a surname. No private surname list belongs in this repository or its tests.

Profiles are empty at launch. Add one only after explicit public approval, with `publicApproval: true`, a non-name member ID, `displayName`, and `nameKind` (`first` or `trail`). First names cannot contain extra names or initials. Optional `bio` and `photoId` must also be approved. The crew section is omitted when no profiles are approved.

## Add a trip

Add a record to `trips` in the public JSON. Follow an existing record and use a new stable `t-###` ID and slug. Routes currently use those non-name slugs. Fields:

| Field | Meaning |
| --- | --- |
| `id`, `slug`, `title` | Stable identity, public URL segment, approved route title |
| `month`, `datePrecision` | `YYYY-MM` and `month`; never infer exact hiking days |
| `region`, `states` | Approved region and state codes |
| `routeType` | `Combined`, `Point to point`, `Loop`, or `Out and back` |
| `componentRoutes` | Required for combined trips; count the combined record only once |
| `distanceMiles`, `elevationGainFt` | Documented route figures; use `null` for unknown values |
| `metricBasis` | `documented-route`; these are not verified GPX measurements |
| `participantCount` | Optional recorded attendance on that trip; never unique-member reach |
| `recap` | Optional approved Markdown filename such as `t-008.md` |
| `images` | Optional array of approved `p-####` photo IDs |
| `track` | Optional approved route track, always `<trip id>.json`; see Route maps |
| `publicationState` | `draft` or `published` |
| `tripState` | `planned` or `completed` |

Only published completed trips get public routes and contribute to totals. Every entry in this file, including drafts, must already be safe for public use. Keep private editorial drafts outside the project. Shared functions update the home, journey, annual totals, archive, and sitemap; no page-component edits are needed. The test suite demonstrates adding a hypothetical eighth published record without altering the source dataset. Update baseline reconciliation assertions when real approved history changes.

For an approved recap, create `src/content/public/recaps/t-008.md` and set `recap` to that filename. Markdown is rendered without raw HTML. Do not add editorial TODOs, invented stories, private names, exact days, or unverified tracks. Trip facts render on their own when a recap is absent. The initial seven records total **105.9 documented route miles**, **19,920 ft listed gain**, **three states**, and **75 trip participations**.

## Route maps

A trip page shows a route map only when the trip references an approved file in `src/content/public/tracks/`. Two kinds exist, and the page labels them differently:

- `"source": "published-route"`: approved by the owner on November 17, 2026 for all seven trips. It is the commonly published version of each documented route (AllTrails, Komoot, Hiking Project, Gaia), traced along OpenStreetMap trail data. The map is headed "The route" and captioned as approximate and **not a GPS recording**. These files are derived from OpenStreetMap and are available under the [Open Database License](https://opendatacommons.org/licenses/odbl/). The map caption carries the required "© OpenStreetMap contributors" credit. Never copy geometry from AllTrails or other proprietary sites.
- `"source": "recorded-gps"`: the crew's own recording, imported as described below. Only this kind is headed "The route we took". It replaces a published route when the crew supplies one.

Published routes as traced, with routed miles before display simplification:

| Trip | Published route traced | Routed | Documented |
| --- | --- | --- | --- |
| `t-001` | Newfound Gap → AT → Charlies Bunion and back; then Newfound Gap → AT → Boulevard Trail → Mount Le Conte → Alum Cave Trail to the Alum Cave/Grassy Patch lots | 21.1 mi | 21.5 mi |
| `t-002` | AT northbound from Carvers Gap over the Roan balds and Hump Mountain to US 19E | 14.3 mi | 14.5 mi |
| `t-003` | Twentymile Trail → Long Hungry Ridge Trail → Gregory Bald Trail over Gregory Bald → Wolf Ridge Trail | 15.5 mi | 15.6 mi |
| `t-004` | Standing Indian Campground → Lower Trail Ridge Trail → Standing Indian → AT around the basin over Albert Mountain → Glassmine Gap → Long Branch Trail | 21.3 mi | 21.6 mi |
| `t-005` | Winding Stair Gap → AT → Siler Bald and back | 8.9 mi | 9.0 mi |
| `t-006` | Black Balsam trailhead → Art Loeb Trail over Black Balsam Knob and Tennent Mountain → Shining Rock Gap → Ivestor Gap Trail | 9.5 mi | 9.8 mi |
| `t-007` | Massie Gap → Rhododendron Trail → AT over Wilburn Ridge → Rhododendron Gap → Mount Rogers spur and back → Pine Mountain Trail → The Scales → AT past Wise Shelter → Massie Gap | 14.5 mi | 13.9 mi |

A test fails if a drawn route is more than 10% off the documented distance. Never use a planned or "custom route" file as a recorded track.

### Import a recorded GPS track

1. Keep the owner-supplied recordings (GPX from Strava, AllTrails, Gaia, a watch, etc.) outside this repository. `*.gpx`, `*.fit`, `*.tcx`, `*.kml`, and `*.kmz` are ignored by Git and Vercel anyway.
2. Confirm which recordings belong to the trip and that the crew approves publishing the line. A multi-part day, multi-day trip, or combined route can use several files, listed in hiking order.
3. Run `npm run import:track -- t-007 ~/path/part-1.gpx ~/path/part-2.gpx`. Add `--trim-start 200` and/or `--trim-end 200` (meters) if a recording started or ended somewhere private, such as a house or a dispersed campsite.
4. The importer keeps only recorded track-point coordinates, simplified to about 6 m and rounded to 5 decimals. Timestamps (which would reveal exact hiking days), elevation, names, waypoints, and device metadata are dropped. It writes `src/content/public/tracks/t-007.json`.
5. Validation fails while that file is unreferenced. After reviewing the map with `npm run dev`, approve publication by setting `"track": "t-007.json"` on the trip, then run `npm run check`.

The map is a static, server-rendered SVG with no tile service or third-party requests. Recorded-track length is never shown as a trip metric. Distance and elevation remain documented-route figures. The output audit checks that maps appear only on trips with approved tracks and that trip pages contain no recording timestamps.

### Topographic basemaps

A route map can draw its line over a static terrain image from the USGS The National Map `USGSTopo` layer (public domain), showing contours, shading, trails and place names. Without one, the map falls back to the plain grid.

1. Run `npm run fetch:basemap -- t-007` (several trip IDs are allowed; `--force` replaces an existing one). The trip must already reference an approved track. This local tool is never run by the build. It sends only the map's bounding box to USGS, re-encodes the export as WebP without metadata in `public/maps/t-007.webp`, and records the image's exact bounds in `src/content/public/basemaps.json`.
2. Review the map with `npm run dev`, then run `npm run check`.

The image is placed by its recorded bounds, so it stays aligned with the line. Validation allows only manifest-listed files in `public/maps/`, checks dimensions and metadata, and fails if a basemap no longer covers its route map (for example, after a track changes). Refetch it then. The map caption credits USGS whenever a basemap is shown. As of November 17, 2026, only `t-007` has a basemap.

## Photographs

The homepage uses owner-supplied photo `p-0001`, explicitly approved for that placement on November 11, 2026. Its WebP derivative has identifying metadata removed and is registered in the public photo inventory. No trip association or personal identification is inferred. Remaining green contour panels explicitly say **Development photo placeholder** and do not depict any real location or trip.

Photo `p-0002` was owner-supplied and approved on November 11, 2026 for the Grayson Highlands and Mount Rogers Loop latest-adventure feature. Its metadata-stripped WebP is registered with trip `t-007`, supplying the homepage feature, archive card and trip page. The homepage feature preserves the full photograph on desktop and mobile. No people are identified.

Photo `p-0004` was owner-supplied and approved on November 17, 2026 for the Carvers Gap to US 19E trip page. Its metadata-stripped WebP is registered with trip `t-002`. No people are identified.

Photo `p-0005` was owner-supplied and approved on November 17, 2026 for the Our story crew slot (`crewPhotoId`). Its metadata-stripped WebP is registered in the public photo inventory without a trip association. No people are identified.

Keep originals outside this repository in private local storage. Before adding a public derivative, record permission and confirmed trip association, inspect the image, strip EXIF/IPTC/XMP and location metadata, and rename it with a non-name ID such as `p-0001.webp`. Do not send source attachments to external services. An image inventory needs orientation, placement, focal point, factual alt text, and any approved first-name-only credit. Never identify a person from their face.

Place only a cleaned approved derivative in `public/images/`, then add an entry to `photos` with `id`, `filename`, `publicApproval: true`, `metadataRemoved: true`, `alt`, `width`, and `height`. Optional fields: `caption`, `creditMemberId`, and `focalPoint` as `[xPercent, yPercent]`. Credits must reference an approved profile. Validation checks approval, filename, dimensions, actual EXIF/IPTC/XMP absence, and dangling references. Owner review must also cover visible identifying details and the photo's contents. Never add an original to `public`, because Next.js serves those files directly.

Set a trip's `images`, or `heroPhotoId`/`crewPhotoId` in site configuration, to replace the matching placeholder. `next/image` sets responsive sizes and stable image areas; only the actual hero is preloaded. Review crops on mobile. A complete keyboard-operated lightbox and image inventory review belong to the photo phase once real images exist. Do not claim that phase is complete before those checks.

## Brand and configuration

Edit `src/config/site.ts` for the working name, tagline, confirmed social links, image placements, or an agreed goal. The same name drives navigation, footer, metadata, contact subject, and the typography-only social preview image. No final brand or logo is assumed.

| Environment variable | Effect |
| --- | --- |
| `SITE_URL` | Approved HTTPS production origin, without path/query/credentials. Enables canonical URLs and social-image references. Leave unset until known. |
| `GROUP_EMAIL` | Approved shared group inbox. Enables email CTAs and footer contact. No email is invented. |
| `ALLOW_INDEXING` | Explicit `true` allows indexing only when a domain exists and this is not a Vercel preview. Defaults off. |
| `VERCEL_ENV` | Set by Vercel. Preview deployments always remain noindex, with robots disallow and an empty sitemap. |

Use `.env.local` for local configuration and the Vercel environment settings for deployment. Rebuild after changing configuration; pages are static. No secret or private roster value belongs in a public environment variable. Social links must be confirmed HTTPS accounts. Leave the array empty for unavailable accounts.

For an agreed mileage goal, set `site.goal` to `{ label, year, targetMiles }`. The journey page derives that year's documented miles from the same trips. Leave `null` until the target and period are approved. The annual comparison bars are not goal progress bars.

The partnership page offers discussion ideas only. There are no sponsor claims, unverified businesses, forms, success messages, or outgoing requests. The initial contact path uses a configured `mailto` link. Adding a form requires an approved delivery provider/destination and verified acceptance before reporting success.

## Vercel release workflow

Source repository: [MTN-Pred-Hiking-Website](https://github.com/justintimechick-bit/MTN-Pred-Hiking-Website). The owner authorized the initial source-code push after local implementation. No Vercel project or deployment was created as part of that handoff. This folder did not start as a Git repository; source-attachment exclusions were added before the initial commit.

1. Review the release candidate locally with `npm run check` and mobile/desktop browser checks. Verify the Git staging list excludes all source attachments and private records before committing. Do not use `git add --force`.
2. When the owner authorizes deployment, import the GitHub repository into Vercel. Choose **Next.js**, Node **24.x**, and the default output settings. The build command is `npm run build`; no adapter or static export is needed.
3. Configure approved production environment values. Keep `ALLOW_INDEXING=false` while the site is unfinished. Use Vercel preview protection as appropriate. Noindex is indexing control, not access control; preview content must still be entirely public-safe.
4. Review a branch preview. Vercel Git integration can automatically deploy production-branch pushes, so do not push or connect production as part of a review-only task.
5. After an explicit launch decision, configure the real domain, contact, and approved imagery, then enable indexing in production only and rebuild. Confirm rendered canonicals, robots, sitemap, social previews, all CTAs, and photo permissions before release.

To revert a release, use Vercel's deployment rollback/promote controls to restore the previous known-good deployment, or revert the source commit and redeploy after checks. Environment settings are maintained separately; verify they still match the intended release.

Official references: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images), [images](https://nextjs.org/docs/app/getting-started/images), [Vercel Git deployments](https://vercel.com/docs/git).

See `docs/IMPLEMENTATION.md` for phase status, validation evidence, and remaining launch inputs.

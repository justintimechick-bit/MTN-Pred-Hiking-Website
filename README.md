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

Run `npm run check` before a release. It runs Biome lint, TypeScript, 11 content tests, content/asset validation, the production build, and a rendered-output audit. `npm run audit:output` requires an existing build. Font files are self-hosted; building does not fetch Google Fonts. The pinned dependencies and lockfile are intentional. Biome provides linting without the incompatible ESLint plugin dependency chain.

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
| `publicationState` | `draft` or `published` |
| `tripState` | `planned` or `completed` |

Only published completed trips get public routes and contribute to totals. Every entry in this file, including drafts, must already be safe for public use. Keep private editorial drafts outside the project. Shared functions update the home, journey, annual totals, archive, and sitemap; no page-component edits are needed. The test suite demonstrates adding a hypothetical eighth published record without altering the source dataset. Update baseline reconciliation assertions when real approved history changes.

For an approved recap, create `src/content/public/recaps/t-008.md` and set `recap` to that filename. Markdown is rendered without raw HTML. Do not add editorial TODOs, invented stories, private names, exact days, or unverified tracks. Trip facts render on their own when a recap is absent. The initial seven records total **105.9 documented route miles**, **19,920 ft listed gain**, **three states**, and **75 trip participations**.

## Photographs

The homepage uses owner-supplied photo `p-0001`, explicitly approved for that placement on November 11, 2026. Its WebP derivative has identifying metadata removed and is registered in the public photo inventory. No trip association or personal identification is inferred. Remaining green contour panels explicitly say **Development photo placeholder** and do not depict any real location or trip.

Photo `p-0002` was owner-supplied and approved on November 11, 2026 for the Grayson Highlands and Mount Rogers Loop latest-adventure feature. Its metadata-stripped WebP is registered with trip `t-007`, supplying the homepage feature, archive card and trip page. The homepage feature preserves the full photograph on desktop and mobile. No people are identified.

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

# Project instructions

Read this file and the existing code before changes. Follow the owner's shared privacy rules.

- Public content is an explicit allowlist in `src/content/public/`. Never read or import the raw workbook from application code or build scripts. Never copy, commit, upload, or serve source attachments. They remain ignored local reference files.
- Hiker names can only be approved first names or trail names. No surnames or surname initials in any public surface, metadata, URL, image filename, caption, alt text, JSON, download, or social preview. Use stable non-name member IDs. Profiles start empty; only explicit public approval permits an entry.
- Trip history was approved by the owner on November 10, 2026. Preserve month precision, combined-route counting, and documented-route metric labels. Never fabricate experiences, attendance, exact dates, tracks, goals, partners, reach, or accounts.
- Keep internal plans, purchases, membership counts, contact records, and target businesses out of public content. Do not use private data or a surname denylist as a test fixture.
- Brand, tagline, group email, available social links, and canonical domain belong in `src/config/site.ts`. Hide actions without real configuration.
- Use Next.js App Router, TypeScript, and plain CSS. Prefer static Server Components. No database, authentication, member portal, or custom CMS.
- Photos must be owner-supplied, explicitly approved, metadata-stripped derivatives named with non-name IDs. Until then show labeled development placeholders. Do not send attachments to external services.
- Run `npm run check` for content or application changes. Build output audit complements human content approval; it cannot determine whether a trail name is secretly a surname.
- Do not deploy, push, contact businesses, or send inquiries unless the owner explicitly requests that action.

import { z } from "zod";

const publicText = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    (text) => !/[<>]|https?:\/\/|@/.test(text),
    "Use plain approved public text without contact details or markup",
  );
const id = z.string().regex(/^t-\d{3,}$/);
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const optionalMetric = z.number().nonnegative().nullable();

export const tripSchema = z
  .strictObject({
    id,
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    title: publicText,
    month,
    datePrecision: z.literal("month"),
    region: publicText,
    states: z.array(z.enum(["TN", "NC", "VA", "GA", "SC", "AL", "KY", "WV"])).min(1),
    routeType: z.enum(["Combined", "Point to point", "Loop", "Out and back"]),
    componentRoutes: z.array(publicText).optional(),
    distanceMiles: optionalMetric,
    elevationGainFt: optionalMetric,
    metricBasis: z.literal("documented-route"),
    participantCount: z.number().int().positive().nullable().optional(),
    recap: z
      .string()
      .regex(/^t-\d{3,}\.md$/)
      .optional(),
    images: z.array(z.string().regex(/^p-\d{4,}$/)).optional(),
    track: z
      .string()
      .regex(/^t-\d{3,}\.json$/)
      .optional(),
    publicationState: z.enum(["draft", "published"]),
    tripState: z.enum(["planned", "completed"]),
  })
  .refine(
    (trip) => trip.routeType !== "Combined" || (trip.componentRoutes?.length ?? 0) >= 2,
    "Combined trips need component routes",
  );

const coordinate = z.tuple([
  z
    .number()
    .min(-180)
    .max(180)
    .refine((n) => Number(n.toFixed(5)) === n, "Round longitude to 5 decimals"),
  z
    .number()
    .min(-90)
    .max(90)
    .refine((n) => Number(n.toFixed(5)) === n, "Round latitude to 5 decimals"),
]);

const segments = z.array(z.array(coordinate).min(2).max(3000)).min(1).max(20);

// Route lines are coordinates only. Strict objects and bare [lon, lat] tuples leave
// no place for timestamps, elevation, or waypoint names.
export const trackSchema = z.discriminatedUnion("source", [
  // The crew's own GPS recording, imported with scripts/import-track.ts.
  z.strictObject({
    tripId: id,
    source: z.literal("recorded-gps"),
    timestampsRemoved: z.literal(true),
    segments,
  }),
  // The commonly published version of the documented route, traced on OpenStreetMap
  // trail data. Approximate: never presented as a recording of the crew's hike.
  z.strictObject({
    tripId: id,
    source: z.literal("published-route"),
    dataSource: z.literal("openstreetmap"),
    segments,
  }),
]);

// A static USGS topographic image drawn under a trip's route map. Written only by
// scripts/fetch-basemap.ts; bounds place the image, so it cannot drift from the route.
const lon = z.number().min(-180).max(180);
const lat = z.number().min(-85).max(85);
export const basemapSchema = z
  .strictObject({
    tripId: id,
    filename: z.string().regex(/^t-\d{3,}\.webp$/),
    source: z.literal("usgs-national-map"),
    layer: z.literal("USGSTopo"),
    metadataRemoved: z.literal(true),
    bounds: z.tuple([lon, lat, lon, lat]),
    width: z.number().int().positive().max(4096),
    height: z.number().int().positive().max(4096),
  })
  .refine((map) => map.filename === `${map.tripId}.webp`, "Basemap filename must match its trip")
  .refine(
    ({ bounds: [w, s, e, n] }) => w < e && s < n,
    "Basemap bounds are [west, south, east, north]",
  );
export const basemapsSchema = z
  .array(basemapSchema)
  .refine(
    (maps) => new Set(maps.map((map) => map.tripId)).size === maps.length,
    "One basemap per trip",
  );

export const profileSchema = z
  .strictObject({
    id: z.string().regex(/^m-\d{4,}$/),
    publicApproval: z.literal(true),
    displayName: z.string().trim().min(2).max(45),
    nameKind: z.enum(["first", "trail"]),
    bio: publicText.optional(),
    photoId: z
      .string()
      .regex(/^p-\d{4,}$/)
      .optional(),
  })
  .refine(
    (profile) =>
      profile.nameKind !== "first" ||
      /^[\p{L}\p{M}]+(?:[-'’][\p{L}\p{M}]+)*$/u.test(profile.displayName),
    "A first name must contain one name, without initials",
  );

export const photoSchema = z.strictObject({
  id: z.string().regex(/^p-\d{4,}$/),
  publicApproval: z.literal(true),
  metadataRemoved: z.literal(true),
  filename: z.string().regex(/^p-\d{4,}\.(webp|avif|jpg|jpeg|png)$/),
  alt: publicText,
  caption: publicText.optional(),
  creditMemberId: z
    .string()
    .regex(/^m-\d{4,}$/)
    .optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  focalPoint: z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]).optional(),
});

export const contentSchema = z
  .strictObject({
    trips: z.array(tripSchema),
    profiles: z.array(profileSchema),
    photos: z.array(photoSchema),
  })
  .superRefine((content, ctx) => {
    for (const key of ["trips", "profiles", "photos"] as const) {
      const ids = content[key].map((item) => item.id);
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({ code: "custom", message: `Duplicate ${key} IDs`, path: [key] });
    }
    if (new Set(content.trips.map((trip) => trip.slug)).size !== content.trips.length)
      ctx.addIssue({ code: "custom", message: "Duplicate trip slugs", path: ["trips"] });
    const photoIds = new Set(content.photos.map((photo) => photo.id));
    const memberIds = new Set(content.profiles.map((profile) => profile.id));
    for (const trip of content.trips)
      if (trip.track && trip.track !== `${trip.id}.json`)
        ctx.addIssue({
          code: "custom",
          message: "Track filename must match its trip ID",
          path: ["trips", trip.id],
        });
    for (const trip of content.trips)
      for (const photo of trip.images ?? []) {
        if (!photoIds.has(photo))
          ctx.addIssue({
            code: "custom",
            message: "Trip references an unapproved photo",
            path: ["trips", trip.id],
          });
      }
    for (const profile of content.profiles) {
      if (profile.photoId && !photoIds.has(profile.photoId))
        ctx.addIssue({
          code: "custom",
          message: "Profile references an unapproved photo",
          path: ["profiles", profile.id],
        });
    }
    for (const photo of content.photos) {
      if (photo.creditMemberId && !memberIds.has(photo.creditMemberId))
        ctx.addIssue({
          code: "custom",
          message: "Photo credit references an unapproved profile",
          path: ["photos", photo.id],
        });
      if (!photo.filename.startsWith(`${photo.id}.`))
        ctx.addIssue({
          code: "custom",
          message: "Photo filename must match its stable ID",
          path: ["photos", photo.id],
        });
    }
  });

export type Trip = z.infer<typeof tripSchema>;
export type Track = z.infer<typeof trackSchema>;
export type Basemap = z.infer<typeof basemapSchema>;

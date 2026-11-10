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
    publicationState: z.enum(["draft", "published"]),
    tripState: z.enum(["planned", "completed"]),
  })
  .refine(
    (trip) => trip.routeType !== "Combined" || (trip.componentRoutes?.length ?? 0) >= 2,
    "Combined trips need component routes",
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

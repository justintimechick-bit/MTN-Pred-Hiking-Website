import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import data from "@/content/public/content.json";
import basemapData from "@/content/public/basemaps.json";
import { basemapsSchema, contentSchema, type Trip, trackSchema } from "./schema";
import { publishedTrips } from "./trips";

// Build-time allowlist only. No private source reader or client-side filtering.
export const content = contentSchema.parse(data);
export const trips = publishedTrips(content.trips);
export const getTrip = (slug: string) => trips.find((trip) => trip.slug === slug);

/** An approved, coordinates-only track, read only when the trip explicitly references it. */
export async function getTrack(trip: Trip) {
  if (!trip.track) return null;
  const file = path.join(process.cwd(), "src/content/public/tracks", trip.track);
  const track = trackSchema.parse(JSON.parse(await readFile(file, "utf8")));
  if (track.tripId !== trip.id) throw new Error("Track belongs to a different trip");
  return track;
}

const basemaps = basemapsSchema.parse(basemapData);
/** The static terrain image under a trip's route map, if one has been fetched. */
export const getBasemap = (trip: Trip) => basemaps.find((map) => map.tripId === trip.id) ?? null;

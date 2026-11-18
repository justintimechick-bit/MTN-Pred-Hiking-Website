import type { Basemap, Track } from "@/lib/schema";
import { projectSegments } from "@/lib/track";

export function RouteMap({
  track,
  title,
  basemap,
}: {
  track: Track;
  title: string;
  basemap?: Basemap | null;
}) {
  const map = projectSegments(track.segments);
  const { width, height, start, finish, isLoop, scaleBar } = map;
  const recorded = track.source === "recorded-gps";
  const gridStep = 40;
  // Place the terrain image by its recorded corners, so it stays aligned with the line.
  const terrain = basemap && {
    nw: map.project([basemap.bounds[0], basemap.bounds[3]]),
    se: map.project([basemap.bounds[2], basemap.bounds[1]]),
  };
  const backdrop = basemap ? "on a USGS topographic map" : "drawn without a basemap";
  return (
    <figure className="route-map">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${track.tripId}-map-title`}
      >
        <title id={`${track.tripId}-map-title`}>
          {recorded
            ? `Map of the recorded GPS track for ${title}, ${backdrop}. North is up.`
            : `Approximate map of the published route for ${title}, ${backdrop}. North is up.`}
        </title>
        <rect width={width} height={height} className="route-map-bg" />
        {basemap && terrain ? (
          <image
            href={`/maps/${basemap.filename}`}
            x={terrain.nw[0]}
            y={terrain.nw[1]}
            width={Number((terrain.se[0] - terrain.nw[0]).toFixed(1))}
            height={Number((terrain.se[1] - terrain.nw[1]).toFixed(1))}
            preserveAspectRatio="none"
            className="route-map-terrain"
          />
        ) : (
          <>
            <defs>
              <pattern
                id={`${track.tripId}-grid`}
                width={gridStep}
                height={gridStep}
                patternUnits="userSpaceOnUse"
              >
                <path d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`} className="route-map-grid" />
              </pattern>
            </defs>
            <rect width={width} height={height} fill={`url(#${track.tripId}-grid)`} />
          </>
        )}
        {map.paths.map((d, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: segments are static and ordered
          <path key={`casing-${i}`} d={d} className="route-map-casing" />
        ))}
        {map.paths.map((d, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: segments are static and ordered
          <path key={`line-${i}`} d={d} className="route-map-line" />
        ))}
        {isLoop ? (
          <circle cx={start[0]} cy={start[1]} r="10" className="route-map-start" />
        ) : (
          <>
            <rect
              x={finish[0] - 8}
              y={finish[1] - 8}
              width="16"
              height="16"
              className="route-map-finish"
            />
            <circle cx={start[0]} cy={start[1]} r="10" className="route-map-start" />
          </>
        )}
        <g transform={`translate(${width - 44} 30)`} className="route-map-north">
          <path d="M0 -14 L8 8 L0 3 L-8 8 Z" />
          <text y="28" textAnchor="middle">
            N
          </text>
        </g>
        <g transform={`translate(24 ${height - 24})`} className="route-map-scale">
          <path d={`M0 -6 V0 H${scaleBar.px} V-6`} />
          <text x={scaleBar.px + 10} y="2">
            {scaleBar.label}
          </text>
        </g>
      </svg>
      <figcaption>
        <ul className="route-map-legend">
          <li>
            <span className="legend-start" aria-hidden="true" />
            {isLoop ? "Start and finish" : "Start"}
          </li>
          {!isLoop && (
            <li>
              <span className="legend-finish" aria-hidden="true" />
              Finish
            </li>
          )}
          <li>
            <span className="legend-line" aria-hidden="true" />
            {recorded ? "Recorded track" : "Published route"}
          </li>
        </ul>
        {recorded ? (
          <p>
            The crew’s recorded GPS track, simplified{basemap ? "" : " and drawn without a basemap"}
            . Timestamps and waypoints were removed. Its length can differ from the documented route
            figures.
          </p>
        ) : (
          <p>
            Approximate line of the commonly published version of this route, traced on
            OpenStreetMap trail data and checked against the documented distance. It is not a GPS
            recording of our hike. Map data ©{" "}
            <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>,
            available under the Open Database License.
          </p>
        )}
        {basemap && (
          <p>
            Base map: U.S. Geological Survey,{" "}
            <a href="https://www.usgs.gov/programs/national-geospatial-program/national-map">
              The National Map
            </a>{" "}
            (public domain). Trails shown on the base map may differ from the route line.
          </p>
        )}
      </figcaption>
    </figure>
  );
}

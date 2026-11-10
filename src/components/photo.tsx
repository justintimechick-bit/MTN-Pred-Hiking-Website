import Image from "next/image";
import { content } from "@/lib/content";

export function Photo({
  id,
  label = "Trip photograph",
  hero = false,
  className = "",
}: {
  id?: string | null;
  label?: string;
  hero?: boolean;
  className?: string;
}) {
  const photo = content.photos.find((entry) => entry.id === id);
  const credit = photo?.creditMemberId
    ? content.profiles.find((member) => member.id === photo.creditMemberId)
    : undefined;
  return (
    <figure className={`photo ${photo ? "has-photo" : "photo-placeholder"} ${className}`}>
      {photo ? (
        <>
          <Image
            src={`/images/${photo.filename}`}
            alt={photo.alt}
            fill
            sizes={hero ? "100vw" : "(max-width: 700px) 100vw, 50vw"}
            preload={hero}
            style={{
              objectFit: "cover",
              objectPosition: photo.focalPoint
                ? `${photo.focalPoint[0]}% ${photo.focalPoint[1]}%`
                : "50% 50%",
            }}
          />
          {(photo.caption || credit) && (
            <figcaption>
              {photo.caption}
              {credit ? ` Photo: ${credit.displayName}.` : ""}
            </figcaption>
          )}
        </>
      ) : (
        <>
          <svg
            className="contours"
            viewBox="0 0 800 500"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((line) => (
              <path
                key={line}
                d={`M ${-110 + line * 16} ${450 + line * 35} C ${80 + line * 9} ${200 + line * 24}, ${290 + line * 8} ${580 - line * 14}, ${420 + line * 16} ${240 - line * 16} S ${650 + line * 22} ${80 - line * 10}, ${920} ${-80 + line * 20}`}
              />
            ))}
          </svg>
          <div className="placeholder-note">
            <span className="photo-symbol" aria-hidden="true">
              ＋
            </span>
            <span>
              {label}
              <small>Development photo placeholder</small>
            </span>
          </div>
        </>
      )}
    </figure>
  );
}

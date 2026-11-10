import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const dynamic = "force-static";
export function GET() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "76px",
        background: "#173c36",
        color: "#f7f7f0",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 28, color: "#f8d74b" }}>Atlanta, Georgia</div>
      <div
        style={{ display: "flex", maxWidth: 950, fontSize: 106, fontWeight: 700, lineHeight: 1 }}
      >
        {site.name}
      </div>
      <div style={{ display: "flex", fontSize: 32 }}>{site.tagline}</div>
    </div>,
    { width: 1200, height: 630 },
  );
}

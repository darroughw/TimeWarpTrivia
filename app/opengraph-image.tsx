import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "TimeWarp Trivia: decade-hopping party trivia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const logoSvg = readFileSync(join(process.cwd(), "public", "logo.svg"), "utf-8");
  const logoDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          background: "#0b0e1a",
          backgroundImage:
            "radial-gradient(circle at 50% 35%, rgba(255,178,56,0.16), transparent 60%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUrl} width={240} height={222} alt="" />
        <div
          style={{
            display: "flex",
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#fbf6ec",
          }}
        >
          Decade-Hopping Party Trivia
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#a7abc4" }}>
          Host on the big screen. Everyone else plays from their phone.
        </div>
      </div>
    ),
    { ...size },
  );
}

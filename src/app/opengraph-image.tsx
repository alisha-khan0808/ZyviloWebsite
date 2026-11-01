import { ImageResponse } from "next/og";

export const alt = "Zyvilo — Your Business. On Autopilot.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "radial-gradient(circle at 85% 10%, #D9C8FF 0%, #F3ECFF 35%, #FCFAFF 70%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 800, color: "#080B2C", letterSpacing: -1 }}>Zyvilo</div>
        <div style={{ fontSize: 22, letterSpacing: 8, color: "#7300FF", marginTop: 6 }}>AI AUTOMATIONS</div>
        <div style={{ fontSize: 84, fontWeight: 800, color: "#080B2C", marginTop: 60, lineHeight: 1.05 }}>Your Business.</div>
        <div style={{ fontSize: 84, fontWeight: 800, color: "#7300FF", lineHeight: 1.05 }}>On Autopilot.</div>
        <div style={{ fontSize: 28, color: "#5E6075", marginTop: 30, maxWidth: 900 }}>
          AI agents, multi-agent systems and end-to-end business automation.
        </div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";
import { BUGSPARK_DASHBOARD_DOMAIN } from "@/lib/constants";

export const runtime = "edge";
export const alt = "BugSpark - 香港 Bug 回報追蹤工具";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
          position: "relative",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.3), transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.2), transparent 70%)",
          }}
        />

        {/* Logo / Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 700,
              color: "white",
            }}
          >
            B
          </div>
          <span
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "white",
              letterSpacing: -1,
            }}
          >
            BugSpark
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.85)",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
          }}
        >
          香港最強 Bug 回報追蹤工具
        </div>

        {/* Sub-tagline */}
        <div
          style={{
            fontSize: 18,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            maxWidth: 700,
            marginTop: 16,
            lineHeight: 1.5,
          }}
        >
          自動擷取螢幕截圖 · 主控台日誌 · 網路請求 · AI 分析
        </div>

        {/* Domain */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 16,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          {BUGSPARK_DASHBOARD_DOMAIN}
        </div>
      </div>
    ),
    { ...size },
  );
}

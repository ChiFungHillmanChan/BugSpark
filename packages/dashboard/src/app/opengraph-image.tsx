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
              background: "linear-gradient(135deg, #0f172a, #1e1b4b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Spider icon using SVG inline */}
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <ellipse cx="16" cy="14" rx="4.5" ry="3.5" fill="#e94560" />
              <ellipse cx="16" cy="20" rx="3.5" ry="3" fill="#e94560" />
              <circle cx="14.5" cy="13" r="1" fill="white" opacity="0.9" />
              <circle cx="17.5" cy="13" r="1" fill="white" opacity="0.9" />
              <path d="M11.5 14 Q9 11 6 9.5" stroke="#ff6b6b" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M11.5 15.5 Q8.5 14.5 5.5 14" stroke="#ff6b6b" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M12.5 18 Q9 19 6 21" stroke="#ff6b6b" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M13 20 Q10 22 7.5 25" stroke="#ff6b6b" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M20.5 14 Q23 11 26 9.5" stroke="#ff6b6b" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M20.5 15.5 Q23.5 14.5 26.5 14" stroke="#ff6b6b" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M19.5 18 Q23 19 26 21" stroke="#ff6b6b" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M19 20 Q22 22 24.5 25" stroke="#ff6b6b" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
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

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BugSpark",
    short_name: "BugSpark",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#e94560",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

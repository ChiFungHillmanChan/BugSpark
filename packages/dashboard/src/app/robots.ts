import type { MetadataRoute } from "next";
import { BUGSPARK_DASHBOARD_URL } from "@/lib/constants";

const BASE_URL = BUGSPARK_DASHBOARD_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/features", "/pricing", "/about", "/changelog", "/docs"],
        disallow: [
          "/dashboard",
          "/bugs",
          "/projects",
          "/settings",
          "/admin",
          "/api/",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

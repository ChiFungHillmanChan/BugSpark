import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import ChangelogContent from "./changelog-content";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    titleZh: "更新日誌",
    titleEn: "Changelog",
    descriptionZh: "BugSpark 的所有最新更新、改進和修復。",
    descriptionEn:
      "All the latest updates, improvements and fixes for BugSpark.",
    path: "/changelog",
  });
}

export default function ChangelogPage() {
  return <ChangelogContent />;
}

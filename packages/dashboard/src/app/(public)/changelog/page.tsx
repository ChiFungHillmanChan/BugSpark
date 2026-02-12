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

const changelogJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "BugSpark Changelog",
  description: "All the latest updates, improvements and fixes for BugSpark.",
  url: "https://bugspark.hillmanchan.com/changelog",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "v0.3.0 — AI Analysis & GitHub/Linear Integration" },
      { "@type": "ListItem", position: 2, name: "v0.2.0 — Dashboard & CLI" },
      { "@type": "ListItem", position: 3, name: "v0.1.0 — Widget MVP" },
    ],
  },
};

export default function ChangelogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(changelogJsonLd) }}
      />
      <ChangelogContent />
    </>
  );
}

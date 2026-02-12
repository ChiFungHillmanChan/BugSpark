import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import AboutContent from "./about-content";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    titleZh: "關於 BugSpark - 香港開發者工具",
    titleEn: "About BugSpark - Developer Tools from Hong Kong",
    descriptionZh:
      "BugSpark 由香港開發者打造，致力於讓錯誤回報不再痛苦。開源、隱私優先、極致簡潔。",
    descriptionEn:
      "Built by developers, for developers. BugSpark makes bug reporting effortless. Open source, privacy-first, radically simple.",
    path: "/about",
  });
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BugSpark",
  url: "https://bugspark.hillmanchan.com",
  logo: "https://bugspark.hillmanchan.com/icon.png",
  description:
    "BugSpark 由香港開發者打造，致力於讓錯誤回報不再痛苦。開源、隱私優先、極致簡潔。",
  founder: {
    "@type": "Person",
    name: "Hillman Chan",
    url: "https://hillmanchan.com",
  },
  sameAs: ["https://github.com/BugSpark"],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <AboutContent />
    </>
  );
}

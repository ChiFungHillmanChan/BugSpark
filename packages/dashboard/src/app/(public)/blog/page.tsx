import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo";
import { BUGSPARK_DASHBOARD_URL } from "@/lib/constants";
import BlogContent from "./blog-content";

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    titleZh: "部落格 - BugSpark",
    titleEn: "Blog - BugSpark",
    descriptionZh: "指南、更新和技巧，助你充分運用 BugSpark。",
    descriptionEn:
      "Guides, updates, and tips to help you get the most out of BugSpark.",
    path: "/blog",
  });
}

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "BugSpark Blog",
  description:
    "Guides, updates, and tips to help you get the most out of BugSpark.",
  url: `${BUGSPARK_DASHBOARD_URL}/blog`,
  blogPost: [
    {
      "@type": "BlogPosting",
      headline: "Getting Started with BugSpark",
      datePublished: "2026-02",
    },
    {
      "@type": "BlogPosting",
      headline: "What's New in v0.3.0",
      datePublished: "2026-02",
    },
    {
      "@type": "BlogPosting",
      headline: "5 Tips for Better Bug Reports",
      datePublished: "2026-01",
    },
  ],
};

export default function BlogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <BlogContent />
    </>
  );
}

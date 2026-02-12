import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { loadMDXContent, getDocSlugs } from "@/lib/docs-loader";
import { DocsContent } from "@/components/docs/docs-content";
import { findDocBySlug, getAdjacentDocs } from "@/lib/docs";
import { generatePageMetadata } from "@/lib/seo";

interface DocsPageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateStaticParams() {
  return [
    { slug: undefined },
    ...getDocSlugs().map((s) => ({ slug: s.split("/") })),
  ];
}

export async function generateMetadata({
  params,
}: DocsPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug || slug.length === 0) return {};

  const doc = findDocBySlug(slug);
  const t = await getTranslations("docs");
  const docTitle = doc ? t(doc.titleKey) : slug.join("/");

  return generatePageMetadata({
    titleZh: `${docTitle} - BugSpark 文檔`,
    titleEn: `${docTitle} - BugSpark Docs`,
    descriptionZh: `BugSpark 文檔：${docTitle}。了解如何使用 BugSpark 的所有功能。`,
    descriptionEn: `BugSpark documentation: ${docTitle}. Learn how to use all BugSpark features.`,
    path: `/docs/${slug.join("/")}`,
  });
}

export default async function DocsSlugPage({ params }: DocsPageProps) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    redirect("/docs/getting-started");
  }

  const locale = await getLocale();
  const t = await getTranslations("docs");
  const slugPath = slug.join("/");
  const Content = await loadMDXContent(slugPath, locale);

  if (!Content) {
    notFound();
  }

  const { previous, next } = getAdjacentDocs(slug);

  return (
    <DocsContent>
      <Content />
      <nav className="flex items-center justify-between mt-12 pt-6 border-t border-gray-200">
        {previous ? (
          <Link
            href={`/docs/${previous.slug}`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-accent"
          >
            <ChevronLeft className="w-4 h-4" />
            {t(previous.titleKey)}
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/docs/${next.slug}`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-accent"
          >
            {t(next.titleKey)}
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </DocsContent>
  );
}

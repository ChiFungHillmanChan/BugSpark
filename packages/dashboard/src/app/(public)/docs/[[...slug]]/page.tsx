import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { loadMDXContent, getDocSlugs } from "@/lib/docs-loader";
import { DocsContent } from "@/components/docs/docs-content";
import { getAdjacentDocs } from "@/lib/docs";

interface DocsPageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateStaticParams() {
  return [
    { slug: undefined },
    ...getDocSlugs().map((s) => ({ slug: s.split("/") })),
  ];
}

export default async function DocsSlugPage({ params }: DocsPageProps) {
  const { slug } = await params;
  if (!slug || slug.length === 0) {
    redirect("/docs/getting-started");
  }

  const slugPath = slug.join("/");
  const Content = await loadMDXContent(slugPath);

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
            {previous.title}
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/docs/${next.slug}`}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-accent"
          >
            {next.title}
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <div />
        )}
      </nav>
    </DocsContent>
  );
}

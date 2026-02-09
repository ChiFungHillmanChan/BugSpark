import type { ReactNode } from "react";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { DocsSearch } from "@/components/docs/docs-search";

export default function PublicDocsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <DocsSearch basePath="/docs" />
      <div className="flex gap-8">
        <div className="hidden md:block">
          <DocsSidebar basePath="/docs" />
        </div>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

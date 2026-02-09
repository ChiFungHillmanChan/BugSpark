import type { ReactNode } from "react";

interface DocsContentProps {
  children: ReactNode;
}

export function DocsContent({ children }: DocsContentProps) {
  return (
    <article className="flex-1 min-w-0 max-w-3xl px-6 py-2">
      <div className="prose prose-gray max-w-none">{children}</div>
    </article>
  );
}

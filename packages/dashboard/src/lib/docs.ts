import { docsNavConfig, flattenNavItems, type DocNavItem } from "@/components/docs/docs-nav-config";

export function getDocSlugs(): string[][] {
  const items = flattenNavItems(docsNavConfig);
  return items.map((item) => item.slug.split("/"));
}

export function findDocBySlug(slugParts: string[]): DocNavItem | undefined {
  const slug = slugParts.join("/");
  const items = flattenNavItems(docsNavConfig);
  return items.find((item) => item.slug === slug);
}

export function getAdjacentDocs(
  slugParts: string[],
): { previous: DocNavItem | undefined; next: DocNavItem | undefined } {
  const slug = slugParts.join("/");
  const items = flattenNavItems(docsNavConfig);
  const index = items.findIndex((item) => item.slug === slug);

  return {
    previous: index > 0 ? items[index - 1] : undefined,
    next: index < items.length - 1 ? items[index + 1] : undefined,
  };
}

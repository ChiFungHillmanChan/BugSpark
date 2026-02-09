export interface DocNavItem {
  title: string;
  slug: string;
  children?: DocNavItem[];
}

export const docsNavConfig: DocNavItem[] = [
  {
    title: "Getting Started",
    slug: "getting-started",
  },
  {
    title: "Widget",
    slug: "widget",
    children: [
      { title: "Installation", slug: "widget/installation" },
      { title: "Configuration", slug: "widget/configuration" },
      { title: "Annotation Tools", slug: "widget/annotation-tools" },
      { title: "Advanced", slug: "widget/advanced" },
    ],
  },
  {
    title: "API Reference",
    slug: "api",
    children: [
      { title: "Authentication", slug: "api/authentication" },
      { title: "Reports", slug: "api/reports" },
      { title: "Projects", slug: "api/projects" },
      { title: "Webhooks", slug: "api/webhooks" },
    ],
  },
  {
    title: "Dashboard",
    slug: "dashboard",
    children: [
      { title: "Overview", slug: "dashboard/overview" },
      { title: "Bug Management", slug: "dashboard/bug-management" },
      { title: "Project Setup", slug: "dashboard/project-setup" },
    ],
  },
];

export function flattenNavItems(items: DocNavItem[]): DocNavItem[] {
  const result: DocNavItem[] = [];
  for (const item of items) {
    if (item.children) {
      result.push(...item.children);
    } else {
      result.push(item);
    }
  }
  return result;
}

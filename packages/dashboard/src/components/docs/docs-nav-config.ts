export interface DocNavItem {
  titleKey: string;
  slug: string;
  children?: DocNavItem[];
}

export const docsNavConfig: DocNavItem[] = [
  {
    titleKey: "gettingStarted",
    slug: "getting-started",
  },
  {
    titleKey: "widget",
    slug: "widget",
    children: [
      { titleKey: "installation", slug: "widget/installation" },
      { titleKey: "configuration", slug: "widget/configuration" },
      { titleKey: "annotationTools", slug: "widget/annotation-tools" },
      { titleKey: "advanced", slug: "widget/advanced" },
    ],
  },
  {
    titleKey: "cli",
    slug: "cli",
    children: [
      { titleKey: "cliInstallation", slug: "cli/installation" },
      { titleKey: "cliCommands", slug: "cli/commands" },
      { titleKey: "cliAuthentication", slug: "cli/authentication" },
      { titleKey: "cliAiSetup", slug: "cli/ai-setup" },
    ],
  },
  {
    titleKey: "apiReference",
    slug: "api",
    children: [
      { titleKey: "authentication", slug: "api/authentication" },
      { titleKey: "reports", slug: "api/reports" },
      { titleKey: "projects", slug: "api/projects" },
      { titleKey: "webhooks", slug: "api/webhooks" },
    ],
  },
  {
    titleKey: "dashboard",
    slug: "dashboard",
    children: [
      { titleKey: "overview", slug: "dashboard/overview" },
      { titleKey: "bugManagement", slug: "dashboard/bug-management" },
      { titleKey: "projectSetup", slug: "dashboard/project-setup" },
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

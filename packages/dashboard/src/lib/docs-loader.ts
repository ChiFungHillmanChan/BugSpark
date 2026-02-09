import type { ComponentType } from "react";

type MDXModule = { default: ComponentType };

const MDX_MODULES: Record<string, () => Promise<MDXModule>> = {
  "getting-started": () => import("@content/docs/getting-started.mdx"),
  "widget/installation": () => import("@content/docs/widget/installation.mdx"),
  "widget/configuration": () =>
    import("@content/docs/widget/configuration.mdx"),
  "widget/annotation-tools": () =>
    import("@content/docs/widget/annotation-tools.mdx"),
  "widget/advanced": () => import("@content/docs/widget/advanced.mdx"),
  "api/authentication": () =>
    import("@content/docs/api/authentication.mdx"),
  "api/reports": () => import("@content/docs/api/reports.mdx"),
  "api/projects": () => import("@content/docs/api/projects.mdx"),
  "api/webhooks": () => import("@content/docs/api/webhooks.mdx"),
  "dashboard/overview": () =>
    import("@content/docs/dashboard/overview.mdx"),
  "dashboard/bug-management": () =>
    import("@content/docs/dashboard/bug-management.mdx"),
  "dashboard/project-setup": () =>
    import("@content/docs/dashboard/project-setup.mdx"),
};

export async function loadMDXContent(
  slug: string,
): Promise<ComponentType | null> {
  const loader = MDX_MODULES[slug];
  if (!loader) return null;
  const mod = await loader();
  return mod.default;
}

export function getDocSlugs(): string[] {
  return Object.keys(MDX_MODULES);
}

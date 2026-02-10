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
  "cli/installation": () => import("@content/docs/cli/installation.mdx"),
  "cli/commands": () => import("@content/docs/cli/commands.mdx"),
  "cli/authentication": () =>
    import("@content/docs/cli/authentication.mdx"),
  "cli/ai-setup": () => import("@content/docs/cli/ai-setup.mdx"),
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

const MDX_MODULES_ZH_TW: Record<string, () => Promise<MDXModule>> = {
  "getting-started": () =>
    import("@content/docs/zh-TW/getting-started.mdx"),
  "widget/installation": () =>
    import("@content/docs/zh-TW/widget/installation.mdx"),
  "widget/configuration": () =>
    import("@content/docs/zh-TW/widget/configuration.mdx"),
  "widget/annotation-tools": () =>
    import("@content/docs/zh-TW/widget/annotation-tools.mdx"),
  "widget/advanced": () =>
    import("@content/docs/zh-TW/widget/advanced.mdx"),
  "cli/installation": () =>
    import("@content/docs/zh-TW/cli/installation.mdx"),
  "cli/commands": () => import("@content/docs/zh-TW/cli/commands.mdx"),
  "cli/authentication": () =>
    import("@content/docs/zh-TW/cli/authentication.mdx"),
  "cli/ai-setup": () => import("@content/docs/zh-TW/cli/ai-setup.mdx"),
  "api/authentication": () =>
    import("@content/docs/zh-TW/api/authentication.mdx"),
  "api/reports": () => import("@content/docs/zh-TW/api/reports.mdx"),
  "api/projects": () => import("@content/docs/zh-TW/api/projects.mdx"),
  "api/webhooks": () => import("@content/docs/zh-TW/api/webhooks.mdx"),
  "dashboard/overview": () =>
    import("@content/docs/zh-TW/dashboard/overview.mdx"),
  "dashboard/bug-management": () =>
    import("@content/docs/zh-TW/dashboard/bug-management.mdx"),
  "dashboard/project-setup": () =>
    import("@content/docs/zh-TW/dashboard/project-setup.mdx"),
};

const LOCALE_MODULES: Record<
  string,
  Record<string, () => Promise<MDXModule>>
> = {
  en: MDX_MODULES,
  "zh-TW": MDX_MODULES_ZH_TW,
};

export async function loadMDXContent(
  slug: string,
  locale: string = "en",
): Promise<ComponentType | null> {
  const modules = LOCALE_MODULES[locale];
  const loader = modules?.[slug] ?? MDX_MODULES[slug];
  if (!loader) return null;
  const mod = await loader();
  return mod.default;
}

export function getDocSlugs(): string[] {
  return Object.keys(MDX_MODULES);
}

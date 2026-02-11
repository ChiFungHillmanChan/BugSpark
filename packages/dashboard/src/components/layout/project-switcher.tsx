"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  Layers,
  Check,
  Settings,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectContext } from "@/providers/project-provider";
import { useProjects } from "@/hooks/use-projects";

const ACCENT_COLOR = "#e94560";

/** Matches /projects/<uuid> — the project-settings page. */
const PROJECT_SETTINGS_RE = /^\/projects\/[^/]+$/;

function getProjectColor(settings: Record<string, unknown>): string {
  if (
    settings &&
    typeof settings === "object" &&
    "widgetColor" in settings &&
    typeof settings.widgetColor === "string"
  ) {
    return settings.widgetColor;
  }
  return ACCENT_COLOR;
}

interface ProjectSwitcherProps {
  onNavigate?: () => void;
}

export function ProjectSwitcher({ onNavigate }: ProjectSwitcherProps) {
  const { selectedProjectId, setSelectedProjectId } = useProjectContext();
  const { data: projects } = useProjects();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (!projects || projects.length === 0) return null;

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const displayColor = selectedProject
    ? getProjectColor(selectedProject.settings)
    : ACCENT_COLOR;

  /**
   * When the user picks a new project, update the context **and** navigate
   * to the correct page when the current route is project-specific.
   */
  function handleSelectProject(projectId: string | null) {
    setSelectedProjectId(projectId);
    setIsOpen(false);

    // If user is on a project-settings page (/projects/<id>), navigate to
    // the newly-selected project's settings — or back to /dashboard when
    // "All projects" is chosen (project settings require a single project).
    if (PROJECT_SETTINGS_RE.test(pathname)) {
      router.push(projectId ? `/projects/${projectId}` : "/dashboard");
    }
    // Pages like /dashboard and /bugs react to context automatically — no
    // explicit navigation needed.
  }

  return (
    <div className="px-4 mt-4 mb-4" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-navy-900/80 border border-gray-200 dark:border-white/[0.06] text-sm hover:bg-gray-200 dark:hover:bg-navy-800 transition-colors"
      >
        {selectedProject ? (
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: displayColor }}
          />
        ) : (
          <Layers className="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" />
        )}
        <span className="flex-1 text-left truncate font-medium">
          {selectedProject?.name ?? t("allProjects")}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 shrink-0 text-gray-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div className="mt-1 rounded-lg bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/[0.06] py-1 shadow-lg">
          <button
            onClick={() => handleSelectProject(null)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/[0.04]",
              !selectedProjectId && "text-accent font-medium",
            )}
          >
            <Layers className="w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400" />
            <span className="flex-1 text-left">{t("allProjects")}</span>
            {!selectedProjectId && (
              <Check className="w-4 h-4 shrink-0 text-accent" />
            )}
          </button>

          <div className="mx-3 my-1 border-t border-gray-200 dark:border-white/[0.06]" />

          {projects.map((project) => {
            const color = getProjectColor(project.settings);
            const isSelected = selectedProjectId === project.id;
            return (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-white/[0.04]",
                  isSelected && "text-accent font-medium",
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="flex-1 text-left truncate">
                  {project.name}
                </span>
                {isSelected && (
                  <Check className="w-4 h-4 shrink-0 text-accent" />
                )}
              </button>
            );
          })}

          <div className="mx-3 my-1 border-t border-gray-200 dark:border-white/[0.06]" />

          <Link
            href="/projects"
            onClick={() => {
              setIsOpen(false);
              onNavigate?.();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.04]"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>{t("manageProjects")}</span>
          </Link>
          <Link
            href="/projects?create=true"
            onClick={() => {
              setIsOpen(false);
              onNavigate?.();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.04]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>{t("newProject")}</span>
          </Link>
        </div>
      )}
    </div>
  );
}

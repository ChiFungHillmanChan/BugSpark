import Link from "next/link";
import { Globe } from "lucide-react";
import type { Project } from "@/types";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{project.name}</h3>
        <span
          className={`w-2 h-2 rounded-full ${
            project.isActive ? "bg-green-500" : "bg-gray-300"
          }`}
        />
      </div>

      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <Globe className="w-4 h-4" />
        <span>{project.domain}</span>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">
        {project.apiKey.slice(0, 12)}...
      </div>
    </Link>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useProjects } from "@/hooks/use-projects";

const SELECTED_PROJECT_KEY = "bugspark-selected-project";
const ALL_PROJECTS_VALUE = "__all__";

interface ProjectContextValue {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { data: projects } = useProjects();
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(SELECTED_PROJECT_KEY);
    if (stored === ALL_PROJECTS_VALUE) setSelectedProjectIdState(null);
    else if (stored) setSelectedProjectIdState(stored);
  }, []);

  useEffect(() => {
    if (!projects || projects.length === 0) return;
    const firstId = projects[0].id;
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(SELECTED_PROJECT_KEY)
        : null;
    const userChoseAll = stored === ALL_PROJECTS_VALUE;
    const isValidProject =
      selectedProjectId &&
      projects.some((p) => p.id === selectedProjectId);
    if (userChoseAll) return;
    if (!selectedProjectId || !isValidProject) {
      setSelectedProjectIdState(firstId);
      if (typeof window !== "undefined") {
        localStorage.setItem(SELECTED_PROJECT_KEY, firstId);
      }
    }
  }, [projects, selectedProjectId]);

  const setSelectedProjectId = useCallback((id: string | null) => {
    setSelectedProjectIdState(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(SELECTED_PROJECT_KEY, id);
      else localStorage.setItem(SELECTED_PROJECT_KEY, ALL_PROJECTS_VALUE);
    }
  }, []);

  return (
    <ProjectContext.Provider
      value={{ selectedProjectId, setSelectedProjectId }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within ProjectProvider");
  return ctx;
}

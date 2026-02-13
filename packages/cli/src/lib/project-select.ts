import { select } from "@inquirer/prompts";
import type { ApiClient } from "./api-client.js";
import type { ProjectResponse } from "../types.js";

export async function selectProject(client: ApiClient): Promise<ProjectResponse> {
  const projects = await client.get<ProjectResponse[]>("/projects");
  if (projects.length === 0) {
    throw new Error("No projects found. Create one with: bugspark projects create <name>");
  }
  if (projects.length === 1) return projects[0];

  const selectedId = await select({
    message: "Select a project",
    choices: projects.map((p) => ({
      name: `${p.name} (${p.domain || "no domain"})`,
      value: p.id,
    })),
  });

  const found = projects.find((p) => p.id === selectedId);
  if (!found) throw new Error("Selected project not found.");
  return found;
}

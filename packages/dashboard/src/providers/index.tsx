"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { ProjectProvider } from "./project-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <ProjectProvider>{children}</ProjectProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

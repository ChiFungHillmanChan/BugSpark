import { Bug } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-navy-900 px-4">
      <div className="mb-8 flex items-center gap-2">
        <Bug className="w-8 h-8 text-accent" />
        <span className="text-2xl font-bold text-gray-900 dark:text-white">BugSpark</span>
      </div>
      {children}
    </div>
  );
}

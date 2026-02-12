import { Bug } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Bug className="w-8 h-8 text-accent animate-pulse dark:drop-shadow-[0_0_12px_var(--color-accent-glow)]" />
    </div>
  );
}

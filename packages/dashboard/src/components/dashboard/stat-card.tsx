import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-navy-800/50 rounded-xl border border-gray-200 dark:border-white/[0.06] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <div className="dark:bg-accent/10 dark:p-2 dark:rounded-lg"><Icon className="w-5 h-5 text-gray-400 dark:text-accent" /></div>
      </div>
      <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

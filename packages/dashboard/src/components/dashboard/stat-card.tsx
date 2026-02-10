import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <Icon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      </div>
      <span className="text-3xl font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

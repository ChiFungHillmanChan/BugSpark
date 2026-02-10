import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-navy-700 dark:via-navy-600 dark:to-navy-700 bg-[length:200%_100%] animate-shimmer",
        className,
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/[0.06] p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, index) => (
        <td key={index} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonChart() {
  return <Skeleton className="h-64 w-full" />;
}

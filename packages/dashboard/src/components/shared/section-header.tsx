import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  pill?: string;
  title: string;
  subtitle?: string;
  hasGradientTitle?: boolean;
}

export function SectionHeader({
  pill,
  title,
  subtitle,
  hasGradientTitle = false,
}: SectionHeaderProps) {
  return (
    <div className="text-center mb-16">
      {pill && <span className="section-pill mb-4">{pill}</span>}
      <h2
        className={cn(
          "text-3xl sm:text-4xl font-bold mt-4",
          "text-gray-900 dark:text-white",
          hasGradientTitle && "dark:gradient-text",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}

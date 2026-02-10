import {
  MousePointerClick,
  ArrowDownUp,
  Link2,
  Maximize,
  AlertTriangle,
} from "lucide-react";
import type { SessionEvent } from "@/types";

interface SessionTimelineProps {
  events: SessionEvent[] | null;
}

const EVENT_ICONS: Record<SessionEvent["type"], React.ElementType> = {
  click: MousePointerClick,
  scroll: ArrowDownUp,
  navigate: Link2,
  resize: Maximize,
  error: AlertTriangle,
};

const EVENT_COLORS: Record<SessionEvent["type"], string> = {
  click: "text-blue-500 bg-blue-50 dark:bg-blue-950/40",
  scroll: "text-gray-500 bg-gray-50 dark:bg-gray-800/40",
  navigate: "text-purple-500 bg-purple-50 dark:bg-purple-950/40",
  resize: "text-teal-500 bg-teal-50 dark:bg-teal-950/40",
  error: "text-red-500 bg-red-50 dark:bg-red-950/40",
};

export function SessionTimeline({ events }: SessionTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <p className="text-gray-400 dark:text-gray-500 text-sm py-4 text-center">
        No session events captured
      </p>
    );
  }

  return (
    <div className="relative max-h-96 overflow-y-auto">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 dark:bg-white/10" />
      <div className="space-y-4 pl-12 pr-2 py-2">
        {events.map((event, index) => {
          const IconComponent = EVENT_ICONS[event.type];
          const colorClass = EVENT_COLORS[event.type];

          return (
            <div key={index} className="relative">
              <div
                className={`absolute -left-12 top-0 w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}
              >
                <IconComponent className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {event.type}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {event.timestamp}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                  {event.target}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

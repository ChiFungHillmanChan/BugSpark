"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { SessionEvent } from "@/types";

interface UserFlowDiagramProps {
  userActions: SessionEvent[] | null;
}

interface EventStyle {
  fill: string;
  stroke: string;
  label: string;
}

const EVENT_STYLES: Record<string, EventStyle> = {
  click: { fill: "#dcfce7", stroke: "#22c55e", label: "C" },
  navigation: { fill: "#dbeafe", stroke: "#3b82f6", label: "N" },
  navigate: { fill: "#dbeafe", stroke: "#3b82f6", label: "N" },
  scroll: { fill: "#f3f4f6", stroke: "#9ca3af", label: "S" },
  input: { fill: "#ffedd5", stroke: "#f97316", label: "I" },
  type: { fill: "#ffedd5", stroke: "#f97316", label: "I" },
  error: { fill: "#fee2e2", stroke: "#ef4444", label: "E" },
};

const DEFAULT_STYLE: EventStyle = {
  fill: "#f3f4f6",
  stroke: "#9ca3af",
  label: "?",
};

const NODE_SPACING = 140;
const NODE_RADIUS = 20;
const SVG_HEIGHT = 160;
const NODE_CY = 70;
const PADDING_X = 40;

function getEventStyle(eventType: string): EventStyle {
  return EVENT_STYLES[eventType.toLowerCase()] ?? DEFAULT_STYLE;
}

function formatRelativeTime(timestampMs: number, baseMs: number): string {
  const diffSeconds = Math.round((timestampMs - baseMs) / 1000);
  if (diffSeconds < 0) return "0s";
  if (diffSeconds < 60) return `${diffSeconds}s`;
  const minutes = Math.floor(diffSeconds / 60);
  const seconds = diffSeconds % 60;
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

function truncateTarget(target: string | undefined, maxLength: number): string {
  if (!target) return "";
  return target.length > maxLength ? target.slice(0, maxLength - 1) + "\u2026" : target;
}

function TooltipContent({ event, baseTimestamp }: { event: SessionEvent; baseTimestamp: number }) {
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-64 pointer-events-none">
      <p className="font-semibold capitalize mb-1">{event.type}</p>
      {event.target && (
        <p className="text-gray-300 font-mono break-all mb-1">{event.target}</p>
      )}
      <p className="text-gray-400">+{formatRelativeTime(event.timestamp, baseTimestamp)}</p>
      {event.data && Object.keys(event.data).length > 0 && (
        <div className="mt-1 pt-1 border-t border-gray-700">
          {Object.entries(event.data).map(([key, value]) => (
            <p key={key} className="text-gray-300">
              <span className="text-gray-500">{key}:</span>{" "}
              {typeof value === "string" ? value : JSON.stringify(value)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function UserFlowDiagram({ userActions }: UserFlowDiagramProps) {
  const t = useTranslations("bugs");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!userActions || userActions.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t("userFlow")}</h3>
        <div className="text-center py-4">
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-2">
            {t("noUserActions")}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t("enableSessionRecordingHint")}
          </p>
        </div>
      </div>
    );
  }

  const baseTimestamp = userActions[0].timestamp;
  const svgWidth = Math.max(
    PADDING_X * 2 + (userActions.length - 1) * NODE_SPACING + NODE_RADIUS * 2,
    300
  );

  return (
    <div className="bg-white dark:bg-navy-800 rounded-lg border border-gray-200 dark:border-navy-700 shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t("userFlow")}</h3>
      <div className="overflow-x-auto relative">
        <svg
          width={svgWidth}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${svgWidth} ${SVG_HEIGHT}`}
          className="block"
        >
          {/* Connection lines */}
          {userActions.map((_, index) => {
            if (index === 0) return null;
            const x1 = PADDING_X + (index - 1) * NODE_SPACING + NODE_RADIUS;
            const x2 = PADDING_X + index * NODE_SPACING - NODE_RADIUS;
            return (
              <line
                key={`line-${index}`}
                x1={x1}
                y1={NODE_CY}
                x2={x2}
                y2={NODE_CY}
                stroke="#d1d5db"
                strokeWidth={2}
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {/* Arrowhead marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#d1d5db" />
            </marker>
          </defs>

          {/* Event nodes */}
          {userActions.map((event, index) => {
            const cx = PADDING_X + index * NODE_SPACING;
            const style = getEventStyle(event.type);
            const isHovered = hoveredIndex === index;

            return (
              <g
                key={`node-${index}`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Circle */}
                <circle
                  cx={cx}
                  cy={NODE_CY}
                  r={isHovered ? NODE_RADIUS + 3 : NODE_RADIUS}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={isHovered ? 3 : 2}
                  style={{ transition: "r 0.15s, stroke-width 0.15s" }}
                />

                {/* Letter label */}
                <text
                  x={cx}
                  y={NODE_CY + 1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={style.stroke}
                  fontSize={14}
                  fontWeight={700}
                >
                  {style.label}
                </text>

                {/* Time above */}
                <text
                  x={cx}
                  y={NODE_CY - NODE_RADIUS - 12}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize={10}
                >
                  +{formatRelativeTime(event.timestamp, baseTimestamp)}
                </text>

                {/* Event type below */}
                <text
                  x={cx}
                  y={NODE_CY + NODE_RADIUS + 16}
                  textAnchor="middle"
                  fill="#374151"
                  fontSize={11}
                  fontWeight={500}
                >
                  {event.type}
                </text>

                {/* Target below event type */}
                <text
                  x={cx}
                  y={NODE_CY + NODE_RADIUS + 32}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize={10}
                  fontFamily="monospace"
                >
                  {truncateTarget(event.target, 16)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip rendered outside SVG for better styling */}
        {hoveredIndex !== null && (
          <div
            className="absolute z-10"
            style={{
              left: PADDING_X + hoveredIndex * NODE_SPACING - 80,
              top: NODE_CY - NODE_RADIUS - 90,
            }}
          >
            <TooltipContent
              event={userActions[hoveredIndex]}
              baseTimestamp={baseTimestamp}
            />
          </div>
        )}
      </div>
    </div>
  );
}

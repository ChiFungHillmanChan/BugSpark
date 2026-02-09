"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  return (
    <div className="relative group rounded-lg overflow-hidden mb-4">
      {language && (
        <div className="bg-navy-800 px-4 py-1.5 text-xs text-gray-400 font-mono">
          {language}
        </div>
      )}
      <pre className="bg-navy-900 p-4 overflow-x-auto">
        <code className="text-sm text-gray-300 font-mono leading-relaxed">
          {code}
        </code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-navy-700 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copy code"
      >
        {isCopied ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

interface CalloutProps {
  type?: "info" | "warning" | "danger" | "tip";
  title?: string;
  children: ReactNode;
}

const CALLOUT_STYLES = {
  info: "border-blue-400 bg-blue-50 text-blue-800",
  warning: "border-yellow-400 bg-yellow-50 text-yellow-800",
  danger: "border-red-400 bg-red-50 text-red-800",
  tip: "border-green-400 bg-green-50 text-green-800",
};

const CALLOUT_TITLES = {
  info: "Info",
  warning: "Warning",
  danger: "Danger",
  tip: "Tip",
};

export function Callout({ type = "info", title, children }: CalloutProps) {
  return (
    <div
      className={cn(
        "border-l-4 rounded-r-lg p-4 mb-4",
        CALLOUT_STYLES[type],
      )}
    >
      <p className="font-semibold text-sm mb-1">
        {title ?? CALLOUT_TITLES[type]}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

interface ApiEndpointProps {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  description?: string;
}

const METHOD_COLORS = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PATCH: "bg-yellow-100 text-yellow-700",
  PUT: "bg-orange-100 text-orange-700",
  DELETE: "bg-red-100 text-red-700",
};

export function ApiEndpoint({ method, path, description }: ApiEndpointProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 mb-4">
      <span
        className={cn(
          "px-2 py-0.5 rounded text-xs font-bold shrink-0",
          METHOD_COLORS[method],
        )}
      >
        {method}
      </span>
      <div>
        <code className="text-sm font-mono font-semibold text-gray-900">
          {path}
        </code>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

interface DocsTabsProps {
  tabs: string[];
  children: ReactNode[];
}

export function DocsTabs({ tabs, children }: DocsTabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="mb-4">
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 transition-colors",
              activeIndex === index
                ? "border-accent text-accent"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="pt-4">{children[activeIndex]}</div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import {
  WIDGET_SCRIPT_TAG,
  WIDGET_SCRIPT_TAG_FULL,
  WIDGET_NPM_INIT,
  WIDGET_REACT_INIT,
  WIDGET_VUE_INIT,
  WIDGET_ANGULAR_INIT,
  CSP_EXAMPLE,
  getAiPromptEn,
  getAiPromptZhHK,
} from "@/lib/doc-snippets";
import { CodeBlock } from "./mdx-components";

/**
 * Renders the standard widget <script> tag snippet.
 * Usage in MDX: <WidgetScriptSnippet />
 */
export function WidgetScriptSnippet() {
  return <CodeBlock code={WIDGET_SCRIPT_TAG} language="html" />;
}

/**
 * Renders the fully-configured widget <script> tag snippet.
 * Usage in MDX: <WidgetScriptSnippetFull />
 */
export function WidgetScriptSnippetFull() {
  return <CodeBlock code={WIDGET_SCRIPT_TAG_FULL} language="html" />;
}

/**
 * Renders the NPM BugSpark.init() snippet.
 * Usage in MDX: <WidgetNpmSnippet />
 */
export function WidgetNpmSnippet() {
  return <CodeBlock code={WIDGET_NPM_INIT} language="typescript" />;
}

/**
 * Renders the React useEffect snippet.
 * Usage in MDX: <WidgetReactSnippet />
 */
export function WidgetReactSnippet() {
  return <CodeBlock code={WIDGET_REACT_INIT} language="tsx" />;
}

/**
 * Renders the Vue snippet.
 * Usage in MDX: <WidgetVueSnippet />
 */
export function WidgetVueSnippet() {
  return <CodeBlock code={WIDGET_VUE_INIT} language="vue" />;
}

/**
 * Renders the Angular snippet.
 * Usage in MDX: <WidgetAngularSnippet />
 */
export function WidgetAngularSnippet() {
  return <CodeBlock code={WIDGET_ANGULAR_INIT} language="typescript" />;
}

/**
 * Renders the CSP example snippet.
 * Usage in MDX: <CspSnippet />
 */
export function CspSnippet() {
  return <CodeBlock code={CSP_EXAMPLE} language="" />;
}

/**
 * Renders the full AI setup prompt as a copyable text block.
 * Usage in MDX: <AiSetupPrompt locale="en" /> or <AiSetupPrompt locale="zh-HK" />
 */
export function AiSetupPrompt({ locale = "en" }: { locale?: "en" | "zh-HK" }) {
  const [isCopied, setIsCopied] = useState(false);
  const promptText = locale === "zh-HK" ? getAiPromptZhHK() : getAiPromptEn();

  async function handleCopy() {
    await navigator.clipboard.writeText(promptText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  return (
    <div className="relative group rounded-lg overflow-hidden mb-4">
      <div className="bg-navy-800 px-4 py-1.5 text-xs text-gray-400 font-mono flex items-center justify-between">
        <span>text</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-400 hover:text-white transition-colors"
          aria-label="Copy prompt"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-xs">Copy prompt</span>
            </>
          )}
        </button>
      </div>
      <pre className="bg-navy-900 p-4 overflow-x-auto max-h-[600px] overflow-y-auto">
        <code className="text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap">
          {promptText}
        </code>
      </pre>
    </div>
  );
}

import type { MDXComponents } from "mdx/types";
import {
  CodeBlock,
  Callout,
  ApiEndpoint,
  DocsTabs,
} from "@/components/docs/mdx-components";
import {
  WidgetScriptSnippet,
  WidgetScriptSnippetFull,
  WidgetNpmSnippet,
  WidgetReactSnippet,
  WidgetVueSnippet,
  WidgetAngularSnippet,
  CspSnippet,
  AiSetupPrompt,
} from "@/components/docs/widget-snippets";
import { AuthFlowDiagram } from "@/components/docs/auth-flow-diagram";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    pre: ({ children }) => {
      const codeElement = children as React.ReactElement<{
        children?: string;
        className?: string;
      }>;
      const code = codeElement?.props?.children ?? "";
      const lang =
        codeElement?.props?.className?.replace("language-", "") ?? "";
      return <CodeBlock code={String(code).trimEnd()} language={lang} />;
    },
    CodeBlock,
    Callout,
    ApiEndpoint,
    DocsTabs,
    WidgetScriptSnippet,
    WidgetScriptSnippetFull,
    WidgetNpmSnippet,
    WidgetReactSnippet,
    WidgetVueSnippet,
    WidgetAngularSnippet,
    CspSnippet,
    AiSetupPrompt,
    AuthFlowDiagram,
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-3 pb-2 border-b border-gray-200 dark:border-navy-700">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-2">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-600 dark:text-gray-300">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1 text-gray-600 dark:text-gray-300">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-accent hover:underline font-medium"
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),
    code: ({ children }) => (
      <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-navy-800 text-sm font-mono text-accent">
        {children}
      </code>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto mb-6 rounded-lg border border-gray-200 dark:border-navy-700 shadow-sm">
        <table className="w-full text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-gray-50/80 dark:bg-navy-800/80 border-b border-gray-200 dark:border-navy-700">
        {children}
      </thead>
    ),
    tr: ({ children }) => (
      <tr className="border-b border-gray-100 dark:border-navy-700 last:border-b-0 hover:bg-gray-50/50 dark:hover:bg-navy-800/50 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }) => (
      <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 align-top">{children}</td>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-accent/30 pl-4 my-4 text-gray-500 dark:text-gray-400 italic">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-8 border-gray-200 dark:border-navy-700" />,
  };
}

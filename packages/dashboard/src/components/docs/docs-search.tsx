"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { docsNavConfig, flattenNavItems } from "./docs-nav-config";

interface DocsSearchProps {
  basePath: string;
}

export function DocsSearch({ basePath }: DocsSearchProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const t = useTranslations("docs");

  const allItems = useMemo(() => flattenNavItems(docsNavConfig), []);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return [];
    const lower = query.toLowerCase();
    return allItems.filter(
      (item) =>
        t(item.titleKey).toLowerCase().includes(lower) ||
        item.slug.toLowerCase().includes(lower),
    );
  }, [query, allItems, t]);

  return (
    <div className="relative mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </div>

      {isFocused && filteredItems.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
          {filteredItems.map((item) => (
            <Link
              key={item.slug}
              href={`${basePath}/${item.slug}`}
              className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-accent"
            >
              {t(item.titleKey)}
              <span className="ml-2 text-xs text-gray-400">{item.slug}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

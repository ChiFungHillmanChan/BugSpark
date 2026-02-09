"use client";

import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/providers/auth-provider";
import apiClient from "@/lib/api-client";

type Theme = "light" | "dark" | "system";

export default function SettingsPage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem("bugspark_theme") as Theme) ?? "system";
  });

  async function handleSaveName(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await apiClient.patch("/auth/me", { name });
    } finally {
      setIsSaving(false);
    }
  }

  function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);
    localStorage.setItem("bugspark_theme", newTheme);
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Settings" />

      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Profile</h2>
        <form onSubmit={handleSaveName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </form>
      </section>

      <section className="border-t border-gray-200 pt-8">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Appearance</h2>
        <div className="flex gap-3">
          {(["light", "dark", "system"] as Theme[]).map((option) => (
            <button
              key={option}
              onClick={() => handleThemeChange(option)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                theme === option
                  ? "bg-accent text-white border-accent"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

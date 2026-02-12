"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useUpdateProject } from "@/hooks/use-projects";
import type { Project } from "@/types";

const PRESET_COLORS = [
  "#e94560",
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

interface ProjectWidgetConfigProps {
  project: Project;
}

export function ProjectWidgetConfig({ project }: ProjectWidgetConfigProps) {
  const t = useTranslations("projects");
  const updateProject = useUpdateProject();
  const [widgetColor, setWidgetColor] = useState("#e94560");
  const [showWatermark, setShowWatermark] = useState(true);
  const [enableScreenshot, setEnableScreenshot] = useState(true);
  const [modalTitle, setModalTitle] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [colorSaved, setColorSaved] = useState(false);

  useEffect(() => {
    if (project?.settings && typeof project.settings === "object") {
      const settings = project.settings as Record<string, unknown>;
      const savedColor = settings.widgetColor;
      if (typeof savedColor === "string") setWidgetColor(savedColor);
      if (typeof settings.showWatermark === "boolean") setShowWatermark(settings.showWatermark);
      if (typeof settings.enableScreenshot === "boolean") setEnableScreenshot(settings.enableScreenshot);
      if (typeof settings.modalTitle === "string") setModalTitle(settings.modalTitle);
      if (typeof settings.buttonText === "string") setButtonText(settings.buttonText);
    }
  }, [project]);

  function handleSaveAppearance() {
    updateProject.mutate(
      {
        id: project.id,
        data: {
          settings: {
            ...((project?.settings as Record<string, unknown>) ?? {}),
            widgetColor,
            showWatermark,
            enableScreenshot,
            modalTitle: modalTitle || null,
            buttonText: buttonText || null,
          },
        },
      },
      {
        onSuccess: () => {
          setColorSaved(true);
          setTimeout(() => setColorSaved(false), 3000);
        },
      },
    );
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("widgetAppearance")}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t("widgetColorDesc")}</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("widgetColor")}</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setWidgetColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  widgetColor === color
                    ? "border-gray-900 dark:border-white scale-110"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <label className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-navy-600 flex items-center justify-center cursor-pointer hover:border-gray-400 dark:hover:border-navy-500 transition-colors overflow-hidden">
              <input
                type="color"
                value={widgetColor}
                onChange={(e) => setWidgetColor(e.target.value)}
                className="opacity-0 absolute w-0 h-0"
              />
              <span className="text-xs text-gray-400">+</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("widgetPreview")}</label>
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-navy-900 border border-gray-200 dark:border-navy-700 rounded-lg">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors"
              style={{ backgroundColor: widgetColor }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{widgetColor}</span>
          </div>
        </div>

        {colorSaved && (
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 text-sm">
            {t("colorSaved")}
          </div>
        )}

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showWatermark}
              onChange={(e) => setShowWatermark(e.target.checked)}
              className="rounded border-gray-300 dark:border-navy-600"
            />
            {t("showWatermark")}
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">{t("showWatermarkDesc")}</p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={enableScreenshot}
              onChange={(e) => setEnableScreenshot(e.target.checked)}
              className="rounded border-gray-300 dark:border-navy-600"
            />
            {t("enableScreenshot")}
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">{t("enableScreenshotDesc")}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("modalTitle")}</label>
          <input
            type="text"
            value={modalTitle}
            onChange={(e) => setModalTitle(e.target.value)}
            placeholder="Report a Bug"
            className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("modalTitleDesc")}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("buttonText")}</label>
          <input
            type="text"
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder=""
            className="w-full px-3 py-2 border border-gray-300 dark:border-navy-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent dark:bg-navy-800 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("buttonTextDesc")}</p>
        </div>

        <button
          type="button"
          onClick={handleSaveAppearance}
          disabled={updateProject.isPending}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {updateProject.isPending ? t("creating") : t("saveChanges")}
        </button>
      </div>
    </div>
  );
}

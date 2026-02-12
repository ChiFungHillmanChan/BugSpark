"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Maximize2, Pencil, Image as ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface ScreenshotViewerProps {
  screenshotUrl: string | null;
  annotatedScreenshotUrl: string | null;
}

export function ScreenshotViewer({
  screenshotUrl,
  annotatedScreenshotUrl,
}: ScreenshotViewerProps) {
  const t = useTranslations("bugs");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isShowingAnnotated, setIsShowingAnnotated] = useState(
    !!annotatedScreenshotUrl
  );

  const hasAnnotated = !!annotatedScreenshotUrl;
  const currentUrl = isShowingAnnotated && hasAnnotated
    ? annotatedScreenshotUrl
    : screenshotUrl;

  // Keyboard shortcut to toggle between original and annotated
  useEffect(() => {
    if (!hasAnnotated) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'a') {
        setIsShowingAnnotated(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasAnnotated]);

  if (!screenshotUrl) {
    return (
      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center text-sm text-gray-400">
        {t("noScreenshot")}
      </div>
    );
  }

  return (
    <>
      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        {hasAnnotated && (
          <div className="absolute top-3 left-3 z-10 flex gap-2">
            <button
              onClick={() => setIsShowingAnnotated(false)}
              title="Press 'A' to toggle"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                !isShowingAnnotated
                  ? "bg-white text-gray-900 shadow-md"
                  : "bg-black/40 text-white hover:bg-black/50"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              {t("original")}
            </button>
            <button
              onClick={() => setIsShowingAnnotated(true)}
              title="Press 'A' to toggle"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isShowingAnnotated
                  ? "bg-white text-gray-900 shadow-md"
                  : "bg-black/40 text-white hover:bg-black/50"
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              {t("annotated")}
            </button>
          </div>
        )}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-3 right-3 z-10 p-1.5 rounded bg-black/30 text-white hover:bg-black/50"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        {/* Use unoptimized because presigned R2/S3 URLs change on every
            API call and expire after 15 min, defeating Next.js image cache. */}
        <Image
          src={currentUrl!}
          alt="Bug screenshot"
          width={0}
          height={0}
          sizes="100vw"
          unoptimized
          className="w-full h-auto object-contain"
        />
      </div>

      {isFullscreen && currentUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
          <Image
            src={currentUrl}
            alt="Bug screenshot fullscreen"
            width={0}
            height={0}
            sizes="100vw"
            unoptimized
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}

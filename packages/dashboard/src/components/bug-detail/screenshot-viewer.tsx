"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Maximize2 } from "lucide-react";

interface ScreenshotViewerProps {
  screenshotUrl: string | null;
  annotatedScreenshotUrl: string | null;
}

export function ScreenshotViewer({
  screenshotUrl,
  annotatedScreenshotUrl,
}: ScreenshotViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isShowingAnnotated, setIsShowingAnnotated] = useState(false);

  const hasAnnotated = !!annotatedScreenshotUrl;
  const currentUrl = isShowingAnnotated && hasAnnotated
    ? annotatedScreenshotUrl
    : screenshotUrl;

  if (!screenshotUrl) {
    return (
      <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center text-sm text-gray-400">
        No screenshot available
      </div>
    );
  }

  return (
    <>
      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        {hasAnnotated && (
          <div className="absolute top-3 left-3 z-10 flex gap-1">
            <button
              onClick={() => setIsShowingAnnotated(false)}
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                !isShowingAnnotated
                  ? "bg-white text-gray-900 shadow"
                  : "bg-black/30 text-white"
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setIsShowingAnnotated(true)}
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                isShowingAnnotated
                  ? "bg-white text-gray-900 shadow"
                  : "bg-black/30 text-white"
              }`}
            >
              Annotated
            </button>
          </div>
        )}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-3 right-3 z-10 p-1.5 rounded bg-black/30 text-white hover:bg-black/50"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <Image
          src={currentUrl!}
          alt="Bug screenshot"
          width={800}
          height={450}
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
            width={1920}
            height={1080}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}

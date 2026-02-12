"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

interface CancelDialogProps {
  isCanceling: boolean;
  onCancel: () => void;
}

export function CancelDialog({ isCanceling, onCancel }: CancelDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-sm text-red-600 dark:text-red-400 hover:underline"
      >
        Cancel Subscription
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsOpen(false);
            }}
            role="button"
            tabIndex={0}
            aria-label="Close dialog"
          />
          <div className="relative bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Cancel Subscription
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to cancel your subscription? You will retain access until the end of your current billing period, after which your plan will revert to Free.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-navy-600 rounded-md hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
              >
                Keep Subscription
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancel();
                  setIsOpen(false);
                }}
                disabled={isCanceling}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isCanceling ? "Canceling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

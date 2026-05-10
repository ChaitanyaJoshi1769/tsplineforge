'use client';

/**
 * Export Progress Component
 * Shows real-time progress during export
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export interface ExportProgressProps {
  filename: string;
  format: string;
  progress: number; // 0-100
  statusMessage: string;
  elapsed?: number; // milliseconds
  estimated?: number; // milliseconds
  canCancel?: boolean;
  onCancel?: () => void;
}

/**
 * Format time in ms to readable string
 */
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Progress Bar Component
 */
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, progress)}%` }}
      />
    </div>
  );
}

/**
 * Export Progress Component
 */
export function ExportProgress({
  filename,
  format,
  progress,
  statusMessage,
  elapsed,
  estimated,
  canCancel = true,
  onCancel,
}: ExportProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(progress);

  // Smooth progress animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const remainingMs = estimated ? Math.max(0, estimated - (elapsed || 0)) : null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">Exporting Model</h3>
        </div>

        {/* Content */}
        <div className="px-6 py-8 space-y-6">
          {/* Filename and Format */}
          <div>
            <p className="text-sm text-slate-400 mb-1">File</p>
            <p className="text-base font-mono text-white break-all">{filename}</p>
            <p className="text-xs text-slate-500 mt-1">Format: {format.toUpperCase()}</p>
          </div>

          {/* Status Message */}
          <div>
            <p className="text-sm text-slate-300 mb-3">{statusMessage}</p>

            {/* Progress Bar */}
            <ProgressBar progress={displayProgress} />

            {/* Progress Percentage */}
            <div className="mt-2 text-right">
              <span className="text-sm font-semibold text-slate-300">
                {Math.round(displayProgress)}%
              </span>
            </div>
          </div>

          {/* Timing Info */}
          {elapsed !== undefined && (
            <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-800/30 rounded-lg px-3 py-2">
              <div>
                <span className="text-slate-500">Elapsed: </span>
                <span className="text-slate-200 font-mono">{formatTime(elapsed)}</span>
              </div>
              {remainingMs !== null && (
                <div>
                  <span className="text-slate-500">Remaining: </span>
                  <span className="text-slate-200 font-mono">{formatTime(remainingMs)}</span>
                </div>
              )}
            </div>
          )}

          {/* Cancel Button */}
          {canCancel && (
            <button
              onClick={onCancel}
              className="w-full py-2 px-4 flex items-center justify-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors text-sm font-medium"
            >
              <X className="h-4 w-4" />
              Cancel Export
            </button>
          )}
        </div>

        {/* Footer Animation */}
        <div className="h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 animate-pulse" />
      </div>
    </div>
  );
}

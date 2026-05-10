'use client';

/**
 * Export Success Component
 * Shows success state after successful export
 */

import React from 'react';
import { CheckCircle2, Copy, FolderOpen, Download, X } from 'lucide-react';
import { formatFileSize } from '@/lib/exportHistory';

export interface ExportSuccessProps {
  filename: string;
  format: string;
  fileSize: number;
  unit?: string;
  timestamp?: number;
  onClose?: () => void;
  onDownloadAgain?: () => void;
  onOpenFolder?: () => void;
  onCopyPath?: () => void;
}

/**
 * Detail Row Component
 */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 px-3 rounded-md hover:bg-slate-800/30 transition-colors">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm text-slate-200 font-mono text-right break-all">{value}</span>
    </div>
  );
}

/**
 * Action Button Component
 */
function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'secondary',
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}) {
  const baseClass = 'flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm';
  const variantClass =
    variant === 'primary'
      ? 'bg-blue-600 hover:bg-blue-500 text-white'
      : 'bg-slate-800 hover:bg-slate-700 text-slate-200';

  return (
    <button onClick={onClick} className={`${baseClass} ${variantClass}`}>
      {Icon}
      {label}
    </button>
  );
}

/**
 * Export Success Component
 */
export function ExportSuccess({
  filename,
  format,
  fileSize,
  unit = 'mm',
  timestamp,
  onClose,
  onDownloadAgain,
  onOpenFolder,
  onCopyPath,
}: ExportSuccessProps) {
  const fullFilename = `${filename}.${format === 'gltf' ? 'glb' : format}`;
  const exportTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'just now';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Export Successful!</h3>
              <p className="text-xs text-slate-400">Your file is ready to download</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Filename */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <p className="text-xs text-slate-400 mb-2">Filename</p>
            <p className="text-sm font-mono text-white break-all">{fullFilename}</p>
          </div>

          {/* Details */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Details</h4>
            <div className="bg-slate-950/50 rounded-lg overflow-hidden border border-slate-800/50">
              <DetailRow label="File Size" value={formatFileSize(fileSize)} />
              <DetailRow label="Format" value={format.toUpperCase()} />
              {unit && <DetailRow label="Unit" value={unit} />}
              <DetailRow label="Exported" value={exportTime} />
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center p-4 bg-emerald-900/20 border border-emerald-800/30 rounded-lg">
            <p className="text-sm text-emerald-200">
              ✓ Ready for use in your CAD software
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {onDownloadAgain && (
              <ActionButton
                icon={<Download className="h-4 w-4" />}
                label="Download"
                onClick={onDownloadAgain}
                variant="primary"
              />
            )}
            {onCopyPath && (
              <ActionButton
                icon={<Copy className="h-4 w-4" />}
                label="Copy Path"
                onClick={onCopyPath}
              />
            )}
          </div>

          {onOpenFolder && (
            <ActionButton
              icon={<FolderOpen className="h-4 w-4" />}
              label="Open Folder"
              onClick={onOpenFolder}
            />
          )}

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium text-sm"
            >
              Done
            </button>
          )}
        </div>

        {/* Success Animation */}
        <div className="h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 animate-pulse" />
      </div>
    </div>
  );
}

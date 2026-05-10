'use client';

/**
 * Advanced Export Dialog Component
 * Premium export experience with format selection, options, and history
 */

import React, { useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { X, FileText } from 'lucide-react';
import { MeshStatisticsComponent } from './MeshStatistics';
import { ExportOptionsPanel } from './ExportOptions';
import { ExportHistoryPanel } from './ExportHistory';
import { FormatCardsGrid } from '@/components/ui/FormatCard';
import { useMeshStatistics } from '@/hooks/useMeshStatistics';
import { useExportOptions } from '@/hooks/useExportOptions';
import { useExportHistory } from '@/hooks/useExportHistory';
import {
  ExportFormat,
  FORMAT_INFO,
  getFullFilename,
  ExportOptions,
} from '@/lib/exportOptions';

export interface AdvancedExportDialogProps {
  scene: THREE.Scene | null;
  isOpen: boolean;
  onClose: () => void;
  onExport: (filename: string, format: ExportFormat, options: ExportOptions) => Promise<void>;
  defaultFormat?: ExportFormat;
  defaultFilename?: string;
  isExporting?: boolean;
}

/**
 * Format Icons Map
 */
function getFormatIcon(format: ExportFormat) {
  const iconClass = 'h-6 w-6';

  const icons: Record<ExportFormat, React.ReactNode> = {
    step: <FileText className={iconClass} />,
    iges: <FileText className={iconClass} />,
    stl: <FileText className={iconClass} />,
    gltf: <FileText className={iconClass} />,
    obj: <FileText className={iconClass} />,
  };

  return icons[format] || <FileText className={iconClass} />;
}

/**
 * Advanced Export Dialog Component
 */
export function AdvancedExportDialog({
  scene,
  isOpen,
  onClose,
  onExport,
  defaultFormat = 'stl',
  defaultFilename = 'model',
  isExporting = false,
}: AdvancedExportDialogProps) {
  // Hooks
  const { statistics, isLoading: statsLoading } = useMeshStatistics(scene);
  const { options, validation, setFormat, setFilename, updateOption } = useExportOptions(
    defaultFormat,
    defaultFilename
  );
  const { history, addEntry, removeEntry, clearHistory } = useExportHistory();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format cards data
  const formatCards = useMemo(() => {
    return (['step', 'iges', 'stl', 'gltf', 'obj'] as ExportFormat[]).map((format) => {
      const info = FORMAT_INFO[format];
      return {
        format,
        name: info.name,
        description: info.description,
        extensions: info.extensions,
        capabilities: info.capabilities,
        icon: getFormatIcon(format),
      };
    });
  }, []);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!validation.valid) {
      setError('Please fix validation errors before exporting');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const filename = getFullFilename(options);
      await onExport(filename, options.format, options);

      // Add to history
      addEntry(
        options.filename,
        options.format,
        options,
        undefined,
        undefined
      );

      // Close dialog on success
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      setError(errorMessage);
      addEntry(
        options.filename,
        options.format,
        options,
        undefined,
        errorMessage
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [options, validation, onExport, onClose, addEntry]);

  // Handle re-export from history
  const handleReexport = useCallback(async (entry: any) => {
    // This would reload the previous export settings and re-export
    // For now, we'll just copy the filename
    setFilename(entry.filename);
  }, [setFilename]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Export Your Model</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Mesh Statistics */}
          <div>
            <MeshStatisticsComponent
              statistics={statistics}
              isLoading={statsLoading}
              unit={options.unit}
              compact={false}
            />
          </div>

          {/* Format Selection */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Select Format</h3>
            <FormatCardsGrid
              formats={formatCards}
              selectedFormat={options.format}
              onSelectFormat={setFormat}
              columns={3}
            />
          </div>

          {/* Format-Specific Options */}
          <ExportOptionsPanel options={options} onChange={updateOption} />

          {/* Filename Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Filename</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={options.filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                disabled={isSubmitting}
              />
              <span className="text-sm text-slate-400 font-mono">
                {getFullFilename(options)}
              </span>
            </div>
          </div>

          {/* Validation Messages */}
          {validation.errors.length > 0 && (
            <div className="space-y-2 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-sm font-medium text-red-200">⚠ Validation errors</p>
              <ul className="space-y-1 text-xs text-red-300">
                {validation.errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="space-y-2 p-4 bg-amber-900/20 border border-amber-800/50 rounded-lg">
              <p className="text-sm font-medium text-amber-200">ℹ Warnings</p>
              <ul className="space-y-1 text-xs text-amber-300">
                {validation.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="space-y-2 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
              <p className="text-sm font-medium text-red-200">Export Error</p>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Export History */}
          {history.length > 0 && (
            <ExportHistoryPanel
              history={history}
              onReexport={handleReexport}
              onDelete={removeEntry}
              onClearAll={clearHistory}
              maxItems={5}
              compact={false}
            />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleExport}
            disabled={!validation.valid || isSubmitting || !statistics}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                Export & Download
                <span>→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

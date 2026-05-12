'use client';

import { useState, useMemo } from 'react';
import { X, Download, Info, Check, Trash2 } from 'lucide-react';
import * as THREE from 'three';
import {
  EXPORT_FORMATS,
  calculateMeshStatistics,
  getExportHistory,
  saveExportHistory,
  clearExportHistory,
  getRelativeTime,
} from '@/lib/exportFormats';
import type { ExportFormat } from '@/lib/exportFormats';

interface AdvancedExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  geometry: THREE.BufferGeometry | THREE.Group | null;
  defaultFilename: string;
}

export function AdvancedExportDialog({
  isOpen,
  onClose,
  geometry,
  defaultFilename,
}: AdvancedExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('gltf');
  const [filename, setFilename] = useState(defaultFilename || 'model');
  const [isExporting, setIsExporting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [exportHistory, setExportHistory] = useState(getExportHistory());
  const [preserveColors, setPreserveColors] = useState(true);
  const [preserveMaterials, setPreserveMaterials] = useState(true);

  const stats = useMemo(() => {
    return geometry ? calculateMeshStatistics(geometry) : null;
  }, [geometry]);

  const formatInfo = EXPORT_FORMATS[selectedFormat];

  const handleExport = async () => {
    if (!geometry) return;

    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const entry = {
        id: Math.random().toString(36).substr(2, 9),
        filename: `${filename}.${formatInfo.extension}`,
        format: selectedFormat,
        fileSize: Math.floor(Math.random() * 50 * 1024 * 1024), // Simulate file size
        timestamp: Date.now(),
        unit: 'mm' as const,
      };

      saveExportHistory(entry);
      setExportHistory(getExportHistory());

      // Show success notification (would be toast in real app)
      alert(`✓ ${entry.filename} exported successfully`);
      onClose();
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-lg font-semibold text-foreground">Export Model</h2>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Mesh Statistics */}
          {stats && (
            <div className="p-4 bg-subtle border border-border rounded-lg space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Info size={16} className="text-info" />
                Mesh Statistics
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Vertices:</span>
                  <p className="font-medium text-foreground">{stats.vertexCount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Faces:</span>
                  <p className="font-medium text-foreground">{stats.faceCount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Bounds:</span>
                  <p className="font-medium text-foreground">
                    {stats.bounds.x.toFixed(2)} × {stats.bounds.y.toFixed(2)} × {stats.bounds.z.toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium text-success flex items-center gap-1">
                    <Check size={14} /> Ready
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Format Selection */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Select Format</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(EXPORT_FORMATS).map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`p-4 border rounded-lg transition-all text-left ${
                    selectedFormat === format.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold text-foreground">{format.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{format.description}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {format.supportsColors && (
                      <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded">Colors</span>
                    )}
                    {format.supportsMaterials && (
                      <span className="text-xs bg-info/20 text-info px-2 py-0.5 rounded">Materials</span>
                    )}
                    {format.supportsAssembly && (
                      <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded">Assembly</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Export Options</h3>
            <div>
              <label className="text-sm text-muted-foreground">Filename</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                disabled={isExporting}
                className="w-full mt-1 px-3 py-2 bg-subtle border border-border rounded-lg text-foreground disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Will be exported as: <span className="font-mono">{filename}.{formatInfo.extension}</span>
              </p>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-2">
              {formatInfo.supportsColors && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveColors}
                    onChange={(e) => setPreserveColors(e.target.checked)}
                    disabled={isExporting}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm text-foreground">Preserve Colors</span>
                </label>
              )}
              {formatInfo.supportsMaterials && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveMaterials}
                    onChange={(e) => setPreserveMaterials(e.target.checked)}
                    disabled={isExporting}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm text-foreground">Preserve Materials</span>
                </label>
              )}
            </div>
          </div>

          {/* Export History */}
          <div className="border-t border-border pt-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              <span>Export History ({exportHistory.length})</span>
              <span className="text-xs">{showHistory ? '▼' : '▶'}</span>
            </button>

            {showHistory && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {exportHistory.length > 0 ? (
                  <>
                    {exportHistory.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-2 bg-subtle rounded text-sm">
                        <div>
                          <p className="font-medium text-foreground">{entry.filename}</p>
                          <p className="text-xs text-muted-foreground">{getRelativeTime(entry.timestamp)}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {(entry.fileSize / 1024 / 1024).toFixed(1)}MB
                        </span>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        clearExportHistory();
                        setExportHistory([]);
                      }}
                      className="w-full text-xs text-error hover:text-error/80 py-2 flex items-center justify-center gap-1"
                    >
                      <Trash2 size={12} /> Clear History
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-3">No exports yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t border-border bg-card sticky bottom-0">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-card-hover transition-colors disabled:opacity-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!geometry || isExporting}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export & Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

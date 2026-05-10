'use client';

/**
 * Export History Panel Component
 * Shows recent exports with quick re-export and download options
 */

import React, { useState } from 'react';
import { ChevronDown, Trash2, RotateCw, Search, Trash } from 'lucide-react';
import { ExportHistoryEntry, getRelativeTime, formatFileSize } from '@/lib/exportHistory';

export interface ExportHistoryPanelProps {
  history: ExportHistoryEntry[];
  isLoading?: boolean;
  onReexport?: (entry: ExportHistoryEntry) => void;
  onDelete?: (id: string) => void;
  onClearAll?: () => void;
  maxItems?: number;
  compact?: boolean;
}

/**
 * Format Badge Component
 */
function FormatBadge({ format }: { format: string }) {
  const colors: Record<string, string> = {
    step: 'bg-blue-900/40 text-blue-200 border-blue-700',
    iges: 'bg-cyan-900/40 text-cyan-200 border-cyan-700',
    stl: 'bg-purple-900/40 text-purple-200 border-purple-700',
    gltf: 'bg-orange-900/40 text-orange-200 border-orange-700',
    obj: 'bg-green-900/40 text-green-200 border-green-700',
  };

  return (
    <span className={`text-xs font-mono px-2 py-1 rounded border ${colors[format] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
      {format.toUpperCase()}
    </span>
  );
}

/**
 * History Entry Component
 */
function HistoryEntry({
  entry,
  onReexport,
  onDelete,
}: {
  entry: ExportHistoryEntry;
  onReexport?: (entry: ExportHistoryEntry) => void;
  onDelete?: (id: string) => void;
}) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-white truncate">{entry.filename}</p>
          <FormatBadge format={entry.format} />
          {!entry.success && <span className="text-xs px-2 py-1 bg-red-900/40 text-red-200 rounded">Failed</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{getRelativeTime(entry.timestamp)}</span>
          {entry.fileSize && <span>• {formatFileSize(entry.fileSize)}</span>}
        </div>
      </div>

      <div className={`flex items-center gap-2 transition-opacity ${isHovering ? 'opacity-100' : 'opacity-0'}`}>
        {entry.success && onReexport && (
          <button
            onClick={() => onReexport(entry)}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-blue-300 transition-colors"
            title="Re-export with same settings"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        )}

        {onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-300 transition-colors"
            title="Remove from history"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Export History Panel Component
 */
export function ExportHistoryPanel({
  history,
  isLoading = false,
  onReexport,
  onDelete,
  onClearAll,
  maxItems = 10,
  compact = false,
}: ExportHistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(!compact);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFormat, setFilterFormat] = useState<string | null>(null);

  // Filter history based on search and format
  const filteredHistory = history
    .filter((entry) => {
      if (searchQuery && !entry.filename.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterFormat && entry.format !== filterFormat) {
        return false;
      }
      return true;
    })
    .slice(0, maxItems);

  const visibleCount = filteredHistory.length;
  const hiddenCount = history.length - visibleCount;

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
      >
        <h3 className="text-sm font-semibold text-white">
          Export History
          {history.length > 0 && <span className="text-slate-400 ml-2 text-xs font-normal">({history.length})</span>}
        </h3>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Content */}
      {isOpen && (
        <div className="bg-slate-950/50 border-t border-slate-800">
          {history.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <p className="text-sm">No exports yet</p>
              <p className="text-xs text-slate-500 mt-1">Your export history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search exports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/50 border border-slate-800 rounded text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Format Filter */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterFormat(null)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    filterFormat === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  All
                </button>
                {['step', 'iges', 'stl', 'gltf', 'obj'].map((format) => {
                  const count = history.filter((e) => e.format === format).length;
                  return (
                    count > 0 && (
                      <button
                        key={format}
                        onClick={() => setFilterFormat(format)}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          filterFormat === format
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {format.toUpperCase()} ({count})
                      </button>
                    )
                  );
                })}
              </div>

              {/* Entries List */}
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-slate-800/30 rounded animate-pulse" />
                  ))}
                </div>
              ) : visibleCount > 0 ? (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {filteredHistory.map((entry) => (
                    <HistoryEntry
                      key={entry.id}
                      entry={entry}
                      onReexport={onReexport}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <p className="text-sm">No exports match your filter</p>
                </div>
              )}

              {/* Info and Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing {visibleCount} {hiddenCount > 0 ? `of ${history.length}` : ''} export
                  {visibleCount !== 1 ? 's' : ''}
                </span>
                {history.length > 0 && onClearAll && (
                  <button
                    onClick={onClearAll}
                    className="flex items-center gap-1 px-2 py-1 hover:bg-red-900/30 hover:text-red-300 rounded transition-colors"
                  >
                    <Trash className="h-3 w-3" />
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

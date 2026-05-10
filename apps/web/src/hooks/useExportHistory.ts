/**
 * Hook for managing export history
 */

import { useState, useCallback, useEffect } from 'react';
import { ExportHistoryManager, ExportHistoryEntry, getRelativeTime } from '@/lib/exportHistory';
import { ExportFormat } from '@/lib/exportOptions';

export interface UseExportHistoryReturn {
  history: ExportHistoryEntry[];
  isLoading: boolean;
  addEntry: (
    filename: string,
    format: ExportFormat,
    options: any,
    fileSize?: number,
    errorMessage?: string
  ) => ExportHistoryEntry;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  getRecent: (count: number) => ExportHistoryEntry[];
  getByFormat: (format: ExportFormat) => ExportHistoryEntry[];
  search: (query: string) => ExportHistoryEntry[];
  getFormattedTime: (timestamp: number) => string;
  refreshHistory: () => void;
}

/**
 * Hook to manage export history
 */
export function useExportHistory(): UseExportHistoryReturn {
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load history on mount
  useEffect(() => {
    refreshHistory();
  }, []);

  const refreshHistory = useCallback(() => {
    setIsLoading(true);
    try {
      const loaded = ExportHistoryManager.getHistory();
      setHistory(loaded);
    } catch (error) {
      console.error('Failed to load export history:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEntry = useCallback(
    (
      filename: string,
      format: ExportFormat,
      options: any,
      fileSize?: number,
      errorMessage?: string
    ): ExportHistoryEntry => {
      const entry = ExportHistoryManager.addEntry(filename, format, options, fileSize, errorMessage);
      refreshHistory();
      return entry;
    },
    [refreshHistory]
  );

  const removeEntry = useCallback(
    (id: string) => {
      ExportHistoryManager.removeEntry(id);
      refreshHistory();
    },
    [refreshHistory]
  );

  const clearHistory = useCallback(() => {
    if (window.confirm('Are you sure you want to clear export history? This cannot be undone.')) {
      ExportHistoryManager.clearHistory();
      refreshHistory();
    }
  }, [refreshHistory]);

  const getRecent = useCallback((count: number): ExportHistoryEntry[] => {
    return ExportHistoryManager.getRecent(count);
  }, []);

  const getByFormat = useCallback((format: ExportFormat): ExportHistoryEntry[] => {
    return ExportHistoryManager.getExportsByFormat(format);
  }, []);

  const search = useCallback((query: string): ExportHistoryEntry[] => {
    return ExportHistoryManager.searchByFilename(query);
  }, []);

  const getFormattedTime = useCallback((timestamp: number): string => {
    return getRelativeTime(timestamp);
  }, []);

  return {
    history,
    isLoading,
    addEntry,
    removeEntry,
    clearHistory,
    getRecent,
    getByFormat,
    search,
    getFormattedTime,
    refreshHistory,
  };
}

/**
 * Hook to track a single export session
 */
export function useExportSession() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startExport = useCallback((message: string = 'Preparing export...') => {
    setIsExporting(true);
    setProgress(0);
    setStatusMessage(message);
    setError(null);
  }, []);

  const updateProgress = useCallback((percent: number, message?: string) => {
    setProgress(Math.min(100, Math.max(0, percent)));
    if (message) setStatusMessage(message);
  }, []);

  const completeExport = useCallback(() => {
    setIsExporting(false);
    setProgress(100);
    setStatusMessage('Export complete');
  }, []);

  const failExport = useCallback((message: string) => {
    setIsExporting(false);
    setError(message);
  }, []);

  const resetExport = useCallback(() => {
    setIsExporting(false);
    setProgress(0);
    setStatusMessage('');
    setError(null);
  }, []);

  return {
    isExporting,
    progress,
    statusMessage,
    error,
    startExport,
    updateProgress,
    completeExport,
    failExport,
    resetExport,
  };
}

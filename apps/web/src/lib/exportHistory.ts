/**
 * Export History Management
 * Persists and retrieves export history from localStorage
 */

import { ExportOptions, ExportFormat } from './exportOptions';

const STORAGE_KEY = 'tsplineforge:export-history';
const MAX_HISTORY_ITEMS = 50;

export interface ExportHistoryEntry {
  id: string;
  filename: string;
  format: ExportFormat;
  fileSize?: number;
  timestamp: number; // milliseconds since epoch
  options: ExportOptions;
  success: boolean;
  errorMessage?: string;
}

/**
 * Export history manager
 */
export class ExportHistoryManager {
  /**
   * Add entry to history
   */
  static addEntry(
    filename: string,
    format: ExportFormat,
    options: ExportOptions,
    fileSize?: number,
    errorMessage?: string
  ): ExportHistoryEntry {
    const entry: ExportHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename,
      format,
      fileSize,
      timestamp: Date.now(),
      options,
      success: !errorMessage,
      errorMessage,
    };

    const history = this.getHistory();
    history.unshift(entry); // Add to beginning
    this.saveHistory(history.slice(0, MAX_HISTORY_ITEMS));

    return entry;
  }

  /**
   * Get all history entries
   */
  static getHistory(): ExportHistoryEntry[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      console.error('Failed to load export history');
      return [];
    }
  }

  /**
   * Get successful exports only
   */
  static getSuccessfulExports(): ExportHistoryEntry[] {
    return this.getHistory().filter((e) => e.success);
  }

  /**
   * Get exports by format
   */
  static getExportsByFormat(format: ExportFormat): ExportHistoryEntry[] {
    return this.getHistory().filter((e) => e.format === format);
  }

  /**
   * Search history by filename
   */
  static searchByFilename(query: string): ExportHistoryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.getHistory().filter((e) => e.filename.toLowerCase().includes(lowerQuery));
  }

  /**
   * Get recent exports (last N)
   */
  static getRecent(count: number = 10): ExportHistoryEntry[] {
    return this.getHistory().slice(0, count);
  }

  /**
   * Get entry by ID
   */
  static getEntryById(id: string): ExportHistoryEntry | undefined {
    return this.getHistory().find((e) => e.id === id);
  }

  /**
   * Remove entry by ID
   */
  static removeEntry(id: string): boolean {
    const history = this.getHistory().filter((e) => e.id !== id);
    this.saveHistory(history);
    return true;
  }

  /**
   * Clear all history
   */
  static clearHistory(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Clear old entries (older than days)
   */
  static clearOldEntries(days: number): void {
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
    const history = this.getHistory().filter((e) => e.timestamp > cutoffTime);
    this.saveHistory(history);
  }

  /**
   * Export history as JSON
   */
  static exportAsJSON(): string {
    return JSON.stringify(this.getHistory(), null, 2);
  }

  /**
   * Import history from JSON
   */
  static importFromJSON(json: string): boolean {
    try {
      const imported = JSON.parse(json);
      if (!Array.isArray(imported)) return false;

      const current = this.getHistory();
      const merged = [...imported, ...current];
      // Remove duplicates by ID
      const unique = Array.from(new Map(merged.map((e) => [e.id, e])).values());
      this.saveHistory(unique.slice(0, MAX_HISTORY_ITEMS));

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get statistics
   */
  static getStatistics() {
    const history = this.getHistory();
    const successful = history.filter((e) => e.success).length;
    const failed = history.length - successful;
    const formats = new Map<ExportFormat, number>();

    history.forEach((e) => {
      formats.set(e.format, (formats.get(e.format) || 0) + 1);
    });

    const totalSize = history.reduce((sum, e) => sum + (e.fileSize || 0), 0);

    return {
      total: history.length,
      successful,
      failed,
      formats: Object.fromEntries(formats),
      totalSize,
      oldestEntry: history[history.length - 1]?.timestamp,
      newestEntry: history[0]?.timestamp,
    };
  }

  /**
   * Save history to localStorage
   */
  private static saveHistory(history: ExportHistoryEntry[]): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save export history:', error);
    }
  }
}

/**
 * Format relative time string
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

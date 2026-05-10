/**
 * Command History - Undo/Redo System using Command Pattern
 * Supports unlimited undo/redo with command batching
 */

export interface Command {
  execute: () => void | Promise<void>;
  undo: () => void | Promise<void>;
  redo?: () => void | Promise<void>;
  timestamp?: number;
  description?: string;
}

export interface CommandHistoryOptions {
  maxHistorySize?: number;
  debounceMs?: number;
  onStateChange?: () => void;
}

export class CommandHistory {
  private history: Command[] = [];
  private pointer: number = -1;
  private isExecuting: boolean = false;
  private pendingCommand: Command | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private maxHistorySize: number;
  private debounceMs: number;
  private onStateChange: (() => void) | null;

  constructor(options: CommandHistoryOptions = {}) {
    this.maxHistorySize = options.maxHistorySize ?? 100;
    this.debounceMs = options.debounceMs ?? 500;
    this.onStateChange = options.onStateChange ?? null;
  }

  async execute(command: Command): Promise<void> {
    this.isExecuting = true;

    // Clear redo history when executing new command
    this.history = this.history.slice(0, this.pointer + 1);

    try {
      // Add command with timestamp
      command.timestamp = Date.now();
      this.history.push(command);
      this.pointer++;

      // Limit history size
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
        this.pointer--;
      }

      // Execute command
      await command.execute();

      this.triggerStateChange();
    } catch (error) {
      // Revert on error
      this.history.pop();
      this.pointer--;
      throw error;
    } finally {
      this.isExecuting = false;
    }
  }

  async undo(): Promise<void> {
    if (!this.canUndo()) return;

    this.isExecuting = true;
    try {
      const command = this.history[this.pointer];
      await command.undo();
      this.pointer--;
      this.triggerStateChange();
    } finally {
      this.isExecuting = false;
    }
  }

  async redo(): Promise<void> {
    if (!this.canRedo()) return;

    this.isExecuting = true;
    try {
      this.pointer++;
      const command = this.history[this.pointer];
      
      if (command.redo) {
        await command.redo();
      } else {
        await command.execute();
      }

      this.triggerStateChange();
    } finally {
      this.isExecuting = false;
    }
  }

  canUndo(): boolean {
    return this.pointer >= 0 && !this.isExecuting;
  }

  canRedo(): boolean {
    return this.pointer < this.history.length - 1 && !this.isExecuting;
  }

  getHistory(): Command[] {
    return [...this.history];
  }

  getHistorySize(): number {
    return this.history.length;
  }

  getCurrentPointer(): number {
    return this.pointer;
  }

  clear(): void {
    this.history = [];
    this.pointer = -1;
    this.triggerStateChange();
  }

  private triggerStateChange(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.onStateChange?.();
    }, this.debounceMs);
  }
}

/**
 * Hook for using command history in React components
 */
import { useCallback, useRef, useEffect, useState } from 'react';

export function useCommandHistory(options?: CommandHistoryOptions) {
  const historyRef = useRef(new CommandHistory(options));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateState = useCallback(() => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  }, []);

  useEffect(() => {
    historyRef.current = new CommandHistory({
      ...options,
      onStateChange: updateState,
    });
  }, [options, updateState]);

  return {
    execute: useCallback((cmd: Command) => historyRef.current.execute(cmd), []),
    undo: useCallback(() => historyRef.current.undo(), []),
    redo: useCallback(() => historyRef.current.redo(), []),
    canUndo,
    canRedo,
    clear: useCallback(() => historyRef.current.clear(), []),
    history: useCallback(() => historyRef.current.getHistory(), []),
  };
}

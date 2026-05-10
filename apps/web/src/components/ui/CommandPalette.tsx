'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

export interface Command {
  id: string;
  label: string;
  description?: string;
  category?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void | Promise<void>;
  visible?: boolean | (() => boolean);
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

const groupCommandsByCategory = (commands: Command[]) => {
  const filtered = commands.filter((cmd) => {
    if (cmd.visible === undefined) return true;
    return typeof cmd.visible === 'boolean' ? cmd.visible : cmd.visible();
  });

  const grouped: Record<string, Command[]> = {};
  filtered.forEach((cmd) => {
    const category = cmd.category || 'General';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(cmd);
  });

  return grouped;
};

const searchCommands = (
  commands: Command[],
  query: string,
  grouped: Record<string, Command[]>,
) => {
  if (!query.trim()) {
    return grouped;
  }

  const q = query.toLowerCase();
  const result: Record<string, Command[]> = {};

  Object.entries(grouped).forEach(([category, cmds]) => {
    const filtered = cmds.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.description?.toLowerCase().includes(q),
    );
    if (filtered.length > 0) {
      result[category] = filtered;
    }
  });

  return result;
};

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const grouped = useMemo(() => groupCommandsByCategory(commands), [commands]);
  const filtered = useMemo(() => searchCommands(commands, query, grouped), [query, commands, grouped]);

  const flattenedCommands = useMemo(() => {
    return Object.values(filtered).flat();
  }, [filtered]);

  const selectedCommand = flattenedCommands[selectedIndex];

  const handleExecute = useCallback(async () => {
    if (selectedCommand) {
      try {
        await selectedCommand.action();
        onClose();
      } catch (error) {
        console.error('Command execution failed:', error);
      }
    }
  }, [selectedCommand, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % flattenedCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev === 0 ? flattenedCommands.length - 1 : prev - 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          handleExecute();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flattenedCommands.length, handleExecute, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="w-full max-w-2xl bg-card rounded-lg overflow-hidden shadow-2xl">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="text-muted flex-shrink-0" size={20} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands..."
            className={cn(
              'w-full bg-transparent outline-none text-base text-foreground placeholder-muted',
              'transition-colors focus:text-foreground',
            )}
          />
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto">
          {flattenedCommands.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-muted text-sm">No commands found</p>
              <p className="text-muted/50 text-xs mt-2">
                Try a different search term
              </p>
            </div>
          ) : (
            Object.entries(filtered).map(([category, cmds]) => (
              <div key={category}>
                {/* Category Header */}
                <div className="px-4 py-2 mt-2 first:mt-0">
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
                    {category}
                  </h3>
                </div>

                {/* Commands in Category */}
                {cmds.map((cmd) => {
                  const isSelected = selectedCommand?.id === cmd.id;
                  return (
                    <button
                      key={cmd.id}
                      onClick={handleExecute}
                      onMouseEnter={() => setSelectedIndex(flattenedCommands.indexOf(cmd))}
                      className={cn(
                        'w-full px-4 py-3 flex items-center justify-between gap-3',
                        'hover:bg-card-hover transition-colors cursor-pointer',
                        isSelected && 'bg-card-hover',
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 text-left">
                        {cmd.icon && (
                          <span className="text-primary flex-shrink-0">{cmd.icon}</span>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {cmd.label}
                          </p>
                          {cmd.description && (
                            <p className="text-xs text-muted mt-0.5">
                              {cmd.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {cmd.shortcut && (
                          <kbd className="px-2 py-1 text-xs font-medium text-muted bg-subtle rounded border border-border">
                            {cmd.shortcut}
                          </kbd>
                        )}
                        {isSelected && (
                          <ChevronRight size={16} className="text-primary" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        {flattenedCommands.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-subtle/30 text-xs text-muted flex items-center justify-between">
            <div>
              Use <kbd className="px-1.5 py-0.5 bg-card rounded text-xs border border-border">↑↓</kbd> to navigate,{' '}
              <kbd className="px-1.5 py-0.5 bg-card rounded text-xs border border-border">Enter</kbd> to execute
            </div>
            <div>
              {selectedIndex + 1} / {flattenedCommands.length}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

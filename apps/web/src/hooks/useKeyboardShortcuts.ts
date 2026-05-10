'use client';

import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string; // 's', 'z', etc.
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  onTrigger: (event: KeyboardEvent) => void;
  description?: string;
  enabled?: boolean;
}

const DEFAULT_SHORTCUTS: Record<string, string> = {
  's': 'Save (Ctrl/Cmd + S)',
  'z': 'Undo (Ctrl/Cmd + Z)',
  'shift+z': 'Redo (Ctrl/Cmd + Shift + Z)',
  '/': 'Search (Ctrl/Cmd + /)',
  'escape': 'Cancel/Close (Esc)',
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
      const isModifierPressed = isMac ? event.metaKey : event.ctrlKey;

      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const _ctrlMatches = shortcut.ctrlKey ? isModifierPressed : !isModifierPressed;
        const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.altKey ? event.altKey : !event.altKey;

        // Special handling for modifier-only keys
        if (!shortcut.ctrlKey && !shortcut.metaKey && event.key === shortcut.key) {
          const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
          const altMatches = shortcut.altKey ? event.altKey : !event.altKey;

          if (shiftMatches && altMatches && !isModifierPressed) {
            event.preventDefault();
            shortcut.onTrigger(event);
            return;
          }
        }

        if (
          keyMatches &&
          (shortcut.ctrlKey || shortcut.metaKey ? isModifierPressed : true) &&
          shiftMatches &&
          altMatches
        ) {
          event.preventDefault();
          shortcut.onTrigger(event);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function getDefaultShortcuts(): Record<string, string> {
  return DEFAULT_SHORTCUTS;
}

export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.metaKey) parts.push('Cmd');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');

  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
}

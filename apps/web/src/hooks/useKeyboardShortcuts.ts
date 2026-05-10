import { useEffect } from 'react';

interface KeyboardShortcuts {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Build key combination string (Ctrl/Cmd + Shift + key)
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key = e.key.toLowerCase();

      // Create shortcut identifier
      let shortcutId = '';
      if (ctrl) shortcutId += 'ctrl+';
      if (shift) shortcutId += 'shift+';
      shortcutId += key;

      if (shortcuts[shortcutId]) {
        e.preventDefault();
        shortcuts[shortcutId]();
      }

      // Tool shortcuts (single key)
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

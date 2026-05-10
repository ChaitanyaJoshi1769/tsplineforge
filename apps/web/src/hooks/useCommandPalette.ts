import { useCallback, useEffect, useRef, useContext, createContext, useState } from 'react';
import { type Command } from '@/components/ui/CommandPalette';

interface CommandPaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  registerCommand: (command: Command) => void;
  unregisterCommand: (commandId: string) => void;
  commands: Command[];
}

export const CommandPaletteContext = createContext<CommandPaletteContextValue | undefined>(undefined);

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
}

export function useCommandPaletteProvider() {
  const [isOpen, setIsOpen] = useState(false);
  const commandsRef = useRef<Map<string, Command>>(new Map());

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const registerCommand = useCallback((command: Command) => {
    commandsRef.current.set(command.id, command);
  }, []);

  const unregisterCommand = useCallback((commandId: string) => {
    commandsRef.current.delete(commandId);
  }, []);

  const commands = Array.from(commandsRef.current.values());

  // Keyboard shortcut for opening command palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open,
    close,
    registerCommand,
    unregisterCommand,
    commands,
  };
}

// Hook to register a command
export function useCommand(command: Command) {
  const palette = useCommandPalette();

  useEffect(() => {
    palette.registerCommand(command);
    return () => palette.unregisterCommand(command.id);
  }, [command, palette]);
}

// Hook to register multiple commands
export function useCommands(commands: Command[]) {
  const palette = useCommandPalette();

  useEffect(() => {
    commands.forEach((cmd) => palette.registerCommand(cmd));
    return () => {
      commands.forEach((cmd) => palette.unregisterCommand(cmd.id));
    };
  }, [commands, palette]);
}

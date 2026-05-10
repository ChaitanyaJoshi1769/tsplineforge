'use client';

import React, { ReactNode } from 'react';
import { CommandPalette } from '@/components/ui/CommandPalette';
import {
  CommandPaletteContext,
  useCommandPaletteProvider,
} from '@/hooks/useCommandPalette';

interface CommandPaletteProviderProps {
  children: ReactNode;
}

export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const value = useCommandPaletteProvider();

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPalette
        isOpen={value.isOpen}
        onClose={value.close}
        commands={value.commands}
      />
    </CommandPaletteContext.Provider>
  );
}

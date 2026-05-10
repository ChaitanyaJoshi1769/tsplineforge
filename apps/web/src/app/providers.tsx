'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/auth';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ToastProvider } from '@/context/toast';
import { ToastContainer } from '@/components/ui/Toast';
import { CommandPaletteProvider } from '@/components/providers/CommandPaletteProvider';
import { ServiceWorkerManager } from '@/components/ServiceWorkerManager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <CommandPaletteProvider>
              <ServiceWorkerManager />
              {children}
              <ToastContainer />
            </CommandPaletteProvider>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  footer?: React.ReactNode;
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  (
    { logo, children, collapsible = false, defaultOpen = true, footer, className, ...props },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
      <>
        {/* Mobile backdrop */}
        {collapsible && isOpen && (
          <div
            className="fixed inset-0 z-sticky md:hidden bg-black/50 animate-fadeIn"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          ref={ref}
          className={cn(
            'bg-card border-r border-border',
            'flex flex-col h-screen',
            'transition-transform duration-200 ease-smooth',
            'fixed md:relative z-fixed md:z-auto',
            'w-64 md:w-auto',
            collapsible && !isOpen && '-translate-x-full md:translate-x-0',
            className,
          )}
          {...props}
        >
          {/* Header with logo */}
          {logo && (
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                {logo}
              </div>
              {collapsible && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="md:hidden text-muted hover:text-foreground transition-colors"
                  aria-label="Close sidebar"
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Navigation items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <SidebarContext.Provider value={{}}>
              {children}
            </SidebarContext.Provider>
          </nav>

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-border">
              {footer}
            </div>
          )}
        </aside>

        {/* Mobile toggle button */}
        {collapsible && (
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              'fixed bottom-4 left-4 z-fixed md:hidden',
              'p-2 rounded-lg bg-primary text-white',
              'transition-opacity duration-200',
              isOpen && 'opacity-0 pointer-events-none',
            )}
            aria-label="Open sidebar"
            type="button"
          >
            ≡
          </button>
        )}
      </>
    );
  },
);

Sidebar.displayName = 'Sidebar';

/* Sidebar Item */
interface SidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  active?: boolean;
}

const SidebarItem = React.forwardRef<HTMLButtonElement, SidebarItemProps>(
  ({ icon, active = false, className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg',
        'text-sm font-medium transition-all duration-150',
        'min-h-[44px] md:min-h-auto',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted hover:text-foreground hover:bg-card-hover',
        className,
      )}
      type="button"
      {...props}
    >
      {icon && <span className="flex-shrink-0 flex items-center text-base md:text-lg">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
    </button>
  ),
);

SidebarItem.displayName = 'SidebarItem';

/* Sidebar Section */
interface SidebarSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

const SidebarSection = React.forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ title, className, children, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props}>
      {title && (
        <div className="px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wide">
          {title}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  ),
);

SidebarSection.displayName = 'SidebarSection';

/* Context */
interface SidebarContextType {}

const SidebarContext = React.createContext<SidebarContextType>({});

export { Sidebar, SidebarItem, SidebarSection };

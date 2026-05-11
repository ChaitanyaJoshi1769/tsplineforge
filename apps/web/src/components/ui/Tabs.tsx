'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultValue, value, onValueChange, children, className, ...props }, ref) => {
    const [internalTab, setInternalTab] = useState(defaultValue || '');
    const isControlled = value !== undefined;
    const activeTab = isControlled ? value : internalTab;

    const handleTabChange = (newValue: string) => {
      if (!isControlled) {
        setInternalTab(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        <TabsContext.Provider value={{ activeTab, onTabChange: handleTabChange }}>
          {children}
        </TabsContext.Provider>
      </div>
    );
  },
);

Tabs.displayName = 'Tabs';

/* Tabs List */
interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex gap-1 border-b border-border',
        className,
      )}
      role="tablist"
      {...props}
    />
  ),
);

TabsList.displayName = 'TabsList';

/* Tabs Trigger */
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  icon?: React.ReactNode;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, icon, children, className, ...props }, ref) => {
    const { activeTab, onTabChange } = React.useContext(TabsContext);
    const isActive = activeTab === value;

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        className={cn(
          'flex items-center gap-2 px-4 py-3 text-sm font-medium',
          'transition-all duration-200 ease-smooth',
          'border-b-2 -mb-[2px]',
          isActive
            ? 'text-primary border-b-primary bg-primary/5'
            : 'text-muted border-b-transparent hover:text-foreground hover:border-border',
          className,
        )}
        onClick={() => onTabChange(value)}
        type="button"
        {...props}
      >
        {icon && <span className="flex items-center">{icon}</span>}
        {children}
      </button>
    );
  },
);

TabsTrigger.displayName = 'TabsTrigger';

/* Tabs Content */
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className, ...props }, ref) => {
    const { activeTab } = React.useContext(TabsContext);

    if (activeTab !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn('animate-fadeIn tab-content', className)}
        {...props}
      />
    );
  },
);

TabsContent.displayName = 'TabsContent';

/* Context */
interface TabsContextType {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType>({
  activeTab: '',
  onTabChange: () => {},
});

export { Tabs, TabsList, TabsTrigger, TabsContent };

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  trigger: React.ReactElement;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  onOpenChange?: (open: boolean) => void;
}

const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ trigger, children, placement = 'bottom', onOpenChange, className }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [isOpen]);

    const handleOpenChange = (newState: boolean) => {
      setIsOpen(newState);
      onOpenChange?.(newState);
    };

    const placementClasses = {
      top: 'bottom-full mb-2',
      bottom: 'top-full mt-2',
      left: 'right-full mr-2',
      right: 'left-full ml-2',
    };

    return (
      <div ref={ref} className="relative inline-block">
        <div
          onClick={() => handleOpenChange(!isOpen)}
          className="cursor-pointer"
        >
          {trigger}
        </div>

        {isOpen && (
          <div
            ref={dropdownRef}
            className={cn(
              'absolute z-dropdown min-w-max',
              placementClasses[placement],
              className,
            )}
          >
            <DropdownContext.Provider value={{ onClose: () => handleOpenChange(false) }}>
              {children}
            </DropdownContext.Provider>
          </div>
        )}
      </div>
    );
  },
);

Dropdown.displayName = 'Dropdown';

/* Dropdown Menu */
interface DropdownMenuProps extends React.HTMLAttributes<HTMLDivElement> {}

const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-slideUp',
        className,
      )}
      {...props}
    />
  ),
);

DropdownMenu.displayName = 'DropdownMenu';

/* Dropdown Item */
interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  destructive?: boolean;
}

const DropdownItem = React.forwardRef<HTMLButtonElement, DropdownItemProps>(
  (
    { icon, description, disabled = false, destructive = false, className, children, ...props },
    ref,
  ) => {
    const { onClose } = React.useContext(DropdownContext);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        onClose();
        props.onClick?.(e);
      }
    };

    return (
      <button
        ref={ref}
        className={cn(
          'w-full flex items-start gap-3 px-4 py-2.5 text-left text-sm',
          'transition-colors duration-150',
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : destructive
              ? 'text-error hover:bg-error/10'
              : 'text-foreground hover:bg-card-hover',
          className,
        )}
        disabled={disabled}
        type="button"
        onClick={handleClick}
        {...props}
      >
        {icon && <span className="flex-shrink-0 flex items-center mt-0.5">{icon}</span>}
        <div className="flex-1">
          <div className="font-medium">{children}</div>
          {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
        </div>
      </button>
    );
  },
);

DropdownItem.displayName = 'DropdownItem';

/* Dropdown Divider */
interface DropdownDividerProps extends React.HTMLAttributes<HTMLDivElement> {}

const DropdownDivider = React.forwardRef<HTMLDivElement, DropdownDividerProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('h-px bg-border', className)}
      {...props}
    />
  ),
);

DropdownDivider.displayName = 'DropdownDivider';

/* Context */
interface DropdownContextType {
  onClose: () => void;
}

const DropdownContext = React.createContext<DropdownContextType>({
  onClose: () => {},
});

export {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
};

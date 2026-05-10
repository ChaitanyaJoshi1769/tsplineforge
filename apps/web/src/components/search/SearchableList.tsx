'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export interface SearchableListProps<T> {
  items: T[];
  searchKeys: (keyof T)[];
  renderItem: (item: T, index: number) => React.ReactNode;
  placeholder?: string;
  noResultsMessage?: string;
  containerClassName?: string;
  listClassName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function SearchableList<T extends Record<string, any>>({
  items,
  searchKeys,
  renderItem,
  placeholder = 'Search...',
  noResultsMessage = 'No results found',
  containerClassName,
  listClassName,
}: SearchableListProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter((item) =>
      searchKeys.some((key) => {
        const value = item[key];
        return String(value).toLowerCase().includes(query);
      }),
    );
  }, [items, searchQuery, searchKeys]);

  return (
    <div className={cn('space-y-4', containerClassName)}>
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        icon="🔍"
        fullWidth
      />

      {filteredItems.length > 0 ? (
        <div className={cn('space-y-2', listClassName)}>
          {filteredItems.map((item, index) => (
            <div key={index} className="animate-fadeIn">
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted">
          <p className="text-sm">{noResultsMessage}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Hook for debounced search
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedSearch<T extends Record<string, any>>(
  query: string,
  items: T[],
  searchKeys: (keyof T)[],
  delay: number = 300,
): T[] {
  const [filteredItems, setFilteredItems] = React.useState(items);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setFilteredItems(items);
        return;
      }

      const lowerQuery = query.toLowerCase();
      setFilteredItems(
        items.filter((item) =>
          searchKeys.some((key) =>
            String(item[key]).toLowerCase().includes(lowerQuery),
          ),
        ),
      );
    }, delay);

    return () => clearTimeout(timer);
  }, [query, items, searchKeys, delay]);

  return filteredItems;
}

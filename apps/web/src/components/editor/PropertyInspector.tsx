'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Property {
  name: string;
  value: string | number;
  type: 'text' | 'number' | 'select';
  options?: string[];
  onChange: (value: string | number) => void;
}

interface PropertyInspectorProps {
  title: string;
  properties: Property[];
  onPropertyChange?: (name: string, value: string | number) => void;
}

export function PropertyInspector({
  title,
  properties,
  onPropertyChange,
}: PropertyInspectorProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-card/80"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform ${expanded ? '' : '-rotate-90'}`}
        />
      </div>

      {expanded && (
        <div className="border-t border-border p-4 space-y-4">
          {properties.map((prop) => (
            <div key={prop.name} className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase">
                {prop.name}
              </label>

              {prop.type === 'text' && (
                <input
                  type="text"
                  value={prop.value}
                  onChange={(e) => {
                    prop.onChange(e.target.value);
                    onPropertyChange?.(prop.name, e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}

              {prop.type === 'number' && (
                <input
                  type="number"
                  value={prop.value}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value) || 0;
                    prop.onChange(num);
                    onPropertyChange?.(prop.name, num);
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}

              {prop.type === 'select' && prop.options && (
                <select
                  value={prop.value}
                  onChange={(e) => {
                    prop.onChange(e.target.value);
                    onPropertyChange?.(prop.name, e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {prop.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

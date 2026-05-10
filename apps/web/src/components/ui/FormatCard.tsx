'use client';

/**
 * Format Card Component
 * Premium card for CAD format selection
 */

import React, { useState } from 'react';
import { ExportFormat, FormatCapabilities } from '@/lib/exportOptions';
import { CheckCircle2, Palette, Package, Zap, Archive } from 'lucide-react';

export interface FormatCardProps {
  format: ExportFormat;
  name: string;
  description: string;
  extensions: string[];
  capabilities: FormatCapabilities;
  icon: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * Capability Badge Component
 */
function CapabilityBadge({
  label,
  supported,
  icon: Icon,
}: {
  label: string;
  supported: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
        supported
          ? 'bg-emerald-900/30 text-emerald-200'
          : 'bg-slate-800/30 text-slate-400'
      }`}
    >
      {Icon}
      <span>{label}</span>
    </div>
  );
}

/**
 * Format Card Component
 */
export function FormatCard({
  format,
  name,
  description,
  extensions,
  capabilities,
  icon,
  selected = false,
  onClick,
  disabled = false,
}: FormatCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={disabled}
      className={`
        relative w-full rounded-lg border-2 p-4 text-left transition-all duration-150
        ${
          selected
            ? 'border-blue-500 bg-blue-500/10 shadow-lg'
            : isHovering && !disabled
              ? 'border-blue-400/50 bg-slate-800/50 shadow-md'
              : 'border-slate-700 bg-slate-900/30'
        }
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-md'}
      `}
    >
      {/* Selected Indicator */}
      {selected && (
        <div className="absolute -right-2 -top-2">
          <div className="rounded-full bg-blue-500 p-1">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
        </div>
      )}

      {/* Icon */}
      <div className="mb-3 flex items-center justify-center w-12 h-12 rounded-lg bg-slate-800/50 text-blue-400">
        {icon}
      </div>

      {/* Format Name */}
      <div className="mb-1">
        <h3 className="text-base font-semibold text-white">{name}</h3>
        <p className="text-xs text-slate-400">{extensions.join(', ')}</p>
      </div>

      {/* Description */}
      <p className="mb-3 text-sm text-slate-300 line-clamp-2">{description}</p>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-2">
        <CapabilityBadge
          label="Colors"
          supported={capabilities.colors}
          icon={<Palette className="h-3 w-3" />}
        />
        <CapabilityBadge
          label="Materials"
          supported={capabilities.materials}
          icon={<Package className="h-3 w-3" />}
        />
        <CapabilityBadge
          label="Assembly"
          supported={capabilities.assembly}
          icon={<Archive className="h-3 w-3" />}
        />
        <CapabilityBadge
          label="Parametric"
          supported={capabilities.parametric}
          icon={<Zap className="h-3 w-3" />}
        />
      </div>
    </button>
  );
}

/**
 * Format Cards Grid Component
 */
export interface FormatCardsGridProps {
  formats: FormatCardProps[];
  selectedFormat?: ExportFormat;
  onSelectFormat?: (format: ExportFormat) => void;
  columns?: number;
}

export function FormatCardsGrid({
  formats,
  selectedFormat,
  onSelectFormat,
  columns = 2,
}: FormatCardsGridProps) {
  return (
    <div
      className={`grid gap-3 ${
        columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      }`}
    >
      {formats.map((formatProps) => (
        <FormatCard
          key={formatProps.format}
          {...formatProps}
          selected={formatProps.format === selectedFormat}
          onClick={() => onSelectFormat?.(formatProps.format)}
        />
      ))}
    </div>
  );
}

'use client';

/**
 * Export Options Panel Component
 * Format-specific configuration options
 */

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  ExportOptions,
  STEPExportOptions,
  STLExportOptions,
  GLTFExportOptions,
  IGESExportOptions,
  UnitSystem,
} from '@/lib/exportOptions';

export interface ExportOptionsPanelProps {
  options: ExportOptions;
  onChange: <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => void;
  disabled?: boolean;
  compact?: boolean;
}

/**
 * Select Input Component
 */
function SelectInput({
  label,
  value,
  options: optionsList,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white transition-colors hover:border-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
      >
        {optionsList.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Number Input Component
 */
function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 0.01,
  unit = '',
  disabled = false,
  help = '',
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  help?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-300">
        {label}
        {unit && <span className="text-slate-500 ml-1">({unit})</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full rounded-md border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-white transition-colors hover:border-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50"
      />
      {help && <p className="text-xs text-slate-500 mt-1">{help}</p>}
    </div>
  );
}

/**
 * Toggle Switch Component
 */
function ToggleSwitch({
  label,
  checked,
  onChange,
  disabled = false,
  hint = '',
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-900/30 border border-slate-800 px-3 py-2">
      <label className="flex flex-col gap-1 flex-1">
        <span className="text-sm font-medium text-white">{label}</span>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </label>
      <button
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`
          relative h-6 w-11 rounded-full transition-colors
          ${checked ? 'bg-blue-500' : 'bg-slate-700'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-opacity-80'}
        `}
      >
        <div
          className={`
            absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform
            ${checked ? 'translate-x-5' : 'translate-x-0.5'}
          `}
        />
      </button>
    </div>
  );
}

/**
 * Collapsible Section Component
 */
function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 hover:bg-slate-800/50 transition-colors"
      >
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="p-4 space-y-4 bg-slate-950/50 border-t border-slate-800">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * STEP Options
 */
function STEPOptions({
  options,
  onChange,
}: {
  options: STEPExportOptions;
  onChange: <K extends keyof STEPExportOptions>(key: K, value: STEPExportOptions[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <SelectInput
        label="Unit System"
        value={options.unit}
        options={[
          { label: 'Millimeters (mm)', value: 'mm' },
          { label: 'Centimeters (cm)', value: 'cm' },
          { label: 'Inches (in)', value: 'in' },
          { label: 'Meters (m)', value: 'm' },
        ]}
        onChange={(value) => onChange('unit', value as UnitSystem)}
      />

      <SelectInput
        label="STEP Variant"
        value={options.stepVariant}
        options={[
          { label: 'STEP AP203', value: 'AP203' },
          { label: 'STEP AP214', value: 'AP214' },
        ]}
        onChange={(value) => onChange('stepVariant', value as 'AP203' | 'AP214')}
      />

      <NumberInput
        label="Tolerance"
        value={options.tolerance}
        onChange={(value) => onChange('tolerance', value)}
        min={0.001}
        max={1}
        step={0.001}
        unit={options.unit}
        help="Controls precision during conversion. Smaller values = higher precision"
      />

      <ToggleSwitch
        label="Preserve Colors"
        checked={options.preserveColors}
        onChange={(value) => onChange('preserveColors', value)}
        hint="Transfer color information to STEP file"
      />

      <ToggleSwitch
        label="Preserve Materials"
        checked={options.preserveMaterials}
        onChange={(value) => onChange('preserveMaterials', value)}
        hint="Transfer material properties to STEP file"
      />
    </div>
  );
}

/**
 * STL Options
 */
function STLOptions({
  options,
  onChange,
}: {
  options: STLExportOptions;
  onChange: <K extends keyof STLExportOptions>(key: K, value: STLExportOptions[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <SelectInput
        label="Unit System"
        value={options.unit}
        options={[
          { label: 'Millimeters (mm)', value: 'mm' },
          { label: 'Centimeters (cm)', value: 'cm' },
          { label: 'Inches (in)', value: 'in' },
          { label: 'Meters (m)', value: 'm' },
        ]}
        onChange={(value) => onChange('unit', value as UnitSystem)}
      />

      <SelectInput
        label="Format"
        value={options.stlFormat}
        options={[
          { label: 'Binary (smaller file)', value: 'binary' },
          { label: 'ASCII (human-readable)', value: 'ascii' },
        ]}
        onChange={(value) => onChange('stlFormat', value as 'binary' | 'ascii')}
      />

      <SelectInput
        label="Precision"
        value={options.precision}
        options={[
          { label: 'Auto (recommended)', value: 'auto' },
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' },
        ]}
        onChange={(value) => onChange('precision', value as 'auto' | 'high' | 'medium' | 'low')}
      />

      <SelectInput
        label="Optimization"
        value={options.optimization}
        options={[
          { label: 'None (fastest)', value: 'none' },
          { label: 'Merge vertices', value: 'merge' },
          { label: 'Remove duplicates', value: 'decimate' },
        ]}
        onChange={(value) => onChange('optimization', value as 'none' | 'merge' | 'decimate')}
      />
    </div>
  );
}

/**
 * GLTF Options
 */
function GLTFOptions({
  options,
  onChange,
}: {
  options: GLTFExportOptions;
  onChange: <K extends keyof GLTFExportOptions>(key: K, value: GLTFExportOptions[K]) => void;
}) {
  return (
    <div className="space-y-4">
      <SelectInput
        label="Unit System"
        value={options.unit}
        options={[
          { label: 'Millimeters (mm)', value: 'mm' },
          { label: 'Centimeters (cm)', value: 'cm' },
          { label: 'Inches (in)', value: 'in' },
          { label: 'Meters (m)', value: 'm' },
        ]}
        onChange={(value) => onChange('unit', value as UnitSystem)}
      />

      <ToggleSwitch
        label="Draco Compression"
        checked={options.compressed}
        onChange={(value) => onChange('compressed', value)}
        hint="Reduce file size using Draco compression"
      />

      <ToggleSwitch
        label="Include Animations"
        checked={options.includeAnimations}
        onChange={(value) => onChange('includeAnimations', value)}
        hint="Export animation clips if present"
      />

      <ToggleSwitch
        label="Include Metadata"
        checked={options.includeMetadata}
        onChange={(value) => onChange('includeMetadata', value)}
        hint="Include object names and properties"
      />
    </div>
  );
}

/**
 * Export Options Panel Component
 */
export function ExportOptionsPanel({
  options,
  onChange,
  compact = false,
}: ExportOptionsPanelProps) {
  // Note: 'disabled' is accepted in props but not currently used (reserved for future use)
  return (
    <CollapsibleSection title="Format-Specific Options" defaultOpen={!compact}>
      <div className="space-y-4">
        {options.format === 'step' && (
          <STEPOptions
            options={options as STEPExportOptions}
            onChange={onChange as <K extends keyof STEPExportOptions>(key: K, value: STEPExportOptions[K]) => void}
          />
        )}

        {options.format === 'iges' && (
          <div className="space-y-4">
            <SelectInput
              label="Unit System"
              value={options.unit}
              options={[
                { label: 'Millimeters (mm)', value: 'mm' },
                { label: 'Centimeters (cm)', value: 'cm' },
                { label: 'Inches (in)', value: 'in' },
                { label: 'Meters (m)', value: 'm' },
              ]}
              onChange={(value) => onChange('unit', value as UnitSystem)}
            />
            <NumberInput
              label="Tolerance"
              value={(options as unknown as Record<string, unknown>).tolerance as number}
              onChange={(value) => (onChange as <K extends keyof IGESExportOptions>(key: K, value: IGESExportOptions[K]) => void)('tolerance', value)}
              min={0.001}
              max={1}
              step={0.001}
              unit={options.unit}
              help="Controls precision during conversion"
            />
          </div>
        )}

        {options.format === 'stl' && (
          <STLOptions
            options={options as STLExportOptions}
            onChange={onChange as <K extends keyof STLExportOptions>(key: K, value: STLExportOptions[K]) => void}
          />
        )}

        {options.format === 'gltf' && (
          <GLTFOptions
            options={options as GLTFExportOptions}
            onChange={onChange as <K extends keyof GLTFExportOptions>(key: K, value: GLTFExportOptions[K]) => void}
          />
        )}

        {options.format === 'obj' && (
          <div className="space-y-4">
            <SelectInput
              label="Unit System"
              value={options.unit}
              options={[
                { label: 'Millimeters (mm)', value: 'mm' },
                { label: 'Centimeters (cm)', value: 'cm' },
                { label: 'Inches (in)', value: 'in' },
                { label: 'Meters (m)', value: 'm' },
              ]}
              onChange={(value) => onChange('unit', value as UnitSystem)}
            />
            <ToggleSwitch
              label="Include Materials"
              checked={(options as unknown as Record<string, unknown>).includeMaterials as boolean}
              onChange={(value) => (onChange as (key: 'includeMaterials', value: boolean) => void)('includeMaterials', value)}
              hint="Export .mtl file with material definitions"
            />
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

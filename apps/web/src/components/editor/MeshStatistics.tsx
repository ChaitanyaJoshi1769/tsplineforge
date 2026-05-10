'use client';

/**
 * Mesh Statistics Display Component
 * Shows real-time geometry statistics
 */

import React from 'react';
import { MeshStatistics } from '@/lib/meshStatistics';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface MeshStatisticsProps {
  statistics: MeshStatistics | null;
  isLoading?: boolean;
  unit?: string;
  compact?: boolean;
}

/**
 * Format large numbers with commas
 */
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Status Badge Component
 */
function StatusBadge({ isManifold }: { isManifold: boolean }) {
  if (isManifold) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-900/30 px-3 py-2 text-sm">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        <span className="text-emerald-200">Ready for export</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg bg-amber-900/30 px-3 py-2 text-sm">
      <AlertTriangle className="h-4 w-4 text-amber-400" />
      <span className="text-amber-200">Non-manifold geometry</span>
    </div>
  );
}

/**
 * Stat Row Component
 */
function StatRow({ label, value, unit = '', highlight = false }: {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center py-2 px-3 rounded-md transition-colors ${
      highlight ? 'bg-blue-900/20' : 'hover:bg-slate-800/30'
    }`}>
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`font-mono text-sm ${highlight ? 'text-blue-300 font-semibold' : 'text-slate-200'}`}>
        {value}
        {unit && <span className="text-slate-400 ml-1">{unit}</span>}
      </span>
    </div>
  );
}

/**
 * Mesh Statistics Display Component
 */
export function MeshStatisticsComponent({
  statistics,
  isLoading = false,
  unit = 'mm',
  compact = false,
}: MeshStatisticsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2 p-4 rounded-lg bg-slate-900/30 border border-slate-800">
        <div className="h-4 bg-slate-700 rounded animate-pulse" />
        <div className="h-4 bg-slate-700 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-slate-700 rounded animate-pulse w-2/3" />
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-200">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-medium">No geometry detected</p>
          <p className="text-xs text-red-300 mt-1">Load or create a model to see statistics</p>
        </div>
      </div>
    );
  }

  const compactView = compact ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <div className="space-y-3 rounded-lg bg-slate-900/30 border border-slate-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white">Mesh Statistics</h3>
        <StatusBadge isManifold={statistics.isManifold} />
      </div>

      {/* Statistics Grid */}
      <div className={`grid ${compactView} gap-1 text-xs bg-slate-950/50 rounded-md overflow-hidden border border-slate-800/50`}>
        <StatRow
          label="Vertices"
          value={formatNumber(statistics.vertexCount)}
          highlight={statistics.vertexCount > 1000000}
        />
        <StatRow
          label="Faces"
          value={formatNumber(statistics.faceCount)}
          highlight={statistics.faceCount > 500000}
        />

        <StatRow
          label="Width"
          value={statistics.bounds.x}
          unit={unit}
        />
        <StatRow
          label="Height"
          value={statistics.bounds.y}
          unit={unit}
        />
        <StatRow
          label="Depth"
          value={statistics.bounds.z}
          unit={unit}
        />

        <StatRow
          label="Surface Area"
          value={statistics.surfaceArea}
          unit={`${unit}²`}
        />

        {statistics.volume && (
          <StatRow
            label="Volume"
            value={statistics.volume}
            unit={`${unit}³`}
          />
        )}

        {statistics.hasMaterials && (
          <StatRow
            label="Materials"
            value={statistics.materialCount}
          />
        )}

        {statistics.hasAnimations && (
          <StatRow
            label="Animations"
            value="Yes"
          />
        )}
      </div>

      {/* Warnings/Info */}
      {statistics.vertexCount > 10_000_000 && (
        <div className="flex items-start gap-2 rounded-md bg-amber-900/20 border border-amber-800/50 p-3 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>Very large mesh - export may take longer</div>
        </div>
      )}

      {!statistics.isManifold && (
        <div className="flex items-start gap-2 rounded-md bg-amber-900/20 border border-amber-800/50 p-3 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>Non-manifold geometry may not export correctly in all formats</div>
        </div>
      )}
    </div>
  );
}

/**
 * Mesh Statistics Card (Compact)
 */
export function MeshStatisticsCard({ statistics }: { statistics: MeshStatistics | null }) {
  if (!statistics) return null;

  const getStatusColor = () => {
    if (!statistics.isManifold) return 'text-amber-400';
    if (statistics.vertexCount > 10_000_000) return 'text-orange-400';
    return 'text-emerald-400';
  };

  const getStatusIcon = () => {
    if (!statistics.isManifold) return '⚠️';
    if (statistics.vertexCount > 10_000_000) return '⏱️';
    return '✓';
  };

  return (
    <div className={`rounded-lg bg-slate-900/50 border border-slate-800 p-3 space-y-2 text-xs`}>
      <div className={`flex items-center gap-2 ${getStatusColor()}`}>
        <span>{getStatusIcon()}</span>
        <span>
          {!statistics.isManifold ? 'Non-manifold' : statistics.vertexCount > 10_000_000 ? 'Large mesh' : 'Ready'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-slate-300">
        <div>
          <div className="text-slate-400 text-xs mb-0.5">Vertices</div>
          <div className="font-mono font-semibold">{formatNumber(statistics.vertexCount)}</div>
        </div>
        <div>
          <div className="text-slate-400 text-xs mb-0.5">Faces</div>
          <div className="font-mono font-semibold">{formatNumber(statistics.faceCount)}</div>
        </div>
      </div>
    </div>
  );
}

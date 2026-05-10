'use client';

import React from 'react';
import { CAMERA_PRESETS } from '@/lib/cameraPresets';
import { Button } from '@/components/ui/Button';

interface ViewportControlsProps {
  selectedPreset: string | null;
  isAnimating: boolean;
  onPresetSelect: (presetId: string) => void;
  onFrameView: () => void;
  onResetView: () => void;
  className?: string;
}

export function ViewportControls({
  selectedPreset,
  isAnimating,
  onPresetSelect,
  onFrameView,
  onResetView,
  className = '',
}: ViewportControlsProps) {
  const presets = Object.values(CAMERA_PRESETS);

  return (
    <div
      className={`flex flex-col gap-3 p-3 bg-card border border-border rounded-lg ${className}`}
    >
      {/* Control Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={onFrameView}
          disabled={isAnimating}
          title="Frame view (zoom to fit object)"
          className="flex-1"
        >
          📦 Frame
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={onResetView}
          disabled={isAnimating}
          title="Reset to default view"
          className="flex-1"
        >
          ↺ Reset
        </Button>
      </div>

      {/* Preset Label */}
      <div className="text-xs font-medium text-foreground px-1">View Presets</div>

      {/* Preset Buttons Grid */}
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onPresetSelect(preset.id)}
            disabled={isAnimating}
            title={preset.description}
            className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
              selectedPreset === preset.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-subtle hover:bg-subtle/80 text-foreground'
            } ${isAnimating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="pt-2 border-t border-border/30">
        <div className="text-xs text-muted space-y-1">
          <div>
            <span className="font-medium">Rotate:</span> Left Mouse Drag
          </div>
          <div>
            <span className="font-medium">Pan:</span> Right Mouse Drag
          </div>
          <div>
            <span className="font-medium">Zoom:</span> Mouse Wheel
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Standalone viewport controls widget
 * Can be placed in toolbar, sidebar, or floating panel
 */
export function ViewportControlsCompact({
  selectedPreset,
  isAnimating,
  onPresetSelect,
  className = '',
}: Omit<ViewportControlsProps, 'onFrameView' | 'onResetView'> & {
  onFrameView?: () => void;
  onResetView?: () => void;
}) {
  const presets = [
    CAMERA_PRESETS.front,
    CAMERA_PRESETS.top,
    CAMERA_PRESETS.isometric,
    CAMERA_PRESETS.perspective,
  ];

  return (
    <div className={`flex gap-1 ${className}`}>
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onPresetSelect(preset.id)}
          disabled={isAnimating}
          title={preset.description}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-150 ${
            selectedPreset === preset.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-subtle hover:bg-subtle/80 text-foreground'
          } ${isAnimating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {preset.name}
        </button>
      ))}
    </div>
  );
}

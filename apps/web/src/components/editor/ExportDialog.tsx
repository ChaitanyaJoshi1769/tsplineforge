'use client';

import React, { useState } from 'react';
import * as THREE from 'three';
import { useExport } from '@/hooks/useExport';
import { useToast } from '@/context/toast';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { LinearProgress } from '@/components/ui/ProgressIndicators';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  scene?: THREE.Object3D;
  defaultFilename?: string;
}

type ExportFormat = 'stl' | 'glb' | 'gltf' | 'obj';

const FORMAT_OPTIONS: Array<{
  value: ExportFormat;
  label: string;
  description: string;
  binary: boolean;
}> = [
  {
    value: 'stl',
    label: 'STL (Binary)',
    description: 'Stereolithography Format - Best for 3D printing',
    binary: true,
  },
  {
    value: 'glb',
    label: 'GLB (Binary)',
    description: 'Binary GLTF - Optimized with embedded textures',
    binary: true,
  },
  {
    value: 'gltf',
    label: 'GLTF (JSON)',
    description: 'GL Transmission Format - Readable format with separate textures',
    binary: false,
  },
  {
    value: 'obj',
    label: 'OBJ',
    description: 'Wavefront OBJ - Universal 3D format',
    binary: false,
  },
];

export function ExportDialog({
  isOpen,
  onClose,
  scene,
  defaultFilename = 'model',
}: ExportDialogProps) {
  const { addToast } = useToast();
  const { export: exportModel, isExporting, progress, error, success, clearError } = useExport();

  const [filename, setFilename] = useState(defaultFilename);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('glb');

  const handleExport = async () => {
    if (!scene) {
      addToast({
        type: 'error',
        title: 'No Scene',
        message: 'No 3D scene available for export',
        duration: 3000,
      });
      return;
    }

    const format = FORMAT_OPTIONS.find((f) => f.value === selectedFormat);
    if (!format) {
      addToast({
        type: 'error',
        title: 'Invalid Format',
        message: 'Please select a valid export format',
        duration: 3000,
      });
      return;
    }

    try {
      await exportModel(scene, filename || 'model', {
        format: selectedFormat,
        binary: format.binary,
      });

      addToast({
        type: 'success',
        title: 'Export Successful',
        message: `Model exported as ${format.label}`,
        duration: 3000,
      });

      // Close dialog after successful export
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: error || (err instanceof Error ? err.message : 'Unknown error'),
        duration: 5000,
      });
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      clearError();
      onClose();
    }
  };

  const selectedFormatInfo = FORMAT_OPTIONS.find((f) => f.value === selectedFormat);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Export Model">
      <div className="space-y-6">
        {/* Filename Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Filename</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Enter filename"
              disabled={isExporting}
              className="flex-1 px-3 py-2 bg-subtle border border-border rounded-lg text-sm text-foreground placeholder-muted disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="px-3 py-2 bg-subtle/50 border border-border rounded-lg text-sm text-muted">
              {selectedFormatInfo?.value}
            </span>
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">Export Format</label>
          <div className="space-y-2">
            {FORMAT_OPTIONS.map((format) => (
              <label
                key={format.value}
                className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedFormat === format.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border-light'
                } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="format"
                  value={format.value}
                  checked={selectedFormat === format.value}
                  onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                  disabled={isExporting}
                  className="mr-3"
                />
                <span className="font-medium text-foreground">{format.label}</span>
                <p className="text-xs text-muted mt-1">{format.description}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">Exporting...</label>
              <span className="text-xs text-muted">{Math.round(progress)}%</span>
            </div>
            <LinearProgress progress={progress} />
          </div>
        )}

        {/* Error Message */}
        {error && !isExporting && (
          <div className="p-3 bg-error/10 border border-error/30 rounded-lg">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && !isExporting && (
          <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
            <p className="text-sm text-success">Export completed successfully!</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !filename.trim()}>
            {isExporting ? `Exporting (${Math.round(progress)}%)` : 'Export'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

'use client';

import React, { useState } from 'react';
import * as THREE from 'three';
import { AdvancedExportDialog } from './AdvancedExportDialog';
import { Button } from '@/components/ui/Button';
import { useExport } from '@/hooks/useExport';
import { ExportFormat, ExportOptions } from '@/lib/exportOptions';
import type { ExportOptions as LegacyExportOptions } from '@/lib/exporters';

interface ExportButtonProps {
  scene?: THREE.Object3D;
  projectName?: string;
  className?: string;
}

export function ExportButton({ scene, projectName = 'model', className }: ExportButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isExporting, export: performExport } = useExport();

  const handleExport = async (filename: string, format: ExportFormat, options: ExportOptions) => {
    if (!scene) return;

    // Convert the new ExportOptions to the legacy format that useExport understands
    const stlFormat = (options as unknown as Record<string, unknown>).stlFormat === 'binary' ? 'binary' : 'ascii';

    // Map new formats to their corresponding legacy formats
    // STEP and IGES now have native support in exporters.ts
    const legacyFormat = (
      format === 'step' || format === 'iges'
        ? format as 'step' | 'iges'
        : format
    ) as LegacyExportOptions['format'] | 'step' | 'iges';

    const legacyOptions = {
      format: legacyFormat,
      binary: format === 'stl' ? (stlFormat === 'binary') : true,
    } as unknown as LegacyExportOptions;

    await performExport(scene, filename, legacyOptions);
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setIsDialogOpen(true)}
        disabled={!scene || isExporting}
        className={className}
        title="Export model to CAD formats (STEP, IGES, STL, GLTF, OBJ)"
      >
        ⬇️ Export
      </Button>

      <AdvancedExportDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        scene={scene as THREE.Scene | null}
        defaultFilename={projectName}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </>
  );
}

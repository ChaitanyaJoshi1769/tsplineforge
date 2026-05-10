'use client';

import React, { useState } from 'react';
import * as THREE from 'three';
import { AdvancedExportDialog } from './AdvancedExportDialog';
import { Button } from '@/components/ui/Button';
import { useExport } from '@/hooks/useExport';
import { ExportFormat, ExportOptions } from '@/lib/exportOptions';

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

    // Convert the new ExportOptions to the old format for backward compatibility
    const legacyOptions = {
      format,
      binary: format === 'stl' ? ((options as any).stlFormat === 'binary') : true,
    };

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

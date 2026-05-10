'use client';

import React, { useState } from 'react';
import * as THREE from 'three';
import { ExportDialog } from './ExportDialog';
import { Button } from '@/components/ui/Button';

interface ExportButtonProps {
  scene?: THREE.Object3D;
  projectName?: string;
  className?: string;
}

export function ExportButton({ scene, projectName = 'model', className }: ExportButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setIsDialogOpen(true)}
        className={className}
        title="Export model to STL, GLTF, or OBJ format"
      >
        ⬇️ Export
      </Button>

      <ExportDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        scene={scene}
        defaultFilename={projectName}
      />
    </>
  );
}

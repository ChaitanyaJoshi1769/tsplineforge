'use client';

import React from 'react';
import { FileDropZone, type FileDropZoneProps } from '@/components/ui/FileDropZone';

// Supported 3D model formats for CAD
const SUPPORTED_FORMATS = {
  '.obj': 'application/wavefront-obj',
  '.stl': 'application/vnd.ms-pki.stl',
  '.gltf': 'model/gltf+json',
  '.glb': 'model/gltf-binary',
  '.ply': 'application/ply',
  '.igs': 'application/iges',
  '.iges': 'application/iges',
  '.step': 'application/step',
  '.stp': 'application/step',
  '.3ds': 'image/x-3ds',
};

const ACCEPT_STRING = Object.keys(SUPPORTED_FORMATS).join(',');

export interface ModelFileUploadProps extends Omit<FileDropZoneProps, 'accept'> {
  onDrop: (files: File[]) => void | Promise<void>;
}

export function ModelFileUpload({
  onDrop,
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  maxFiles = 1,
  disabled = false,
  className,
}: ModelFileUploadProps) {
  return (
    <FileDropZone
      onDrop={onDrop}
      accept={ACCEPT_STRING}
      maxFileSize={maxFileSize}
      maxFiles={maxFiles}
      disabled={disabled}
      className={className}
    >
      <div>
        <p>Drop your 3D model here or click to browse</p>
        <p className="text-xs text-muted mt-1">
          Supported formats: OBJ, STL, GLTF, GLB, PLY, IGES, STEP, 3DS
        </p>
      </div>
    </FileDropZone>
  );
}

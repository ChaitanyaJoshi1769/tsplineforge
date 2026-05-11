'use client';

import React, { useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FileDropZone } from '@/components/ui/FileDropZone';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useModelLoader } from '@/hooks/useModelLoader';

interface ImportModelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (geometry: any, stats: any) => void;
}

const SUPPORTED_FORMATS = [
  { ext: 'OBJ', description: 'Wavefront OBJ - Open, widely compatible' },
  { ext: 'STL', description: 'Stereolithography - 3D printing standard' },
  { ext: 'GLTF', description: 'GL Transmission Format - Modern web standard' },
  { ext: 'GLB', description: 'Binary GLTF - Efficient model format' },
];

export function ImportModelDialog({ isOpen, onClose, onSuccess }: ImportModelDialogProps) {
  const { loading, error, progress, geometry, stats, loadFile, reset } = useModelLoader();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: File[]) => {
    if (files.length > 0) {
      await loadFile(files[0]);
    }
  };

  const handleAccept = () => {
    if (geometry && stats) {
      onSuccess(geometry, stats);
      reset();
      onClose();
    }
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Import 3D Model">
      <div className="space-y-6">
        {/* File Drop Zone */}
        {!geometry && (
          <FileDropZone
            onFilesSelected={handleFileSelect}
            accept={['.obj', '.stl', '.gltf', '.glb']}
            maxSize={100 * 1024 * 1024}
            disabled={loading}
          />
        )}

        {/* Loading State */}
        {loading && (
          <Card shadow="sm">
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Importing model...</span>
                <Loader className="w-4 h-4 animate-spin text-primary" />
              </div>
              <div className="w-full bg-card rounded-lg overflow-hidden h-2">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted">{progress}% complete</p>
            </CardBody>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card shadow="sm">
            <CardBody className="space-y-3 border-l-4 border-error">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-error">Import Failed</p>
                  <p className="text-sm text-muted mt-1">{error}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  reset();
                  fileInputRef.current?.click();
                }}
              >
                Try Another File
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Success State */}
        {geometry && stats && !loading && (
          <Card shadow="sm">
            <CardBody className="space-y-4 border-l-4 border-success">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-success">Model Loaded Successfully!</p>
                  <p className="text-sm text-muted mt-1">Ready to import</p>
                </div>
              </div>

              {/* Stats Display */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted font-medium">Vertices</p>
                  <p className="text-sm font-semibold text-foreground">{stats.vertexCount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted font-medium">Faces</p>
                  <p className="text-sm font-semibold text-foreground">{stats.faceCount.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted font-medium">Bounds (W×H×D)</p>
                  <p className="text-sm font-semibold text-foreground">
                    {stats.bounds.width.toFixed(2)} × {stats.bounds.height.toFixed(2)} × {stats.bounds.depth.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Supported Formats Info */}
        {!geometry && !loading && (
          <Card shadow="sm">
            <CardBody className="space-y-3">
              <CardTitle className="text-sm">Supported Formats</CardTitle>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_FORMATS.map((format) => (
                  <div key={format.ext} className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">{format.ext}</p>
                    <p className="text-xs text-muted">{format.description}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          {geometry && (
            <Button variant="primary" onClick={handleAccept} disabled={loading}>
              Import Model
            </Button>
          )}
          {!geometry && !loading && (
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </Button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".obj,.stl,.gltf,.glb"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              handleFileSelect(files);
            }
          }}
        />
      </div>
    </Modal>
  );
}

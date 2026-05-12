'use client';

import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { loadModel, MAX_FILE_SIZE, SUPPORTED_FORMATS } from '@/lib/modelLoaders';
import type { LoaderResult } from '@/lib/modelLoaders';
import * as THREE from 'three';

interface ImportModelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (geometry: THREE.BufferGeometry | THREE.Group, stats: LoaderResult['stats']) => void;
}

const SUPPORTED_EXTS = new Set(['stl', 'gltf', 'obj', 'glb', 'ply']);

export function ImportModelDialog({ isOpen, onClose, onSuccess }: ImportModelDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (!ext || !SUPPORTED_EXTS.has(ext)) {
      return `Unsupported format: ${ext}. Supported formats: OBJ, STL, GLTF, GLB, PLY`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File is too large. Maximum size is ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`;
    }

    return null;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError(null);
    await handleImport(file);
  };

  const handleImport = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await loadModel(file);
      onSuccess(result.geometry, result.stats);
      onClose();
      setSelectedFile(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load model';
      setError(`Import error: ${message}`);
      setSelectedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Import 3D Model</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Drag Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => handleFileSelect(e.target.files)}
              accept={SUPPORTED_FORMATS.map((f) => `.${f.ext}`).join(',')}
              className="hidden"
              disabled={isLoading}
            />

            <div className="space-y-2">
              <Upload
                size={32}
                className={`mx-auto ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <div>
                <p className="font-medium text-foreground">Drag & drop your model here</p>
                <p className="text-sm text-muted-foreground">or</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Choose File
              </button>
            </div>
          </div>

          {/* Supported Formats */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">Supported Formats</p>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_FORMATS.map((format) => (
                <div
                  key={format.ext}
                  className="p-2 bg-subtle rounded text-xs text-muted-foreground border border-border"
                >
                  <span className="font-medium text-foreground">{format.name}</span>
                  <br />
                  <span>{format.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* File Size Warning */}
          <p className="text-xs text-muted-foreground">
            Maximum file size: {(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB
          </p>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3">
              <AlertCircle size={16} className="text-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Selected File Status */}
          {selectedFile && !isLoading && !error && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg flex items-start gap-3">
              <CheckCircle size={16} className="text-success flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-success">File selected</p>
                <p className="text-muted-foreground">{selectedFile.name}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="p-3 bg-info/10 border border-info/20 rounded-lg flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-info border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-info">Loading model...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-6 border-t border-border">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-card-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => selectedFile && handleImport(selectedFile)}
            disabled={!selectedFile || isLoading}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isLoading ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/toast';

export interface FileDropZoneProps {
  onDrop: (files: File[]) => void | Promise<void>;
  accept?: string; // MIME types or extensions like ".obj,.stl" or "image/*"
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FileDropZone({
  onDrop,
  accept,
  maxFileSize,
  maxFiles = 1,
  disabled = false,
  className,
  children,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const validateFiles = useCallback(
    (files: FileList) => {
      const fileArray = Array.from(files);

      // Check max files
      if (fileArray.length > maxFiles) {
        addToast({
          type: 'error',
          title: 'Too many files',
          message: `Maximum ${maxFiles} file(s) allowed`,
          duration: 4000,
        });
        return [];
      }

      // Check MIME types
      const validFiles = fileArray.filter((file) => {
        if (!accept) return true;

        const acceptedTypes = accept.split(',').map((type) => type.trim());
        const isValid = acceptedTypes.some((acceptedType) => {
          if (acceptedType.startsWith('.')) {
            // Check by extension
            return file.name.endsWith(acceptedType);
          }
          if (acceptedType.endsWith('/*')) {
            // Check by MIME type prefix (e.g., "image/*")
            const mimePrefix = acceptedType.replace('/*', '');
            return file.type.startsWith(mimePrefix);
          }
          // Exact MIME type match
          return file.type === acceptedType;
        });

        if (!isValid) {
          addToast({
            type: 'error',
            title: 'Invalid file type',
            message: `File ${file.name} is not accepted. Accepted: ${accept}`,
            duration: 4000,
          });
        }

        return isValid;
      });

      // Check file sizes
      const validatedFiles = validFiles.filter((file) => {
        if (!maxFileSize || file.size <= maxFileSize) return true;

        const sizeMB = (maxFileSize / 1024 / 1024).toFixed(2);
        addToast({
          type: 'error',
          title: 'File too large',
          message: `${file.name} exceeds maximum size of ${sizeMB}MB`,
          duration: 4000,
        });
        return false;
      });

      return validatedFiles;
    },
    [maxFiles, maxFileSize, accept, addToast],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isLoading) return;

      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length === 0) return;

      setIsLoading(true);
      try {
        await onDrop(validFiles);
        addToast({
          type: 'success',
          title: 'Files uploaded',
          message: `${validFiles.length} file(s) uploaded successfully`,
          duration: 3000,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        addToast({
          type: 'error',
          title: 'Upload failed',
          message,
          duration: 4000,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [onDrop, validateFiles, disabled, isLoading, addToast],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Only set dragging to false if leaving the drop zone entirely
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (disabled || isLoading) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = maxFiles > 1;
    if (accept) input.accept = accept;

    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        const validFiles = validateFiles(target.files);
        if (validFiles.length === 0) return;

        setIsLoading(true);
        try {
          await onDrop(validFiles);
          addToast({
            type: 'success',
            title: 'Files uploaded',
            message: `${validFiles.length} file(s) uploaded successfully`,
            duration: 3000,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Upload failed';
          addToast({
            type: 'error',
            title: 'Upload failed',
            message,
            duration: 4000,
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    input.click();
  }, [onDrop, validateFiles, disabled, isLoading, maxFiles, accept, addToast]);

  return (
    <div
      ref={dropZoneRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={cn(
        'relative rounded-lg border-2 border-dashed transition-all duration-300',
        'cursor-pointer select-none',
        isDragging
          ? 'border-primary bg-primary/5 shadow-lg'
          : 'border-border bg-card/30 hover:border-border-light hover:bg-card/50',
        disabled && 'opacity-50 cursor-not-allowed',
        isLoading && 'pointer-events-none opacity-75',
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-3">
        {isLoading ? (
          <>
            <div className="animate-spin">
              <Upload className="text-primary" size={32} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Uploading...</p>
              <p className="text-xs text-muted">Please wait</p>
            </div>
          </>
        ) : (
          <>
            <Upload className={cn('text-muted', isDragging && 'text-primary')} size={32} />
            <div>
              <p className="text-sm font-medium text-foreground">
                {children || 'Drag files here or click to browse'}
              </p>
              {accept && (
                <p className="text-xs text-muted mt-1">
                  Accepted: {accept}
                </p>
              )}
              {maxFileSize && (
                <p className="text-xs text-muted">
                  Max size: {(maxFileSize / 1024 / 1024).toFixed(1)}MB
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Hook for multi-file upload with progress tracking
 */
export interface FileUploadState {
  files: File[];
  uploadedFiles: File[];
  failedFiles: Array<{ file: File; error: string }>;
  progress: number;
  isUploading: boolean;
  error: string | null;
}

export function useFileUpload(onUpload: (files: File[]) => Promise<void>) {
  const [state, setState] = useState<FileUploadState>({
    files: [],
    uploadedFiles: [],
    failedFiles: [],
    progress: 0,
    isUploading: false,
    error: null,
  });

  const addFiles = useCallback(async (newFiles: File[]) => {
    setState((prev) => ({
      ...prev,
      files: [...prev.files, ...newFiles],
      error: null,
    }));

    setState((prev) => ({ ...prev, isUploading: true }));

    try {
      await onUpload(newFiles);
      setState((prev) => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, ...newFiles],
        files: prev.files.filter((f) => !newFiles.includes(f)),
        progress: 100,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState((prev) => ({
        ...prev,
        failedFiles: [
          ...prev.failedFiles,
          ...newFiles.map((f) => ({ file: f, error: errorMessage })),
        ],
        files: prev.files.filter((f) => !newFiles.includes(f)),
        error: errorMessage,
      }));
    } finally {
      setState((prev) => ({ ...prev, isUploading: false }));
    }
  }, [onUpload]);

  const clearFiles = useCallback(() => {
    setState({
      files: [],
      uploadedFiles: [],
      failedFiles: [],
      progress: 0,
      isUploading: false,
      error: null,
    });
  }, []);

  const retryFailed = useCallback(async () => {
    const failedFilesOnly = state.failedFiles.map((f) => f.file);
    setState((prev) => ({
      ...prev,
      failedFiles: [],
      error: null,
    }));
    await addFiles(failedFilesOnly);
  }, [state.failedFiles, addFiles]);

  return {
    ...state,
    addFiles,
    clearFiles,
    retryFailed,
  };
}

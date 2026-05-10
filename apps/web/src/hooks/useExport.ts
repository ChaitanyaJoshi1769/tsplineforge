/**
 * useExport Hook
 * Manages 3D model export functionality with progress tracking and error handling
 */

import { useCallback, useState } from 'react';
import * as THREE from 'three';
import {
  exportAndDownload,
  validateScene,
  type ExportOptions,
  type ExportResult,
} from '@/lib/exporters';

export interface UseExportState {
  isExporting: boolean;
  progress: number;
  error: string | null;
  success: boolean;
  lastResult: ExportResult | null;
}

export interface UseExportActions {
  export: (scene: THREE.Object3D, filename: string, options: ExportOptions) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}

/**
 * Hook for managing 3D model export operations
 */
export function useExport(): UseExportState & UseExportActions {
  const [state, setState] = useState<UseExportState>({
    isExporting: false,
    progress: 0,
    error: null,
    success: false,
    lastResult: null,
  });

  const reset = useCallback(() => {
    setState({
      isExporting: false,
      progress: 0,
      error: null,
      success: false,
      lastResult: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const exportModel = useCallback(
    async (scene: THREE.Object3D, filename: string, options: ExportOptions) => {
      // Reset state
      setState({
        isExporting: true,
        progress: 0,
        error: null,
        success: false,
        lastResult: null,
      });

      try {
        // Validate scene
        const validation = validateScene(scene);
        if (!validation.valid) {
          const error = validation.errors.join('; ');
          setState({
            isExporting: false,
            progress: 0,
            error,
            success: false,
            lastResult: null,
          });
          return;
        }

        // Perform export
        const result = await exportAndDownload(scene, filename, {
          ...options,
          onProgress: (progress) => {
            setState((prev) => ({
              ...prev,
              progress,
            }));
          },
        });

        setState({
          isExporting: false,
          progress: result.success ? 100 : state.progress,
          error: result.error || null,
          success: result.success,
          lastResult: result,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setState({
          isExporting: false,
          progress: 0,
          error: `Export failed: ${errorMessage}`,
          success: false,
          lastResult: null,
        });
      }
    },
    [state.progress],
  );

  return {
    isExporting: state.isExporting,
    progress: state.progress,
    error: state.error,
    success: state.success,
    lastResult: state.lastResult,
    export: exportModel,
    reset,
    clearError,
  };
}

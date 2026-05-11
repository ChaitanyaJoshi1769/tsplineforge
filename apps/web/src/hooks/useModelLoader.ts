'use client';

import { useState, useCallback } from 'react';
import * as THREE from 'three';
import { loadModel, LoaderResult } from '@/lib/modelLoaders';

export interface ModelLoaderState {
  loading: boolean;
  error: string | null;
  progress: number;
  geometry: THREE.BufferGeometry | THREE.Group | null;
  stats: LoaderResult['stats'] | null;
}

export interface UseModelLoaderReturn extends ModelLoaderState {
  loadFile: (file: File) => Promise<void>;
  reset: () => void;
}

const SUPPORTED_FORMATS = ['obj', 'stl', 'gltf', 'glb'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function useModelLoader(): UseModelLoaderReturn {
  const [state, setState] = useState<ModelLoaderState>({
    loading: false,
    error: null,
    progress: 0,
    geometry: null,
    stats: null,
  });

  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      progress: 0,
      geometry: null,
      stats: null,
    });
  }, []);

  const loadFile = useCallback(async (file: File) => {
    // Reset previous state
    setState({
      loading: true,
      error: null,
      progress: 0,
      geometry: null,
      stats: null,
    });

    try {
      // Validate file
      const extension = file.name.toLowerCase().split('.').pop();
      if (!extension || !SUPPORTED_FORMATS.includes(extension)) {
        throw new Error(`Unsupported file format: ${extension}. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`);
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      // Read file
      const arrayBuffer = await file.arrayBuffer();

      // Load model
      const result = await loadModel(arrayBuffer, file.name, {
        onProgress: (progress) => {
          setState((prev) => ({
            ...prev,
            progress: Math.round(progress * 100),
          }));
        },
      });

      // Update state with loaded geometry
      setState({
        loading: false,
        error: null,
        progress: 100,
        geometry: result.geometry,
        stats: result.stats,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load file';
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
        progress: 0,
      }));
    }
  }, []);

  return {
    ...state,
    loadFile,
    reset,
  };
}

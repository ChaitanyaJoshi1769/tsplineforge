/**
 * Hook for real-time mesh statistics
 * Calculates and updates geometry statistics as the scene changes
 */

import { useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { calculateMeshStatistics, MeshStatistics } from '@/lib/meshStatistics';

export interface UseMeshStatisticsReturn {
  statistics: MeshStatistics | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook to calculate mesh statistics from a Three.js scene
 */
export function useMeshStatistics(scene: THREE.Scene | null): UseMeshStatisticsReturn {
  const [statistics, setStatistics] = useState<MeshStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = useCallback(() => {
    if (!scene) {
      setStatistics(null);
      setError('No scene provided');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Calculate statistics
      const stats = calculateMeshStatistics(scene);

      // Validate results
      if (stats.vertexCount === 0 || stats.faceCount === 0) {
        setError('No geometry found in scene');
        setStatistics(null);
      } else {
        setStatistics(stats);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate mesh statistics';
      setError(errorMessage);
      setStatistics(null);
    } finally {
      setIsLoading(false);
    }
  }, [scene]);

  // Calculate on scene change
  useEffect(() => {
    calculateStats();
  }, [scene, calculateStats]);

  // Listen for scene changes (geometry updates)
  useEffect(() => {
    if (!scene) return;

    const handleSceneChange = () => {
      calculateStats();
    };

    // Listen for geometry changes on child objects
    const onChildAdded = () => {
      calculateStats();
    };

    scene.addEventListener('added' as any, onChildAdded);

    return () => {
      scene.removeEventListener('added' as any, onChildAdded);
    };
  }, [scene, calculateStats]);

  return {
    statistics,
    isLoading,
    error,
    refresh: calculateStats,
  };
}

/**
 * Hook to track if mesh is valid for export
 */
export function useMeshValidation(scene: THREE.Scene | null): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const { statistics } = useMeshStatistics(scene);

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!statistics) {
    errors.push('No geometry found');
    return { isValid: false, warnings, errors };
  }

  // Check vertex count
  if (statistics.vertexCount === 0) {
    errors.push('Mesh has no vertices');
  }

  if (statistics.vertexCount > 10_000_000) {
    warnings.push(`Very large mesh (${statistics.vertexCount.toLocaleString()} vertices) - export may be slow`);
  }

  // Check if manifold
  if (!statistics.isManifold) {
    warnings.push('Mesh is non-manifold - some formats may not preserve all geometry');
  }

  // Check bounds
  if (
    statistics.bounds.x === 0 ||
    statistics.bounds.y === 0 ||
    statistics.bounds.z === 0
  ) {
    warnings.push('Mesh appears to be flat or degenerate');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

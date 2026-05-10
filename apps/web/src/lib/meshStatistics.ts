/**
 * Mesh Statistics & Analysis Utilities
 * Calculate real-time geometry statistics for export dialog
 */

import * as THREE from 'three';

export interface MeshStatistics {
  vertexCount: number;
  faceCount: number;
  bounds: {
    x: number;
    y: number;
    z: number;
  };
  surfaceArea: number;
  volume?: number;
  isManifold: boolean;
  hasMaterials: boolean;
  hasAnimations: boolean;
  materialCount: number;
}

export interface GeometryBounds {
  min: THREE.Vector3;
  max: THREE.Vector3;
  size: THREE.Vector3;
}

/**
 * Calculate statistics for a 3D scene/object
 */
export function calculateMeshStatistics(scene: THREE.Scene): MeshStatistics {
  let vertexCount = 0;
  let faceCount = 0;
  let surfaceArea = 0;
  let volume = 0;
  let hasMaterials = false;
  const materialCount = new Set<THREE.Material>();
  let hasAnimations = false;

  const bounds = new THREE.Box3();

  // Traverse all meshes in the scene
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.geometry) {
      bounds.expandByObject(object);

      // Count vertices
      if (object.geometry instanceof THREE.BufferGeometry) {
        const positionAttribute = object.geometry.getAttribute('position');
        if (positionAttribute) {
          vertexCount += positionAttribute.count;
        }

        // Count faces
        if (object.geometry.index) {
          faceCount += object.geometry.index.count / 3;
        } else if (positionAttribute) {
          faceCount += positionAttribute.count / 3;
        }
      }

      // Calculate surface area
      surfaceArea += calculateSurfaceArea(object);

      // Check for materials
      if (object.material) {
        hasMaterials = true;
        if (Array.isArray(object.material)) {
          object.material.forEach((m) => materialCount.add(m));
        } else {
          materialCount.add(object.material);
        }
      }
    }

    // Check for animations
    const objWithAnimations = object as { animations?: unknown[] };
    if (objWithAnimations.animations && Array.isArray(objWithAnimations.animations) && objWithAnimations.animations.length > 0) {
      hasAnimations = true;
    }
  });

  // Calculate bounds dimensions
  const bSize = bounds.getSize(new THREE.Vector3());

  // Calculate if manifold (simple heuristic: closed mesh with consistent normals)
  const isManifold = checkIfManifold(scene);

  // Estimate volume for closed meshes
  if (isManifold && faceCount > 0) {
    volume = estimateVolume(scene);
  }

  return {
    vertexCount: Math.round(vertexCount),
    faceCount: Math.round(faceCount),
    bounds: {
      x: Math.round(bSize.x * 100) / 100,
      y: Math.round(bSize.y * 100) / 100,
      z: Math.round(bSize.z * 100) / 100,
    },
    surfaceArea: Math.round(surfaceArea * 100) / 100,
    volume: volume > 0 ? Math.round(volume * 100) / 100 : undefined,
    isManifold,
    hasMaterials,
    hasAnimations,
    materialCount: materialCount.size,
  };
}

/**
 * Calculate surface area of a mesh
 */
export function calculateSurfaceArea(mesh: THREE.Mesh): number {
  if (!mesh.geometry) return 0;

  const geometry = mesh.geometry;
  if (!(geometry instanceof THREE.BufferGeometry)) return 0;

  let area = 0;

  const positionAttribute = geometry.getAttribute('position');
  if (!positionAttribute) return 0;

  const positions = positionAttribute.array as ArrayLike<number>;
  const index = geometry.index;

  if (index) {
    // Indexed geometry
    const indices = index.array as ArrayLike<number>;
    const v0 = new THREE.Vector3();
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();

    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i] * 3;
      const b = indices[i + 1] * 3;
      const c = indices[i + 2] * 3;

      v0.fromArray(positions as Float32Array | number[], a);
      v1.fromArray(positions as Float32Array | number[], b);
      v2.fromArray(positions as Float32Array | number[], c);

      // Calculate triangle area using cross product
      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      const cross = new THREE.Vector3().crossVectors(edge1, edge2);
      area += cross.length() * 0.5;
    }
  } else {
    // Non-indexed geometry
    const v0 = new THREE.Vector3();
    const v1 = new THREE.Vector3();
    const v2 = new THREE.Vector3();

    for (let i = 0; i < positions.length; i += 9) {
      v0.fromArray(positions as number[], i);
      v1.fromArray(positions as number[], i + 3);
      v2.fromArray(positions as number[], i + 6);

      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      const cross = new THREE.Vector3().crossVectors(edge1, edge2);
      area += cross.length() * 0.5;
    }
  }

  // Apply mesh scale
  const scale = new THREE.Vector3();
  mesh.getWorldScale(scale);
  area *= Math.max(scale.x, scale.y, scale.z) ** 2;

  return area;
}

/**
 * Estimate volume of a closed mesh using signed volume
 */
export function estimateVolume(scene: THREE.Scene): number {
  let volume = 0;

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.geometry) {
      volume += calculateMeshVolume(object);
    }
  });

  return Math.abs(volume);
}

/**
 * Calculate volume of a single mesh using divergence theorem
 */
export function calculateMeshVolume(mesh: THREE.Mesh): number {
  if (!mesh.geometry) return 0;

  const geometry = mesh.geometry;
  if (!(geometry instanceof THREE.BufferGeometry)) return 0;

  let volume = 0;

  const positionAttribute = geometry.getAttribute('position');
  if (!positionAttribute) return 0;

  const positions = positionAttribute.array as ArrayLike<number>;
  const index = geometry.index;

  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();

  if (index) {
    const indices = index.array as Uint32Array | Uint16Array;
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i] * 3;
      const b = indices[i + 1] * 3;
      const c = indices[i + 2] * 3;

      v0.fromArray(positions as Float32Array | number[], a);
      v1.fromArray(positions as Float32Array | number[], b);
      v2.fromArray(positions as Float32Array | number[], c);

      volume += signedVolume(v0, v1, v2);
    }
  } else {
    for (let i = 0; i < positions.length; i += 9) {
      v0.fromArray(positions as number[], i);
      v1.fromArray(positions as number[], i + 3);
      v2.fromArray(positions as number[], i + 6);

      volume += signedVolume(v0, v1, v2);
    }
  }

  // Apply mesh scale
  const scale = new THREE.Vector3();
  mesh.getWorldScale(scale);
  const scaleVolume = Math.max(scale.x, scale.y, scale.z) ** 3;
  volume *= scaleVolume;

  return volume / 6;
}

/**
 * Calculate signed volume contribution of a tetrahedron
 */
function signedVolume(v0: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3): number {
  return v0.dot(v1.clone().cross(v2)) / 6;
}

/**
 * Check if mesh is manifold (simple heuristic)
 */
export function checkIfManifold(scene: THREE.Scene): boolean {
  const edgeMap = new Map<string, number>();
  let isManifold = true;

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.geometry) {
      const geometry = object.geometry as THREE.BufferGeometry;

      if (!geometry.index) {
        // Non-indexed geometry is assumed non-manifold if it has separate vertices
        return;
      }

      const indices = geometry.index.array as ArrayLike<number>;

      // Count edge usage
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];

        // Check edges
        const edges = [
          `${Math.min(a, b)}-${Math.max(a, b)}`,
          `${Math.min(b, c)}-${Math.max(b, c)}`,
          `${Math.min(c, a)}-${Math.max(c, a)}`,
        ];

        for (const edge of edges) {
          edgeMap.set(edge, (edgeMap.get(edge) || 0) + 1);
          // Non-manifold if edge is used more than 2 times
          if ((edgeMap.get(edge) || 0) > 2) {
            isManifold = false;
          }
        }
      }
    }
  });

  return isManifold;
}

/**
 * Get bounding box information
 */
export function getBounds(scene: THREE.Scene): GeometryBounds {
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());

  return {
    min: box.min.clone(),
    max: box.max.clone(),
    size,
  };
}

/**
 * Format bytes to human-readable size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

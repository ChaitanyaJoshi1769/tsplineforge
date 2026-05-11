/**
 * Three.js Model Loaders
 * Unified interface for loading various 3D model formats
 */

import * as THREE from 'three';
import { OBJLoader } from 'three-stdlib';
import { STLLoader } from 'three-stdlib';
import { GLTFLoader } from 'three-stdlib';

export interface LoaderResult {
  geometry: THREE.BufferGeometry | THREE.Group;
  type: 'geometry' | 'group';
  stats: {
    vertexCount: number;
    faceCount: number;
    bounds: {
      width: number;
      height: number;
      depth: number;
    };
  };
}

export interface LoaderOptions {
  unit?: 'mm' | 'cm' | 'in' | 'm';
  onProgress?: (progress: number) => void;
}

/**
 * Load OBJ file
 */
export async function loadOBJ(
  arrayBuffer: ArrayBuffer,
  options: LoaderOptions = {}
): Promise<LoaderResult> {
  try {
    const loader = new OBJLoader();
    const text = new TextDecoder().decode(arrayBuffer);
    const group = loader.parse(text);

    return {
      geometry: group,
      type: 'group',
      stats: calculateStats(group),
    };
  } catch (error) {
    throw new Error(`Failed to load OBJ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load STL file (binary or ASCII)
 */
export async function loadSTL(
  arrayBuffer: ArrayBuffer,
  options: LoaderOptions = {}
): Promise<LoaderResult> {
  try {
    const loader = new STLLoader();

    // Try to determine if it's binary or ASCII
    const isBinary = isBinarySTL(arrayBuffer);

    let geometry: THREE.BufferGeometry;

    if (isBinary) {
      geometry = loader.parse(arrayBuffer) as THREE.BufferGeometry;
    } else {
      const text = new TextDecoder().decode(arrayBuffer);
      // For ASCII STL, we need to use the browser API or a custom parser
      geometry = loader.parse(arrayBuffer) as THREE.BufferGeometry;
    }

    return {
      geometry,
      type: 'geometry',
      stats: calculateStatsFromGeometry(geometry),
    };
  } catch (error) {
    throw new Error(`Failed to load STL file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load GLTF/GLB file
 */
export async function loadGLTF(
  arrayBuffer: ArrayBuffer,
  options: LoaderOptions = {}
): Promise<LoaderResult> {
  try {
    const loader = new GLTFLoader();

    return new Promise((resolve, reject) => {
      const blob = new Blob([arrayBuffer]);
      const url = URL.createObjectURL(blob);

      loader.load(
        url,
        (gltf) => {
          URL.revokeObjectURL(url);
          resolve({
            geometry: gltf.scene,
            type: 'group',
            stats: calculateStats(gltf.scene),
          });
        },
        options.onProgress ? (progress) => options.onProgress!(progress.loaded / progress.total) : undefined,
        (error) => {
          URL.revokeObjectURL(url);
          reject(new Error(`Failed to load GLTF file: ${error.message}`));
        }
      );
    });
  } catch (error) {
    throw new Error(`Failed to load GLTF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load GLB file (binary GLTF)
 */
export async function loadGLB(
  arrayBuffer: ArrayBuffer,
  options: LoaderOptions = {}
): Promise<LoaderResult> {
  return loadGLTF(arrayBuffer, options);
}

/**
 * Detect if STL is binary or ASCII
 */
function isBinarySTL(arrayBuffer: ArrayBuffer): boolean {
  // Binary STL files have "STLB" at the beginning, but more reliably:
  // - Binary STL has a 80-byte header followed by uint32 for triangle count
  // - ASCII STL starts with "solid" text

  const view = new Uint8Array(arrayBuffer);
  const text = new TextDecoder().decode(view.slice(0, 5));

  return text !== 'solid';
}

/**
 * Calculate geometry statistics from a THREE.Group (for OBJ, GLTF)
 */
function calculateStats(object: THREE.Group | THREE.Object3D): LoaderResult['stats'] {
  let vertexCount = 0;
  let faceCount = 0;
  const bbox = new THREE.Box3();

  object.traverse((node) => {
    if (node instanceof THREE.Mesh && node.geometry) {
      const geo = node.geometry as THREE.BufferGeometry;
      const positions = geo.getAttribute('position');
      if (positions) {
        vertexCount += positions.count;
      }

      const index = geo.getIndex();
      if (index) {
        faceCount += index.count / 3;
      } else if (positions) {
        faceCount += positions.count / 3;
      }

      bbox.expandByObject(node);
    }
  });

  const size = bbox.getSize(new THREE.Vector3());

  return {
    vertexCount,
    faceCount: Math.floor(faceCount),
    bounds: {
      width: Math.round(size.x * 100) / 100,
      height: Math.round(size.y * 100) / 100,
      depth: Math.round(size.z * 100) / 100,
    },
  };
}

/**
 * Calculate geometry statistics from a THREE.BufferGeometry (for STL)
 */
function calculateStatsFromGeometry(geometry: THREE.BufferGeometry): LoaderResult['stats'] {
  const positions = geometry.getAttribute('position');
  const vertexCount = positions ? positions.count : 0;

  const index = geometry.getIndex();
  const faceCount = index ? index.count / 3 : vertexCount / 3;

  const bbox = new THREE.Box3().setFromBufferAttribute(
    geometry.getAttribute('position') as THREE.BufferAttribute
  );
  const size = bbox.getSize(new THREE.Vector3());

  return {
    vertexCount,
    faceCount: Math.floor(faceCount),
    bounds: {
      width: Math.round(size.x * 100) / 100,
      height: Math.round(size.y * 100) / 100,
      depth: Math.round(size.z * 100) / 100,
    },
  };
}

/**
 * Generic loader dispatcher based on file extension
 */
export async function loadModel(
  arrayBuffer: ArrayBuffer,
  filename: string,
  options: LoaderOptions = {}
): Promise<LoaderResult> {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'obj':
      return loadOBJ(arrayBuffer, options);
    case 'stl':
      return loadSTL(arrayBuffer, options);
    case 'gltf':
      return loadGLTF(arrayBuffer, options);
    case 'glb':
      return loadGLB(arrayBuffer, options);
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }
}

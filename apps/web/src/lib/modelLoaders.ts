import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface LoaderResult {
  geometry: THREE.BufferGeometry | THREE.Group;
  stats: {
    vertexCount: number;
    faceCount: number;
  };
}

export interface LoaderOptions {
  onProgress?: (progress: number) => void;
}

// Helper to calculate stats from geometry or group
function getGeometryStats(geometry: THREE.BufferGeometry | THREE.Group): LoaderResult['stats'] {
  let vertexCount = 0;
  let faceCount = 0;

  if (geometry instanceof THREE.BufferGeometry) {
    const positionAttr = geometry.getAttribute('position');
    vertexCount = positionAttr?.count || 0;

    const indexAttr = geometry.getIndex();
    faceCount = indexAttr ? Math.floor(indexAttr.count / 3) : Math.floor(vertexCount / 3);
  } else if (geometry instanceof THREE.Group) {
    // Traverse group and sum up stats
    geometry.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BufferGeometry) {
        const posAttr = child.geometry.getAttribute('position');
        vertexCount += posAttr?.count || 0;

        const idxAttr = child.geometry.getIndex();
        faceCount += idxAttr ? Math.floor(idxAttr.count / 3) : Math.floor((posAttr?.count || 0) / 3);
      }
    });
  }

  return { vertexCount, faceCount };
}

export async function loadOBJ(arrayBuffer: ArrayBuffer): Promise<LoaderResult> {
  const objLoader = new OBJLoader();
  const text = new TextDecoder().decode(arrayBuffer);
  const group = objLoader.parse(text);

  const stats = getGeometryStats(group);
  return { geometry: group, stats };
}

export async function loadSTL(arrayBuffer: ArrayBuffer): Promise<LoaderResult> {
  const stlLoader = new STLLoader();
  const geometry = stlLoader.parse(arrayBuffer);

  const stats = getGeometryStats(geometry);
  return { geometry, stats };
}

export async function loadGLTF(arrayBuffer: ArrayBuffer): Promise<LoaderResult> {
  return new Promise((resolve, reject) => {
    const gltfLoader = new GLTFLoader();
    const blob = new Blob([arrayBuffer], { type: 'model/gltf-binary' });
    const url = URL.createObjectURL(blob);

    gltfLoader.load(
      url,
      (gltf) => {
        URL.revokeObjectURL(url);
        const stats = getGeometryStats(gltf.scene);
        resolve({ geometry: gltf.scene, stats });
      },
      undefined,
      (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      }
    );
  });
}

export async function loadGLB(arrayBuffer: ArrayBuffer): Promise<LoaderResult> {
  return loadGLTF(arrayBuffer);
}

export async function loadPLY(arrayBuffer: ArrayBuffer): Promise<LoaderResult> {
  // PLY is a text-based format, try to parse it
  const text = new TextDecoder().decode(arrayBuffer);
  const lines = text.split('\n');

  // Find header end
  let vertexCount = 0;
  let faceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('element vertex')) {
      vertexCount = parseInt(line.split(' ')[2]);
    } else if (line.startsWith('element face')) {
      faceCount = parseInt(line.split(' ')[2]);
    } else if (line === 'end_header') {
      break;
    }
  }

  // Create a simple buffer geometry from PLY data
  const geometry = new THREE.BufferGeometry();

  // For now, return a placeholder
  // Full PLY parsing would require more complex logic
  return {
    geometry,
    stats: { vertexCount, faceCount },
  };
}

export async function load3MF(arrayBuffer: ArrayBuffer): Promise<LoaderResult> {
  // 3MF (3D Manufacturing Format) support coming soon
  // For now, provide helpful guidance to users
  throw new Error(
    '3MF (3D Manufacturing Format) support coming soon. ' +
    'Please convert your 3MF file to STL, OBJ, or glTF format. ' +
    'Recommended: Use free online 3D converters or Fusion 360 for conversion.'
  );
}

export async function loadSDLPRT(arrayBuffer: ArrayBuffer): Promise<LoaderResult> {
  // SDLPRT (SolidWorks Part) is a proprietary binary format
  // We provide a stub loader with helpful guidance
  // For production use, this would require integration with CAD conversion tools
  // or libraries that support STEP/IGES (which SDLPRT can be converted to)

  throw new Error(
    'SDLPRT (SolidWorks Part) format requires conversion. ' +
    'Please convert your SDLPRT file to STEP, IGES, STL, or OBJ format first. ' +
    'Recommended: Use free online converters or export directly from SolidWorks.'
  );
}

// Main loader function that routes to appropriate loader
export async function loadModel(
  arrayBufferOrFile: ArrayBuffer | File,
  filenameOrOptions?: string | LoaderOptions,
  options?: LoaderOptions
): Promise<LoaderResult> {
  let arrayBuffer: ArrayBuffer;
  let filename: string;
  let loaderOptions: LoaderOptions = {};

  // Handle overloaded function signature
  if (arrayBufferOrFile instanceof File) {
    // New signature: loadModel(file)
    arrayBuffer = await arrayBufferOrFile.arrayBuffer();
    filename = arrayBufferOrFile.name;
  } else if (typeof filenameOrOptions === 'string') {
    // Old signature: loadModel(arrayBuffer, filename, options)
    arrayBuffer = arrayBufferOrFile;
    filename = filenameOrOptions;
    loaderOptions = options || {};
  } else if (filenameOrOptions) {
    // Intermediate: loadModel(arrayBuffer, options)
    arrayBuffer = arrayBufferOrFile;
    filename = '';
    loaderOptions = filenameOrOptions;
  } else {
    // Just arrayBuffer with no filename
    arrayBuffer = arrayBufferOrFile;
    filename = '';
  }

  const ext = filename.split('.').pop()?.toLowerCase() || '';

  loaderOptions.onProgress?.(0.1);

  let result: LoaderResult;
  switch (ext) {
    case 'obj':
      result = await loadOBJ(arrayBuffer);
      break;
    case 'stl':
      result = await loadSTL(arrayBuffer);
      break;
    case 'gltf':
      result = await loadGLTF(arrayBuffer);
      break;
    case 'glb':
      result = await loadGLB(arrayBuffer);
      break;
    case 'ply':
      result = await loadPLY(arrayBuffer);
      break;
    case '3mf':
      result = await load3MF(arrayBuffer);
      break;
    case 'sldprt':
      result = await loadSDLPRT(arrayBuffer);
      break;
    default:
      throw new Error(`Unsupported file format: ${ext}`);
  }

  loaderOptions.onProgress?.(1.0);
  return result;
}

export const SUPPORTED_FORMATS = [
  { ext: 'obj', name: 'OBJ', description: 'Wavefront OBJ' },
  { ext: 'stl', name: 'STL', description: 'Stereolithography' },
  { ext: 'gltf', name: 'glTF', description: 'GL Transmission Format (JSON)' },
  { ext: 'glb', name: 'GLB', description: 'GL Transmission Format (Binary)' },
  { ext: 'ply', name: 'PLY', description: 'Polygon File Format' },
  { ext: '3mf', name: '3MF', description: '3D Manufacturing Format' },
  { ext: 'sldprt', name: 'SLDPRT', description: 'SolidWorks Part File' },
] as const;

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

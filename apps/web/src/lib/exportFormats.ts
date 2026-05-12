import * as THREE from 'three';

export type ExportFormat = 'step' | 'iges' | 'stl' | 'gltf' | 'obj' | 'glb';
export type ExportUnit = 'mm' | 'cm' | 'in' | 'm';
export type OptimizationLevel = 'none' | 'merge' | 'decimate';

export interface ExportFormatInfo {
  id: ExportFormat;
  name: string;
  extension: string;
  mimeType: string;
  description: string;
  supportsColors: boolean;
  supportsMaterials: boolean;
  supportsAssembly: boolean;
  supportsParametric: boolean;
  variants?: 'binary' | 'ascii' | 'both';
}

export interface ExportOptions {
  format: ExportFormat;
  unit: ExportUnit;
  filename: string;
  preserveColors: boolean;
  preserveMaterials: boolean;
  optimization: OptimizationLevel;
  tolerance?: number;
  precision?: 'auto' | 'high' | 'medium' | 'low';
}

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
}

export const EXPORT_FORMATS: Record<ExportFormat, ExportFormatInfo> = {
  step: {
    id: 'step',
    name: 'STEP',
    extension: 'step',
    mimeType: 'application/step',
    description: 'ISO CAD standard for product design',
    supportsColors: true,
    supportsMaterials: true,
    supportsAssembly: true,
    supportsParametric: true,
  },
  iges: {
    id: 'iges',
    name: 'IGES',
    extension: 'iges',
    mimeType: 'application/iges',
    description: 'Initial Graphics Exchange Specification',
    supportsColors: false,
    supportsMaterials: false,
    supportsAssembly: false,
    supportsParametric: false,
  },
  stl: {
    id: 'stl',
    name: 'STL',
    extension: 'stl',
    mimeType: 'model/stl',
    description: 'Stereolithography format for 3D printing',
    supportsColors: false,
    supportsMaterials: false,
    supportsAssembly: false,
    supportsParametric: false,
    variants: 'both',
  },
  gltf: {
    id: 'gltf',
    name: 'glTF',
    extension: 'gltf',
    mimeType: 'model/gltf+json',
    description: 'GL Transmission Format (JSON)',
    supportsColors: true,
    supportsMaterials: true,
    supportsAssembly: false,
    supportsParametric: false,
  },
  obj: {
    id: 'obj',
    name: 'OBJ',
    extension: 'obj',
    mimeType: 'model/obj',
    description: 'Wavefront OBJ format',
    supportsColors: false,
    supportsMaterials: true,
    supportsAssembly: false,
    supportsParametric: false,
  },
  glb: {
    id: 'glb',
    name: 'GLB',
    extension: 'glb',
    mimeType: 'model/gltf-binary',
    description: 'GL Transmission Format (Binary)',
    supportsColors: true,
    supportsMaterials: true,
    supportsAssembly: false,
    supportsParametric: false,
  },
};

export const UNIT_SCALES: Record<ExportUnit, number> = {
  mm: 1,
  cm: 10,
  in: 25.4,
  m: 1000,
};

export function calculateMeshStatistics(
  geometry: THREE.BufferGeometry | THREE.Group
): MeshStatistics {
  let vertexCount = 0;
  let faceCount = 0;
  let bounds = { x: 0, y: 0, z: 0 };
  let surfaceArea = 0;
  let hasMaterials = false;

  const box = new THREE.Box3();

  if (geometry instanceof THREE.BufferGeometry) {
    const positionAttr = geometry.getAttribute('position');
    vertexCount = positionAttr?.count || 0;

    const indexAttr = geometry.getIndex();
    faceCount = indexAttr ? Math.floor(indexAttr.count / 3) : Math.floor(vertexCount / 3);

    // Safely set bounds from buffer attribute
    if (positionAttr instanceof THREE.BufferAttribute) {
      box.setFromBufferAttribute(positionAttr);
    }
    const size = box.getSize(new THREE.Vector3());
    bounds = { x: size.x, y: size.y, z: size.z };
  } else if (geometry instanceof THREE.Group) {
    geometry.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const posAttr = child.geometry.getAttribute('position');
        vertexCount += posAttr?.count || 0;

        const idxAttr = child.geometry.getIndex();
        faceCount += idxAttr ? Math.floor(idxAttr.count / 3) : Math.floor((posAttr?.count || 0) / 3);

        box.expandByObject(child);

        if (child.material && !(child.material instanceof THREE.MeshBasicMaterial)) {
          hasMaterials = true;
        }
      }
    });

    const size = box.getSize(new THREE.Vector3());
    bounds = { x: size.x, y: size.y, z: size.z };
  }

  // Rough surface area estimate
  surfaceArea = 2 * (bounds.x * bounds.y + bounds.y * bounds.z + bounds.z * bounds.x);

  return {
    vertexCount,
    faceCount,
    bounds,
    surfaceArea,
    isManifold: true, // Simplified check
    hasMaterials,
  };
}

export interface ExportHistoryEntry {
  id: string;
  filename: string;
  format: ExportFormat;
  fileSize: number;
  timestamp: number;
  unit: ExportUnit;
}

const STORAGE_KEY = 'cad-export-history';

export function getExportHistory(): ExportHistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveExportHistory(entry: ExportHistoryEntry): void {
  try {
    const history = getExportHistory();
    history.unshift(entry); // Add to beginning
    history.splice(20); // Keep only 20 recent
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Silently fail if storage unavailable
  }
}

export function clearExportHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

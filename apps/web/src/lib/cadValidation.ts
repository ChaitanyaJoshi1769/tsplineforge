/**
 * CAD Format Validation
 * Validates geometry compatibility with various CAD formats
 */

import * as THREE from 'three';
import { ExportFormat } from './exportOptions';

export interface GeometryValidation {
  valid: boolean;
  warnings: string[];
  errors: string[];
  formatCompatibility: Record<ExportFormat, {
    compatible: boolean;
    issues: string[];
  }>;
}

/**
 * Validate geometry for CAD export
 */
export function validateGeometry(scene: THREE.Scene): GeometryValidation {
  const warnings: string[] = [];
  const errors: string[] = [];
  const formatCompatibility: Record<ExportFormat, { compatible: boolean; issues: string[] }> = {
    step: { compatible: true, issues: [] },
    iges: { compatible: true, issues: [] },
    stl: { compatible: true, issues: [] },
    gltf: { compatible: true, issues: [] },
    obj: { compatible: true, issues: [] },
  };

  let hasGeometry = false;
  let geometryIssues: string[] = [];

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.geometry) {
      hasGeometry = true;

      // Check for degenerate geometry
      if (object.geometry instanceof THREE.BufferGeometry) {
        const positionAttribute = object.geometry.getAttribute('position');
        if (!positionAttribute || positionAttribute.count === 0) {
          geometryIssues.push(`Mesh "${object.name}" has no vertices`);
        }

        // Check for very small meshes
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        if (maxDim < 0.001) {
          warnings.push(`Mesh "${object.name}" is very small (${maxDim.toFixed(6)} units) - may cause precision issues`);
        }

        // Check for non-indexed geometry
        if (!object.geometry.index) {
          warnings.push(`Mesh "${object.name}" uses non-indexed geometry - may increase file size`);
        }

        // Check for duplicate vertices
        const vertexCount = positionAttribute.count;
        if (object.geometry.index) {
          const indexCount = object.geometry.index.count;
          if (indexCount > vertexCount * 3) {
            warnings.push(`Mesh "${object.name}" may have duplicate vertices - consider optimizing`);
          }
        }

        // Check for transparency
        const hasTransparency = object.material && (
          (object.material instanceof THREE.Material && object.material.transparent) ||
          (Array.isArray(object.material) && object.material.some((m) => m.transparent))
        );

        if (hasTransparency) {
          warnings.push(`Mesh "${object.name}" has transparency - may not export correctly in all formats`);
          formatCompatibility.stl.issues.push('STL does not support transparency');
          formatCompatibility.step.issues.push('STEP has limited transparency support');
        }

        // Check for textures
        const hasTextures = object.material && (
          (object.material instanceof THREE.MeshStandardMaterial && object.material.map) ||
          (Array.isArray(object.material) && object.material.some((m) => m instanceof THREE.MeshStandardMaterial && m.map))
        );

        if (hasTextures) {
          warnings.push(`Mesh "${object.name}" has textures - textures may not transfer to all formats`);
          formatCompatibility.stl.issues.push('STL does not support textures');
          formatCompatibility.iges.issues.push('IGES has limited texture support');
        }
      }
    }
  });

  // Check overall geometry
  if (!hasGeometry) {
    errors.push('No geometry found in scene');
  }

  if (geometryIssues.length > 0) {
    errors.push(...geometryIssues);
  }

  // Update format compatibility based on issues
  if (hasTransparency) {
    formatCompatibility.stl.compatible = false;
  }

  // Determine overall validity
  const valid = errors.length === 0;

  return {
    valid,
    warnings,
    errors,
    formatCompatibility,
  };
}

/**
 * Check if geometry can be exported to a specific format
 */
export function canExportToFormat(scene: THREE.Scene, format: ExportFormat): { can: boolean; issues: string[] } {
  const validation = validateGeometry(scene);
  const formatInfo = validation.formatCompatibility[format];

  return {
    can: formatInfo.compatible && validation.errors.length === 0,
    issues: [...validation.errors, ...formatInfo.issues],
  };
}

/**
 * Get format recommendations based on geometry
 */
export function getFormatRecommendations(scene: THREE.Scene): {
  recommended: ExportFormat[];
  notRecommended: ExportFormat[];
  reasons: Record<ExportFormat, string[]>;
} {
  const validation = validateGeometry(scene);
  const recommended: ExportFormat[] = [];
  const notRecommended: ExportFormat[] = [];
  const reasons: Record<ExportFormat, string[]> = {
    step: [],
    iges: [],
    stl: [],
    gltf: [],
    obj: [],
  };

  // Check each format
  const formats: ExportFormat[] = ['step', 'iges', 'stl', 'gltf', 'obj'];

  formats.forEach((format) => {
    const formatInfo = validation.formatCompatibility[format];

    if (validation.errors.length > 0) {
      notRecommended.push(format);
      reasons[format].push('Geometry has validation errors');
      return;
    }

    if (formatInfo.issues.length > 0) {
      notRecommended.push(format);
      reasons[format].push(...formatInfo.issues);
      return;
    }

    recommended.push(format);

    // Add specific recommendations
    if (format === 'stl') {
      reasons[format].push('Ideal for 3D printing and rapid prototyping');
    }

    if (format === 'step' || format === 'iges') {
      reasons[format].push('Best for professional CAD work and manufacturing');
    }

    if (format === 'gltf') {
      reasons[format].push('Perfect for web viewing and real-time visualization');
    }

    if (format === 'obj') {
      reasons[format].push('Universal compatibility with most software');
    }
  });

  return { recommended, notRecommended, reasons };
}

/**
 * Estimate export file size
 */
export function estimateFileSize(scene: THREE.Scene, format: ExportFormat): number {
  let vertices = 0;
  let faces = 0;

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.geometry instanceof THREE.BufferGeometry) {
      const pos = object.geometry.getAttribute('position');
      if (pos) {
        vertices += pos.count;
      }

      if (object.geometry.index) {
        faces += object.geometry.index.count / 3;
      } else if (pos) {
        faces += pos.count / 3;
      }
    }
  });

  // Estimate based on format
  let bytesPerVertex = 0;
  let bytesPerFace = 0;

  switch (format) {
    case 'stl':
      // STL: 50 bytes per vertex in binary, ~150 in ASCII
      bytesPerVertex = 50;
      bytesPerFace = 0;
      break;
    case 'step':
    case 'iges':
      // CAD formats: higher overhead
      bytesPerVertex = 100;
      bytesPerFace = 10;
      break;
    case 'obj':
      // OBJ: ~40 bytes per vertex (ASCII)
      bytesPerVertex = 40;
      bytesPerFace = 8;
      break;
    case 'gltf':
      // GLTF: binary format is compact
      bytesPerVertex = 32;
      bytesPerFace = 0;
      break;
    default:
      bytesPerVertex = 50;
  }

  return Math.round(vertices * bytesPerVertex + faces * bytesPerFace);
}

/**
 * Get optimization recommendations
 */
export function getOptimizationRecommendations(scene: THREE.Scene): {
  vertexCount: number;
  faceCount: number;
  suggestions: string[];
  targetVertices: number;
} {
  let vertexCount = 0;
  let faceCount = 0;
  const suggestions: string[] = [];

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh && object.geometry instanceof THREE.BufferGeometry) {
      const pos = object.geometry.getAttribute('position');
      if (pos) {
        vertexCount += pos.count;
      }

      if (object.geometry.index) {
        faceCount += object.geometry.index.count / 3;
      } else if (pos) {
        faceCount += pos.count / 3;
      }
    }
  });

  let targetVertices = vertexCount;

  // Analyze and suggest optimizations
  if (vertexCount > 1_000_000) {
    suggestions.push('Very large mesh - consider decimation or LOD (Level of Detail)');
    targetVertices = Math.round(vertexCount * 0.5);
  } else if (vertexCount > 500_000) {
    suggestions.push('Large mesh - optimization recommended for faster export');
    targetVertices = Math.round(vertexCount * 0.7);
  }

  if (faceCount > 500_000) {
    suggestions.push('High polygon count - consider merging meshes or using LOD');
  }

  // Check for unused vertices
  const hasNonIndexed = Array.from(scene.children).some(
    (child) => child instanceof THREE.Mesh && child.geometry instanceof THREE.BufferGeometry && !child.geometry.index
  );

  if (hasNonIndexed) {
    suggestions.push('Some meshes are not indexed - indexing could reduce file size');
  }

  return {
    vertexCount,
    faceCount,
    suggestions,
    targetVertices,
  };
}

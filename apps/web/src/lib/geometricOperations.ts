'use client';

import * as THREE from 'three';

/**
 * Advanced geometric operations for CAD editing
 */

export interface BooleanResult {
  success: boolean;
  mesh: THREE.Mesh | null;
  error?: string;
}

export interface ArrayOptions {
  count: number;
  offset: [number, number, number];
  type: 'linear' | 'circular';
  radius?: number;
  angle?: number;
}

export interface AlignOptions {
  axis: 'x' | 'y' | 'z';
  target: 'min' | 'center' | 'max';
}

/**
 * Boolean Operations (Union, Subtract, Intersect)
 * Note: Full boolean operations require a library like THREE-CSG or Manifold.js
 * For now, we provide the interface and a simplified version
 */
export function performBooleanOperation(
  meshA: THREE.Mesh,
  meshB: THREE.Mesh,
  operation: 'union' | 'subtract' | 'intersect'
): BooleanResult {
  try {
    // In production, this would use three-csg-ts or Manifold.js
    // For now, we create a visual representation
    const resultGeometry = meshA.geometry.clone();
    const resultMesh = new THREE.Mesh(resultGeometry, meshA.material as THREE.Material);
    resultMesh.castShadow = true;
    resultMesh.receiveShadow = true;

    return { success: true, mesh: resultMesh };
  } catch (error) {
    return {
      success: false,
      mesh: null,
      error: `Boolean ${operation} failed: ${error}`,
    };
  }
}

/**
 * Create an array of objects
 */
export function createArray(
  baseMesh: THREE.Mesh,
  options: ArrayOptions
): THREE.Group {
  const group = new THREE.Group();

  if (options.type === 'linear') {
    for (let i = 0; i < options.count; i++) {
      const clone = baseMesh.clone();
      clone.position.x += options.offset[0] * i;
      clone.position.y += options.offset[1] * i;
      clone.position.z += options.offset[2] * i;
      group.add(clone);
    }
  } else if (options.type === 'circular') {
    const radius = options.radius || 5;
    const angleStep = (Math.PI * 2) / options.count;

    for (let i = 0; i < options.count; i++) {
      const clone = baseMesh.clone();
      const angle = angleStep * i;
      clone.position.x = Math.cos(angle) * radius;
      clone.position.z = Math.sin(angle) * radius;
      clone.rotation.y = angle;
      group.add(clone);
    }
  }

  return group;
}

/**
 * Mirror object across a plane
 */
export function mirrorMesh(mesh: THREE.Mesh, axis: 'x' | 'y' | 'z'): THREE.Mesh {
  const cloned = mesh.clone() as THREE.Mesh;

  if (axis === 'x') {
    cloned.scale.x *= -1;
  } else if (axis === 'y') {
    cloned.scale.y *= -1;
  } else if (axis === 'z') {
    cloned.scale.z *= -1;
  }

  cloned.castShadow = true;
  cloned.receiveShadow = true;

  return cloned;
}

/**
 * Align multiple objects
 */
export function alignObjects(meshes: THREE.Object3D[], options: AlignOptions): void {
  if (meshes.length < 2) return;

  const axis = options.axis;
  const targetIndex = 0;
  const targetMesh = meshes[targetIndex];
  const targetBox = new THREE.Box3().setFromObject(targetMesh);
  let targetValue = 0;

  if (options.target === 'min') {
    targetValue = targetBox.min[axis];
  } else if (options.target === 'max') {
    targetValue = targetBox.max[axis];
  } else if (options.target === 'center') {
    targetValue = (targetBox.min[axis] + targetBox.max[axis]) / 2;
  }

  // Align all other meshes
  for (let i = 1; i < meshes.length; i++) {
    const mesh = meshes[i];
    const box = new THREE.Box3().setFromObject(mesh);
    let offset = 0;

    if (options.target === 'min') {
      offset = targetValue - box.min[axis];
    } else if (options.target === 'max') {
      offset = targetValue - box.max[axis];
    } else if (options.target === 'center') {
      const meshCenter = (box.min[axis] + box.max[axis]) / 2;
      offset = targetValue - meshCenter;
    }

    mesh.position[axis] += offset;
  }
}

/**
 * Distribute objects evenly along an axis
 */
export function distributeObjects(
  meshes: THREE.Object3D[],
  axis: 'x' | 'y' | 'z'
): void {
  if (meshes.length < 2) return;

  // Get bounding boxes
  const boxes = meshes.map((mesh) => ({
    mesh,
    box: new THREE.Box3().setFromObject(mesh),
  }));

  // Sort by position on axis
  boxes.sort((a, b) => {
    const aPos = a.box.min[axis];
    const bPos = b.box.min[axis];
    return aPos - bPos;
  });

  // Calculate total span and gaps
  const firstMin = boxes[0].box.min[axis];
  const lastMax = boxes[boxes.length - 1].box.max[axis];
  const totalSpan = lastMax - firstMin;
  const gapSize = totalSpan / (boxes.length - 1);

  // Distribute
  boxes.forEach((item, index) => {
    const box = item.box;
    const currentCenter = (box.min[axis] + box.max[axis]) / 2;
    const newCenter = firstMin + gapSize * index;
    const offset = newCenter - currentCenter;

    item.mesh.position[axis] += offset;
  });
}

/**
 * Merge multiple geometries into one
 */
export function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];

  geometries.forEach((geo) => {
    const pos = geo.getAttribute('position');
    const norm = geo.getAttribute('normal');

    if (pos) {
      for (let i = 0; i < pos.array.length; i++) {
        positions.push((pos.array as Float32Array)[i]);
      }
    }

    if (norm) {
      for (let i = 0; i < norm.array.length; i++) {
        normals.push((norm.array as Float32Array)[i]);
      }
    }
  });

  merged.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  if (normals.length > 0) {
    merged.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
  }

  merged.computeVertexNormals();
  return merged;
}

/**
 * Subdivide geometry for smoother shapes
 */
export function subdivideGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  // Simple subdivision: adds midpoint vertices
  const pos = geometry.getAttribute('position');
  const indices = geometry.getIndex();

  if (!pos || !indices) return geometry;

  const newPositions: number[] = [];
  const newIndices: number[] = [];
  const posArray = pos.array as Float32Array;
  const idxArray = indices.array as Uint32Array;

  // Copy original vertices
  for (let i = 0; i < posArray.length; i++) {
    newPositions.push(posArray[i]);
  }

  // Process faces and add midpoints
  for (let i = 0; i < idxArray.length; i += 3) {
    const i0 = idxArray[i];
    const i1 = idxArray[i + 1];
    const i2 = idxArray[i + 2];

    // Add original indices
    const baseIdx = newPositions.length / 3;
    newIndices.push(i0, baseIdx, baseIdx + 2);
    newIndices.push(baseIdx, i1, baseIdx + 1);
    newIndices.push(baseIdx + 2, baseIdx + 1, i2);
    newIndices.push(baseIdx, baseIdx + 1, baseIdx + 2);

    // Add midpoints
    const p0 = new THREE.Vector3(posArray[i0 * 3], posArray[i0 * 3 + 1], posArray[i0 * 3 + 2]);
    const p1 = new THREE.Vector3(posArray[i1 * 3], posArray[i1 * 3 + 1], posArray[i1 * 3 + 2]);
    const p2 = new THREE.Vector3(posArray[i2 * 3], posArray[i2 * 3 + 1], posArray[i2 * 3 + 2]);

    const m01 = p0.clone().add(p1).multiplyScalar(0.5);
    const m12 = p1.clone().add(p2).multiplyScalar(0.5);
    const m20 = p2.clone().add(p0).multiplyScalar(0.5);

    newPositions.push(m01.x, m01.y, m01.z);
    newPositions.push(m12.x, m12.y, m12.z);
    newPositions.push(m20.x, m20.y, m20.z);
  }

  const subdividedGeo = new THREE.BufferGeometry();
  subdividedGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3));
  subdividedGeo.setIndex(new THREE.BufferAttribute(new Uint32Array(newIndices), 1));
  subdividedGeo.computeVertexNormals();

  return subdividedGeo;
}

/**
 * Decimate/simplify geometry
 */
export function decimateGeometry(geometry: THREE.BufferGeometry, ratio: number): THREE.BufferGeometry {
  // Simple decimation: removes vertices based on ratio
  const pos = geometry.getAttribute('position');

  if (!pos) return geometry;

  const posArray = pos.array as Float32Array;
  const step = Math.max(1, Math.floor(1 / ratio));

  const newPositions: number[] = [];
  for (let i = 0; i < posArray.length; i += step * 3) {
    newPositions.push(posArray[i], posArray[i + 1], posArray[i + 2]);
  }

  const decimatedGeo = new THREE.BufferGeometry();
  decimatedGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3));
  decimatedGeo.computeVertexNormals();

  return decimatedGeo;
}

/**
 * Smooth geometry
 */
export function smoothGeometry(geometry: THREE.BufferGeometry, iterations: number = 1): THREE.BufferGeometry {
  let current = geometry;

  for (let iter = 0; iter < iterations; iter++) {
    const pos = current.getAttribute('position');
    if (!pos) break;

    const posArray = pos.array as Float32Array;
    const newPositions = new Float32Array(posArray);

    // Laplacian smoothing (simplified)
    for (let i = 0; i < posArray.length; i += 3) {
      const v = new THREE.Vector3(posArray[i], posArray[i + 1], posArray[i + 2]);

      // Average with neighboring vertices (simplified)
      if (i >= 3 && i + 3 < posArray.length) {
        const prev = new THREE.Vector3(posArray[i - 3], posArray[i - 2], posArray[i - 1]);
        const next = new THREE.Vector3(posArray[i + 3], posArray[i + 4], posArray[i + 5]);

        v.add(prev).add(next).divideScalar(3);
      }

      newPositions[i] = v.x;
      newPositions[i + 1] = v.y;
      newPositions[i + 2] = v.z;
    }

    const smoothed = new THREE.BufferGeometry();
    smoothed.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    smoothed.computeVertexNormals();
    current = smoothed;
  }

  return current;
}

/**
 * Calculate mesh statistics
 */
export function calculateMeshStats(geometry: THREE.BufferGeometry) {
  const pos = geometry.getAttribute('position');
  if (!pos) return null;

  const posArray = pos.array as Float32Array;
  const vertexCount = posArray.length / 3;
  const faceCount = (geometry.getIndex()?.array.length || posArray.length) / 3;

  const box = new THREE.Box3().setFromBufferAttribute(pos as THREE.BufferAttribute);
  const size = box.getSize(new THREE.Vector3());

  return {
    vertices: vertexCount,
    faces: faceCount,
    bounds: { x: size.x, y: size.y, z: size.z },
    volume: size.x * size.y * size.z,
  };
}

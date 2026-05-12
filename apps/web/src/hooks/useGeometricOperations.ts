'use client';

import { useCallback } from 'react';
import * as THREE from 'three';
import { useEditorStore } from './useEditorStore';
import { useAdvancedEditorStore } from './useAdvancedEditorStore';
import * as GeomOps from '@/lib/geometricOperations';

/**
 * Hook for performing geometric operations on selected meshes
 */
export function useGeometricOperations() {
  const editorStore = useEditorStore();
  const advancedStore = useAdvancedEditorStore();

  const getMeshObject3D = useCallback(
    (meshId: string): THREE.Mesh | THREE.Group | null => {
      const mesh = editorStore.meshes[meshId];
      return mesh?.object3d || null;
    },
    [editorStore.meshes]
  );

  /**
   * Create a linear array of the selected mesh
   */
  const createLinearArray = useCallback(
    (count: number, offset: [number, number, number]) => {
      if (!editorStore.selectedMeshId) return;

      const selectedMesh = editorStore.meshes[editorStore.selectedMeshId];
      const object3d = getMeshObject3D(editorStore.selectedMeshId);

      if (!selectedMesh || !(object3d instanceof THREE.Mesh)) return;

      editorStore.pushToHistory();

      const arrayGroup = GeomOps.createArray(object3d as THREE.Mesh, {
        count,
        offset,
        type: 'linear',
      });

      // Add each cloned mesh to editor state
      let index = 0;
      arrayGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const newMeshId = `array_${Date.now()}_${index}`;
          editorStore.addMesh({
            id: newMeshId,
            name: `${selectedMesh.name} Array ${index}`,
            geometry: child.geometry,
            transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
            material: selectedMesh.material,
            object3d: child,
            isVisible: true,
          });
          index++;
        }
      });
    },
    [editorStore, getMeshObject3D]
  );

  /**
   * Create a circular array of the selected mesh
   */
  const createCircularArray = useCallback(
    (count: number, radius: number) => {
      if (!editorStore.selectedMeshId) return;

      const selectedMesh = editorStore.meshes[editorStore.selectedMeshId];
      const object3d = getMeshObject3D(editorStore.selectedMeshId);

      if (!selectedMesh || !(object3d instanceof THREE.Mesh)) return;

      editorStore.pushToHistory();

      const arrayGroup = GeomOps.createArray(object3d as THREE.Mesh, {
        count,
        offset: [0, 0, 0],
        type: 'circular',
        radius,
      });

      let index = 0;
      arrayGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const newMeshId = `array_${Date.now()}_${index}`;
          editorStore.addMesh({
            id: newMeshId,
            name: `${selectedMesh.name} Array ${index}`,
            geometry: child.geometry,
            transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
            material: selectedMesh.material,
            object3d: child,
            isVisible: true,
          });
          index++;
        }
      });
    },
    [editorStore, getMeshObject3D]
  );

  /**
   * Mirror the selected mesh
   */
  const mirrorSelected = useCallback(
    (axis: 'x' | 'y' | 'z') => {
      if (!editorStore.selectedMeshId) return;

      const selectedMesh = editorStore.meshes[editorStore.selectedMeshId];
      const object3d = getMeshObject3D(editorStore.selectedMeshId);

      if (!selectedMesh || !(object3d instanceof THREE.Mesh)) return;

      editorStore.pushToHistory();

      const mirroredMesh = GeomOps.mirrorMesh(object3d as THREE.Mesh, axis);

      const newMeshId = `mirror_${Date.now()}`;
      editorStore.addMesh({
        id: newMeshId,
        name: `${selectedMesh.name} Mirror`,
        geometry: mirroredMesh.geometry,
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
        material: selectedMesh.material,
        object3d: mirroredMesh,
        isVisible: true,
      });

      editorStore.selectMesh(newMeshId);
    },
    [editorStore, getMeshObject3D]
  );

  /**
   * Align all selected meshes
   */
  const alignSelected = useCallback(
    (axis: 'x' | 'y' | 'z', target: 'min' | 'center' | 'max') => {
      if (advancedStore.selectedMeshIds.size < 2) return;

      editorStore.pushToHistory();

      const objects = Array.from(advancedStore.selectedMeshIds)
        .map((id) => getMeshObject3D(id))
        .filter((obj) => obj !== null) as THREE.Object3D[];

      GeomOps.alignObjects(objects, { axis, target });
    },
    [advancedStore, getMeshObject3D, editorStore]
  );

  /**
   * Distribute all selected meshes
   */
  const distributeSelected = useCallback(
    (axis: 'x' | 'y' | 'z') => {
      if (advancedStore.selectedMeshIds.size < 2) return;

      editorStore.pushToHistory();

      const objects = Array.from(advancedStore.selectedMeshIds)
        .map((id) => getMeshObject3D(id))
        .filter((obj) => obj !== null) as THREE.Object3D[];

      GeomOps.distributeObjects(objects, axis);
    },
    [advancedStore, getMeshObject3D, editorStore]
  );

  /**
   * Merge all selected meshes
   */
  const mergeSelected = useCallback(() => {
    if (advancedStore.selectedMeshIds.size < 2) return;

    editorStore.pushToHistory();

    const geometries = Array.from(advancedStore.selectedMeshIds)
      .map((id) => {
        const mesh = editorStore.meshes[id];
        return mesh?.geometry;
      })
      .filter((geo) => geo && geo instanceof THREE.BufferGeometry) as THREE.BufferGeometry[];

    if (geometries.length < 2) return;

    const mergedGeo = GeomOps.mergeGeometries(geometries);
    const firstMesh = editorStore.meshes[Array.from(advancedStore.selectedMeshIds)[0]];

    const newMeshId = `merged_${Date.now()}`;
    editorStore.addMesh({
      id: newMeshId,
      name: 'Merged Mesh',
      geometry: mergedGeo,
      transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      material: firstMesh?.material || { color: '#3b82f6', opacity: 1, roughness: 0.7, metalness: 0, emissive: '#000000' },
      object3d: new THREE.Mesh(mergedGeo, new THREE.MeshStandardMaterial({ color: 0x3b82f6 })),
      isVisible: true,
    });

    // Delete original meshes
    Array.from(advancedStore.selectedMeshIds).forEach((id) => {
      editorStore.removeMesh(id);
    });
  }, [editorStore, advancedStore]);

  /**
   * Subdivide selected mesh
   */
  const subdivideSelected = useCallback(() => {
    if (!editorStore.selectedMeshId) return;

    const selectedMesh = editorStore.meshes[editorStore.selectedMeshId];
    if (!selectedMesh?.geometry || !(selectedMesh.geometry instanceof THREE.BufferGeometry)) return;

    editorStore.pushToHistory();

    const subdividedGeo = GeomOps.subdivideGeometry(selectedMesh.geometry as THREE.BufferGeometry);

    editorStore.setTransform(editorStore.selectedMeshId, {});

    const object3d = getMeshObject3D(editorStore.selectedMeshId);
    if (object3d instanceof THREE.Mesh) {
      object3d.geometry = subdividedGeo;
    }
  }, [editorStore, getMeshObject3D]);

  /**
   * Smooth selected mesh
   */
  const smoothSelected = useCallback(
    (iterations: number = 1) => {
      if (!editorStore.selectedMeshId) return;

      const selectedMesh = editorStore.meshes[editorStore.selectedMeshId];
      if (!selectedMesh?.geometry || !(selectedMesh.geometry instanceof THREE.BufferGeometry)) return;

      editorStore.pushToHistory();

      const smoothedGeo = GeomOps.smoothGeometry(selectedMesh.geometry as THREE.BufferGeometry, iterations);

      const object3d = getMeshObject3D(editorStore.selectedMeshId);
      if (object3d instanceof THREE.Mesh) {
        object3d.geometry = smoothedGeo;
      }
    },
    [editorStore, getMeshObject3D]
  );

  /**
   * Decimate selected mesh
   */
  const decimateSelected = useCallback(
    (ratio: number) => {
      if (!editorStore.selectedMeshId) return;

      const selectedMesh = editorStore.meshes[editorStore.selectedMeshId];
      if (!selectedMesh?.geometry || !(selectedMesh.geometry instanceof THREE.BufferGeometry)) return;

      editorStore.pushToHistory();

      const decimatedGeo = GeomOps.decimateGeometry(selectedMesh.geometry as THREE.BufferGeometry, ratio);

      const object3d = getMeshObject3D(editorStore.selectedMeshId);
      if (object3d instanceof THREE.Mesh) {
        object3d.geometry = decimatedGeo;
      }
    },
    [editorStore, getMeshObject3D]
  );

  /**
   * Get mesh statistics
   */
  const getMeshStats = useCallback(
    (meshId: string) => {
      const mesh = editorStore.meshes[meshId];
      if (!mesh?.geometry || !(mesh.geometry instanceof THREE.BufferGeometry)) return null;

      return GeomOps.calculateMeshStats(mesh.geometry as THREE.BufferGeometry);
    },
    [editorStore.meshes]
  );

  /**
   * Apply transform constraints (snap to grid, angle snap)
   */
  const applyTransformConstraints = useCallback(
    (value: number, type: 'position' | 'rotation'): number => {
      let result = value;

      if (advancedStore.snapToGrid && type === 'position') {
        result = Math.round(value / advancedStore.snapGridSize) * advancedStore.snapGridSize;
      }

      if (advancedStore.snapAngle && type === 'rotation') {
        result =
          Math.round((value * 180) / Math.PI / advancedStore.snapAngleValue) *
          (advancedStore.snapAngleValue * (Math.PI / 180));
      }

      return result;
    },
    [advancedStore]
  );

  return {
    createLinearArray,
    createCircularArray,
    mirrorSelected,
    alignSelected,
    distributeSelected,
    mergeSelected,
    subdivideSelected,
    smoothSelected,
    decimateSelected,
    getMeshStats,
    applyTransformConstraints,
  };
}

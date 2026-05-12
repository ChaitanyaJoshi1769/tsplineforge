'use client';

import { useEffect } from 'react';
import * as THREE from 'three';
import { useEditorStore, MeshMaterial } from './useEditorStore';

export function useMaterialEditor() {
  const store = useEditorStore();

  // Update Three.js material when material state changes
  useEffect(() => {
    if (!store.selectedMeshId) return;

    const mesh = store.meshes[store.selectedMeshId];
    if (!mesh?.object3d) return;

    const obj = mesh.object3d;

    // Function to update material
    const updateMaterial = (object: THREE.Object3D, material: MeshMaterial) => {
      if (object instanceof THREE.Mesh) {
        if (object.material instanceof THREE.MeshStandardMaterial) {
          object.material.color.setHex(parseInt(material.color.replace('#', ''), 16));
          object.material.opacity = material.opacity;
          object.material.transparent = material.opacity < 1;
          object.material.roughness = material.roughness;
          object.material.metalness = material.metalness;
          object.material.emissive.setHex(parseInt(material.emissive.replace('#', ''), 16));
          object.material.needsUpdate = true;
        } else if (object.material instanceof THREE.MeshPhongMaterial) {
          object.material.color.setHex(parseInt(material.color.replace('#', ''), 16));
          object.material.opacity = material.opacity;
          object.material.transparent = material.opacity < 1;
          object.material.emissive.setHex(parseInt(material.emissive.replace('#', ''), 16));
          object.material.needsUpdate = true;
        } else if (object.material instanceof THREE.Material) {
          // For other material types, try to update what we can
          const mat = object.material as THREE.Material & Record<string, unknown>;
          if ('color' in mat && mat.color instanceof THREE.Color) {
            mat.color.setHex(parseInt(material.color.replace('#', ''), 16));
          }
          if ('opacity' in mat) {
            mat.opacity = material.opacity;
          }
          if ('transparent' in mat) {
            mat.transparent = material.opacity < 1;
          }
          mat.needsUpdate = true;
        }
      }

      // Recursively update materials in groups
      if (object instanceof THREE.Group) {
        object.children.forEach((child) => updateMaterial(child, material));
      }
    };

    updateMaterial(obj, mesh.material);
  }, [store.selectedMeshId, store.meshes]);

  const updateColor = (color: string) => {
    if (store.selectedMeshId) {
      store.setMaterial(store.selectedMeshId, { color });
    }
  };

  const updateOpacity = (opacity: number) => {
    if (store.selectedMeshId) {
      store.setMaterial(store.selectedMeshId, { opacity });
    }
  };

  const updateRoughness = (roughness: number) => {
    if (store.selectedMeshId) {
      store.setMaterial(store.selectedMeshId, { roughness });
    }
  };

  const updateMetalness = (metalness: number) => {
    if (store.selectedMeshId) {
      store.setMaterial(store.selectedMeshId, { metalness });
    }
  };

  const updateEmissive = (emissive: string) => {
    if (store.selectedMeshId) {
      store.setMaterial(store.selectedMeshId, { emissive });
    }
  };

  const applyPreset = (presetName: string) => {
    if (store.selectedMeshId) {
      store.applyMaterialPreset(store.selectedMeshId, presetName);
    }
  };

  return {
    selectedMaterial: store.selectedMeshId ? store.meshes[store.selectedMeshId]?.material : null,
    presets: Object.keys(store.materialPresets),
    updateColor,
    updateOpacity,
    updateRoughness,
    updateMetalness,
    updateEmissive,
    applyPreset,
  };
}

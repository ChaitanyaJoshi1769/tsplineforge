'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useEditorStore } from './useEditorStore';

export function useSelection(camera: THREE.PerspectiveCamera | null, renderer: THREE.WebGLRenderer | null) {
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const store = useEditorStore();
  const meshObjectsRef = useRef<Map<THREE.Object3D, string>>(new Map());

  // Register meshes for raycasting
  useEffect(() => {
    meshObjectsRef.current.clear();
    Object.values(store.meshes).forEach((mesh) => {
      if (mesh.object3d) {
        mesh.object3d.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            meshObjectsRef.current.set(node, mesh.id);
          }
        });
      }
    });
  }, [store.meshes]);

  // Handle click to select
  useEffect(() => {
    if (!camera || !renderer) return;

    const handleClick = (e: MouseEvent) => {
      // Ignore clicks on UI elements
      if (e.target !== renderer.domElement) return;

      // Get canvas bounds
      const rect = renderer.domElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert to normalized device coordinates
      mouseRef.current.x = (x / rect.width) * 2 - 1;
      mouseRef.current.y = -(y / rect.height) * 2 + 1;

      // Cast ray
      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      // Check intersections
      const intersectObjects = Array.from(meshObjectsRef.current.keys());
      const intersects = raycasterRef.current.intersectObjects(intersectObjects, true);

      if (intersects.length > 0) {
        // Find the mesh ID
        const intersectedObject = intersects[0].object;
        let meshId: string | null = null;

        // Walk up the hierarchy to find registered mesh
        let obj: THREE.Object3D | null = intersectedObject;
        while (obj) {
          if (meshObjectsRef.current.has(obj)) {
            meshId = meshObjectsRef.current.get(obj) || null;
            break;
          }
          obj = obj.parent;
        }

        if (meshId) {
          // Toggle selection on Shift+click, otherwise select
          if (e.shiftKey) {
            // Multi-select (TODO: implement)
            store.selectMesh(meshId);
          } else {
            store.selectMesh(meshId);
          }
        }
      } else {
        // Click on empty space, deselect
        if (!e.shiftKey) {
          store.selectMesh(null);
        }
      }
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [camera, renderer, store]);

  // Visual feedback for selection (outline/highlight)
  useEffect(() => {
    // Update outline visibility based on selection
    Object.entries(store.meshes).forEach(([meshId, mesh]) => {
      if (mesh.object3d) {
        const isSelected = store.selectedMeshId === meshId;

        // Add/remove selection visual feedback
        mesh.object3d.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            if (isSelected) {
              // Highlight selected mesh
              node.material.emissive.set(0x444444);
              if (
                node.material instanceof THREE.MeshPhongMaterial ||
                node.material instanceof THREE.MeshStandardMaterial
              ) {
                node.material.emissiveIntensity = 0.5;
              }
            } else {
              // Reset to normal
              node.material.emissive.set(0x000000);
              if (
                node.material instanceof THREE.MeshPhongMaterial ||
                node.material instanceof THREE.MeshStandardMaterial
              ) {
                node.material.emissiveIntensity = 0;
              }
            }
            node.material.needsUpdate = true;
          }
        });
      }
    });
  }, [store.selectedMeshId, store.meshes]);

  return {
    selectedMeshId: store.selectedMeshId,
    selectMesh: store.selectMesh,
  };
}

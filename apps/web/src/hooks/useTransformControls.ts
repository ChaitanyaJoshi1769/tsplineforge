'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useEditorStore } from './useEditorStore';

export function useTransformControls(renderer: THREE.WebGLRenderer | null, camera: THREE.PerspectiveCamera | null) {
  const store = useEditorStore();
  const startPosRef = useRef<[number, number, number]>([0, 0, 0]);
  const startRotRef = useRef<[number, number, number]>([0, 0, 0]);
  const startScaleRef = useRef<[number, number, number]>([1, 1, 1]);

  // Update mesh 3D object when transform changes
  useEffect(() => {
    if (!store.selectedMeshId) return;

    const mesh = store.meshes[store.selectedMeshId];
    if (!mesh?.object3d) return;

    const obj = mesh.object3d;
    obj.position.set(...mesh.transform.position);
    obj.rotation.order = 'XYZ';
    obj.rotation.set(...mesh.transform.rotation);
    obj.scale.set(...mesh.transform.scale);
  }, [store.selectedMeshId, store.meshes, store.transformMode]);

  // Keyboard shortcuts for transform modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return; // Don't interfere with form inputs

      const mesh = store.selectedMeshId ? store.meshes[store.selectedMeshId] : null;
      if (!mesh) return;

      switch (e.key.toLowerCase()) {
        case 'g':
          e.preventDefault();
          store.setTransformMode(store.transformMode === 'move' ? null : 'move');
          startPosRef.current = [...mesh.transform.position];
          break;

        case 'r':
          e.preventDefault();
          store.setTransformMode(store.transformMode === 'rotate' ? null : 'rotate');
          startRotRef.current = [...mesh.transform.rotation];
          break;

        case 's':
          e.preventDefault();
          store.setTransformMode(store.transformMode === 'scale' ? null : 'scale');
          startScaleRef.current = [...mesh.transform.scale];
          break;

        case 'x':
        case 'y':
          // Constraint to axis (when transform mode is active)
          // TODO: Implement axis constraint
          break;

        case 'escape':
          store.setTransformMode(null);
          break;

        case 't':
          // Toggle transform space
          e.preventDefault();
          store.toggleTransformSpace();
          break;

        case 'Delete':
          if (store.selectedMeshId) {
            e.preventDefault();
            store.pushToHistory();
            store.removeMesh(store.selectedMeshId);
          }
          break;

        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.shiftKey) {
              store.redo();
            } else {
              store.undo();
            }
          }
          break;

        case 'd':
          if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            store.pushToHistory();
            store.duplicateMesh(store.selectedMeshId);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  // Handle mouse drag for transforms
  useEffect(() => {
    if (!camera || !renderer) return;

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      if (store.transformMode && store.selectedMeshId) {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !store.transformMode || !store.selectedMeshId) return;

      const deltaX = e.clientX - lastX;
      const deltaY = e.clientY - lastY;

      lastX = e.clientX;
      lastY = e.clientY;

      const mesh = store.meshes[store.selectedMeshId];
      if (!mesh) return;

      const speed = 0.01;

      switch (store.transformMode) {
        case 'move': {
          const newPos: [number, number, number] = [
            mesh.transform.position[0] + deltaX * speed,
            mesh.transform.position[1] - deltaY * speed,
            mesh.transform.position[2],
          ];
          store.setTransform(store.selectedMeshId, { position: newPos });
          break;
        }

        case 'rotate': {
          const rotSpeed = 0.01;
          const newRot: [number, number, number] = [
            mesh.transform.rotation[0] - deltaY * rotSpeed,
            mesh.transform.rotation[1] + deltaX * rotSpeed,
            mesh.transform.rotation[2],
          ];
          store.setTransform(store.selectedMeshId, { rotation: newRot });
          break;
        }

        case 'scale': {
          const scaleSpeed = 0.01;
          const delta = (deltaX + deltaY) * scaleSpeed;
          const newScale: [number, number, number] = [
            Math.max(0.1, mesh.transform.scale[0] + delta),
            Math.max(0.1, mesh.transform.scale[1] + delta),
            Math.max(0.1, mesh.transform.scale[2] + delta),
          ];
          store.setTransform(store.selectedMeshId, { scale: newScale });
          break;
        }
      }
    };

    const handleMouseUp = () => {
      if (isDragging && store.transformMode) {
        isDragging = false;
        store.pushToHistory();
      }
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [store, camera, renderer]);

  return {
    transformMode: store.transformMode,
    setTransformMode: store.setTransformMode,
    setTransform: store.setTransform,
  };
}

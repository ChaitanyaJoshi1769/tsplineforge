/**
 * useViewportControls Hook
 * Manages viewport and camera controls for 3D viewer
 */

import { useCallback, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  CAMERA_PRESETS,
  applyCameraPreset,
  animateCameraTransition,
  getViewportState,
  rotateCamera,
  panCamera,
  zoomCamera,
  frameObject,
  resetCamera,
  type ViewportState,
} from '@/lib/cameraPresets';

export interface ViewportControlsState {
  selectedPreset: string | null;
  isAnimating: boolean;
  animationProgress: number;
}

export interface ViewportControlsActions {
  applyPreset: (presetId: string, animate?: boolean) => void;
  handleMouseDown: (event: MouseEvent) => void;
  handleMouseMove: (event: MouseEvent) => void;
  handleMouseUp: (event: MouseEvent) => void;
  handleMouseWheel: (event: WheelEvent) => void;
  frameView: () => void;
  resetView: () => void;
  getState: () => ViewportState;
}

interface InternalState {
  isDragging: boolean;
  isRotating: boolean;
  isPanning: boolean;
  lastMouseX: number;
  lastMouseY: number;
  previousViewportState: ViewportState | null;
}

/**
 * Hook for managing viewport and camera controls
 */
export function useViewportControls(
  camera: THREE.PerspectiveCamera | null,
  object: THREE.Object3D | null,
  controls?: { target: THREE.Vector3; position: THREE.Vector3; up: THREE.Vector3 },
): ViewportControlsState & ViewportControlsActions {
  const [state, setState] = useState<ViewportControlsState>({
    selectedPreset: null,
    isAnimating: false,
    animationProgress: 0,
  });

  const internalStateRef = useRef<InternalState>({
    isDragging: false,
    isRotating: false,
    isPanning: false,
    lastMouseX: 0,
    lastMouseY: 0,
    previousViewportState: null,
  });

  const getState = useCallback((): ViewportState => {
    if (!camera) {
      return {
        position: new THREE.Vector3(),
        target: new THREE.Vector3(),
        up: new THREE.Vector3(0, 1, 0),
      };
    }

    const target = controls?.target || new THREE.Vector3();
    return getViewportState(camera, target);
  }, [camera, controls]);

  const applyPreset = useCallback(
    (presetId: string, animate: boolean = true) => {
      if (!camera) return;

      const preset = CAMERA_PRESETS[presetId];
      if (!preset) return;

      const fromState = getState();

      if (animate) {
        setState((prev) => ({
          ...prev,
          isAnimating: true,
          selectedPreset: presetId,
        }));

        animateCameraTransition(
          camera,
          fromState,
          {
            position: preset.position.clone(),
            target: preset.target.clone(),
            up: preset.up.clone(),
          },
          500,
          (progress) => {
            setState((prev) => ({
              ...prev,
              animationProgress: progress,
            }));
          },
        );

        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            isAnimating: false,
            animationProgress: 0,
          }));
        }, 500);
      } else {
        applyCameraPreset(camera, preset, false);
        setState((prev) => ({
          ...prev,
          selectedPreset: presetId,
        }));
      }

      if (controls) {
        controls.target.copy(preset.target);
        controls.position.copy(preset.position);
      }
    },
    [camera, controls, getState],
  );

  const frameView = useCallback(() => {
    if (!camera || !object) return;

    frameObject(object, camera, controls, 1.5);
    setState((prev) => ({
      ...prev,
      selectedPreset: null,
    }));
  }, [camera, object, controls]);

  const resetView = useCallback(() => {
    if (!camera || !object) return;

    resetCamera(camera, object, controls);
    setState((prev) => ({
      ...prev,
      selectedPreset: null,
    }));
  }, [camera, object, controls]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    internalStateRef.current.isDragging = true;
    internalStateRef.current.lastMouseX = event.clientX;
    internalStateRef.current.lastMouseY = event.clientY;
    internalStateRef.current.previousViewportState = getState();

    // Determine operation based on mouse button
    if (event.button === 0) {
      // Left click = rotate
      internalStateRef.current.isRotating = true;
    } else if (event.button === 2) {
      // Right click = pan
      internalStateRef.current.isPanning = true;
    }
  }, [getState]);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!internalStateRef.current.isDragging || !camera) return;

      const deltaX = event.clientX - internalStateRef.current.lastMouseX;
      const deltaY = event.clientY - internalStateRef.current.lastMouseY;

      const target = controls?.target || new THREE.Vector3();

      if (internalStateRef.current.isRotating) {
        rotateCamera(camera, target, deltaX, deltaY, 0.005);
      } else if (internalStateRef.current.isPanning) {
        panCamera(camera, target, deltaX, deltaY, 0.5);
      }

      internalStateRef.current.lastMouseX = event.clientX;
      internalStateRef.current.lastMouseY = event.clientY;
    },
    [camera, controls],
  );

  const handleMouseUp = useCallback(() => {
    internalStateRef.current.isDragging = false;
    internalStateRef.current.isRotating = false;
    internalStateRef.current.isPanning = false;
    internalStateRef.current.previousViewportState = null;
  }, []);

  const handleMouseWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();

      if (!camera) return;

      const target = controls?.target || new THREE.Vector3();
      const delta = event.deltaY > 0 ? 1 : -1;

      zoomCamera(camera, target, delta, 0.1);
    },
    [camera, controls],
  );

  return {
    // State
    selectedPreset: state.selectedPreset,
    isAnimating: state.isAnimating,
    animationProgress: state.animationProgress,

    // Actions
    applyPreset,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseWheel,
    frameView,
    resetView,
    getState,
  };
}

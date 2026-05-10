/**
 * Camera Presets & Viewport Controls
 * Provides predefined camera angles and viewport management
 */

import * as THREE from 'three';

export interface CameraPreset {
  id: string;
  name: string;
  description: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
  up: THREE.Vector3;
  fov?: number;
}

export interface ViewportState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  up: THREE.Vector3;
}

/**
 * Standard camera presets for common viewing angles
 */
export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  front: {
    id: 'front',
    name: 'Front',
    description: 'Front view (Y-axis)',
    position: new THREE.Vector3(0, 0, 100),
    target: new THREE.Vector3(0, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
  },
  back: {
    id: 'back',
    name: 'Back',
    description: 'Back view (Y-axis)',
    position: new THREE.Vector3(0, 0, -100),
    target: new THREE.Vector3(0, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
  },
  top: {
    id: 'top',
    name: 'Top',
    description: 'Top view (Z-axis)',
    position: new THREE.Vector3(0, 100, 0),
    target: new THREE.Vector3(0, 0, 0),
    up: new THREE.Vector3(0, 0, -1),
  },
  bottom: {
    id: 'bottom',
    name: 'Bottom',
    description: 'Bottom view (Z-axis)',
    position: new THREE.Vector3(0, -100, 0),
    target: new THREE.Vector3(0, 0, 0),
    up: new THREE.Vector3(0, 0, 1),
  },
  left: {
    id: 'left',
    name: 'Left',
    description: 'Left view (X-axis)',
    position: new THREE.Vector3(-100, 0, 0),
    target: new THREE.Vector3(0, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
  },
  right: {
    id: 'right',
    name: 'Right',
    description: 'Right view (X-axis)',
    position: new THREE.Vector3(100, 0, 0),
    target: new THREE.Vector3(0, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
  },
  isometric: {
    id: 'isometric',
    name: 'Isometric',
    description: 'Isometric 3D view',
    position: new THREE.Vector3(100, 100, 100),
    target: new THREE.Vector3(0, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
  },
  perspective: {
    id: 'perspective',
    name: 'Perspective',
    description: 'Perspective 3D view',
    position: new THREE.Vector3(150, 120, 150),
    target: new THREE.Vector3(0, 0, 0),
    up: new THREE.Vector3(0, 1, 0),
  },
};

/**
 * Apply camera preset to camera
 */
export function applyCameraPreset(
  camera: THREE.Camera,
  preset: CameraPreset,
  animate: boolean = false,
): void {
  if (!(camera instanceof THREE.PerspectiveCamera)) {
    return;
  }

  if (animate) {
    // Animation would be handled by caller using animateCameraTransition
    return;
  }

  // Update camera position and orientation
  camera.position.copy(preset.position);
  (camera as unknown as { up: THREE.Vector3 }).up.copy(preset.up);

  // Update FOV if specified
  if (preset.fov) {
    camera.fov = preset.fov;
  }

  camera.lookAt(preset.target);
  camera.updateProjectionMatrix();
}

/**
 * Animate camera transition between two positions
 */
export function animateCameraTransition(
  camera: THREE.Camera,
  fromState: ViewportState,
  toState: ViewportState,
  duration: number = 500,
  callback?: (progress: number) => void,
): void {
  if (!(camera instanceof THREE.PerspectiveCamera)) {
    return;
  }

  const startTime = Date.now();
  const startPosition = fromState.position.clone();
  const startTarget = fromState.target.clone();
  const startUp = fromState.up.clone();

  const animate = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (ease-out-cubic)
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    // Interpolate position
    camera.position.lerpVectors(startPosition, toState.position, easeProgress);

    // Interpolate target
    const currentTarget = startTarget.clone();
    currentTarget.lerp(toState.target, easeProgress);

    // Interpolate up vector
    const currentUp = startUp.clone();
    currentUp.lerp(toState.up, easeProgress);
    currentUp.normalize();

    // Update camera
    (camera as unknown as { up: THREE.Vector3 }).up.copy(currentUp);
    camera.lookAt(currentTarget);
    camera.updateProjectionMatrix();

    callback?.(progress);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  animate();
}

/**
 * Calculate camera distance to fit object in view
 */
export function calculateCameraDistance(
  object: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  padding: number = 1.5,
): number {
  const boundingBox = new THREE.Box3().setFromObject(object);
  const size = boundingBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  const fov = (camera.fov * Math.PI) / 180; // convert to radians
  const distance = maxDim / 2 / Math.tan(fov / 2);

  return distance * padding;
}

/**
 * Frame object in viewport (zoom to fit)
 */
export function frameObject(
  object: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  controls?: { target: THREE.Vector3; position: THREE.Vector3; up: THREE.Vector3 },
  padding: number = 1.5,
): void {
  const boundingBox = new THREE.Box3().setFromObject(object);
  const center = boundingBox.getCenter(new THREE.Vector3());
  const distance = calculateCameraDistance(object, camera, padding);

  // Get current direction from target to camera
  const direction = new THREE.Vector3();
  direction.subVectors(camera.position, center);
  direction.normalize();

  // Position camera at the calculated distance
  const newPosition = new THREE.Vector3();
  newPosition.copy(direction).multiplyScalar(distance).add(center);

  camera.position.copy(newPosition);

  if (controls) {
    controls.target.copy(center);
    controls.position.copy(newPosition);
  }

  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

/**
 * Get current viewport state
 */
export function getViewportState(
  camera: THREE.Camera,
  controlsTarget?: THREE.Vector3,
): ViewportState {
  const target = controlsTarget || new THREE.Vector3(0, 0, 0);

  return {
    position: camera.position.clone(),
    target: target.clone(),
    up: (camera as unknown as { up: THREE.Vector3 }).up.clone(),
  };
}

/**
 * Rotate camera around target
 */
export function rotateCamera(
  camera: THREE.Camera,
  target: THREE.Vector3,
  deltaX: number,
  deltaY: number,
  sensitivity: number = 0.005,
): void {
  if (!(camera instanceof THREE.PerspectiveCamera)) {
    return;
  }

  // Get current camera direction
  const direction = new THREE.Vector3();
  direction.subVectors(camera.position, target);

  // Get current spherical coordinates
  const spherical = new THREE.Spherical();
  spherical.setFromVector3(direction);

  // Apply rotation
  spherical.theta -= deltaX * sensitivity;
  spherical.phi -= deltaY * sensitivity;

  // Clamp phi to avoid flipping
  spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

  // Update camera position
  direction.setFromSpherical(spherical);
  camera.position.copy(target).add(direction);

  camera.lookAt(target);
  camera.updateProjectionMatrix();
}

/**
 * Pan camera (move parallel to view plane)
 */
export function panCamera(
  camera: THREE.Camera,
  target: THREE.Vector3,
  deltaX: number,
  deltaY: number,
  _sensitivity: number = 0.5,
): void {
  if (!(camera instanceof THREE.PerspectiveCamera)) {
    return;
  }

  // Get camera axes
  const up = (camera as unknown as { up: THREE.Vector3 }).up.clone();
  const right = new THREE.Vector3();
  right.crossVectors(new THREE.Vector3(0, 0, 1), up).normalize();

  // Calculate pan distance based on camera distance
  const distance = camera.position.distanceTo(target);
  const panScale = (distance * Math.tan((camera.fov * Math.PI) / 360) * 2) / 500;

  // Apply pan
  right.multiplyScalar(-deltaX * panScale);
  up.multiplyScalar(deltaY * panScale);

  camera.position.add(right).add(up);
  target.add(right).add(up);

  camera.lookAt(target);
  camera.updateProjectionMatrix();
}

/**
 * Zoom camera (dolly)
 */
export function zoomCamera(
  camera: THREE.Camera,
  target: THREE.Vector3,
  delta: number,
  sensitivity: number = 0.1,
): void {
  if (!(camera instanceof THREE.PerspectiveCamera)) {
    return;
  }

  const direction = new THREE.Vector3();
  direction.subVectors(camera.position, target);

  const currentDistance = direction.length();
  const newDistance = currentDistance * (1 + delta * sensitivity);

  // Clamp zoom distance (avoid zooming too close or too far)
  const clampedDistance = Math.max(0.1, Math.min(newDistance, 1000));

  direction.normalize().multiplyScalar(clampedDistance);
  camera.position.copy(target).add(direction);

  camera.lookAt(target);
  camera.updateProjectionMatrix();
}

/**
 * Reset camera to default view
 */
export function resetCamera(
  camera: THREE.Camera,
  object: THREE.Object3D,
  controls?: { target: THREE.Vector3; position: THREE.Vector3; up: THREE.Vector3 },
): void {
  if (!(camera instanceof THREE.PerspectiveCamera)) {
    return;
  }

  // Frame the object
  frameObject(object, camera, controls);

  // Apply isometric-like rotation
  const boundingBox = new THREE.Box3().setFromObject(object);
  const center = boundingBox.getCenter(new THREE.Vector3());

  const distance = calculateCameraDistance(object, camera);

  camera.position.set(
    center.x + distance / Math.sqrt(3),
    center.y + distance / Math.sqrt(3),
    center.z + distance / Math.sqrt(3),
  );

  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

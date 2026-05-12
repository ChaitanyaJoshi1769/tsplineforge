'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '@/hooks/useEditorStore';
import { useTransformControls } from '@/hooks/useTransformControls';
import { useSelection } from '@/hooks/useSelection';
import { useMaterialEditor } from '@/hooks/useMaterialEditor';

interface MeshViewerProps {
  importedGeometry?: THREE.BufferGeometry | THREE.Group | null;
  autoRotate?: boolean;
  editable?: boolean;
  onMeshChange?: (mesh: THREE.Mesh) => void;
  onSceneReady?: (scene: THREE.Scene) => void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [key: string]: unknown;
}

export function MeshViewer({
  importedGeometry,
  autoRotate = false,
  editable = false,
  onMeshChange,
  onSceneReady,
}: MeshViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | THREE.Group | null>(null);
  const importedGeometryRef = useRef<THREE.BufferGeometry | THREE.Group | null>(null);
  const [selectedVertex, _setSelectedVertex] = useState<number | null>(null);

  // Mouse controls state
  const mouseState = useRef({
    isRotating: false,
    isPanning: false,
    lastX: 0,
    lastY: 0,
    speed: 0.005,
    spacePressed: false,
  });

  // Editor hooks
  const editorStore = useEditorStore();

  // Initialize scene, renderer, and camera once
  useEffect(() => {
    if (!containerRef.current || sceneRef.current) return; // Only initialize once

    // Initialize scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f0f0f);
    sceneRef.current = scene;

    // Camera
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 2;
    camera.position.y = 0.5;
    cameraRef.current = camera;

    // Renderer with better quality
    const renderer = new THREE.WebGLRenderer({ antialias: true, precision: 'highp' });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Grid helper for reference
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Create default box
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x1e40af,
      roughness: 0.7,
      metalness: 0,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshRef.current = mesh;

    // Animation loop with frame rate control
    let lastTime = Date.now();
    const animate = () => {
      requestAnimationFrame(animate);
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (autoRotate && meshRef.current) {
        meshRef.current.rotation.x += 0.5 * deltaTime;
        meshRef.current.rotation.y += 1.0 * deltaTime;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Notify parent component that scene is ready
    if (onSceneReady) {
      onSceneReady(scene);
    }

    // Handle camera controls
    const onMouseWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.001;
      const direction = camera.position.clone().normalize();
      const distance = camera.position.length();
      const newDistance = Math.max(0.1, Math.min(50, distance - e.deltaY * zoomSpeed * distance));
      camera.position.copy(direction.multiplyScalar(newDistance));
    };

    // Handle vertex selection and movement
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const isSpacePressed = mouseState.current.spacePressed;

      if (e.button === 0 && !isSpacePressed) {
        // Left-click for rotation
        mouseState.current.isRotating = true;
        mouseState.current.lastX = e.clientX;
        mouseState.current.lastY = e.clientY;
        containerRef.current.style.cursor = 'grabbing';
      } else if ((e.button === 0 && isSpacePressed) || e.button === 2) {
        // Space+click or right-click for panning
        mouseState.current.isPanning = true;
        mouseState.current.lastX = e.clientX;
        mouseState.current.lastY = e.clientY;
        containerRef.current.style.cursor = 'grab';
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (mouseState.current.isRotating) {
        const deltaX = e.clientX - mouseState.current.lastX;
        const deltaY = e.clientY - mouseState.current.lastY;

        // Rotate camera around target (origin)
        const radius = camera.position.length();
        let theta = Math.atan2(camera.position.x, camera.position.z);
        let phi = Math.acos(camera.position.y / radius);

        theta -= deltaX * mouseState.current.speed;
        phi += deltaY * mouseState.current.speed;

        // Clamp phi to avoid flipping
        phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

        camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
        camera.position.y = radius * Math.cos(phi);
        camera.position.z = radius * Math.sin(phi) * Math.cos(theta);
        camera.lookAt(0, 0, 0);

        mouseState.current.lastX = e.clientX;
        mouseState.current.lastY = e.clientY;
      } else if (mouseState.current.isPanning) {
        const deltaX = (e.clientX - mouseState.current.lastX) * 0.01;
        const deltaY = (e.clientY - mouseState.current.lastY) * 0.01;

        // Pan camera
        const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(
          new THREE.Vector3(1, 0, 0),
          Math.atan2(camera.position.y, Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2))
        );
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          Math.atan2(camera.position.x, camera.position.z)
        );

        camera.position.addScaledVector(right, -deltaX);
        camera.position.addScaledVector(forward, deltaY);
        camera.lookAt(0, 0, 0);

        mouseState.current.lastX = e.clientX;
        mouseState.current.lastY = e.clientY;
      }

      if (editable && selectedVertex !== null && meshRef.current) {
        raycaster.setFromCamera(mouse, camera);
        // Would implement vertex dragging here
      }
    };

    const onMouseUp = (_e: MouseEvent) => {
      mouseState.current.isRotating = false;
      mouseState.current.isPanning = false;
      if (containerRef.current) {
        containerRef.current.style.cursor = 'default';
      }
    };

    const onClick = (e: MouseEvent) => {
      if (!editable || !meshRef.current) return;
      if (mouseState.current.isRotating || mouseState.current.isPanning) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(meshRef.current);

      if (intersects.length > 0) {
        // Vertex selection would go here
        if (onMeshChange && meshRef.current instanceof THREE.Mesh) {
          onMeshChange(meshRef.current);
        }
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('wheel', onMouseWheel, { passive: false });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('contextmenu', onContextMenu);
    if (editable) window.addEventListener('click', onClick);

    // Track space key
    const onKeyDown = (_e: KeyboardEvent) => {
      if (_e.code === 'Space') {
        mouseState.current.spacePressed = true;
      }
    };
    const onKeyUp = (_e: KeyboardEvent) => {
      if (_e.code === 'Space') {
        mouseState.current.spacePressed = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('wheel', onMouseWheel);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Handle imported geometry updates (separate effect)
  useEffect(() => {
    if (!importedGeometry || !sceneRef.current || !cameraRef.current) return;

    // Skip if we've already processed this geometry
    if (importedGeometryRef.current === importedGeometry) return;
    importedGeometryRef.current = importedGeometry;

    const scene = sceneRef.current;
    const camera = cameraRef.current;

    // Remove previous imported mesh
    if (meshRef.current) {
      scene.remove(meshRef.current);
    }

    let mesh: THREE.Mesh | THREE.Group | null = null;

    if (importedGeometry instanceof THREE.BufferGeometry) {
      // It's a geometry, create a mesh from it
      const material = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        emissive: 0x000000,
        roughness: 0.7,
        metalness: 0,
      });
      mesh = new THREE.Mesh(importedGeometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
    } else if (importedGeometry instanceof THREE.Group) {
      // It's a group (from GLTF/OBJ), use it directly
      mesh = importedGeometry;
      scene.add(mesh);

      // Apply shadow properties to all meshes in the group
      mesh.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.castShadow = true;
          node.receiveShadow = true;
          // Ensure material has proper properties for editing
          if (!node.material) {
            node.material = new THREE.MeshStandardMaterial({
              color: 0x3b82f6,
              roughness: 0.7,
              metalness: 0,
            });
          }
        }
      });
    }

    if (mesh) {
      meshRef.current = mesh;
      const meshId = `imported_${Date.now()}`;

      // Register mesh with editor store
      if (editable) {
        editorStore.addMesh({
          id: meshId,
          name: 'Imported Model',
          geometry: importedGeometry,
          transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
          material: { color: '#3b82f6', opacity: 1, roughness: 0.7, metalness: 0, emissive: '#000000' },
          object3d: mesh,
          isVisible: true,
        });
      }

      // Auto-fit camera to geometry bounds
      const bbox = new THREE.Box3().setFromObject(mesh);
      const size = bbox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5; // Add some padding
      camera.position.z = cameraZ;

      const center = bbox.getCenter(new THREE.Vector3());
      mesh.position.set(-center.x, -center.y, -center.z); // Center the mesh properly
      camera.lookAt(0, 0, 0);
    }
  }, [importedGeometry, editable]);

  // Set up transform controls and selection (only if editable)
  useTransformControls(rendererRef.current, cameraRef.current);
  useSelection(cameraRef.current, rendererRef.current);
  useMaterialEditor();

  // Register mesh with editor store when imported
  useEffect(() => {
    if (!editable || !meshRef.current || !importedGeometry) return;

    const meshId = `mesh_${Date.now()}`;
    const mesh = meshRef.current;

    editorStore.addMesh({
      id: meshId,
      name: 'Imported Model',
      geometry: importedGeometry,
      transform: {
        position: [mesh.position.x, mesh.position.y, mesh.position.z],
        rotation: [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z],
        scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z],
      },
      material: {
        color: '#3b82f6',
        opacity: 1,
        roughness: 0.7,
        metalness: 0,
        emissive: '#000000',
      },
      object3d: mesh,
      isVisible: true,
    });
  }, [editable, importedGeometry, editorStore]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-background rounded-lg border border-border cursor-default relative"
      style={{ minHeight: '500px' }}
    >
      {/* Viewport Controls Legend */}
      <div className="absolute top-4 right-4 text-xs text-muted-foreground pointer-events-none">
        <div className="bg-background/80 backdrop-blur px-4 py-3 rounded-lg border border-border space-y-1">
          <div className="font-semibold text-foreground">Controls</div>
          <div className="space-y-0.5 text-xs">
            <div>🖱️ <span className="font-medium">Drag</span> - Rotate</div>
            <div>🎚️ <span className="font-medium">Scroll</span> - Zoom</div>
            <div>🛰️ <span className="font-medium">Space + Drag</span> - Pan</div>
          </div>
        </div>
      </div>

      {editable && (
        <div className="absolute top-4 left-4 bg-card/80 p-3 rounded-lg text-sm text-muted-foreground z-10">
          <div>Scroll: Zoom</div>
          <div>Click: Select vertex</div>
          {selectedVertex !== null && <div>Selected: Vertex {selectedVertex}</div>}
        </div>
      )}
    </div>
  );
}

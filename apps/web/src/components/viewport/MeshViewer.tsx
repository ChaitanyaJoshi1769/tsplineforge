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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [key: string]: unknown;
}

export function MeshViewer({
  importedGeometry,
  autoRotate = false,
  editable = false,
  onMeshChange,
}: MeshViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | THREE.Group | null>(null);
  const importedGeometryRef = useRef<THREE.BufferGeometry | THREE.Group | null>(null);
  const [selectedVertex, _setSelectedVertex] = useState<number | null>(null);

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

    // Handle camera controls
    const onMouseWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSpeed = 0.1;
      const direction = camera.position.normalize();
      const distance = camera.position.length();
      const newDistance = Math.max(0.1, Math.min(20, distance + e.deltaY * zoomSpeed));
      camera.position.copy(direction.multiplyScalar(newDistance));
    };

    // Handle vertex selection and movement
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (editable && selectedVertex !== null && meshRef.current) {
        raycaster.setFromCamera(mouse, camera);
        // Would implement vertex dragging here
      }
    };

    const onClick = (e: MouseEvent) => {
      if (!editable || !meshRef.current) return;

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
    if (editable) window.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('wheel', onMouseWheel);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
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

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-background rounded-lg border border-border cursor-default relative"
      style={{ minHeight: '500px' }}
    >
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

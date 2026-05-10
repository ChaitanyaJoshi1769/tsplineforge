'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface MeshViewerProps {
  meshData?: ArrayBuffer;
  autoRotate?: boolean;
  showNormals?: boolean;
  showWireframe?: boolean;
  editable?: boolean;
  onMeshChange?: (mesh: THREE.Mesh) => void;
}

export function MeshViewer({
  meshData,
  autoRotate = false,
  showNormals = false,
  showWireframe = false,
  editable = false,
  onMeshChange,
}: MeshViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const controlsRef = useRef<any>(null);
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

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
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;
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

    // Create default mesh or use provided data
    let mesh = meshRef.current;
    if (!mesh) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshPhongMaterial({
        color: 0x3b82f6,
        emissive: 0x1e40af,
        shininess: 100,
      });
      mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshRef.current = mesh;
    }

    // Add wireframe if needed
    if (showWireframe && mesh) {
      const wireframeGeometry = new THREE.WireframeGeometry(mesh.geometry);
      const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 1 });
      const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
      mesh.add(wireframe);
    }

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
        if (onMeshChange) {
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
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [autoRotate, showWireframe, meshData, editable, onMeshChange]);

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

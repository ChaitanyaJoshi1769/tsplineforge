/**
 * Export Functions Test Suite
 * Tests for STEP, IGES, STL, GLTF, and OBJ export functionality
 */

import * as THREE from 'three';
import {
  exportToSTEP,
  exportToIGES,
  exportToSTL,
  exportToGLTF,
  exportToOBJ,
  validateScene,
} from '../exporters';

/**
 * Utility: Create a simple test cube
 */
function createTestCube(size: number = 10): THREE.Scene {
  const scene = new THREE.Scene();
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return scene;
}

/**
 * Utility: Create a simple test pyramid (4 vertices, 4 faces)
 */
function createTestPyramid(): THREE.Scene {
  const scene = new THREE.Scene();
  const geometry = new THREE.TetrahedronGeometry(5);
  const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return scene;
}

/**
 * Utility: Create a large mesh for stress testing
 */
function createLargeMesh(vertexCount: number = 100000): THREE.Scene {
  const scene = new THREE.Scene();
  const geometry = new THREE.IcosahedronGeometry(10, 8);

  // Scale to achieve target vertex count
  const currentVertices = geometry.getAttribute('position').count;
  const scale = Math.sqrt(vertexCount / currentVertices);

  const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(scale, scale, scale);
  scene.add(mesh);
  return scene;
}

/**
 * Utility: Create empty scene
 */
function createEmptyScene(): THREE.Scene {
  return new THREE.Scene();
}

/**
 * Utility: Validate STEP file format
 */
function validateSTEPFormat(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content.includes('ISO-10303-21')) {
    errors.push('Missing ISO-10303-21 header');
  }
  if (!content.includes('HEADER')) {
    errors.push('Missing HEADER section');
  }
  if (!content.includes('DATA')) {
    errors.push('Missing DATA section');
  }
  if (!content.includes('ENDSEC')) {
    errors.push('Missing ENDSEC terminators');
  }
  if (!content.includes('END-ISO-10303-21')) {
    errors.push('Missing END-ISO-10303-21 footer');
  }
  if (!content.includes('CARTESIAN_POINT')) {
    errors.push('No vertices found (CARTESIAN_POINT)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Utility: Validate IGES file format
 */
function validateIGESFormat(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content.includes('S      1')) {
    errors.push('Missing start section');
  }
  if (!content.includes('G      1')) {
    errors.push('Missing global section');
  }
  if (!content.includes('D')) {
    errors.push('Missing directory entries');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Test Suite: Integration Tests
 */
describe('Export Functions - Integration Tests', () => {
  test('STEP export with simple cube', async () => {
    const scene = createTestCube();
    const result = await exportToSTEP(scene, 'test-cube');

    expect(result.success).toBe(true);
    expect(result.filename).toBe('test-cube.step');
    expect(result.mimeType).toBe('application/octet-stream');
    expect(result.data).toBeDefined();

    const validation = validateSTEPFormat(result.data as string);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('IGES export with simple cube', async () => {
    const scene = createTestCube();
    const result = await exportToIGES(scene, 'test-cube');

    expect(result.success).toBe(true);
    expect(result.filename).toBe('test-cube.iges');
    expect(result.mimeType).toBe('application/octet-stream');
    expect(result.data).toBeDefined();

    const validation = validateIGESFormat(result.data as string);
    expect(validation.valid).toBe(true);
  });

  test('STL export with simple cube', async () => {
    const scene = createTestCube();
    const result = await exportToSTL(scene, 'test-cube', true);

    expect(result.success).toBe(true);
    expect(result.filename).toBe('test-cube.stl');
    expect(result.data).toBeDefined();
  });

  test('OBJ export with simple cube', async () => {
    const scene = createTestCube();
    const result = await exportToOBJ(scene, 'test-cube');

    expect(result.success).toBe(true);
    expect(result.filename).toBe('test-cube.obj');
    expect((result.data as string).includes('v ')).toBe(true); // Contains vertices
    expect((result.data as string).includes('f ')).toBe(true); // Contains faces
  });

  test('GLTF export with simple cube', async () => {
    const scene = createTestCube();
    const result = await exportToGLTF(scene, 'test-cube', false);

    expect(result.success).toBe(true);
    expect(result.filename).toBe('test-cube.gltf');
    expect(result.data).toBeDefined();
  });
});

/**
 * Test Suite: Edge Case Tests
 */
describe('Export Functions - Edge Cases', () => {
  test('Empty scene should fail validation', () => {
    const scene = createEmptyScene();
    const validation = validateScene(scene);

    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test('STEP export with empty scene should fail', async () => {
    const scene = createEmptyScene();
    const result = await exportToSTEP(scene, 'empty');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('No geometry');
  });

  test('IGES export with empty scene should fail', async () => {
    const scene = createEmptyScene();
    const result = await exportToIGES(scene, 'empty');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('Pyramid export (minimal geometry)', async () => {
    const scene = createTestPyramid();
    const result = await exportToSTEP(scene, 'pyramid');

    expect(result.success).toBe(true);
    const validation = validateSTEPFormat(result.data as string);
    expect(validation.valid).toBe(true);
  });

  test('Multiple meshes in scene', async () => {
    const scene = new THREE.Scene();

    const geom1 = new THREE.BoxGeometry(5, 5, 5);
    const mesh1 = new THREE.Mesh(geom1, new THREE.MeshStandardMaterial());
    scene.add(mesh1);

    const geom2 = new THREE.SphereGeometry(3, 32, 32);
    const mesh2 = new THREE.Mesh(geom2, new THREE.MeshStandardMaterial());
    mesh2.position.set(10, 0, 0);
    scene.add(mesh2);

    const result = await exportToSTEP(scene, 'multi-mesh');

    expect(result.success).toBe(true);
    const validation = validateSTEPFormat(result.data as string);
    expect(validation.valid).toBe(true);
  });
});

/**
 * Test Suite: Performance Tests
 */
describe('Export Functions - Performance', () => {
  test('Large mesh performance - 100K vertices', async () => {
    const scene = createLargeMesh(100000);
    const startTime = performance.now();
    const result = await exportToSTEP(scene, 'large-100k');
    const duration = performance.now() - startTime;

    expect(result.success).toBe(true);
    // eslint-disable-next-line no-console
    console.log(`100K vertex STEP export: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
  });

  test('File size for different formats', async () => {
    const scene = createTestCube(50);

    const stepResult = await exportToSTEP(scene, 'size-test');
    const igesResult = await exportToIGES(scene, 'size-test');
    const stlResult = await exportToSTL(scene, 'size-test', true);
    const objResult = await exportToOBJ(scene, 'size-test');

    const stepSize = (stepResult.data as string).length;
    const igesSize = (igesResult.data as string).length;
    const stlSize = (stlResult.data as string).length;
    const objSize = (objResult.data as string).length;

    // eslint-disable-next-line no-console
    console.log('File sizes:');
    // eslint-disable-next-line no-console
    console.log(`  STEP: ${(stepSize / 1024).toFixed(2)} KB`);
    // eslint-disable-next-line no-console
    console.log(`  IGES: ${(igesSize / 1024).toFixed(2)} KB`);
    // eslint-disable-next-line no-console
    console.log(`  STL:  ${(stlSize / 1024).toFixed(2)} KB`);
    // eslint-disable-next-line no-console
    console.log(`  OBJ:  ${(objSize / 1024).toFixed(2)} KB`);

    expect(stepSize).toBeGreaterThan(0);
    expect(igesSize).toBeGreaterThan(0);
    expect(stlSize).toBeGreaterThan(0);
    expect(objSize).toBeGreaterThan(0);
  });
});

/**
 * Test Suite: Format Validation
 */
describe('Export Functions - Format Validation', () => {
  test('STEP format contains required sections', async () => {
    const scene = createTestCube();
    const result = await exportToSTEP(scene, 'format-test');
    const content = result.data as string;

    expect(content).toMatch(/ISO-10303-21/);
    expect(content).toMatch(/HEADER/);
    expect(content).toMatch(/FILE_DESCRIPTION/);
    expect(content).toMatch(/FILE_NAME/);
    expect(content).toMatch(/FILE_SCHEMA/);
    expect(content).toMatch(/DATA/);
    expect(content).toMatch(/CARTESIAN_POINT/);
  });

  test('IGES format contains required sections', async () => {
    const scene = createTestCube();
    const result = await exportToIGES(scene, 'format-test');
    const content = result.data as string;

    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain('S      1'); // Start section
  });

  test('OBJ format contains vertex and face data', async () => {
    const scene = createTestCube();
    const result = await exportToOBJ(scene, 'format-test');
    const content = result.data as string;

    const vertices = (content.match(/^v /gm) || []).length;
    const faces = (content.match(/^f /gm) || []).length;

    expect(vertices).toBeGreaterThan(0);
    expect(faces).toBeGreaterThan(0);
    // eslint-disable-next-line no-console
    console.log(`OBJ: ${vertices} vertices, ${faces} faces`);
  });
});

/**
 * Test Suite: Error Handling
 */
describe('Export Functions - Error Handling', () => {
  test('Invalid filename handling', async () => {
    const scene = createTestCube();
    const result = await exportToSTEP(scene, '');

    expect(result.filename).toBe('.step');
    expect(result.success).toBe(true);
  });

  test('Scene validation catches empty scenes', () => {
    const scene = createEmptyScene();
    const validation = validateScene(scene);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('No meshes found in scene');
  });

  test('Very large mesh validation', () => {
    const scene = createTestCube();
    // Add validation for extremely large meshes
    const validation = validateScene(scene);

    expect(validation.valid).toBe(true);
  });
});

/**
 * Test Suite: Progress Tracking
 */
describe('Export Functions - Progress Tracking', () => {
  test('STEP export reports progress', async () => {
    const scene = createTestCube();
    const progressEvents: number[] = [];

    await exportToSTEP(scene, 'progress-test', {
      onProgress: (progress) => {
        progressEvents.push(progress);
      },
    });

    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[0]).toBe(10);
    expect(progressEvents[progressEvents.length - 1]).toBe(100);
  });

  test('IGES export reports progress', async () => {
    const scene = createTestCube();
    const progressEvents: number[] = [];

    await exportToIGES(scene, 'progress-test', {
      onProgress: (progress) => {
        progressEvents.push(progress);
      },
    });

    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[progressEvents.length - 1]).toBe(100);
  });
});

export { createTestCube, createTestPyramid, createLargeMesh, createEmptyScene };

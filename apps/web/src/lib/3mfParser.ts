import * as THREE from 'three';

/**
 * 3MF (3D Manufacturing Format) Parser
 * 3MF is a ZIP-based format containing XML model data
 *
 * Format structure:
 * - 3dmodel.model (XML) - Main model file
 * - [Content_Types].xml - MIME type definitions
 * - _rels/.rels - Relationships
 * - Optional textures and other resources
 */

export async function parse3MF(arrayBuffer: ArrayBuffer): Promise<THREE.Group> {
  // Import JSZip dynamically (it's a common library)
  const JSZip = (await import('jszip')).default;

  const zip = new JSZip();
  await zip.loadAsync(arrayBuffer);

  // Find the main model file (usually 3dmodel.model)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let modelFile: any = null;
  let _modelFileName = '';

  // Look for .model files in the root
  Object.keys(zip.files).forEach((filename) => {
    if (filename.endsWith('.model') && !filename.includes('/')) {
      modelFile = zip.files[filename];
      _modelFileName = filename;
    }
  });

  if (!modelFile) {
    throw new Error('No .model file found in 3MF package');
  }

  const modelXmlText = await modelFile.async('text');
  return parse3MFModel(modelXmlText);
}

function parse3MFModel(xmlText: string): THREE.Group {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Failed to parse 3MF XML');
  }

  const group = new THREE.Group();

  // Find all resources (objects)
  const resources = xmlDoc.getElementsByTagName('resources')[0];
  if (!resources) {
    throw new Error('No resources found in 3MF model');
  }

  // Parse all objects
  const objects = resources.getElementsByTagName('object');
  Array.from(objects).forEach((objectElem) => {
    const id = objectElem.getAttribute('id');
    const name = objectElem.getAttribute('name') || `Object_${id}`;

    // Get mesh data
    const mesh = objectElem.getElementsByTagName('mesh')[0];
    if (!mesh) return;

    // Parse vertices
    const vertices: number[] = [];
    const verticesElem = mesh.getElementsByTagName('vertices')[0];
    if (verticesElem) {
      const vertexElements = verticesElem.getElementsByTagName('vertex');
      Array.from(vertexElements).forEach((vertex) => {
        const x = parseFloat(vertex.getAttribute('x') || '0');
        const y = parseFloat(vertex.getAttribute('y') || '0');
        const z = parseFloat(vertex.getAttribute('z') || '0');
        vertices.push(x, y, z);
      });
    }

    // Parse triangles (faces)
    const indices: number[] = [];
    const trianglesElem = mesh.getElementsByTagName('triangles')[0];
    if (trianglesElem) {
      const triangleElements = trianglesElem.getElementsByTagName('triangle');
      Array.from(triangleElements).forEach((triangle) => {
        const v1 = parseInt(triangle.getAttribute('v1') || '0');
        const v2 = parseInt(triangle.getAttribute('v2') || '0');
        const v3 = parseInt(triangle.getAttribute('v3') || '0');
        indices.push(v1, v2, v3);
      });
    }

    // Create Three.js geometry
    if (vertices.length > 0 && indices.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
      geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
      geometry.computeVertexNormals();

      // Create material
      const material = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        roughness: 0.7,
        metalness: 0,
      });

      // Create mesh
      const threeGeometry = new THREE.Mesh(geometry, material);
      threeGeometry.name = name;
      group.add(threeGeometry);
    }
  });

  // If group is empty, create a default box
  if (group.children.length === 0) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
  }

  return group;
}

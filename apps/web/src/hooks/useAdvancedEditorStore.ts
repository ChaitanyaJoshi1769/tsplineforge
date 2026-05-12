'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import * as THREE from 'three';

interface MaterialDef {
  name: string;
  color: string;
  roughness: number;
  metalness: number;
  emissive: string;
}

export interface Layer {
  id: string;
  name: string;
  meshIds: Set<string>;
  visible: boolean;
  locked: boolean;
  color?: string;
}

export interface MeshGroup {
  id: string;
  name: string;
  meshIds: Set<string>;
  parentId?: string;
}

interface AdvancedEditorState {
  // View and rendering
  viewMode: 'solid' | 'wireframe' | 'material' | 'normal' | 'uv';
  shadingMode: 'flat' | 'smooth' | 'matcap';
  showGrid: boolean;
  gridSize: number;
  showAxes: boolean;

  // Selection modes
  selectionMode: 'single' | 'multi' | 'box' | 'byType';
  selectedMeshIds: Set<string>;

  // Transform constraints
  snapToGrid: boolean;
  snapGridSize: number;
  snapAngle: boolean;
  snapAngleValue: number; // degrees
  transformSpace: 'world' | 'local';

  // Layers and groups
  layers: Map<string, Layer>;
  activeLayer: string | null;
  groups: Map<string, MeshGroup>;

  // Tools and operations
  activeTool: 'move' | 'rotate' | 'scale' | 'measure' | 'boolean' | null;
  measurementData: { start: THREE.Vector3; end: THREE.Vector3; distance: number } | null;

  // Material system
  materialLibrary: Map<string, MaterialDef>;

  // Camera presets
  cameraPresets: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'iso' | 'free';

  // Actions
  setViewMode: (mode: AdvancedEditorState['viewMode']) => void;
  setShadingMode: (mode: AdvancedEditorState['shadingMode']) => void;
  setSelectionMode: (mode: AdvancedEditorState['selectionMode']) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  setSnapToGrid: (enabled: boolean) => void;
  setGridSize: (size: number) => void;
  setSnapAngle: (enabled: boolean, degrees?: number) => void;

  // Layer management
  createLayer: (name: string) => string;
  deleteLayer: (id: string) => void;
  setActiveLayer: (id: string | null) => void;
  addMeshToLayer: (meshId: string, layerId: string) => void;
  removeMeshFromLayer: (meshId: string, layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;

  // Group management
  createGroup: (name: string, parentId?: string) => string;
  deleteGroup: (id: string) => void;
  addMeshToGroup: (meshId: string, groupId: string) => void;
  removeMeshFromGroup: (meshId: string, groupId: string) => void;

  // Material library
  saveMaterial: (name: string, material: MaterialDef) => void;
  loadMaterial: (name: string) => MaterialDef | null;
  deleteMaterial: (name: string) => void;

  // Camera
  setCameraPreset: (preset: AdvancedEditorState['cameraPresets']) => void;

  // Tools
  setActiveTool: (tool: AdvancedEditorState['activeTool']) => void;
  setMeasurementData: (data: AdvancedEditorState['measurementData']) => void;
}

export const useAdvancedEditorStore = create<AdvancedEditorState>()(
  immer((set, get) => ({
    // Initial state
    viewMode: 'material',
    shadingMode: 'smooth',
    showGrid: true,
    gridSize: 1,
    showAxes: true,

    selectionMode: 'single',
    selectedMeshIds: new Set(),

    snapToGrid: false,
    snapGridSize: 0.5,
    snapAngle: false,
    snapAngleValue: 15,
    transformSpace: 'world',

    layers: new Map([['default', { id: 'default', name: 'Default', meshIds: new Set(), visible: true, locked: false }]]),
    activeLayer: 'default',
    groups: new Map(),

    activeTool: null,
    measurementData: null,

    materialLibrary: new Map([
      [
        'metallic',
        {
          name: 'Metallic',
          color: '#cccccc',
          roughness: 0.3,
          metalness: 1,
          emissive: '#000000',
        },
      ],
      [
        'plastic',
        {
          name: 'Plastic',
          color: '#ff6b35',
          roughness: 0.8,
          metalness: 0,
          emissive: '#000000',
        },
      ],
      [
        'rubber',
        {
          name: 'Rubber',
          color: '#1a1a1a',
          roughness: 0.95,
          metalness: 0,
          emissive: '#000000',
        },
      ],
      [
        'glass',
        {
          name: 'Glass',
          color: '#e0f7ff',
          roughness: 0.1,
          metalness: 0,
          emissive: '#000000',
        },
      ],
      [
        'gold',
        {
          name: 'Gold',
          color: '#ffd700',
          roughness: 0.4,
          metalness: 1,
          emissive: '#332200',
        },
      ],
    ]),

    cameraPresets: 'free',

    // View actions
    setViewMode: (mode) => {
      set((state) => {
        state.viewMode = mode;
      });
    },

    setShadingMode: (mode) => {
      set((state) => {
        state.shadingMode = mode;
      });
    },

    // Selection actions
    setSelectionMode: (mode) => {
      set((state) => {
        state.selectionMode = mode;
      });
    },

    addToSelection: (id) => {
      set((state) => {
        if (state.selectionMode === 'single') {
          state.selectedMeshIds.clear();
        }
        state.selectedMeshIds.add(id);
      });
    },

    removeFromSelection: (id) => {
      set((state) => {
        state.selectedMeshIds.delete(id);
      });
    },

    clearSelection: () => {
      set((state) => {
        state.selectedMeshIds.clear();
      });
    },

    // Grid and snap actions
    setSnapToGrid: (enabled) => {
      set((state) => {
        state.snapToGrid = enabled;
      });
    },

    setGridSize: (size) => {
      set((state) => {
        state.gridSize = size;
      });
    },

    setSnapAngle: (enabled, degrees) => {
      set((state) => {
        state.snapAngle = enabled;
        if (degrees !== undefined) {
          state.snapAngleValue = degrees;
        }
      });
    },

    // Layer management
    createLayer: (name) => {
      const id = `layer_${Date.now()}`;
      set((state) => {
        state.layers.set(id, {
          id,
          name,
          meshIds: new Set(),
          visible: true,
          locked: false,
        });
      });
      return id;
    },

    deleteLayer: (id) => {
      set((state) => {
        state.layers.delete(id);
        if (state.activeLayer === id) {
          state.activeLayer = 'default';
        }
      });
    },

    setActiveLayer: (id) => {
      set((state) => {
        state.activeLayer = id;
      });
    },

    addMeshToLayer: (meshId, layerId) => {
      set((state) => {
        const layer = state.layers.get(layerId);
        if (layer) {
          layer.meshIds.add(meshId);
        }
      });
    },

    removeMeshFromLayer: (meshId, layerId) => {
      set((state) => {
        const layer = state.layers.get(layerId);
        if (layer) {
          layer.meshIds.delete(meshId);
        }
      });
    },

    toggleLayerVisibility: (layerId) => {
      set((state) => {
        const layer = state.layers.get(layerId);
        if (layer) {
          layer.visible = !layer.visible;
        }
      });
    },

    toggleLayerLock: (layerId) => {
      set((state) => {
        const layer = state.layers.get(layerId);
        if (layer) {
          layer.locked = !layer.locked;
        }
      });
    },

    // Group management
    createGroup: (name, parentId) => {
      const id = `group_${Date.now()}`;
      set((state) => {
        state.groups.set(id, {
          id,
          name,
          meshIds: new Set(),
          parentId,
        });
      });
      return id;
    },

    deleteGroup: (id) => {
      set((state) => {
        state.groups.delete(id);
      });
    },

    addMeshToGroup: (meshId, groupId) => {
      set((state) => {
        const group = state.groups.get(groupId);
        if (group) {
          group.meshIds.add(meshId);
        }
      });
    },

    removeMeshFromGroup: (meshId, groupId) => {
      set((state) => {
        const group = state.groups.get(groupId);
        if (group) {
          group.meshIds.delete(meshId);
        }
      });
    },

    // Material library
    saveMaterial: (name, material) => {
      set((state) => {
        state.materialLibrary.set(name, {
          name,
          color: material.color || '#ffffff',
          roughness: material.roughness || 0.5,
          metalness: material.metalness || 0,
          emissive: material.emissive || '#000000',
        });
      });
    },

    loadMaterial: (name) => {
      return get().materialLibrary.get(name) || null;
    },

    deleteMaterial: (name) => {
      set((state) => {
        state.materialLibrary.delete(name);
      });
    },

    // Camera
    setCameraPreset: (preset) => {
      set((state) => {
        state.cameraPresets = preset;
      });
    },

    // Tools
    setActiveTool: (tool) => {
      set((state) => {
        state.activeTool = tool;
      });
    },

    setMeasurementData: (data) => {
      set((state) => {
        state.measurementData = data;
      });
    },
  }))
);

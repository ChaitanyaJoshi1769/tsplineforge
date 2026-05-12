'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import * as THREE from 'three';

export interface MeshTransform {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface MeshMaterial {
  color: string;
  opacity: number;
  roughness: number;
  metalness: number;
  emissive: string;
}

export interface EditorMesh {
  id: string;
  name: string;
  geometry: THREE.BufferGeometry | THREE.Group | null;
  transform: MeshTransform;
  material: MeshMaterial;
  object3d: THREE.Mesh | THREE.Group | null;
  isVisible: boolean;
}

interface EditorState {
  // Meshes
  meshes: Record<string, EditorMesh>;
  selectedMeshId: string | null;

  // Transform mode (G=move, R=rotate, S=scale)
  transformMode: 'move' | 'rotate' | 'scale' | null;
  transformSpace: 'world' | 'local';

  // Material presets
  materialPresets: Record<string, Partial<MeshMaterial>>;

  // Undo/Redo
  undoStack: EditorState['meshes'][];
  redoStack: EditorState['meshes'][];

  // Actions
  addMesh: (mesh: EditorMesh) => void;
  removeMesh: (id: string) => void;
  selectMesh: (id: string | null) => void;
  setTransform: (id: string, transform: Partial<MeshTransform>) => void;
  setMaterial: (id: string, material: Partial<MeshMaterial>) => void;
  duplicateMesh: (id: string) => void;
  setTransformMode: (mode: 'move' | 'rotate' | 'scale' | null) => void;
  toggleTransformSpace: () => void;
  applyMaterialPreset: (id: string, preset: string) => void;
  setObject3D: (id: string, object: THREE.Mesh | THREE.Group | null) => void;
  toggleVisibility: (id: string) => void;

  // History
  pushToHistory: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;

  // Reset
  resetMesh: (id: string) => void;
  resetAll: () => void;
}

const DEFAULT_MATERIAL: MeshMaterial = {
  color: '#3b82f6',
  opacity: 1,
  roughness: 0.7,
  metalness: 0,
  emissive: '#000000',
};

const MATERIAL_PRESETS: Record<string, Partial<MeshMaterial>> = {
  metallic: {
    color: '#a0a0a0',
    roughness: 0.2,
    metalness: 1,
  },
  plastic: {
    color: '#4a4a4a',
    roughness: 0.5,
    metalness: 0,
  },
  rubber: {
    color: '#1a1a1a',
    roughness: 0.8,
    metalness: 0,
  },
  glass: {
    color: '#ffffff',
    opacity: 0.3,
    roughness: 0.1,
    metalness: 0,
  },
  gold: {
    color: '#ffd700',
    roughness: 0.3,
    metalness: 1,
    emissive: '#ffaa00',
  },
};

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    meshes: {},
    selectedMeshId: null,
    transformMode: null,
    transformSpace: 'world',
    materialPresets: MATERIAL_PRESETS,
    undoStack: [],
    redoStack: [],

    addMesh: (mesh: EditorMesh) => {
      set((state) => {
        state.meshes[mesh.id] = {
          ...mesh,
          material: { ...DEFAULT_MATERIAL, ...mesh.material },
        };
        state.selectedMeshId = mesh.id;
        state.redoStack = [];
      });
    },

    removeMesh: (id: string) => {
      set((state) => {
        delete state.meshes[id];
        if (state.selectedMeshId === id) {
          state.selectedMeshId = null;
        }
        state.redoStack = [];
      });
    },

    selectMesh: (id: string | null) => {
      set((state) => {
        state.selectedMeshId = id;
      });
    },

    setTransform: (id: string, transform: Partial<MeshTransform>) => {
      set((state) => {
        if (state.meshes[id]) {
          state.meshes[id].transform = {
            ...state.meshes[id].transform,
            ...transform,
          };
        }
      });
    },

    setMaterial: (id: string, material: Partial<MeshMaterial>) => {
      set((state) => {
        if (state.meshes[id]) {
          state.meshes[id].material = {
            ...state.meshes[id].material,
            ...material,
          };
        }
      });
    },

    duplicateMesh: (id: string) => {
      const mesh = get().meshes[id];
      if (!mesh) return;

      const newId = `${id}_copy_${Date.now()}`;
      const newMesh: EditorMesh = {
        ...mesh,
        id: newId,
        name: `${mesh.name} (Copy)`,
        transform: {
          ...mesh.transform,
          position: [
            mesh.transform.position[0] + 1,
            mesh.transform.position[1],
            mesh.transform.position[2],
          ],
        },
      };

      set((state) => {
        state.meshes[newId] = newMesh;
        state.selectedMeshId = newId;
        state.redoStack = [];
      });
    },

    setTransformMode: (mode: 'move' | 'rotate' | 'scale' | null) => {
      set((state) => {
        state.transformMode = mode;
      });
    },

    toggleTransformSpace: () => {
      set((state) => {
        state.transformSpace = state.transformSpace === 'world' ? 'local' : 'world';
      });
    },

    applyMaterialPreset: (id: string, preset: string) => {
      const presetMaterial = get().materialPresets[preset];
      if (presetMaterial) {
        get().setMaterial(id, presetMaterial);
      }
    },

    setObject3D: (id: string, object: THREE.Mesh | THREE.Group | null) => {
      set((state) => {
        if (state.meshes[id]) {
          state.meshes[id].object3d = object;
        }
      });
    },

    toggleVisibility: (id: string) => {
      set((state) => {
        if (state.meshes[id]) {
          state.meshes[id].isVisible = !state.meshes[id].isVisible;
          if (state.meshes[id].object3d) {
            state.meshes[id].object3d!.visible = state.meshes[id].isVisible;
          }
        }
      });
    },

    pushToHistory: () => {
      set((state) => {
        state.undoStack.push(JSON.parse(JSON.stringify(state.meshes)));
        if (state.undoStack.length > 50) {
          state.undoStack.shift();
        }
        state.redoStack = [];
      });
    },

    undo: () => {
      const state = get();
      if (state.undoStack.length === 0) return;

      set((st) => {
        st.redoStack.push(JSON.parse(JSON.stringify(st.meshes)));
        st.meshes = JSON.parse(JSON.stringify(st.undoStack.pop()));
      });
    },

    redo: () => {
      const state = get();
      if (state.redoStack.length === 0) return;

      set((st) => {
        st.undoStack.push(JSON.parse(JSON.stringify(st.meshes)));
        st.meshes = JSON.parse(JSON.stringify(st.redoStack.pop()));
      });
    },

    clearHistory: () => {
      set((state) => {
        state.undoStack = [];
        state.redoStack = [];
      });
    },

    resetMesh: (id: string) => {
      set((state) => {
        if (state.meshes[id]) {
          state.meshes[id].transform = {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          };
          state.meshes[id].material = { ...DEFAULT_MATERIAL };
        }
      });
    },

    resetAll: () => {
      set((state) => {
        Object.values(state.meshes).forEach((mesh) => {
          mesh.transform = {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          };
          mesh.material = { ...DEFAULT_MATERIAL };
        });
      });
    },
  }))
);

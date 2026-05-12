'use client';

import { useEditorStore } from './useEditorStore';

export function useMeshOperations() {
  const store = useEditorStore();

  const duplicate = () => {
    if (store.selectedMeshId) {
      store.pushToHistory();
      store.duplicateMesh(store.selectedMeshId);
    }
  };

  const deleteMesh = () => {
    if (store.selectedMeshId) {
      store.pushToHistory();
      store.removeMesh(store.selectedMeshId);
    }
  };

  const resetTransform = () => {
    if (store.selectedMeshId) {
      store.pushToHistory();
      store.resetMesh(store.selectedMeshId);
    }
  };

  const resetAll = () => {
    store.pushToHistory();
    store.resetAll();
  };

  const toggleVisibility = () => {
    if (store.selectedMeshId) {
      store.toggleVisibility(store.selectedMeshId);
    }
  };

  const undo = () => {
    store.undo();
  };

  const redo = () => {
    store.redo();
  };

  return {
    duplicate,
    deleteMesh,
    resetTransform,
    resetAll,
    toggleVisibility,
    undo,
    redo,
    canUndo: store.undoStack.length > 0,
    canRedo: store.redoStack.length > 0,
  };
}

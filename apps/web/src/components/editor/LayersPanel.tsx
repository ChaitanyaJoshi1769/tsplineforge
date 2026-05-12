'use client';

import { useState } from 'react';
import { useAdvancedEditorStore } from '@/hooks/useAdvancedEditorStore';
import { useEditorStore } from '@/hooks/useEditorStore';
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2 } from 'lucide-react';

export function LayersPanel() {
  const advancedStore = useAdvancedEditorStore();
  const editorStore = useEditorStore();
  const [newLayerName, setNewLayerName] = useState('');
  const [showNewLayer, setShowNewLayer] = useState(false);

  const handleCreateLayer = () => {
    if (newLayerName.trim()) {
      advancedStore.createLayer(newLayerName);
      setNewLayerName('');
      setShowNewLayer(false);
    }
  };

  const handleAddMeshToLayer = (meshId: string, layerId: string) => {
    // Remove from all layers first
    advancedStore.layers.forEach((layer) => {
      advancedStore.removeMeshFromLayer(meshId, layer.id);
    });
    // Add to selected layer
    advancedStore.addMeshToLayer(meshId, layerId);
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      <div className="border-b border-border p-4">
        <h3 className="font-semibold text-sm mb-3">Layers</h3>

        <button
          onClick={() => setShowNewLayer(!showNewLayer)}
          className="w-full px-3 py-2 rounded bg-primary/20 border border-primary/30 text-xs font-medium hover:bg-primary/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Layer
        </button>

        {showNewLayer && (
          <div className="mt-2 space-y-2">
            <input
              type="text"
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
              placeholder="Layer name..."
              className="w-full px-2 py-1 rounded bg-background border border-border text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateLayer();
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCreateLayer}
                className="px-2 py-1 rounded bg-primary text-xs font-medium text-white hover:bg-primary/90"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewLayer(false)}
                className="px-2 py-1 rounded bg-card border border-border text-xs font-medium hover:border-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {Array.from(advancedStore.layers.values()).map((layer) => (
            <div
              key={layer.id}
              onClick={() => advancedStore.setActiveLayer(layer.id)}
              className={`rounded p-2 cursor-pointer transition-all ${
                advancedStore.activeLayer === layer.id
                  ? 'bg-primary/20 border border-primary/40'
                  : 'bg-card/50 hover:bg-card border border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium flex-1 truncate">{layer.name}</span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      advancedStore.toggleLayerVisibility(layer.id);
                    }}
                    className="p-1 hover:bg-white/10 rounded"
                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                  >
                    {layer.visible ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 opacity-50" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      advancedStore.toggleLayerLock(layer.id);
                    }}
                    className="p-1 hover:bg-white/10 rounded"
                    title={layer.locked ? 'Unlock layer' : 'Lock layer'}
                  >
                    {layer.locked ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 opacity-50" />
                    )}
                  </button>
                  {layer.id !== 'default' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        advancedStore.deleteLayer(layer.id);
                      }}
                      className="p-1 hover:bg-red-500/20 rounded"
                      title="Delete layer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500/70" />
                    </button>
                  )}
                </div>
              </div>

              {/* Meshes in layer */}
              <div className="mt-1 text-xs text-muted text-right">
                {layer.meshIds.size > 0 && <span>{layer.meshIds.size} mesh(es)</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current mesh's layer assignment */}
      {editorStore.selectedMeshId && (
        <div className="border-t border-border p-4">
          <div className="text-xs text-muted mb-2">Selected mesh layer:</div>
          <div className="space-y-1">
            {Array.from(advancedStore.layers.values()).map((layer) => (
              <button
                key={layer.id}
                onClick={() => handleAddMeshToLayer(editorStore.selectedMeshId!, layer.id)}
                className={`w-full px-2 py-1 rounded text-xs font-medium text-left transition-all ${
                  layer.meshIds.has(editorStore.selectedMeshId)
                    ? 'bg-primary/30 border border-primary/40'
                    : 'bg-card border border-border hover:border-primary/50'
                }`}
              >
                {layer.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

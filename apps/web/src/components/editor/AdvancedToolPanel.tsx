'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useEditorStore } from '@/hooks/useEditorStore';
import { useAdvancedEditorStore } from '@/hooks/useAdvancedEditorStore';
import { useGeometricOperations } from '@/hooks/useGeometricOperations';
import {
  Shapes,
  Grid3x3,
  FlipHorizontal,
  AlignCenter,
  Maximize2,
  Grid2x2,
  Eye,
} from 'lucide-react';

export function AdvancedToolPanel() {
  const editorStore = useEditorStore();
  const advancedStore = useAdvancedEditorStore();
  const geomOps = useGeometricOperations();

  const [arrayCount, setArrayCount] = useState(3);
  const [arrayOffset, setArrayOffset] = useState({ x: 1, y: 0, z: 0 });
  const [circularRadius, setCircularRadius] = useState(5);

  const selectedMeshId = editorStore.selectedMeshId;
  const selectedCount = advancedStore.selectedMeshIds.size;
  const hasSelection = selectedMeshId || selectedCount > 0;

  const renderGeometricOps = () => (
    <div className="space-y-4">
      {/* Array Operations */}
      <div className="border border-border rounded-lg p-4 bg-card/50">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Grid3x3 className="w-4 h-4" />
          Array
        </h4>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted font-medium">Linear Array</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <input
                type="number"
                min="1"
                max="100"
                value={arrayCount}
                onChange={(e) => setArrayCount(parseInt(e.target.value))}
                placeholder="Count"
                className="w-full px-2 py-1 rounded bg-background border border-border text-xs"
              />
              <input
                type="number"
                step="0.1"
                value={arrayOffset.x}
                onChange={(e) =>
                  setArrayOffset({ ...arrayOffset, x: parseFloat(e.target.value) })
                }
                placeholder="X Offset"
                className="w-full px-2 py-1 rounded bg-background border border-border text-xs"
              />
              <button
                onClick={() => geomOps.createLinearArray(arrayCount, [arrayOffset.x, arrayOffset.y, arrayOffset.z])}
                disabled={!selectedMeshId}
                className="px-2 py-1 rounded bg-primary text-xs font-medium text-white disabled:opacity-50 hover:bg-primary/90"
              >
                Create
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted font-medium">Circular Array</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input
                type="number"
                min="1"
                max="100"
                value={arrayCount}
                onChange={(e) => setArrayCount(parseInt(e.target.value))}
                placeholder="Count"
                className="w-full px-2 py-1 rounded bg-background border border-border text-xs"
              />
              <input
                type="number"
                step="0.1"
                value={circularRadius}
                onChange={(e) => setCircularRadius(parseFloat(e.target.value))}
                placeholder="Radius"
                className="w-full px-2 py-1 rounded bg-background border border-border text-xs"
              />
              <button
                onClick={() => geomOps.createCircularArray(arrayCount, circularRadius)}
                disabled={!selectedMeshId}
                className="col-span-2 px-2 py-1 rounded bg-primary text-xs font-medium text-white disabled:opacity-50 hover:bg-primary/90"
              >
                Create Circular Array
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mirror */}
      <div className="border border-border rounded-lg p-4 bg-card/50">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <FlipHorizontal className="w-4 h-4" />
          Mirror
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {(['x', 'y', 'z'] as const).map((axis) => (
            <button
              key={axis}
              onClick={() => geomOps.mirrorSelected(axis)}
              disabled={!selectedMeshId}
              className="px-2 py-2 rounded bg-primary/10 border border-primary/30 text-xs font-medium disabled:opacity-50 hover:bg-primary/20"
            >
              Mirror {axis.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Alignment */}
      {selectedCount > 1 && (
        <div className="border border-border rounded-lg p-4 bg-card/50">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <AlignCenter className="w-4 h-4" />
            Align & Distribute
          </h4>

          <div className="space-y-2">
            <div>
              <label className="text-xs text-muted font-medium block mb-1">Align</label>
              <div className="grid grid-cols-3 gap-1">
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <button
                    key={axis}
                    onClick={() => geomOps.alignSelected(axis, 'center')}
                    className="px-1 py-1 rounded bg-secondary/20 border border-secondary/30 text-xs font-medium hover:bg-secondary/30"
                  >
                    {axis}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted font-medium block mb-1">Distribute</label>
              <div className="grid grid-cols-3 gap-1">
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <button
                    key={axis}
                    onClick={() => geomOps.distributeSelected(axis)}
                    className="px-1 py-1 rounded bg-secondary/20 border border-secondary/30 text-xs font-medium hover:bg-secondary/30"
                  >
                    Dist {axis}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Merge */}
      {selectedCount > 1 && (
        <button
          onClick={() => geomOps.mergeSelected()}
          className="w-full px-3 py-2 rounded bg-accent/20 border border-accent/30 text-xs font-medium hover:bg-accent/30"
        >
          Merge Selected Meshes
        </button>
      )}
    </div>
  );

  const renderMeshOps = () => (
    <div className="space-y-4">
      {/* Subdivision */}
      {selectedMeshId && (
        <div className="border border-border rounded-lg p-4 bg-card/50">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Grid2x2 className="w-4 h-4" />
            Mesh Operations
          </h4>

          <div className="space-y-2">
            <button
              onClick={() => geomOps.subdivideSelected()}
              className="w-full px-3 py-2 rounded bg-primary/20 border border-primary/30 text-xs font-medium hover:bg-primary/30"
            >
              Subdivide
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => geomOps.smoothSelected(1)}
                className="px-2 py-2 rounded bg-primary/20 border border-primary/30 text-xs font-medium hover:bg-primary/30"
              >
                Smooth (1)
              </button>
              <button
                onClick={() => geomOps.smoothSelected(3)}
                className="px-2 py-2 rounded bg-primary/20 border border-primary/30 text-xs font-medium hover:bg-primary/30"
              >
                Smooth (3)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => geomOps.decimateSelected(0.7)}
                className="px-2 py-2 rounded bg-secondary/20 border border-secondary/30 text-xs font-medium hover:bg-secondary/30"
              >
                Decimate 70%
              </button>
              <button
                onClick={() => geomOps.decimateSelected(0.5)}
                className="px-2 py-2 rounded bg-secondary/20 border border-secondary/30 text-xs font-medium hover:bg-secondary/30"
              >
                Decimate 50%
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mesh Stats */}
      {selectedMeshId && (
        <div className="border border-border rounded-lg p-4 bg-card/50">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Shapes className="w-4 h-4" />
            Statistics
          </h4>
          {(() => {
            const stats = geomOps.getMeshStats(selectedMeshId);
            return stats ? (
              <div className="text-xs space-y-1 text-muted">
                <p>
                  Vertices: <span className="text-foreground font-medium">{stats.vertices.toFixed(0)}</span>
                </p>
                <p>
                  Faces: <span className="text-foreground font-medium">{stats.faces.toFixed(0)}</span>
                </p>
                <p>
                  Bounds:{' '}
                  <span className="text-foreground font-medium">
                    {stats.bounds.x.toFixed(2)} × {stats.bounds.y.toFixed(2)} × {stats.bounds.z.toFixed(2)}
                  </span>
                </p>
                <p>
                  Volume: <span className="text-foreground font-medium">{stats.volume.toFixed(2)}</span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted">No geometry data</p>
            );
          })()}
        </div>
      )}
    </div>
  );

  const renderViewOps = () => (
    <div className="space-y-4">
      {/* View Modes */}
      <div className="border border-border rounded-lg p-4 bg-card/50">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          View Mode
        </h4>
        <div className="space-y-2">
          {(['solid', 'wireframe', 'material', 'normal'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => advancedStore.setViewMode(mode)}
              className={`w-full px-3 py-2 rounded text-xs font-medium transition-all ${
                advancedStore.viewMode === mode
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border hover:border-primary'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Presets */}
      <div className="border border-border rounded-lg p-4 bg-card/50">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Maximize2 className="w-4 h-4" />
          Camera
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {(['front', 'top', 'left', 'iso'] as const).map((preset) => (
            <button
              key={preset}
              onClick={() => advancedStore.setCameraPreset(preset)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                advancedStore.cameraPresets === preset
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border hover:border-primary'
              }`}
            >
              {preset.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Settings */}
      <div className="border border-border rounded-lg p-4 bg-card/50">
        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Grid3x3 className="w-4 h-4" />
          Grid & Snap
        </h4>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={advancedStore.showGrid}
              onChange={(_e) => {
                // Note: This would need to be implemented in viewport
              }}
              className="w-4 h-4"
            />
            <span className="text-xs">Show Grid</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={advancedStore.snapToGrid}
              onChange={(e) => advancedStore.setSnapToGrid(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-xs">Snap to Grid</span>
          </label>

          <div>
            <label className="text-xs text-muted font-medium">Grid Size</label>
            <input
              type="number"
              step="0.1"
              value={advancedStore.gridSize}
              onChange={(e) => advancedStore.setGridSize(parseFloat(e.target.value))}
              className="w-full px-2 py-1 rounded bg-background border border-border text-xs mt-1"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={advancedStore.snapAngle}
              onChange={(e) => advancedStore.setSnapAngle(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-xs">Snap Angle</span>
          </label>

          <div>
            <label className="text-xs text-muted font-medium">Angle (°)</label>
            <input
              type="number"
              min="1"
              max="180"
              value={advancedStore.snapAngleValue}
              onChange={(e) => advancedStore.setSnapAngle(true, parseFloat(e.target.value))}
              className="w-full px-2 py-1 rounded bg-background border border-border text-xs mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      <Tabs defaultValue="geometry" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 bg-card rounded-none border-b border-border px-2">
          <TabsTrigger value="geometry" className="text-xs" title="Geometric Operations">
            <Shapes className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Geometry</span>
          </TabsTrigger>
          <TabsTrigger value="mesh" className="text-xs" title="Mesh Operations">
            <Grid2x2 className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Mesh</span>
          </TabsTrigger>
          <TabsTrigger value="view" className="text-xs" title="View & Render">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">View</span>
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="geometry" className="m-0">
            {renderGeometricOps()}
          </TabsContent>

          <TabsContent value="mesh" className="m-0">
            {renderMeshOps()}
          </TabsContent>

          <TabsContent value="view" className="m-0">
            {renderViewOps()}
          </TabsContent>
        </div>
      </Tabs>

      {!hasSelection && (
        <div className="border-t border-border p-3 bg-card/50 text-xs text-muted text-center">
          Select a mesh to enable tools
        </div>
      )}
    </div>
  );
}

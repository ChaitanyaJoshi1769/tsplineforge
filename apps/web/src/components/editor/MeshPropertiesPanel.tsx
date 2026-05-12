'use client';

import { useEffect, useState } from 'react';
import { useEditorStore } from '@/hooks/useEditorStore';
import { useMaterialEditor } from '@/hooks/useMaterialEditor';
import { useMeshOperations } from '@/hooks/useMeshOperations';
import { useToast } from '@/context/toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Copy, Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react';

export function MeshPropertiesPanel() {
  const store = useEditorStore();
  const materialEditor = useMaterialEditor();
  const meshOps = useMeshOperations();
  const { addToast } = useToast();

  const selectedMesh = store.selectedMeshId ? store.meshes[store.selectedMeshId] : null;

  const [position, setPosition] = useState([0, 0, 0]);
  const [rotation, setRotation] = useState([0, 0, 0]);
  const [scale, setScale] = useState([1, 1, 1]);

  // Sync transform values from store
  useEffect(() => {
    if (selectedMesh) {
      setPosition([...selectedMesh.transform.position]);
      setRotation([...selectedMesh.transform.rotation]);
      setScale([...selectedMesh.transform.scale]);
    }
  }, [selectedMesh?.id, selectedMesh?.transform]);

  if (!selectedMesh) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">Click on a mesh to edit properties</p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="transform" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="transform">Transform</TabsTrigger>
        <TabsTrigger value="material">Material</TabsTrigger>
        <TabsTrigger value="info">Info</TabsTrigger>
      </TabsList>

      {/* Transform Tab */}
      <TabsContent value="transform" className="space-y-4">
        <Card shadow="sm">
          <CardBody>
            <CardTitle>Position</CardTitle>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                <div key={axis}>
                  <label className="text-xs font-medium text-muted-foreground">{axis}</label>
                  <Input
                    type="number"
                    value={position[i].toFixed(2)}
                    onChange={(e) => {
                      const newPos = [...position] as [number, number, number];
                      newPos[i] = parseFloat(e.target.value) || 0;
                      setPosition(newPos);
                      store.setTransform(selectedMesh.id, { position: newPos });
                      store.pushToHistory();
                    }}
                    step="0.1"
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card shadow="sm">
          <CardBody>
            <CardTitle>Rotation</CardTitle>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                <div key={axis}>
                  <label className="text-xs font-medium text-muted-foreground">{axis}</label>
                  <Input
                    type="number"
                    value={((rotation[i] * 180) / Math.PI).toFixed(2)}
                    onChange={(e) => {
                      const newRot = [...rotation] as [number, number, number];
                      newRot[i] = (parseFloat(e.target.value) || 0) * (Math.PI / 180);
                      setRotation(newRot);
                      store.setTransform(selectedMesh.id, { rotation: newRot });
                      store.pushToHistory();
                    }}
                    step="1"
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card shadow="sm">
          <CardBody>
            <CardTitle>Scale</CardTitle>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                <div key={axis}>
                  <label className="text-xs font-medium text-muted-foreground">{axis}</label>
                  <Input
                    type="number"
                    value={scale[i].toFixed(2)}
                    onChange={(e) => {
                      const newScale = [...scale] as [number, number, number];
                      newScale[i] = Math.max(0.1, parseFloat(e.target.value) || 1);
                      setScale(newScale);
                      store.setTransform(selectedMesh.id, { scale: newScale });
                      store.pushToHistory();
                    }}
                    step="0.1"
                    min="0.1"
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              meshOps.resetTransform();
              setPosition([0, 0, 0]);
              setRotation([0, 0, 0]);
              setScale([1, 1, 1]);
              addToast({
                type: 'info',
                title: 'Transform reset',
                message: 'Mesh returned to origin',
              });
            }}
            className="flex items-center gap-2"
          >
            <RotateCcw size={14} /> Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              meshOps.duplicate();
              addToast({
                type: 'success',
                title: 'Mesh duplicated',
                message: 'A copy has been created',
              });
            }}
            className="flex items-center gap-2"
          >
            <Copy size={14} /> Duplicate
          </Button>
        </div>
      </TabsContent>

      {/* Material Tab */}
      <TabsContent value="material" className="space-y-4">
        <Card shadow="sm">
          <CardBody>
            <CardTitle>Color</CardTitle>
            <div className="flex gap-2 mt-3">
              <input
                type="color"
                value={selectedMesh.material.color}
                onChange={(e) => materialEditor.updateColor(e.target.value)}
                className="w-12 h-10 rounded-md border border-border cursor-pointer"
              />
              <Input
                type="text"
                value={selectedMesh.material.color}
                onChange={(e) => materialEditor.updateColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardBody>
        </Card>

        <Card shadow="sm">
          <CardBody>
            <CardTitle>Opacity</CardTitle>
            <div className="space-y-2 mt-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedMesh.material.opacity}
                onChange={(e) => materialEditor.updateOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-right">
                {(selectedMesh.material.opacity * 100).toFixed(0)}%
              </div>
            </div>
          </CardBody>
        </Card>

        <Card shadow="sm">
          <CardBody>
            <CardTitle>Roughness</CardTitle>
            <div className="space-y-2 mt-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedMesh.material.roughness}
                onChange={(e) => materialEditor.updateRoughness(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-right">
                {(selectedMesh.material.roughness * 100).toFixed(0)}%
              </div>
            </div>
          </CardBody>
        </Card>

        <Card shadow="sm">
          <CardBody>
            <CardTitle>Metalness</CardTitle>
            <div className="space-y-2 mt-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedMesh.material.metalness}
                onChange={(e) => materialEditor.updateMetalness(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-right">
                {(selectedMesh.material.metalness * 100).toFixed(0)}%
              </div>
            </div>
          </CardBody>
        </Card>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Presets</p>
          <div className="grid grid-cols-2 gap-2">
            {materialEditor.presets.map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                onClick={() => materialEditor.applyPreset(preset)}
                className="capitalize"
              >
                {preset}
              </Button>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* Info Tab */}
      <TabsContent value="info" className="space-y-4">
        <Card shadow="sm">
          <CardBody>
            <CardTitle>Mesh Name</CardTitle>
            <Input
              type="text"
              value={selectedMesh.name}
              onChange={(_e) => {
                // TODO: Add rename functionality to store
              }}
              className="mt-2"
              disabled
            />
          </CardBody>
        </Card>

        <Card shadow="sm">
          <CardBody>
            <CardTitle>Statistics</CardTitle>
            <div className="space-y-2 mt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visible:</span>
                <Badge variant={selectedMesh.isVisible ? 'primary' : 'secondary'}>
                  {selectedMesh.isVisible ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transform Mode:</span>
                <Badge variant="secondary" className="capitalize">
                  {store.transformMode || 'None'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Space:</span>
                <Badge variant="info" className="capitalize">
                  {store.transformSpace}
                </Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              meshOps.toggleVisibility();
              addToast({
                type: 'info',
                title: selectedMesh.isVisible ? 'Mesh hidden' : 'Mesh shown',
              });
            }}
            className="flex items-center gap-1 justify-center"
            title={selectedMesh.isVisible ? 'Hide' : 'Show'}
          >
            {selectedMesh.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => store.toggleTransformSpace()}
            className="text-xs"
          >
            {store.transformSpace === 'world' ? 'Local' : 'World'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              meshOps.deleteMesh();
              addToast({
                type: 'warning',
                title: 'Mesh deleted',
                message: 'Press Ctrl+Z to undo',
              });
            }}
            className="flex items-center gap-1 justify-center"
          >
            <Trash2 size={14} /> Delete
          </Button>
        </div>

        <div className="flex gap-2 text-xs text-muted-foreground">
          <div className="flex-1 space-y-1">
            <p>
              <span className="font-medium">Ctrl+Z</span> - Undo
            </p>
            <p>
              <span className="font-medium">Ctrl+Shift+Z</span> - Redo
            </p>
            <p>
              <span className="font-medium">Ctrl+Shift+D</span> - Duplicate
            </p>
          </div>
          <div className="flex-1 space-y-1">
            <p>
              <span className="font-medium">G</span> - Move
            </p>
            <p>
              <span className="font-medium">R</span> - Rotate
            </p>
            <p>
              <span className="font-medium">S</span> - Scale
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

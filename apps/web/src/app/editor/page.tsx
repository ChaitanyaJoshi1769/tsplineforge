'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth';
import { useEditorStore } from '@/hooks/useEditorStore';
import { useMaterialEditor } from '@/hooks/useMaterialEditor';
import { useMeshOperations } from '@/hooks/useMeshOperations';
import { MeshViewer } from '@/components/viewport/MeshViewer';
import { CADToolbar } from '@/components/editor/CADToolbar';
import { AIAssistant } from '@/components/claude/AIAssistant';
import { ImportModelDialog } from '@/components/editor/ImportModelDialog';
import type { LoaderResult } from '@/lib/modelLoaders';
import { Header } from '@/components/layout/Header';
import { StatusBar } from '@/components/layout/StatusBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Tooltip } from '@/components/ui/Tooltip';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ArrowLeft, Sparkles, Save, Download, Upload, RotateCcw, Copy, Trash2 } from 'lucide-react';
import * as THREE from 'three';

export default function EditorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [meshName, setMeshName] = useState('Untitled Mesh');
  const [isSaved, setIsSaved] = useState(true);
  const [meshStats, setMeshStats] = useState({
    vertices: 0,
    faces: 0,
    triangles: 0,
    isValid: true,
  });
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importedGeometry, setImportedGeometry] = useState<THREE.BufferGeometry | THREE.Group | null>(null);
  const editingFilePath = 'services/geometry-engine/src/curvature.rs';

  // Editor hooks
  const editorStore = useEditorStore();
  const materialEditor = useMaterialEditor();
  const meshOps = useMeshOperations();

  const selectedMesh = editorStore.selectedMeshId
    ? editorStore.meshes[editorStore.selectedMeshId]
    : null;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Lock scrolling while on the editor page (3D canvas owns the viewport).
  // Clean up on unmount so other pages can scroll normally.
  useEffect(() => {
    document.documentElement.classList.add('editor-active');
    document.body.classList.add('editor-active');
    return () => {
      document.documentElement.classList.remove('editor-active');
      document.body.classList.remove('editor-active');
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 animate-fadeIn">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted text-sm">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleMeshChange = (mesh: THREE.Mesh) => {
    setIsSaved(false);

    // Update stats from geometry
    if (mesh.geometry) {
      const positionAttr = mesh.geometry.getAttribute('position');
      const vertexCount = positionAttr?.count || 0;

      const indexAttr = mesh.geometry.getIndex();
      const faceCount = indexAttr ? indexAttr.count / 3 : 0;

      setMeshStats({
        vertices: vertexCount,
        faces: Math.floor(faceCount),
        triangles: Math.floor(faceCount),
        isValid: true,
      });
    }
  };

  const handleImportSuccess = (geometry: THREE.BufferGeometry | THREE.Group, stats: LoaderResult['stats']) => {
    setImportedGeometry(geometry);
    setIsSaved(false);

    // Update mesh stats from import
    setMeshStats({
      vertices: stats.vertexCount,
      faces: stats.faceCount,
      triangles: stats.faceCount,
      isValid: true,
    });
  };


  return (
    <div className="w-full h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <Header
        logo={
          <Tooltip content="Back to Dashboard">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-card-hover rounded-lg transition-colors text-muted hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </button>
          </Tooltip>
        }
        title={
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">
              {meshName}
              {!isSaved && <span className="text-xs text-warning ml-2">● Unsaved</span>}
            </h1>
            <p className="text-xs text-muted">CAD Editor</p>
          </div>
        }
        rightContent={
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Tooltip content="Import 3D model">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
                leftIcon={<Upload size={16} />}
              >
                Import
              </Button>
            </Tooltip>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsSaved(true);
              }}
              leftIcon={<Save size={16} />}
            >
              Save
            </Button>
            <Tooltip content="Ask Claude AI for help">
              <Button
                variant={showAIAssistant ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                leftIcon={<Sparkles size={16} />}
              >
                {showAIAssistant ? 'Close' : 'Claude'}
              </Button>
            </Tooltip>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              leftIcon={<Download size={16} />}
            >
              Export
            </Button>
          </div>
        }
      />

      {/* Main Editor Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar - Hidden on mobile */}
        <div className="hidden md:flex md:w-56 border-r border-border/50 bg-card/50 backdrop-blur-sm p-4 overflow-y-auto space-y-2">
          <div className="mb-4">
            <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-2">
              Tools
            </div>
            <CADToolbar onToolSelect={() => {}} />
          </div>
        </div>

        {/* Center - 3D Viewport */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <MeshViewer
            autoRotate={false}
            showWireframe={false}
            editable={true}
            importedGeometry={importedGeometry}
            onMeshChange={handleMeshChange}
          />

          {/* Viewport Controls Legend */}
          <div className="absolute top-4 right-4 text-xs text-muted space-y-1 pointer-events-none">
            <div className="bg-background/80 backdrop-blur px-3 py-2 rounded-lg border border-border">
              <div className="font-semibold text-foreground mb-1">Controls</div>
              <div>🖱️ Rotate • Scroll Zoom • Space Pan</div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties or AI - Hidden on mobile */}
        <div className={`hidden lg:flex lg:flex-col border-l border-border/50 bg-card/50 backdrop-blur-sm overflow-y-auto transition-all duration-300 ${
          showAIAssistant ? 'lg:w-96' : 'lg:w-80'
        }`}>
          {/* Quick actions for selected mesh */}
          {!showAIAssistant && selectedMesh && (
            <div className="border-b border-border/50 p-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Tooltip content="Duplicate (Shift+D)">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      editorStore.pushToHistory();
                      meshOps.duplicate();
                    }}
                    className="w-full"
                  >
                    <Copy size={16} />
                  </Button>
                </Tooltip>
                <Tooltip content="Delete (Delete)">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      editorStore.pushToHistory();
                      meshOps.deleteMesh();
                    }}
                    className="w-full"
                  >
                    <Trash2 size={16} />
                  </Button>
                </Tooltip>
                <Tooltip content="Reset Transform">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => meshOps.resetTransform()}
                    className="w-full"
                  >
                    <RotateCcw size={16} />
                  </Button>
                </Tooltip>
              </div>
            </div>
          )}
          {showAIAssistant ? (
            <div className="h-full flex flex-col">
              <AIAssistant
                filePath={editingFilePath}
                language="rust"
                currentCode={`// Current code from ${editingFilePath}`}
                onAcceptChange={() => {
                  setIsSaved(false);
                }}
                onClose={() => setShowAIAssistant(false)}
              />
            </div>
          ) : (
            <div className="h-full flex flex-col p-4 space-y-4">
              {/* Properties Tabs */}
              <Tabs defaultValue="properties">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="inspector">Inspector</TabsTrigger>
                </TabsList>

                {/* Properties Tab */}
                <TabsContent value="properties" className="space-y-4">
                  {/* Mesh Properties Card */}
                  <Card shadow="sm">
                    <CardBody className="space-y-3">
                      <CardTitle className="text-sm">Mesh</CardTitle>
                      <Input
                        label="Name"
                        value={meshName}
                        onChange={(e) => {
                          setMeshName(e.target.value);
                          setIsSaved(false);
                        }}
                        fullWidth
                      />
                    </CardBody>
                  </Card>

                  {/* Transform Card */}
                  <Card shadow="sm">
                    <CardBody className="space-y-3">
                      <CardTitle className="text-sm">Transform</CardTitle>
                      {selectedMesh ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase">Position X</label>
                            <input
                              type="number"
                              value={selectedMesh.transform.position[0].toFixed(2)}
                              onChange={(e) => {
                                editorStore.setTransform(selectedMesh.id, {
                                  position: [parseFloat(e.target.value), selectedMesh.transform.position[1], selectedMesh.transform.position[2]],
                                });
                              }}
                              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase">Position Y</label>
                            <input
                              type="number"
                              value={selectedMesh.transform.position[1].toFixed(2)}
                              onChange={(e) => {
                                editorStore.setTransform(selectedMesh.id, {
                                  position: [selectedMesh.transform.position[0], parseFloat(e.target.value), selectedMesh.transform.position[2]],
                                });
                              }}
                              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase">Position Z</label>
                            <input
                              type="number"
                              value={selectedMesh.transform.position[2].toFixed(2)}
                              onChange={(e) => {
                                editorStore.setTransform(selectedMesh.id, {
                                  position: [selectedMesh.transform.position[0], selectedMesh.transform.position[1], parseFloat(e.target.value)],
                                });
                              }}
                              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase">Scale</label>
                            <input
                              type="number"
                              value={selectedMesh.transform.scale[0].toFixed(2)}
                              onChange={(e) => {
                                const scale = parseFloat(e.target.value);
                                editorStore.setTransform(selectedMesh.id, {
                                  scale: [scale, scale, scale],
                                });
                              }}
                              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted">Select a mesh to edit</p>
                      )}
                    </CardBody>
                  </Card>

                  {/* Appearance Card */}
                  <Card shadow="sm">
                    <CardBody className="space-y-3">
                      <CardTitle className="text-sm">Appearance</CardTitle>
                      {selectedMesh ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase">Color</label>
                            <input
                              type="color"
                              value={selectedMesh.material.color}
                              onChange={(e) => materialEditor.updateColor(e.target.value)}
                              className="w-full h-10 rounded-md cursor-pointer"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase">Opacity</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={selectedMesh.material.opacity}
                              onChange={(e) => materialEditor.updateOpacity(parseFloat(e.target.value))}
                              className="w-full"
                            />
                            <span className="text-xs text-muted">{(selectedMesh.material.opacity * 100).toFixed(0)}%</span>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground uppercase">Roughness</label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={selectedMesh.material.roughness}
                              onChange={(e) => materialEditor.updateRoughness(parseFloat(e.target.value))}
                              className="w-full"
                            />
                            <span className="text-xs text-muted">{(selectedMesh.material.roughness * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted">Select a mesh to edit</p>
                      )}
                    </CardBody>
                  </Card>
                </TabsContent>

                {/* Inspector Tab */}
                <TabsContent value="inspector" className="space-y-4">
                  <Card shadow="sm">
                    <CardBody className="space-y-3">
                      <CardTitle className="text-sm">Statistics</CardTitle>
                      <Separator />
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted">Vertices:</span>
                          <Badge variant="primary" size="sm">{meshStats.vertices.toLocaleString()}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted">Faces:</span>
                          <Badge variant="info" size="sm">{meshStats.faces.toLocaleString()}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted">Triangles:</span>
                          <Badge variant="secondary" size="sm">{meshStats.triangles.toLocaleString()}</Badge>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-border/50">
                          <span className="text-muted">Status:</span>
                          <Badge
                            variant={meshStats.isValid ? 'success' : 'error'}
                            size="sm"
                            dot
                          >
                            {meshStats.isValid ? 'Valid' : 'Invalid'}
                          </Badge>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        leftContent={
          <>
            <span>📊 {meshStats.vertices.toLocaleString()} vertices</span>
            <span>• {meshStats.faces.toLocaleString()} faces</span>
          </>
        }
        rightContent={
          <>
            <span>✓ Ready</span>
          </>
        }
      />

      {/* Import Model Dialog */}
      <ImportModelDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}

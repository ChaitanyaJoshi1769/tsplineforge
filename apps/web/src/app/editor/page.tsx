'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth';
import { MeshViewer } from '@/components/viewport/MeshViewer';
import { CADToolbar } from '@/components/editor/CADToolbar';
import { PropertyInspector } from '@/components/editor/PropertyInspector';
import { AIAssistant } from '@/components/claude/AIAssistant';
import { ArrowLeft, Sparkles } from 'lucide-react';
import * as THREE from 'three';

export default function EditorPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedMesh, setSelectedMesh] = useState<THREE.Mesh | null>(null);
  const [meshName, setMeshName] = useState('Untitled Mesh');
  const [meshStats, setMeshStats] = useState({
    vertices: 0,
    faces: 0,
    triangles: 0,
    isValid: true,
  });
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [editingFilePath, setEditingFilePath] = useState('services/geometry-engine/src/curvature.rs');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleMeshChange = (mesh: THREE.Mesh) => {
    setSelectedMesh(mesh);

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

  const meshProperties = [
    {
      name: 'Name',
      value: meshName,
      type: 'text' as const,
      onChange: (v: string | number) => setMeshName(String(v)),
    },
    {
      name: 'Vertices',
      value: meshStats.vertices,
      type: 'number' as const,
      onChange: () => {},
    },
    {
      name: 'Faces',
      value: meshStats.faces,
      type: 'number' as const,
      onChange: () => {},
    },
    {
      name: 'Validity',
      value: meshStats.isValid ? 'Valid' : 'Invalid',
      type: 'select' as const,
      options: ['Valid', 'Invalid'],
      onChange: () => {},
    },
  ];

  return (
    <div className="w-full h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between h-16 border-b border-border px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-card rounded-lg transition-colors"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{meshName}</h1>
            <p className="text-xs text-muted-foreground">CAD Editor • {user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Sparkles size={16} />
            {showAIAssistant ? 'Hide' : 'Ask Claude'}
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
            Save
          </button>
          <button className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-card/80 transition-colors text-sm font-medium">
            Export
          </button>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar - Tools */}
        <div className="w-56 border-r border-border bg-card/40 p-4 overflow-y-auto">
          <CADToolbar onToolSelect={(toolId) => console.log('Selected tool:', toolId)} />
        </div>

        {/* Center - 3D Viewport */}
        <div className="flex-1 flex flex-col">
          <MeshViewer
            autoRotate={false}
            showWireframe={false}
            editable={true}
            onMeshChange={handleMeshChange}
          />
        </div>

        {/* Right Sidebar - Properties or AI Assistant */}
        <div className={`${showAIAssistant ? 'w-96' : 'w-72'} border-l border-border bg-card/40 p-4 overflow-y-auto`}>
          {showAIAssistant ? (
            <AIAssistant
              filePath={editingFilePath}
              language="rust"
              currentCode={`// Current code from ${editingFilePath}`}
              onAcceptChange={(newCode) => {
                console.log('Accepted changes:', newCode);
                // In a real implementation, this would update the file
              }}
              onClose={() => setShowAIAssistant(false)}
            />
          ) : (
            <div className="space-y-4">
          <PropertyInspector title="Mesh Properties" properties={meshProperties} />

          <div className="border-t border-border pt-4">
            <PropertyInspector
              title="Transform"
              properties={[
                {
                  name: 'Position X',
                  value: 0,
                  type: 'number',
                  onChange: () => {},
                },
                {
                  name: 'Position Y',
                  value: 0,
                  type: 'number',
                  onChange: () => {},
                },
                {
                  name: 'Position Z',
                  value: 0,
                  type: 'number',
                  onChange: () => {},
                },
                {
                  name: 'Rotation X',
                  value: 0,
                  type: 'number',
                  onChange: () => {},
                },
                {
                  name: 'Rotation Y',
                  value: 0,
                  type: 'number',
                  onChange: () => {},
                },
                {
                  name: 'Rotation Z',
                  value: 0,
                  type: 'number',
                  onChange: () => {},
                },
                {
                  name: 'Scale',
                  value: 1,
                  type: 'number',
                  onChange: () => {},
                },
              ]}
            />
          </div>

          <div className="border-t border-border pt-4">
            <PropertyInspector
              title="Appearance"
              properties={[
                {
                  name: 'Color',
                  value: '#3b82f6',
                  type: 'text',
                  onChange: () => {},
                },
                {
                  name: 'Opacity',
                  value: 1,
                  type: 'number',
                  onChange: () => {},
                },
                {
                  name: 'Metallic',
                  value: 0,
                  type: 'number',
                  onChange: () => {},
                },
                {
                  name: 'Roughness',
                  value: 0.5,
                  type: 'number',
                  onChange: () => {},
                },
              ]}
            />
          </div>

          {/* Statistics */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vertices:</span>
                <span className="font-mono">{meshStats.vertices}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Faces:</span>
                <span className="font-mono">{meshStats.faces}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Triangles:</span>
                <span className="font-mono">{meshStats.triangles}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className={meshStats.isValid ? 'text-success' : 'text-error'}>
                  {meshStats.isValid ? 'Valid' : 'Invalid'}
                </span>
              </div>
            </div>
          </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Grid, FolderOpen, Upload } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  meshes: string[];
  createdAt: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/project`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      return response.data.projects as Project[];
    },
    enabled: !!user,
  });

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">TSplineForge</h1>
            <p className="text-foreground/60 text-sm">Welcome back, {user.email}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/editor')}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded font-medium transition flex items-center gap-2">
              <Plus size={18} />
              Open Editor
            </button>
            <button className="bg-secondary hover:bg-secondary-dark text-white px-4 py-2 rounded font-medium transition flex items-center gap-2">
              <Upload size={18} />
              Upload Mesh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Projects Grid */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Grid size={24} className="text-primary" />
            <h2 className="text-2xl font-bold">Your Projects</h2>
          </div>

          {projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-card border border-border rounded-lg p-6 hover:bg-card-hover transition cursor-pointer"
                  onClick={() => router.push(`/project/${project.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <FolderOpen size={24} className="text-primary mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{project.name}</h3>
                      <p className="text-foreground/60 text-sm line-clamp-2">
                        {project.description || 'No description'}
                      </p>
                      <p className="text-foreground/40 text-xs mt-3">
                        {project.meshes.length} mesh{project.meshes.length !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <FolderOpen size={48} className="mx-auto text-foreground/30 mb-4" />
              <p className="text-foreground/60 mb-4">No projects yet</p>
              <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded font-medium transition">
                Create Your First Project
              </button>
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-foreground/60 text-center py-8">
              No recent activity yet. Upload a mesh to get started!
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

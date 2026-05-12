'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Header } from '@/components/layout/Header';
import { Sidebar, SidebarItem, SidebarSection } from '@/components/layout/Sidebar';
import { Card, CardBody, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { formatRelativeTime } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description: string;
  meshes: string[];
  createdAt: string;
}

export function DashboardContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [mounted, setMounted] = useState(false);

  // Only render after component mounts to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const { data: projects, isLoading, error: queryError } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        console.log('Fetching projects from:', apiUrl);

        const response = await axios.get(`${apiUrl}/api/project`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.data || !response.data.projects) {
          throw new Error('Invalid response format from server');
        }

        return response.data.projects as Project[];
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            router.push('/');
            throw new Error('Authentication expired. Please login again.');
          }
          throw new Error(`Server error: ${error.response?.status} ${error.response?.statusText}`);
        }
        throw error;
      }
    },
    enabled: !!user && mounted,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Filter and sort projects
  const filteredProjects = (projects || [])
    .filter((p) =>
      (p.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (p.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      try {
        switch (sortBy) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          default:
            return 0;
        }
      } catch (err) {
        console.error('Error sorting projects:', err);
        return 0;
      }
    });

  if (loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4 animate-fadeIn">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        logo={
          <div className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ✦ Forge
          </div>
        }
        collapsible
        footer={
          <div className="text-xs text-muted">
            <p className="font-medium mb-1">{user.email}</p>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={() => {
                localStorage.removeItem('token');
                router.push('/');
              }}
              className="justify-start"
            >
              Sign Out
            </Button>
          </div>
        }
      >
        <SidebarSection title="Workspace">
          <SidebarItem
            icon="📊"
            active={true}
            onClick={() => router.push('/dashboard')}
          >
            Projects
          </SidebarItem>
          <SidebarItem
            icon="📁"
            onClick={() => {
              alert('Recent projects feature coming soon');
            }}
          >
            Recent
          </SidebarItem>
          <SidebarItem
            icon="⭐"
            onClick={() => {
              alert('Favorites feature coming soon');
            }}
          >
            Favorites
          </SidebarItem>
        </SidebarSection>

        <SidebarSection title="Tools">
          <SidebarItem
            icon="✏️"
            onClick={() => router.push('/editor')}
          >
            Editor
          </SidebarItem>
          <SidebarItem
            icon="⚙️"
            onClick={() => router.push('/settings')}
          >
            Settings
          </SidebarItem>
        </SidebarSection>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          title={
            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-semibold text-foreground">
                Welcome back, {user.email.split('@')[0]}
              </h1>
              <p className="text-xs md:text-sm text-muted">Manage your T-Spline projects</p>
            </div>
          }
          rightContent={
            <div className="flex gap-2 items-center">
              <ThemeToggle />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  alert('Project upload feature coming soon');
                }}
                className="hidden sm:inline-flex"
              >
                ⬆ Upload
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/editor')}
              >
                <span className="hidden sm:inline">✏️ New Project</span>
                <span className="sm:hidden">✏️ New</span>
              </Button>
            </div>
          }
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8">
          {/* Error State */}
          {queryError && (
            <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-error text-lg mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="font-medium text-error">Failed to load projects</p>
                  <p className="text-sm text-error/80 mt-1">
                    {queryError instanceof Error ? queryError.message : 'An unknown error occurred'}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                    >
                      Try Again
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('Debug info:', {
                          apiUrl: process.env.NEXT_PUBLIC_API_URL,
                          token: localStorage.getItem('token') ? 'exists' : 'missing',
                        });
                      }}
                    >
                      Debug
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="mb-6 md:mb-8 space-y-3 md:space-y-4">
            <div className="flex gap-3 md:gap-4 flex-col md:flex-row md:items-end">
              <div className="flex-1 min-w-0">
                <Input
                  label="Search projects"
                  placeholder="Find a project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  fullWidth
                  icon="🔍"
                />
              </div>
              <div className="flex gap-2 flex-wrap md:flex-nowrap">
                <Button
                  variant={sortBy === 'newest' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('newest')}
                  className="flex-1 md:flex-none text-xs md:text-sm"
                >
                  Newest
                </Button>
                <Button
                  variant={sortBy === 'oldest' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('oldest')}
                  className="flex-1 md:flex-none text-xs md:text-sm"
                >
                  Oldest
                </Button>
                <Button
                  variant={sortBy === 'name' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('name')}
                  className="flex-1 md:flex-none text-xs md:text-sm"
                >
                  Name
                </Button>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          {isLoading && !queryError ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} shadow="md">
                  <CardBody className="space-y-3">
                    <Skeleton variant="line" height={20} width="70%" />
                    <Skeleton variant="line" height={16} count={2} />
                    <Skeleton variant="line" height={14} width="40%" />
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : !queryError && filteredProjects.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-muted">
                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <Card
                    key={project.id}
                    interactive
                    shadow="md"
                    onClick={() => router.push(`/project/${project.id}`)}
                    className="cursor-pointer group hover-lift"
                  >
                    <CardBody className="space-y-4">
                      {/* Icon & Title */}
                      <div className="flex items-start gap-3">
                        <div className="text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-200">
                          📁
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors duration-200">
                            {project.name}
                          </CardTitle>
                          <p className="text-xs text-muted mt-0.5">
                            {formatRelativeTime(project.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <CardDescription className="line-clamp-2">
                        {project.description || 'No description provided'}
                      </CardDescription>

                      {/* Metadata */}
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <Badge variant="primary" size="sm" dot>
                          {project.meshes.length} mesh
                          {project.meshes.length !== 1 ? 'es' : ''}
                        </Badge>
                        <span className="text-xs text-muted/60 group-hover:text-muted transition-colors">
                          Click to open →
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                No projects found
              </h3>
              <p className="text-muted text-center mb-8 max-w-sm">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : "You haven't created any projects yet. Start by creating a new one!"}
              </p>
              {!searchQuery && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => router.push('/editor')}
                >
                  Create Your First Project
                </Button>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

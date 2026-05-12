import { NextRequest, NextResponse } from 'next/server';

// In-memory project database (demo purposes - use real DB in production)
const projects: Record<string, { id: string; name: string; description: string; meshes: string[]; createdAt: string }[]> = {
  'user_1': [
    {
      id: 'project_1',
      name: 'Sample Model',
      description: 'A sample 3D model for demonstration purposes',
      meshes: ['mesh_1', 'mesh_2'],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'project_2',
      name: 'Prototype Design',
      description: 'Early prototype iteration with basic geometry',
      meshes: ['mesh_3'],
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'project_3',
      name: 'Final Model',
      description: 'Production-ready model with optimized geometry',
      meshes: ['mesh_4', 'mesh_5', 'mesh_6'],
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    // Get user ID from token (simplified - in production, verify JWT)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For demo: extract user ID from token (in production, verify JWT properly)
    // For now, return demo user's projects
    const userProjects = projects['user_1'] || [];

    return NextResponse.json(
      { projects: userProjects },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user ID from token (simplified)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Create new project (in production, save to database)
    const projectId = `project_${Date.now()}`;
    const newProject = {
      id: projectId,
      name,
      description: description || '',
      meshes: [],
      createdAt: new Date().toISOString(),
    };

    // Add to demo user's projects
    if (!projects['user_1']) {
      projects['user_1'] = [];
    }
    projects['user_1'].push(newProject);

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { Router, Request, Response } from 'express';
import { logger } from '../services/logger';
import { v4 as uuidv4 } from 'uuid';

export const projectRouter = Router();

interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  meshes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const projects: Map<string, Project> = new Map();

projectRouter.get('/', (req: Request, res: Response) => {
  const userProjects = Array.from(projects.values()).filter((p) => p.userId === req.user?.id);

  res.json({
    projects: userProjects,
    total: userProjects.length,
  });
});

projectRouter.post('/', (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name required' });
    }

    const projectId = uuidv4();
    const project: Project = {
      id: projectId,
      userId: req.user!.id,
      name,
      description: description || '',
      meshes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    projects.set(projectId, project);

    logger.info(`Project created: ${projectId} by ${req.user?.email}`);

    res.status(201).json(project);
  } catch (error) {
    logger.error({ error }, 'Project creation failed');
    res.status(500).json({ error: 'Creation failed' });
  }
});

projectRouter.get('/:id', (req: Request, res: Response) => {
  const project = projects.get(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(project);
});

projectRouter.patch('/:id', (req: Request, res: Response) => {
  const project = projects.get(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { name, description } = req.body;
  if (name) project.name = name;
  if (description !== undefined) project.description = description;
  project.updatedAt = new Date();

  logger.info(`Project updated: ${req.params.id}`);

  res.json(project);
});

projectRouter.delete('/:id', (req: Request, res: Response) => {
  const project = projects.get(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  projects.delete(req.params.id);

  logger.info(`Project deleted: ${req.params.id}`);

  res.json({ message: 'Project deleted' });
});

projectRouter.post('/:id/meshes', (req: Request, res: Response) => {
  const project = projects.get(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { meshId } = req.body;
  if (!meshId) {
    return res.status(400).json({ error: 'Mesh ID required' });
  }

  if (!project.meshes.includes(meshId)) {
    project.meshes.push(meshId);
  }

  project.updatedAt = new Date();
  res.json(project);
});

projectRouter.delete('/:id/meshes/:meshId', (req: Request, res: Response) => {
  const project = projects.get(req.params.id);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  project.meshes = project.meshes.filter((m) => m !== req.params.meshId);
  project.updatedAt = new Date();

  res.json(project);
});

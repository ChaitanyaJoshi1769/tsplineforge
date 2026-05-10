import { Router, Request, Response } from 'express';
import { logger } from '../services/logger';
import { v4 as uuidv4 } from 'uuid';

export const meshRouter = Router();

// TODO: Connect to actual storage (S3, database)
interface Mesh {
  id: string;
  userId: string;
  name: string;
  format: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
}

const meshes: Map<string, Mesh> = new Map();

meshRouter.get('/', (req: Request, res: Response) => {
  const userMeshes = Array.from(meshes.values()).filter((m) => m.userId === req.user?.id);
  res.json({
    meshes: userMeshes,
    total: userMeshes.length,
  });
});

meshRouter.get('/:id', (req: Request, res: Response) => {
  const mesh = meshes.get(req.params.id);

  if (!mesh) {
    return res.status(404).json({ error: 'Mesh not found' });
  }

  if (mesh.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(mesh);
});

meshRouter.post('/upload', async (req: Request, res: Response) => {
  try {
    const { name, format, data } = req.body;

    if (!name || !format || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const meshId = uuidv4();
    const mesh: Mesh = {
      id: meshId,
      userId: req.user!.id,
      name,
      format,
      size: Buffer.byteLength(data, 'base64'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    meshes.set(meshId, mesh);

    logger.info(`Mesh uploaded: ${meshId} by ${req.user?.email}`);

    res.status(201).json({
      id: meshId,
      ...mesh,
    });
  } catch (error) {
    logger.error({ error }, 'Mesh upload failed');
    res.status(500).json({ error: 'Upload failed' });
  }
});

meshRouter.delete('/:id', (req: Request, res: Response) => {
  const mesh = meshes.get(req.params.id);

  if (!mesh) {
    return res.status(404).json({ error: 'Mesh not found' });
  }

  if (mesh.userId !== req.user?.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  meshes.delete(req.params.id);

  logger.info(`Mesh deleted: ${req.params.id} by ${req.user?.email}`);

  res.json({ message: 'Mesh deleted' });
});

meshRouter.post('/:id/validate', (req: Request, res: Response) => {
  const mesh = meshes.get(req.params.id);

  if (!mesh) {
    return res.status(404).json({ error: 'Mesh not found' });
  }

  // TODO: Call geometry engine for validation
  res.json({
    meshId: mesh.id,
    isValid: true,
    issues: [],
    suggestions: [],
  });
});

meshRouter.post('/:id/remesh', (req: Request, res: Response) => {
  const mesh = meshes.get(req.params.id);

  if (!mesh) {
    return res.status(404).json({ error: 'Mesh not found' });
  }

  // TODO: Call remesh engine
  res.json({
    jobId: uuidv4(),
    status: 'queued',
    progress: 0,
  });
});

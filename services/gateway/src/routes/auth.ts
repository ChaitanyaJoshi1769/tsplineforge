import { Router, Request, Response } from 'express';
import { generateToken } from '../middleware/auth';
import { logger } from '../services/logger';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const authRouter = Router();

// TODO: Connect to actual database
const users: Map<string, { id: string; email: string; passwordHash: string; role: string }> = new Map();

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (users.has(email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const userId = uuidv4();
    const passwordHash = await bcryptjs.hash(password, 10);

    users.set(email, {
      id: userId,
      email,
      passwordHash,
      role: 'user',
    });

    const token = generateToken(userId, email, 'user');

    logger.info(`User registered: ${email}`);
    res.status(201).json({
      id: userId,
      email,
      token,
    });
  } catch (error) {
    logger.error({ error }, 'Registration failed');
    res.status(500).json({ error: 'Registration failed' });
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = users.get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordValid = await bcryptjs.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email, user.role);

    logger.info(`User logged in: ${email}`);
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    logger.error({ error }, 'Login failed');
    res.status(500).json({ error: 'Login failed' });
  }
});

authRouter.post('/logout', (req: Request, res: Response) => {
  // Token-based auth means logout is client-side
  res.json({ message: 'Logged out' });
});

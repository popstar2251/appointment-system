import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';

// Extends Express's Request type so downstream handlers can access req.admin
declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; email: string };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.token as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    req.admin = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
};

import { Request, Response } from 'express';
import { login } from '../services/auth';
import { signToken } from '../lib/auth';

const COOKIE_OPTIONS = {
  httpOnly: true,      // not accessible from JS — prevents XSS token theft
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production', // HTTPS-only in production
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

export const loginHandler = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = await login(email, password);
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signToken({ id: user.id, email: user.email });
  res.cookie('token', token, COOKIE_OPTIONS);
  res.json({ email: user.email });
};

export const logoutHandler = (req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ ok: true });
};

export const meHandler = (req: Request, res: Response): void => {
  // req.admin is set by requireAuth middleware
  if (!req.admin) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ email: req.admin.email });
};

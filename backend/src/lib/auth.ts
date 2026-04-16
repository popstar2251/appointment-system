import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const PLACEHOLDER = 'REPLACE_ME_WITH_OUTPUT_OF_openssl_rand_base64_32';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === PLACEHOLDER) {
    throw new Error(
      'JWT_SECRET is missing or still set to the placeholder value. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }
  return secret;
}

export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, 12);

export const verifyPassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);

export const signToken = (payload: { id: string; email: string }): string =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });

export const verifyToken = (token: string): { id: string; email: string } => {
  const decoded = jwt.verify(token, getJwtSecret());
  if (typeof decoded === 'string') throw new Error('Invalid token');
  return decoded as { id: string; email: string };
};

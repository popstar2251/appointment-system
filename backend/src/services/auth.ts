import prisma from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/auth';

export const login = async (email: string, password: string) => {
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;
  return user;
};

// Called on server startup. Creates the admin user from env vars if one doesn't exist yet.
// Idempotent: safe to run on every boot.
export const bootstrapAdmin = async (): Promise<void> => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('[auth] ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin bootstrap');
    return;
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return; // already exists, nothing to do

  const passwordHash = await hashPassword(password);
  await prisma.adminUser.create({ data: { email, passwordHash } });
  console.log(`[auth] Admin user created: ${email}`);
};

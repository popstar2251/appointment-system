import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Singleton: una sola instancia de PrismaClient en toda la app.
const prisma = new PrismaClient();

export default prisma;

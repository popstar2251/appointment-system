import 'dotenv/config';
import { bootstrapAdmin } from './services/auth';
import prisma from './lib/prisma';

bootstrapAdmin()
  .then(() => console.log('Seed complete'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());

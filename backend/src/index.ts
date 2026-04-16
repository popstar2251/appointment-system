import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import prisma from './lib/prisma';
import { bootstrapAdmin } from './services/auth';
import appointmentsRouter from './routes/appointments';
import retellRouter from './routes/retell';
import authRouter from './routes/auth';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5174';

// Diagnostic route — bypasses all middleware and Prisma
app.get('/ping', (req, res) => { res.json({ ok: true }); });

// Health check — verifies DB connectivity; useful for deployment readiness checks
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: 'connected' });
  } catch {
    res.status(503).json({ ok: false, db: 'unreachable' });
  }
});

// credentials: true is required when the frontend sends cookies (withCredentials: true)
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser()); // parses req.cookies — needed to read the JWT auth cookie

app.use('/auth', authRouter);
app.use('/appointments', appointmentsRouter);
// Retell tool calls come from Retell's servers (server-to-server), not a browser — no CORS needed
app.use('/retell', retellRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Appointment System API running' });
});

// Bootstrap admin user from env vars on first boot, then start the server
bootstrapAdmin()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to bootstrap admin:', err);
    process.exit(1);
  });

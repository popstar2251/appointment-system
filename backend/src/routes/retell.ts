import { Router } from 'express';
import { handleToolCall } from '../controllers/retell';

const router = Router();

// Retell calls this endpoint when the agent decides to use a tool during a call.
router.post('/tool', handleToolCall);

export default router;

import { Router } from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from '../controllers/appointments';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/requireAuth';
import { createAppointmentSchema, updateStatusSchema } from '../schemas/appointment';

const router = Router();

// Admin-only: exposes all customer data
router.get('/', requireAuth, getAppointments);
router.get('/:id', requireAuth, getAppointmentById);

// Public: guest booking (no login required)
router.post('/', validate(createAppointmentSchema), createAppointment);

// Admin-only: status management and deletion
router.patch('/:id/status', requireAuth, validate(updateStatusSchema), updateAppointmentStatus);
router.delete('/:id', requireAuth, deleteAppointment);

export default router;

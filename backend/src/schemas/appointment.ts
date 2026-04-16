import { z } from 'zod';

// z.object() defines the shape of the expected request body.
// Each field has its type and chained validations.
export const createAppointmentSchema = z.object({
  clientName: z.string().min(2, 'Name must be at least 2 characters'),
  clientPhone: z.string().regex(/^\+?[\d\s\-]{7,15}$/, 'Invalid phone number'),
  clientEmail: z.string().email('Invalid email address'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  service: z.string().min(1, 'Service is required'),
}).refine(
  // Object-level refine combines date + time so we can catch "today at 09:00" when it's already 15:00
  (data) => new Date(`${data.date}T${data.time}`) > new Date(),
  { message: 'Cannot book in the past', path: ['date'] }
);

export const updateStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled']),
});

// z.infer extracts the TypeScript type from the schema — no separate type declaration needed.
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

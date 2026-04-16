import { Request, Response } from 'express';
import * as AppointmentService from '../services/appointments';
import { SlotTakenError } from '../services/appointments';
import { createAppointmentSchema } from '../schemas/appointment';
import { notifyAppointmentCreated } from '../lib/n8n';

// Retell always expects { result: string } — even on errors.
// The agent reads this string aloud to the caller, so responses must be human-friendly.
// With "Payload: args only" ON in Retell, the arguments are sent directly as the request body.
export const handleToolCall = async (req: Request, res: Response): Promise<void> => {
  // Reuse the same Zod schema that validates web bookings — single source of truth.
  // The past-date refine also runs here, so callers can't book in the past via voice either.
  const parsed = createAppointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((e) => e.message).join(', ');
    res.json({ result: `I could not book the appointment. Missing or invalid info: ${issues}` });
    return;
  }

  try {
    const appointment = await AppointmentService.create(parsed.data);
    notifyAppointmentCreated(appointment); // fire-and-forget — sends confirmation email via n8n
    res.json({
      result: `Done! The appointment has been booked for ${appointment.clientName} on ${appointment.date} at ${appointment.time}. A confirmation email has been sent to ${appointment.clientEmail}.`,
    });
  } catch (e) {
    if (e instanceof SlotTakenError) {
      res.json({ result: `Sorry, that time slot is already taken. Could you choose a different date or time?` });
    } else {
      res.json({ result: `Sorry, I was unable to complete the booking. Please try again or contact us directly.` });
    }
  }
};

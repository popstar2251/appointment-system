import { describe, it, expect } from 'vitest';
import { createAppointmentSchema } from './appointment';

// A valid future date/time used across tests — far enough ahead to never be "in the past"
const FUTURE_DATE = '2099-12-31';
const FUTURE_TIME = '10:00';

const validPayload = {
  clientName: 'Maria Gomez',
  clientPhone: '+5491155667788',
  clientEmail: 'maria@example.com',
  date: FUTURE_DATE,
  time: FUTURE_TIME,
  service: 'General Consultation',
};

describe('createAppointmentSchema', () => {
  it('accepts a valid payload', () => {
    const result = createAppointmentSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid phone number', () => {
    const result = createAppointmentSchema.safeParse({
      ...validPayload,
      clientPhone: 'not-a-phone',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const phoneError = result.error.issues.find((i) => i.path[0] === 'clientPhone');
      expect(phoneError?.message).toBe('Invalid phone number');
    }
  });

  it('rejects an invalid email address', () => {
    const result = createAppointmentSchema.safeParse({
      ...validPayload,
      clientEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === 'clientEmail');
      expect(emailError?.message).toBe('Invalid email address');
    }
  });

  it('rejects a date + time in the past', () => {
    const result = createAppointmentSchema.safeParse({
      ...validPayload,
      date: '2000-01-01',
      time: '08:00',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pastError = result.error.issues.find((i) => i.message === 'Cannot book in the past');
      expect(pastError).toBeDefined();
    }
  });
});

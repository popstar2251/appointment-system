import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import * as AppointmentService from '../services/appointments';
import { SlotTakenError } from '../services/appointments';
import { CreateAppointmentInput, UpdateStatusInput } from '../schemas/appointment';
import { notifyAppointmentCreated, notifyStatusChanged } from '../lib/n8n';

// Helper to detect Prisma's "record not found" error (code P2025)
const isNotFound = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025';

export const getAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointments = await AppointmentService.findAll();
    res.json(appointments);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

export const getAppointmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await AppointmentService.findById(String(req.params.id));
    if (!appointment) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    res.json(appointment);
  } catch {
    res.status(500).json({ error: 'Failed to fetch appointment' });
  }
};

export const createAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as CreateAppointmentInput;
    const appointment = await AppointmentService.create(body);
    notifyAppointmentCreated(appointment); // fire-and-forget — sends email via n8n
    res.status(201).json(appointment);
  } catch (e) {
    if (e instanceof SlotTakenError) {
      res.status(409).json({ error: e.message });
    } else {
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body as UpdateStatusInput;
  try {
    const appointment = await AppointmentService.updateStatus(String(req.params.id), status);
    notifyStatusChanged(appointment); // fire-and-forget — notifies client of status change
    res.json(appointment);
  } catch (e) {
    if (isNotFound(e)) {
      res.status(404).json({ error: 'Appointment not found' });
    } else {
      res.status(500).json({ error: 'Failed to update appointment status' });
    }
  }
};

export const deleteAppointment = async (req: Request, res: Response): Promise<void> => {
  try {
    const appointment = await AppointmentService.remove(String(req.params.id));
    res.json({ message: 'Appointment deleted', appointment });
  } catch (e) {
    if (isNotFound(e)) {
      res.status(404).json({ error: 'Appointment not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete appointment' });
    }
  }
};

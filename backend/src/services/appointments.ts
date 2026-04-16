import prisma from '../lib/prisma';
import { CreateAppointmentInput } from '../schemas/appointment';

// Custom error thrown when a requested date+time is already taken by a non-cancelled appointment.
// Controllers catch this and return 409 Conflict.
export class SlotTakenError extends Error {
  constructor() {
    super('That time slot is already booked');
    this.name = 'SlotTakenError';
  }
}

export const findAll = () => {
  return prisma.appointment.findMany({ orderBy: { createdAt: 'desc' } });
};

export const findById = (id: string) => {
  return prisma.appointment.findUnique({ where: { id } });
};

export const create = async (data: CreateAppointmentInput) => {
  // Check for an existing non-cancelled appointment at the same date + time.
  // Excludes cancelled slots so a cancelled slot can be rebooked.
  const clash = await prisma.appointment.findFirst({
    where: { date: data.date, time: data.time, status: { not: 'cancelled' } },
  });
  if (clash) throw new SlotTakenError();

  return prisma.appointment.create({ data });
};

export const updateStatus = (id: string, status: string) => {
  return prisma.appointment.update({
    where: { id },
    data: { status },
  });
};

export const remove = (id: string) => {
  return prisma.appointment.delete({ where: { id } });
};

import axios from 'axios';
import type { Appointment } from '../types/appointment';

export type CreateAppointmentInput = Omit<Appointment, 'id' | 'status' | 'createdAt'>;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true, // sends the httpOnly JWT cookie on every request
});

// Global 401 handler: if the session expires mid-session, redirect to login.
// Skips /auth/* endpoints — a 401 from those is expected (login failed, or not logged in yet).
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      axios.isAxiosError(err) &&
      err.response?.status === 401 &&
      !err.config?.url?.includes('/auth/')
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth API
export const authLogin = async (email: string, password: string): Promise<{ email: string }> => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const authLogout = async (): Promise<void> => {
  await api.post('/auth/logout');
};

export const authMe = async (): Promise<{ email: string } | null> => {
  try {
    const res = await api.get('/auth/me');
    return res.data;
  } catch {
    return null;
  }
};

export const getAppointments = async (): Promise<Appointment[]> => {
  const res = await api.get('/appointments');
  return res.data;
};

export const createAppointment = async (data: CreateAppointmentInput): Promise<Appointment> => {
  const res = await api.post('/appointments', data);
  return res.data;
};

export const updateStatus = async (
  id: string,
  status: Appointment['status']
): Promise<Appointment> => {
  const res = await api.patch(`/appointments/${id}/status`, { status });
  return res.data;
};

export const deleteAppointment = async (id: string): Promise<void> => {
  await api.delete(`/appointments/${id}`);
};

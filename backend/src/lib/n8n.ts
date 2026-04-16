// Notifica a n8n cuando ocurre un evento en la app.
// "Fire and forget": no esperamos la respuesta — si n8n falla, el usuario no se ve afectado.

import axios from 'axios';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL ?? 'http://localhost:5678/webhook/appointment-created';

export const notifyAppointmentCreated = (appointment: object): void => {
  axios.post(N8N_WEBHOOK_URL, appointment).catch((err) => {
    // Solo logueamos — nunca rompemos el flujo principal por esto
    console.error('[n8n] Failed to notify webhook:', err.message);
  });
};

const N8N_STATUS_WEBHOOK_URL =
  process.env.N8N_STATUS_WEBHOOK_URL ?? 'http://localhost:5678/webhook/appointment-status-changed';

// Fires when an appointment is confirmed or cancelled — sends an email to the client
export const notifyStatusChanged = (appointment: object): void => {
  axios.post(N8N_STATUS_WEBHOOK_URL, appointment).catch((err) => {
    console.error('[n8n] Failed to notify status webhook:', err.message);
  });
};

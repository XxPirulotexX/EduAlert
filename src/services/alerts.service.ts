
import type { Alert, AlertStatus, AlertFollowUp } from '../types';
import { ALERTS } from '../data/mock';
import { readStoredData, writeStoredData } from './storage.service';

const STORAGE_KEY = 'alerts';
const FOLLOW_UPS_KEY = 'alert-follow-ups';

function getAll(): Alert[] {
  return readStoredData<Alert[]>(STORAGE_KEY, ALERTS);
}

function getAllFollowUps(): AlertFollowUp[] {
  return readStoredData<AlertFollowUp[]>(FOLLOW_UPS_KEY, []);
}

export const alertsService = {
  getAll(): Alert[] {
    return getAll();
  },

  getById(id: number): Alert | undefined {
    return getAll().find((alert) => alert.id === id);
  },

  getByStatus(status: AlertStatus): Alert[] {
    return getAll().filter((alert) => alert.status === status);
  },

  updateStatus(id: number, status: AlertStatus): Alert {
    const alerts = getAll();
    const existingAlert = alerts.find((alert) => alert.id === id);

    if (!existingAlert) {
      throw new Error(`No se encontró la alerta con ID ${id}.`);
    }

    const updatedAlert: Alert = { ...existingAlert, status };

    writeStoredData(
      STORAGE_KEY,
      alerts.map((alert) =>
        alert.id === id ? updatedAlert : alert,
      ),
    );

    return updatedAlert;
  },

  getFollowUpsByAlert(alertId: number): AlertFollowUp[] {
    return getAllFollowUps()
      .filter((followUp) => followUp.alertId === alertId)
      .sort((a, b) => b.date.localeCompare(a.date));
  },

  addFollowUp(
    data: Omit<AlertFollowUp, 'id' | 'date'>,
  ): AlertFollowUp {
    const alertExists = getAll().some(
      (alert) => alert.id === data.alertId,
    );

    if (!alertExists) {
      throw new Error(
        `No se encontró la alerta con ID ${data.alertId}.`,
      );
    }

    if (!data.responsible.trim() || !data.notes.trim()) {
      throw new Error(
        'El responsable y las observaciones son obligatorios.',
      );
    }

    const followUp: AlertFollowUp = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      date: new Date().toISOString(),
      responsible: data.responsible.trim(),
      notes: data.notes.trim(),
    };

    writeStoredData(FOLLOW_UPS_KEY, [
      ...getAllFollowUps(),
      followUp,
    ]);

    return followUp;
  },
};

/** Servicio de alertas tempranas y seguimientos persistidos en la API. */
import { apiRequest } from './api-client.service'
import type { RiskLevel } from './students-api.service'

export type AlertStatus = 'Nueva' | 'En seguimiento' | 'Revisada'

export interface ApiAlert {
  id: number
  estudianteId: number
  nombreEstudiante: string
  codigoEstudiantil: string
  grado: string | null
  nivelRiesgo: RiskLevel
  senal: string
  estado: AlertStatus
  creadoEn: string
  actualizadoEn: string | null
}

export interface AlertRequest {
  estudianteId: number
  senal: string
  nivelRiesgo: RiskLevel
}

export interface AlertFollowUp {
  id: number
  alertaId: number
  responsableUsuarioId: number
  responsable: string
  observaciones: string
  creadoEn: string
}

export const alertasApiService = {
  getAll: () => apiRequest<ApiAlert[]>('/alertas'),
  create: (data: AlertRequest) => apiRequest<ApiAlert>('/alertas', {
    method: 'POST', body: JSON.stringify(data),
  }),
  updateStatus: (id: number, estado: AlertStatus) =>
    apiRequest<ApiAlert>(`/alertas/${id}/estado`, {
      method: 'PATCH', body: JSON.stringify({ estado }),
    }),
  getFollowUps: (id: number) =>
    apiRequest<AlertFollowUp[]>(`/alertas/${id}/seguimientos`),
  addFollowUp: (id: number, observaciones: string) =>
    apiRequest<AlertFollowUp>(`/alertas/${id}/seguimientos`, {
      method: 'POST', body: JSON.stringify({ observaciones }),
    }),
}

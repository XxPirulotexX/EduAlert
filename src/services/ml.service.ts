/** Cliente frontend del componente ML; los secretos y el servicio FastAPI nunca llegan al navegador. */
import { apiRequest } from './api-client.service'

export interface RiskPredictionInput {
  promedio_actual: number
  promedio_periodo_anterior: number
  porcentaje_asistencia: number
  inasistencias_consecutivas: number
  asignaturas_perdidas: number
  entregas_pendientes: number
  participacion_academica: number
  acompanamiento_familiar: number
}

export interface RiskPredictionResponse {
  prediccion: 'continuidad_simulada' | 'posible_interrupcion_simulada' | string
  probabilidades: Record<string, number>
  origen_datos: 'sintetico' | string
  es_dato_real: false
  advertencia: string
}

export const mlApiService = {
  predictRisk: (data: RiskPredictionInput) =>
    apiRequest<RiskPredictionResponse>('/ml/modeling/predict', {
      method: 'POST', body: JSON.stringify(data),
    }),
  health: () => apiRequest<{ status: string; service: string; version: string }>('/ml/health'),
}

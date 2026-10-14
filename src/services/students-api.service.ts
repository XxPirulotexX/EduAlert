/** Servicio REST de estudiantes: PostgreSQL, y no localStorage, es la fuente de verdad. */
import { apiRequest } from './api-client.service'

export type StudentStatus = 'activo' | 'inactivo' | 'egresado' | 'retirado'
export type RiskLevel = 'bajo' | 'medio' | 'alto' | 'sin_evaluar'

export interface ApiStudent {
  id: number
  usuarioId: number | null
  codigoEstudiantil: string
  nombres: string
  apellidos: string
  estado: StudentStatus
  grado: string | null
  promedioActual: number | null
  nivelRiesgo: RiskLevel
  observacionesRiesgo: string | null
  creadoEn: string
  actualizadoEn: string | null
}

export interface StudentRequest {
  usuarioId: number | null
  codigoEstudiantil: string
  nombres: string
  apellidos: string
  estado: StudentStatus
  grado: string | null
  promedioActual: number | null
  nivelRiesgo: RiskLevel
  observacionesRiesgo: string | null
}

export interface RiskAssessment {
  id: number
  estudianteId: number
  nivel: RiskLevel
  observaciones: string | null
  fuente: string
  versionModelo: string | null
  creadoEn: string
}

const ENDPOINT = '/estudiantes'

export const studentsApiService = {
  getAll: () => apiRequest<ApiStudent[]>(ENDPOINT),
  getById: (id: number) => apiRequest<ApiStudent>(`${ENDPOINT}/${id}`),
  getRiskHistory: (id: number) => apiRequest<RiskAssessment[]>(`${ENDPOINT}/${id}/riesgo/historial`),
  create: (data: StudentRequest) => apiRequest<ApiStudent>(ENDPOINT, {
    method: 'POST', body: JSON.stringify(data),
  }),
  update: (id: number, data: StudentRequest) => apiRequest<ApiStudent>(`${ENDPOINT}/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  deactivate: (id: number) => apiRequest<void>(`${ENDPOINT}/${id}`, {
    method: 'DELETE',
  }),
}

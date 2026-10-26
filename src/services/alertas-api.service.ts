/** Servicio REST de alertas tempranas y seguimientos persistidos en PostgreSQL. */
import { apiRequest } from './api-client.service'
import type { ApiPage, RiskLevel } from './students-api.service'

export type AlertStatus = 'Nueva' | 'En seguimiento' | 'Revisada' | 'Archivada'

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

export interface AlertQuery {
  texto?: string
  estado?: AlertStatus
  nivelRiesgo?: RiskLevel
  grado?: string
  estudianteId?: number
  pagina?: number
  tamano?: number
}

const MAX_PAGE_SIZE = 100

function buildQuery(query: AlertQuery): string {
  const params = new URLSearchParams()
  if (query.texto?.trim()) params.set('texto', query.texto.trim())
  if (query.estado) params.set('estado', query.estado)
  if (query.nivelRiesgo) params.set('nivelRiesgo', query.nivelRiesgo)
  if (query.grado?.trim()) params.set('grado', query.grado.trim())
  if (query.estudianteId != null) params.set('estudianteId', String(query.estudianteId))
  params.set('pagina', String(Math.max(0, query.pagina ?? 0)))
  params.set('tamano', String(Math.min(MAX_PAGE_SIZE, Math.max(1, query.tamano ?? 20))))
  return `/alertas?${params.toString()}`
}

export const alertasApiService = {
  getPage: (query: AlertQuery = {}) => apiRequest<ApiPage<ApiAlert>>(buildQuery(query)),
  /** Recupera el historial de una sola ficha en páginas acotadas, sin descargar alertas de toda la institución. */
  getForStudent: async (estudianteId: number): Promise<ApiAlert[]> => {
    const results: ApiAlert[] = []
    let pagina = 0
    let totalPages = 1
    while (pagina < totalPages) {
      const response = await alertasApiService.getPage({ estudianteId, pagina, tamano: MAX_PAGE_SIZE })
      results.push(...response.content)
      totalPages = response.totalPages
      pagina += 1
    }
    return results
  },
  getById: (id: number) => apiRequest<ApiAlert>(`/alertas/${id}`),
  create: (data: AlertRequest) => apiRequest<ApiAlert>('/alertas', {
    method: 'POST', body: JSON.stringify(data),
  }),
  update: (id: number, data: AlertRequest) => apiRequest<ApiAlert>(`/alertas/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  updateStatus: (id: number, estado: Exclude<AlertStatus, 'Archivada'>) =>
    apiRequest<ApiAlert>(`/alertas/${id}/estado`, {
      method: 'PATCH', body: JSON.stringify({ estado }),
    }),
  /** El backend archiva en vez de borrar físicamente para preservar seguimiento e integridad. */
  archive: (id: number) => apiRequest<void>(`/alertas/${id}`, { method: 'DELETE' }),
  getFollowUps: (id: number) => apiRequest<AlertFollowUp[]>(`/alertas/${id}/seguimientos`),
  addFollowUp: (id: number, observaciones: string) =>
    apiRequest<AlertFollowUp>(`/alertas/${id}/seguimientos`, {
      method: 'POST', body: JSON.stringify({ observaciones }),
    }),
}

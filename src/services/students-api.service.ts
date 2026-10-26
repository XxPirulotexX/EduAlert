/** Servicio REST de estudiantes. PostgreSQL es la fuente de verdad; los listados usan paginación. */
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

export interface ApiPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface StudentQuery {
  texto?: string
  estado?: StudentStatus
  nivelRiesgo?: RiskLevel
  grado?: string
  pagina?: number
  tamano?: number
}

const ENDPOINT = '/estudiantes'
const MAX_PAGE_SIZE = 100

function buildQuery(query: StudentQuery): string {
  const params = new URLSearchParams()
  if (query.texto?.trim()) params.set('texto', query.texto.trim())
  if (query.estado) params.set('estado', query.estado)
  if (query.nivelRiesgo) params.set('nivelRiesgo', query.nivelRiesgo)
  if (query.grado?.trim()) params.set('grado', query.grado.trim())
  params.set('pagina', String(Math.max(0, query.pagina ?? 0)))
  params.set('tamano', String(Math.min(MAX_PAGE_SIZE, Math.max(1, query.tamano ?? 20))))
  return `${ENDPOINT}?${params.toString()}`
}

export const studentsApiService = {
  getPage: (query: StudentQuery = {}) =>
    apiRequest<ApiPage<ApiStudent>>(buildQuery(query)),

  /**
   * Para paneles agregados y selectores que necesitan el catálogo completo, descarga
   * páginas limitadas. La pantalla de mantenimiento debe usar getPage directamente.
   */
  getAll: async (): Promise<ApiStudent[]> => {
    const results: ApiStudent[] = []
    let pagina = 0
    let totalPages = 1
    while (pagina < totalPages) {
      const response = await studentsApiService.getPage({ pagina, tamano: MAX_PAGE_SIZE })
      results.push(...response.content)
      totalPages = response.totalPages
      pagina += 1
    }
    return results
  },

  getById: (id: number) => apiRequest<ApiStudent>(`${ENDPOINT}/${id}`),
  getRiskHistory: (id: number) => apiRequest<RiskAssessment[]>(`${ENDPOINT}/${id}/riesgo/historial`),
  create: (data: StudentRequest) => apiRequest<ApiStudent>(ENDPOINT, {
    method: 'POST', body: JSON.stringify(data),
  }),
  update: (id: number, data: StudentRequest) => apiRequest<ApiStudent>(`${ENDPOINT}/${id}`, {
    method: 'PUT', body: JSON.stringify(data),
  }),
  /** Baja lógica: conserva referencias, evaluaciones y alertas históricas. */
  deactivate: (id: number) => apiRequest<void>(`${ENDPOINT}/${id}`, {
    method: 'DELETE',
  }),
}

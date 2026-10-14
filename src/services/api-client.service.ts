/**
 * Cliente HTTP compartido de EduAlerta.
 * Adjunta el JWT a las solicitudes protegidas y normaliza los errores de API.
 */
import { readStoredData, removeStoredData } from './storage.service'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'
).replace(/\/+$/, '')

interface ApiErrorResponse {
  message?: string
  code?: string
  fieldErrors?: Record<string, string>
}

interface StoredSessionToken {
  accessToken: string
  expiresAt: number
}

/** Error tipado para que los formularios distingan errores HTTP de conexión. */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

/** Ejecuta una petición REST y traduce las respuestas de error a ApiClientError. */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // Agrega el token si hay una sesión local vigente; el servidor sigue validándolo.
  const session = readStoredData<StoredSessionToken | null>('auth-session', null)
  if (!endpoint.startsWith('/auth/login') && session?.accessToken && session.expiresAt > Date.now()) {
    headers.set('Authorization', `Bearer ${session.accessToken}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch {
    throw new ApiClientError(
      'No fue posible conectar con EduAlerta. Comprueba que el backend esté ejecutándose.',
      0,
    )
  }

  if (response.status === 204) return undefined as T

  const responseText = await response.text()
  let data: unknown

  try {
    data = responseText ? JSON.parse(responseText) : undefined
  } catch {
    data = undefined
  }

  // Si la API rechaza el token, se borra la sesión y se avisa a las rutas protegidas.
  if (response.status === 401) {
    removeStoredData('auth-session')
    window.dispatchEvent(new Event('edualerta:auth-expired'))
  }

  if (!response.ok) {
    const apiError = data as ApiErrorResponse | undefined
    throw new ApiClientError(
      apiError?.message ?? `La solicitud falló (HTTP ${response.status}).`,
      response.status,
      apiError?.fieldErrors ?? {},
    )
  }

  return data as T
}

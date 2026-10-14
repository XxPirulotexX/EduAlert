/**
 * Maneja la sesión de autenticación de EduAlerta.
 * La identidad y el rol proceden de la API, no de una selección del navegador.
 */
import type { Role } from '../types'
import { apiRequest } from './api-client.service'
import { removeStoredData, readStoredData, writeStoredData } from './storage.service'

export interface AuthUser {
  id: number
  nombres: string
  apellidos: string
  correo: string
  rol: Role
  estado: string
  estudianteId: number | null
  creadoEn?: string
}

export interface AuthSession {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  expiresAt: number
  user: AuthUser
}

interface LoginResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: AuthUser
}

/** Autentica credenciales contra Spring Boot y guarda la sesión temporal. */
export async function loginWithCredentials(
  correo: string,
  password: string,
): Promise<AuthSession> {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo: correo.trim(), password }),
  })

  const session: AuthSession = {
    ...response,
    expiresAt: Date.now() + response.expiresIn * 1000,
  }

  writeStoredData('auth-session', session)

  // Compatibilidad temporal con pantallas existentes mientras migramos los módulos.
  writeStoredData('demo-role', response.user.rol)
  writeStoredData('demo-email', response.user.correo)

  if (response.user.rol === 'estudiante' && response.user.estudianteId !== null) {
    writeStoredData('demo-student-id', response.user.estudianteId)
  } else {
    removeStoredData('demo-student-id')
  }

  window.dispatchEvent(new Event('edualerta:auth-changed'))
  return session
}

/** Devuelve una sesión solo si existe un token y no ha vencido localmente. */
export function getAuthSession(): AuthSession | null {
  const session = readStoredData<AuthSession | null>('auth-session', null)

  if (!session?.accessToken || !session.user || session.expiresAt <= Date.now()) {
    if (session) logout()
    return null
  }

  return session
}

export function getCurrentAuthUser(): AuthUser | null {
  return getAuthSession()?.user ?? null
}

/** Centraliza la ruta inicial por rol; no concede permisos por sí misma. */
export function getRoleHome(rol: Role): string {
  switch (rol) {
    case 'estudiante':
      return '/app/home-estudiante'
    case 'orientador':
      return '/app/alertas'
    case 'administrador':
    case 'docente':
    default:
      return '/app/home'
  }
}

/** Elimina token y datos heredados de demostración cuando el usuario cierra sesión. */
export function logout(): void {
  removeStoredData('auth-session')
  removeStoredData('demo-role')
  removeStoredData('demo-email')
  removeStoredData('demo-student-id')
  window.dispatchEvent(new Event('edualerta:auth-changed'))
}

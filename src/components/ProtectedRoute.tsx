import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import type { Role } from '../types'
import { getAuthSession, getRoleHome } from '../services/auth.service'

type ProtectedRouteProps = {
  children: ReactNode
  allowedRoles?: Role[]
}

/**
 * Protege páginas según la sesión recibida de la API y su rol.
 * Es una protección de navegación; las mismas reglas se aplican en Spring Boot.
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const location = useLocation()
  const [session, setSession] = useState(() => getAuthSession())

  useEffect(() => {
    const updateSession = () => setSession(getAuthSession())

    window.addEventListener('edualerta:auth-changed', updateSession)
    window.addEventListener('edualerta:auth-expired', updateSession)

    return () => {
      window.removeEventListener('edualerta:auth-changed', updateSession)
      window.removeEventListener('edualerta:auth-expired', updateSession)
    }
  }, [])

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (allowedRoles && !allowedRoles.includes(session.user.rol)) {
    return <Navigate to={getRoleHome(session.user.rol)} replace />
  }

  return children
}

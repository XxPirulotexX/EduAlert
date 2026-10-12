
import { useNavigate, useLocation } from 'react-router-dom'

import {
  HomeIcon,
  StudentsIcon,
  AlertIcon,
  AnalyticsIcon,
  ProfileIcon,
  ProgressIcon,
  OrientationIcon,
} from './icons'

import { COLORS, FONT } from '../theme'

// Estructura común de cada elemento de navegación.
type NavItem = {
  id: string
  label: string
  path: string
  icon: (p: { active?: boolean }) => React.ReactNode
}

// Opciones del menú de docente, orientador y administrador.
// Se conservan las rutas que ya utilizaba el proyecto.
const BASE_NAV: NavItem[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    path: '/app/home',
    icon: HomeIcon,
  },
  {
    id: 'estudiantes',
    label: 'Estudiantes',
    path: '/app/estudiantes',
    icon: StudentsIcon,
  },
  {
    id: 'alertas',
    label: 'Alertas',
    path: '/app/alertas',
    icon: AlertIcon,
  },
  {
    id: 'analitica',
    label: 'Analítica',
    path: '/app/analitica',
    icon: AnalyticsIcon,
  },
  {
    id: 'perfil',
    label: 'Perfil',
    path: '/app/perfil',
    icon: ProfileIcon,
  },
]

// El estudiante solo ve opciones que corresponden al flujo actual.
// Se elimina el enlace de alertas del docente y se añade un inicio propio.
const STUDENT_NAV: NavItem[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    path: '/app/home-estudiante',
    icon: HomeIcon,
  },
  {
    id: 'resultados',
    label: 'Resultados',
    path: '/app/orientacion/resultados',
    icon: ProgressIcon,
  },
  {
    id: 'orientacion',
    label: 'Orientación',
    path: '/app/orientacion',
    icon: OrientationIcon,
  },
  {
    id: 'perfil',
    label: 'Perfil',
    path: '/app/perfil',
    icon: ProfileIcon,
  },
]

interface Props {
  role?: 'docente' | 'orientador' | 'administrador' | 'estudiante'
}

export default function BottomNav({ role = 'docente' }: Props) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // Cada rol obtiene su propio conjunto de opciones.
  const isStudent = role === 'estudiante'
  const items = isStudent ? STUDENT_NAV : BASE_NAV

  return (
    <nav
      aria-label="Navegación principal"
      className="ea-navigation"
      style={{
        '--nav-background': COLORS.card,
        '--nav-border': '#F1F5F9',
        '--nav-font': FONT,
      } as React.CSSProperties}
    >
      {items.map((item) => {
        // En el menú de estudiante, "Orientación" también está activo
        // dentro del test, pero no cuando se consultan los resultados.
        const active = isStudent
          ? pathname === item.path ||
            (item.id === 'orientacion' &&
              pathname === '/app/orientacion/test')
          : pathname === item.path ||
            (item.path !== '/app/home' &&
              pathname.startsWith(`${item.path}/`))

        const Icon = item.icon

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.path)}
            aria-current={active ? 'page' : undefined}
            className={`ea-navigation__item${active ? ' is-active' : ''}`}
          >
            {/* El icono refleja el estado activo de la opción. */}
            <span className="ea-navigation__icon">
              <Icon active={active} />
            </span>

            <span className="ea-navigation__label">
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

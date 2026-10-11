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
import type { ReactNode } from 'react'

type NavItem = { id: string; label: string; path: string; icon: (p: { active?: boolean }) => React.ReactNode }

const BASE_NAV: NavItem[] = [
  { id: 'inicio', label: 'Inicio', path: '/app/home', icon: HomeIcon },
  { id: 'estudiantes', label: 'Estudiantes', path: '/app/estudiantes', icon: StudentsIcon },
  { id: 'alertas', label: 'Alertas', path: '/app/alertas', icon: AlertIcon },
  { id: 'analitica', label: 'Analítica', path: '/app/analitica', icon: AnalyticsIcon },
  { id: 'perfil', label: 'Perfil', path: '/app/perfil', icon: ProfileIcon },
]

const STUDENT_NAV: NavItem[] = [
  { id: 'inicio', label: 'Inicio', path: '/app/home', icon: HomeIcon },
  { id: 'progreso', label: 'Progreso', path: '/app/progreso', icon: ProgressIcon },
  { id: 'alertas', label: 'Alertas', path: '/app/alertas', icon: AlertIcon },
  { id: 'orientacion', label: 'Orientación', path: '/app/orientacion', icon: OrientationIcon },
  { id: 'perfil', label: 'Perfil', path: '/app/perfil', icon: ProfileIcon },
]

interface Props {
  role?: 'docente' | 'orientador' | 'administrador' | 'estudiante'
}

export default function BottomNav({ role = 'docente' }: Props) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const items = role === 'estudiante' ? STUDENT_NAV : BASE_NAV

  return (
    <div
      style={{
        background: COLORS.card,
        borderTop: `1px solid #F1F5F9`,
        padding: '8px 0 18px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        flexShrink: 0,
        boxShadow: '0 -4px 16px rgba(15,23,42,0.05)',
        fontFamily: FONT,
      }}
    >
      {items.map((item) => {
        const active = pathname === item.path
        const Icon = item.icon
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: 10,
              minWidth: 56,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: active ? COLORS.lightBlue : 'transparent',
              }}
            >
              <Icon active={active} />
            </div>
            <span
              style={{
                fontWeight: active ? 600 : 400,
                fontSize: 10,
                color: active ? COLORS.blue : COLORS.subtle,
                lineHeight: 1,
              }}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
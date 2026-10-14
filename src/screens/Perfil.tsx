import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import Card from '../components/Card'
import { COLORS } from '../theme'
import type { ReactNode } from 'react'

import {
  ChevronRight,
  ProfileIcon,
  AlertIcon,
  LockIcon,
  InfoIcon,
  EditIcon,
  SettingsIcon,
  HelpIcon,
  LogOutIcon,
} from '../components/icons'
import type { Role } from '../types'
import {
  readStoredData,
  removeStoredData,
} from '../services/storage.service'
import { logout, getCurrentAuthUser } from '../services/auth.service'
// ============================================================
// CONFIGURACIÓN DE LOS PERFILES DE DEMOSTRACIÓN
// ============================================================

// Los textos y colores cambian según el rol elegido en Login.
// Los datos personales siguen siendo ilustrativos porque todavía
// no existe un servicio de usuarios autenticados.
interface RoleConfiguration {
  label: string
  initials: string
  fallbackEmail: string
  badge: {
    background: string
    text: string
    border: string
  }
}

const ROLE_CONFIG: Record<Role, RoleConfiguration> = {
  administrador: {
    label: 'Administrador',
    initials: 'DA',
    fallbackEmail: 'administrador@edualerta.edu.co',
    badge: {
      background: '#EFF6FF',
      text: '#2563EB',
      border: '#BFDBFE',
    },
  },

  docente: {
    label: 'Docente',
    initials: 'DA',
    fallbackEmail: 'docente@edualerta.edu.co',
    badge: {
      background: '#F0FDF4',
      text: '#16A34A',
      border: '#BBF7D0',
    },
  },

  orientador: {
    label: 'Orientador escolar',
    initials: 'DA',
    fallbackEmail: 'orientador@edualerta.edu.co',
    badge: {
      background: '#F0FDFA',
      text: '#0D9488',
      border: '#99F6E4',
    },
  },

  estudiante: {
    label: 'Estudiante',
    initials: 'DA',
    fallbackEmail: 'estudiante@edualerta.edu.co',
    badge: {
      background: '#FFF7ED',
      text: '#EA580C',
      border: '#FED7AA',
    },
  },
}

// Valida el valor recuperado del almacenamiento antes de usarlo como rol.
function isRole(value: string): value is Role {
  return [
    'administrador',
    'docente',
    'orientador',
    'estudiante',
  ].includes(value)
}

// ============================================================
// COMPONENTE REUTILIZABLE: GRUPO DE OPCIONES
// ============================================================

interface ProfileItem {
  title: string
  description: string
  onClick: () => void
}


/**
 * Cada opción del perfil recibe su propio icono y colores.
 * Así reutilizamos el componente sin repetir el diseño de las filas.
 */
type SectionItem = {
  title: string
  description: string
  icon: ReactNode
  iconColor: string
  iconBg: string
}

function SectionGroup({
  title,
  items,
}: {
  title: string
  items: SectionItem[]
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: COLORS.subtle,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 8,
          paddingLeft: 4,
        }}
      >
        {title}
      </p>

      <Card padding="0">
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '13px 16px',
              borderBottom:
                index < items.length - 1
                  ? '1px solid #F1F5F9'
                  : 'none',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {/* Contenedor visual con el icono correspondiente a la opción. */}
            <div
              aria-hidden="true"
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: item.iconBg,
                color: item.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.navy,
                  margin: 0,
                }}
              >
                {item.title}
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: COLORS.subtle,
                  margin: '2px 0 0',
                }}
              >
                {item.description}
              </p>
            </div>

            <ChevronRight />
          </button>
        ))}
      </Card>
    </div>
  )
}

// ============================================================
// PANTALLA DE PERFIL Y CONFIGURACIÓN
// ============================================================

export default function Perfil() {
  const navigate = useNavigate()
  const currentUser = getCurrentAuthUser()
  const user = getCurrentAuthUser()

  // Recupera el rol guardado al ingresar al modo de demostración.
  // Si no existe o es inválido, se utiliza docente como valor por defecto.
  const storedRole = readStoredData<string>('demo-role', 'docente')
  const role: Role = isRole(storedRole) ? storedRole : 'docente'

  // El correo se guarda al ingresar; si no se proporcionó, se utiliza
  // el correo ilustrativo asociado al perfil seleccionado.
  const storedEmail = readStoredData<string>('demo-email', '')
  const email = storedEmail.trim() || ROLE_CONFIG[role].fallbackEmail

  const profile = ROLE_CONFIG[role]

  // Informa al usuario cuando selecciona una opción aún no implementada.
  const [notice, setNotice] = useState('')

  // Accesos disponibles según el rol actual.
  // Evita mostrar datos ficticios cuando no existe una sesión válida.
  if (!user) {
    return <Navigate to="/login" replace />
  }

  const fullName = `${user.nombres} ${user.apellidos}`.trim()
  const initials =
    `${user.nombres.trim().charAt(0)}${user.apellidos.trim().charAt(0)}`.toUpperCase() || 'EA'

  const roleLabels = {
    administrador: 'Administrador',
    docente: 'Docente',
    orientador: 'Orientador escolar',
    estudiante: 'Estudiante',
  }

  {/* Solo el administrador puede ver el acceso de gestión de cuentas. */}
  {currentUser?.rol === 'administrador' && (
    <button
      type="button"
      onClick={() => navigate('/app/admin/usuarios')}
      style={{
        width: '100%',
        marginBottom: 14,
        padding: '14px 16px',
        borderRadius: 12,
        border: '1px solid #BFDBFE',
        background: '#EFF6FF',
        color: '#1D4ED8',
        fontWeight: 600,
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      Administración de usuarios →
    </button>
  )}

  const helpItems: ProfileItem[] = [
    {
      title: 'Centro de ayuda',
      description: 'Guías y preguntas frecuentes',
      onClick: () =>
        setNotice(
          'El centro de ayuda todavía no está implementado.',
        ),
    },
    {
      title: 'Acerca de EduAlerta',
      description: 'Información de la aplicación y del proyecto',
      onClick: () =>
        setNotice(
          'EduAlerta es un prototipo académico de apoyo a la prevención de la deserción escolar.',
        ),
    },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <PhoneCenter>
      {/* Adapta el contenedor al diseño compartido de la aplicación. */}
      <PhoneFrame desktopLayout>
        {/* El menú cambia según el rol recuperado del almacenamiento. */}
        <BottomNav role={role} />

        <div className="ea-screen-main">
          {/* Encabezado de la pantalla de perfil. */}
          <div
            className="ea-screen-header"
            style={{
              background: '#FFFFFF',
              borderBottom: '1px solid #F1F5F9',
              padding: '18px 24px',
              flexShrink: 0,
            }}
          >
            <h1
              style={{
                fontSize: 21,
                fontWeight: 700,
                color: COLORS.navy,
                margin: 0,
              }}
            >
              Perfil y configuración
            </h1>

            <p
              style={{
                fontSize: 12,
                color: COLORS.muted,
                lineHeight: 1.5,
                margin: '5px 0 0',
              }}
            >
              Información del perfil y accesos disponibles.
            </p>
          </div>

          {/* Área desplazable con los datos y las opciones. */}
          <div className="ea-screen-content no-scrollbar">
            <div
              style={{
                width: '100%',
                maxWidth: 1000,
                boxSizing: 'border-box',
                margin: '0 auto',
                padding: 20,
              }}
            >
              {/* Tarjeta de identidad del perfil seleccionado. */}
              <section
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 22,
                  border: '1px solid #F1F5F9',
                  boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Franja decorativa superior. */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background:
                      'linear-gradient(90deg, #2563EB 0%, #14B8A6 100%)',
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Avatar ilustrativo del prototipo. */}
                  <div
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: '50%',
                      background:
                        'linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 22,
                      color: '#FFFFFF',
                      flexShrink: 0,
                    }}
                  >
                    {profile.initials}
                  </div>

                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: COLORS.navy,
                        margin: 0,
                      }}
                    >
                      Duvan Alquichides
                    </p>

                    {/* Insignia visual dinámica según el rol elegido. */}
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        color: profile.badge.text,
                        background: profile.badge.background,
                        border: `1px solid ${profile.badge.border}`,
                        borderRadius: 6,
                        padding: '3px 8px',
                      }}
                    >
                      {profile.label}
                    </span>

                    <p
                      style={{
                        fontSize: 12,
                        color: COLORS.subtle,
                        margin: '7px 0 0',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {email}
                    </p>

                    <p
                      style={{
                        fontSize: 12,
                        color: COLORS.subtle,
                        margin: '4px 0 0',
                      }}
                    >
                      I.E. Técnica Industrial
                    </p>
                  </div>
                </div>

                {/* Identifica explícitamente los datos que todavía son ficticios. */}
                <p
                  style={{
                    fontSize: 11,
                    color: COLORS.subtle,
                    lineHeight: 1.5,
                    margin: '14px 0 0',
                  }}
                >
                  Perfil ilustrativo del prototipo. La información todavía
                  no proviene de una cuenta autenticada.
                </p>
              </section>

              {/* Acciones propias del rol actual. */}
              <SectionGroup
                title="Mi información"
                items={[
                  {
                    title: 'Información personal',
                    description: 'Datos de identificación y contacto',
                    icon: <ProfileIcon size={20} color="#2563EB" />,
                    iconColor: '#2563EB',
                    iconBg: '#EFF6FF',
                  },
                  {
                    title: 'Editar perfil',
                    description: 'Actualiza tu foto y datos visibles',
                    icon: <EditIcon size={20} color="#7C3AED" />,
                    iconColor: '#7C3AED',
                    iconBg: '#F5F3FF',
                  },
                ]}
              />

              <SectionGroup
                title="Configuración"
                items={[
                  {
                    title: 'Notificaciones',
                    description: 'Alertas, avisos y recordatorios',
                    icon: <AlertIcon size={20} color="#D97706" />,
                    iconColor: '#D97706',
                    iconBg: '#FFFBEB',
                  },
                  {
                    title: 'Preferencias',
                    description: 'Idioma, apariencia y accesibilidad',
                    icon: <SettingsIcon size={20} color="#0D9488" />,
                    iconColor: '#0D9488',
                    iconBg: '#F0FDFA',
                  },
                  {
                    title: 'Seguridad',
                    description: 'Cambia tu contraseña y acceso',
                    icon: <LockIcon size={20} color="#DB2777" />,
                    iconColor: '#DB2777',
                    iconBg: '#FDF2F8',
                  },
                ]}
              />

              <SectionGroup
                title="Ayuda"
                items={[
                  {
                    title: 'Centro de ayuda',
                    description: 'Guías y preguntas frecuentes',
                    icon: <HelpIcon size={20} color="#0891B2" />,
                    iconColor: '#0891B2',
                    iconBg: '#ECFEFF',
                  },
                  {
                    title: 'Acerca de EduAlerta',
                    description: 'Versión, licencias e información legal',
                    icon: <InfoIcon size={20} color="#64748B" />,
                    iconColor: '#64748B',
                    iconBg: '#F1F5F9',
                  },
                ]}
              />


              {/* Los mensajes hacen visible el resultado de las opciones seleccionadas. */}
              {notice && (
                <div
                  role="status"
                  style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 16,
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: '#1E40AF',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {notice}
                  </p>

                  <button
                    type="button"
                    onClick={() => setNotice('')}
                    style={{
                      marginTop: 8,
                      padding: 0,
                      border: 'none',
                      background: 'none',
                      color: COLORS.blue,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cerrar aviso
                  </button>
                </div>
              )}

              {/* Acción de salida de la sesión de demostración. */}
              <Card padding="0">
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '14px 16px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div 
                  aria-hidden="true"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: '#FEF2F2',
                    color: COLORS.riskHigh,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    
                    <LogOutIcon size={20} color={COLORS.riskHigh} />
                  </div>
                  <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: COLORS.riskHigh,
                        margin: 0,
                      }}
                    >
                      Cerrar sesión
                    </p>
                  <ChevronRight />
                </button>
              </Card>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}

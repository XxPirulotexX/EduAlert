
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import Card from '../components/Card'
import { ChevronRight } from '../components/icons'
import { COLORS } from '../theme'

import type { Role } from '../types'
import {
  readStoredData,
  removeStoredData,
} from '../services/storage.service'

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

function SectionGroup({
  title,
  items,
}: {
  title: string
  items: ProfileItem[]
}) {
  return (
    <section style={{ marginBottom: 18 }}>
      {/* Título que agrupa opciones relacionadas del perfil. */}
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: COLORS.subtle,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          margin: '0 0 8px',
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
            onClick={item.onClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              boxSizing: 'border-box',
              padding: '13px 16px',

              // El separador solo aparece entre las opciones del grupo.
              border: 'none',
              borderBottom:
                index < items.length - 1
                  ? '1px solid #F1F5F9'
                  : 'none',

              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {/* Elemento visual común para mantener el diseño consistente. */}
            <div
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#F1F5F9',
                flexShrink: 0,
              }}
            />

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
                  lineHeight: 1.5,
                  margin: '3px 0 0',
                }}
              >
                {item.description}
              </p>
            </div>

            <ChevronRight />
          </button>
        ))}
      </Card>
    </section>
  )
}

// ============================================================
// PANTALLA DE PERFIL Y CONFIGURACIÓN
// ============================================================

export default function Perfil() {
  const navigate = useNavigate()

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
  // Solo se incluyen rutas que ya existen en el proyecto.
  const roleItems: Record<Role, ProfileItem[]> = {
    administrador: [
      {
        title: 'Estudiantes',
        description: 'Consultar los registros disponibles',
        onClick: () => navigate('/app/estudiantes'),
      },
      {
        title: 'Alertas',
        description: 'Consultar alertas y su estado',
        onClick: () => navigate('/app/alertas'),
      },
      {
        title: 'Analítica educativa',
        description: 'Revisar los indicadores del sistema',
        onClick: () => navigate('/app/analitica'),
      },
    ],

    docente: [
      {
        title: 'Mis estudiantes',
        description: 'Consultar estudiantes y sus fichas',
        onClick: () => navigate('/app/estudiantes'),
      },
      {
        title: 'Alertas y seguimientos',
        description: 'Revisar casos y actuaciones registradas',
        onClick: () => navigate('/app/alertas'),
      },
      {
        title: 'Analítica educativa',
        description: 'Consultar indicadores generales',
        onClick: () => navigate('/app/analitica'),
      },
    ],

    orientador: [
      {
        title: 'Estudiantes',
        description: 'Consultar fichas para el acompañamiento',
        onClick: () => navigate('/app/estudiantes'),
      },
      {
        title: 'Alertas y seguimientos',
        description: 'Revisar casos que requieren acompañamiento',
        onClick: () => navigate('/app/alertas'),
      },
      {
        title: 'Analítica educativa',
        description: 'Consultar indicadores generales',
        onClick: () => navigate('/app/analitica'),
      },
    ],

    estudiante: [
      {
        title: 'Orientación vocacional',
        description: 'Iniciar o continuar el test vocacional',
        onClick: () => navigate('/app/orientacion'),
      },
      {
        title: 'Mis resultados vocacionales',
        description: 'Consultar los resultados guardados en este navegador',
        onClick: () => navigate('/app/orientacion/resultados'),
      },
    ],
  }

  // Las opciones de configuración muestran un aviso honesto mientras
  // no estén conectadas a servicios reales.
  const configurationItems: ProfileItem[] = [
    {
      title: 'Información personal',
      description: 'Datos de identificación y contacto',
      onClick: () =>
        setNotice(
          'La edición de los datos personales estará disponible cuando se implemente el servicio de usuarios.',
        ),
    },
    {
      title: 'Editar perfil',
      description: 'Actualizar nombre y datos visibles',
      onClick: () =>
        setNotice(
          'La edición del perfil todavía no está implementada en esta versión.',
        ),
    },
    {
      title: 'Notificaciones',
      description: 'Alertas, avisos y recordatorios',
      onClick: () =>
        setNotice(
          'Las preferencias de notificaciones están pendientes de implementación.',
        ),
    },
    {
      title: 'Preferencias',
      description: 'Idioma, apariencia y accesibilidad',
      onClick: () =>
        setNotice(
          'La configuración de preferencias todavía no está conectada.',
        ),
    },
    {
      title: 'Seguridad',
      description: 'Opciones de acceso y contraseña',
      onClick: () =>
        setNotice(
          'La gestión de contraseñas requiere autenticación real y aún no está disponible.',
        ),
    },
  ]

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

  // Cierra el modo de demostración y vuelve a Login.
  // No elimina los resultados vocacionales ni los datos de estudiantes
  // y alertas, porque pertenecen al almacenamiento del proyecto.
  function handleLogout() {
    removeStoredData('demo-role')
    removeStoredData('demo-email')
    // Elimina el estudiante seleccionado para evitar arrastrar su contexto
    // cuando otra persona entre al prototipo en el mismo navegador.
    removeStoredData('demo-student-id')

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
                title={
                  role === 'estudiante'
                    ? 'Mi orientación'
                    : role === 'orientador'
                      ? 'Acompañamiento'
                      : role === 'administrador'
                        ? 'Supervisión'
                        : 'Espacio docente'
                }
                items={roleItems[role]}
              />

              {/* Opciones comunes que informan si una función está pendiente. */}
              <SectionGroup
                title="Mi información y configuración"
                items={configurationItems}
              />

              <SectionGroup
                title="Ayuda"
                items={helpItems}
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
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: '#FEF2F2',
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1 }}>
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

                    <p
                      style={{
                        fontSize: 12,
                        color: '#FCA5A5',
                        margin: '3px 0 0',
                      }}
                    >
                      Salir del perfil de demostración actual
                    </p>
                  </div>

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

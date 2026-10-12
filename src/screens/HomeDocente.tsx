
import { useNavigate } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import Card from '../components/Card'
import SectionTitle from '../components/SectionTitle'
import BottomNav from '../components/BottomNav'

import {
  AlertIcon,
  AnalyticsIcon,
  StudentsIcon,
} from '../components/icons'

import { COLORS } from '../theme'
import { studentsService } from '../services/students.service'
import { alertsService } from '../services/alerts.service'

// ============================================================
// TIPOS Y FUNCIONES AUXILIARES
// ============================================================

// Normaliza nombres para relacionar alertas antiguas que no tengan
// studentId con los estudiantes registrados en el servicio.
function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase('es-CO')
}

// Define la prioridad visual de cada nivel de riesgo.
// Un número menor representa una prioridad más alta.
const RISK_PRIORITY = {
  alto: 0,
  medio: 1,
  bajo: 2,
} as const

// Determina el color de un nivel de riesgo.
function getRiskColor(risk: 'bajo' | 'medio' | 'alto'): string {
  if (risk === 'alto') return COLORS.riskHigh
  if (risk === 'medio') return COLORS.riskMid
  return COLORS.riskLow
}

// ============================================================
// PANTALLA PRINCIPAL DEL DOCENTE
// ============================================================

export default function HomeDocente() {
  const navigate = useNavigate()

  // ----------------------------------------------------------
  // 1. CONSULTA DE DATOS
  // ----------------------------------------------------------

  // Recupera los estudiantes y alertas de los servicios existentes.
  // No se mantienen listas duplicadas dentro de esta pantalla.
  const students = studentsService.getAll()
  const alerts = alertsService.getAll()

  // ----------------------------------------------------------
  // 2. CÁLCULO DE INDICADORES
  // ----------------------------------------------------------

  // Cuenta los estudiantes por nivel de riesgo registrado.
  const riskLevels = [
    {
      label: 'Riesgo bajo',
      count: students.filter((student) => student.risk === 'bajo').length,
      color: COLORS.riskLow,
    },
    {
      label: 'Riesgo medio',
      count: students.filter((student) => student.risk === 'medio').length,
      color: COLORS.riskMid,
    },
    {
      label: 'Riesgo alto',
      count: students.filter((student) => student.risk === 'alto').length,
      color: COLORS.riskHigh,
    },
  ]

  // Se consideran activas las alertas nuevas o en seguimiento.
  const activeAlerts = alerts.filter(
    (alert) => alert.status !== 'Revisada',
  )

  // Cuenta los seguimientos guardados para las alertas existentes.
  const totalFollowUps = alerts.reduce(
    (total, alert) =>
      total + alertsService.getFollowUpsByAlert(alert.id).length,
    0,
  )

  // Cuenta los casos de riesgo alto con alerta activa.
  // Se utiliza un conjunto para no contar dos veces al mismo estudiante.
  const highRiskCases = new Set(
    activeAlerts
      .filter((alert) => alert.risk === 'alto')
      .map((alert) => {
        const matchingStudent =
          alert.studentId !== undefined
            ? students.find((student) => student.id === alert.studentId)
            : students.find(
                (student) =>
                  normalizeName(student.name) === normalizeName(alert.name),
              )

        // Si no existe correspondencia, se utiliza el nombre de la alerta
        // para no perder ese caso del resumen.
        return matchingStudent
          ? `student-${matchingStudent.id}`
          : `alert-name-${normalizeName(alert.name)}`
      }),
  ).size

  // ----------------------------------------------------------
  // 3. ALERTAS QUE REQUIEREN SEGUIMIENTO
  // ----------------------------------------------------------

  // Relaciona cada alerta activa con el estudiante correspondiente
  // cuando existe una coincidencia por ID o nombre.
  const priorityAlerts = activeAlerts
    .map((alert) => {
      const matchingStudent =
        alert.studentId !== undefined
          ? students.find((student) => student.id === alert.studentId)
          : students.find(
              (student) =>
                normalizeName(student.name) === normalizeName(alert.name),
            )

      return {
        alert,
        student: matchingStudent,
      }
    })
    // Ordena primero las alertas de riesgo alto, luego medio y finalmente bajo.
    .sort((a, b) => {
      const riskDifference =
        RISK_PRIORITY[a.alert.risk] - RISK_PRIORITY[b.alert.risk]

      if (riskDifference !== 0) {
        return riskDifference
      }

      // Entre alertas del mismo riesgo, se priorizan las nuevas.
      if (a.alert.status === 'Nueva' && b.alert.status !== 'Nueva') return -1
      if (b.alert.status === 'Nueva' && a.alert.status !== 'Nueva') return 1

      return 0
    })
    // El inicio muestra una lista breve. El módulo de Alertas conserva
    // la consulta completa de todos los casos.
    .slice(0, 3)

  // ----------------------------------------------------------
  // 4. INDICADORES DEL RESUMEN
  // ----------------------------------------------------------

  const summaryItems = [
    {
      value: students.length,
      label: 'Estudiantes',
    },
    {
      value: activeAlerts.length,
      label: 'Alertas activas',
    },
    {
      value: totalFollowUps,
      label: 'Seguimientos',
    },
  ]

  // ----------------------------------------------------------
  // 5. ACCIONES RÁPIDAS
  // ----------------------------------------------------------

  // Cada botón tiene una ruta real registrada en App.tsx.
  // La orientación vocacional queda disponible como acceso al módulo
  // para facilitar su exploración durante la demostración.
  const quickActions = [
    {
      label: 'Estudiantes',
      Icon: StudentsIcon,
      color: COLORS.blue,
      path: '/app/estudiantes',
    },
    {
      label: 'Alertas',
      Icon: AlertIcon,
      color: COLORS.riskMid,
      path: '/app/alertas',
    },
    {
      label: 'Analítica',
      Icon: AnalyticsIcon,
      color: COLORS.teal,
      path: '/app/analitica',
    },
  ]

  // ============================================================
  // RENDERIZADO
  // ============================================================

  return (
    <PhoneCenter>
      {/* Activa la estructura adaptable: menú lateral en escritorio
          y navegación inferior en móviles. */}
      <PhoneFrame desktopLayout>
        <BottomNav role="docente" />

        <div className="ea-screen-main">
          {/* ----------------------------------------------------
              ENCABEZADO DEL DOCENTE
          ---------------------------------------------------- */}

          <div
            className="ea-screen-header"
            style={{
              background: '#FFFFFF',
              padding: '18px 24px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexShrink: 0,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 13,
                  color: COLORS.muted,
                  margin: 0,
                }}
              >
                Espacio docente
              </p>

              <h1
                style={{
                  fontSize: 22,
                  color: COLORS.navy,
                  fontWeight: 700,
                  margin: '3px 0',
                }}
              >
                Resumen educativo
              </h1>

              <p
                style={{
                  fontSize: 12,
                  color: COLORS.subtle,
                  margin: 0,
                }}
              >
                Consulta el estado de los estudiantes y sus alertas.
              </p>
            </div>

            {/* Avatar ilustrativo; todavía no representa un usuario autenticado. */}
            <div
              aria-label="Perfil docente de demostración"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #2563EB, #14B8A6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
                color: '#FFFFFF',
              }}
            >
              ED
            </div>
          </div>

          {/* Contenido desplazable, independiente de la navegación. */}
          <div className="ea-screen-content no-scrollbar">
            <div
              style={{
                width: '100%',
                maxWidth: 1200,
                boxSizing: 'border-box',
                margin: '0 auto',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {/* ------------------------------------------------
                  AVISO DE ATENCIÓN PRIORITARIA
              ------------------------------------------------ */}

              <section
                style={{
                  background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%)',
                  border: '1px solid #BFDBFE',
                  borderRadius: 14,
                  padding: '13px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 9,
                    height: 9,
                    flexShrink: 0,
                    borderRadius: '50%',
                    background:
                      highRiskCases > 0
                        ? COLORS.riskHigh
                        : COLORS.teal,
                  }}
                />

                <p
                  style={{
                    fontSize: 12,
                    color: '#1E40AF',
                    fontWeight: 500,
                    margin: 0,
                    flex: 1,
                    lineHeight: 1.6,
                  }}
                >
                  {highRiskCases > 0
                    ? `${highRiskCases} caso${highRiskCases === 1 ? '' : 's'} con alertas de riesgo alto requiere${highRiskCases === 1 ? '' : 'n'} revisión prioritaria.`
                    : 'No hay alertas activas de riesgo alto en los registros actuales.'}
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/app/alertas')}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: COLORS.blue,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Ver
                </button>
              </section>

              {/* ------------------------------------------------
                  RESUMEN GENERAL
              ------------------------------------------------ */}

              <section>
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #0F3BA8 100%)',
                    borderRadius: 20,
                    padding: '22px 20px',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.20)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.85)',
                      margin: '0 0 20px',
                    }}
                  >
                    Resumen de estudiantes
                  </p>

                  {/* Los tres indicadores proceden de los servicios actuales. */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: 12,
                    }}
                  >
                    {summaryItems.map((item) => (
                      <div
                        key={item.label}
                        style={{
                          textAlign: 'center',
                          minWidth: 0,
                        }}
                      >
                        <p
                          style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: '#FFFFFF',
                            lineHeight: 1.1,
                            margin: 0,
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {item.value}
                        </p>

                        <p
                          style={{
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.78)',
                            lineHeight: 1.4,
                            margin: '6px 0 0',
                          }}
                        >
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* ------------------------------------------------
                  DISTRIBUCIÓN DEL RIESGO
              ------------------------------------------------ */}

              <section>
                <div style={{ marginBottom: 12 }}>
                  <SectionTitle>Distribución del riesgo</SectionTitle>
                </div>

                <Card>
                  {students.length === 0 ? (
                    <p
                      style={{
                        fontSize: 13,
                        color: COLORS.muted,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      No hay estudiantes registrados para calcular la
                      distribución del riesgo.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                      }}
                    >
                      {riskLevels.map((risk) => {
                        // El porcentaje se basa en el total de estudiantes,
                        // no en el número de alertas.
                        const percentage =
                          students.length > 0
                            ? Math.round(
                                (risk.count / students.length) * 100,
                              )
                            : 0

                        return (
                          <div key={risk.label}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 12,
                                marginBottom: 5,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13,
                                  color: '#334155',
                                }}
                              >
                                {risk.label}
                              </span>

                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: COLORS.navy,
                                }}
                              >
                                {risk.count}
                              </span>
                            </div>

                            {/* Barra proporcional a la cantidad de estudiantes. */}
                            <div
                              style={{
                                height: 6,
                                borderRadius: 99,
                                background: '#F1F5F9',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${percentage}%`,
                                  background: risk.color,
                                  borderRadius: 99,
                                  transition: 'width 0.2s ease',
                                }}
                              />
                            </div>

                            <p
                              style={{
                                fontSize: 10,
                                color: COLORS.subtle,
                                margin: '4px 0 0',
                              }}
                            >
                              {percentage}% del total
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              </section>

              {/* ------------------------------------------------
                  SEGUIMIENTO PRIORITARIO
              ------------------------------------------------ */}

              <section>
                <div style={{ marginBottom: 12 }}>
                  <SectionTitle>Seguimiento prioritario</SectionTitle>
                </div>

                {priorityAlerts.length === 0 ? (
                  <Card>
                    <p
                      style={{
                        fontSize: 13,
                        color: COLORS.muted,
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      No hay alertas pendientes de revisión o seguimiento.
                      Las nuevas alertas aparecerán aquí cuando se registren.
                    </p>
                  </Card>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                      gap: 12,
                    }}
                  >
                    {priorityAlerts.map(({ alert, student }) => {
                      const riskColor = getRiskColor(alert.risk)

                      return (
                        <Card key={alert.id} padding="14px">
                          {/* Identidad y nivel de riesgo de la alerta. */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              marginBottom: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                flexShrink: 0,
                                borderRadius: '50%',
                                background: `${riskColor}18`,
                                color: riskColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                            >
                              {alert.initials}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: COLORS.navy,
                                  margin: 0,
                                  overflowWrap: 'anywhere',
                                }}
                              >
                                {student?.name ?? alert.name}
                              </p>

                              <p
                                style={{
                                  fontSize: 12,
                                  color: COLORS.muted,
                                  margin: '3px 0 0',
                                }}
                              >
                                Grado {student?.grade ?? alert.grade}
                              </p>
                            </div>

                            <span
                              style={{
                                background: `${riskColor}15`,
                                color: riskColor,
                                fontSize: 10,
                                fontWeight: 700,
                                borderRadius: 20,
                                padding: '5px 8px',
                                flexShrink: 0,
                              }}
                            >
                              {alert.risk}
                            </span>
                          </div>

                          {/* Señal asociada con la alerta. */}
                          <p
                            style={{
                              fontSize: 12,
                              color: '#475569',
                              margin: '0 0 12px',
                              lineHeight: 1.6,
                            }}
                          >
                            {alert.signal}
                          </p>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 10,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: COLORS.muted,
                              }}
                            >
                              {alert.status}
                            </span>

                            {/* Si existe un estudiante asociado se abre su ficha;
                                si no, se abre la lista general de alertas. */}
                            <button
                              type="button"
                              onClick={() =>
                                student
                                  ? navigate(`/app/estudiantes/${student.id}`)
                                  : navigate('/app/alertas')
                              }
                              style={{
                                padding: '8px 10px',
                                background: COLORS.lightBlue,
                                color: COLORS.blue,
                                border: '1px solid #DBEAFE',
                                borderRadius: 9,
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {student ? 'Ver ficha' : 'Ver alerta'}
                            </button>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {/* Acceso al listado completo, no solo a las tres alertas del inicio. */}
                <button
                  type="button"
                  onClick={() => navigate('/app/alertas')}
                  style={{
                    marginTop: 12,
                    padding: '8px 0',
                    border: 'none',
                    background: 'none',
                    color: COLORS.blue,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Consultar todas las alertas
                </button>
              </section>

              {/* ------------------------------------------------
                  ACCIONES RÁPIDAS
              ------------------------------------------------ */}

              <section>
                <div style={{ marginBottom: 12 }}>
                  <SectionTitle>Acciones rápidas</SectionTitle>
                </div>

                {/* Cada botón ahora navega a una pantalla real. */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
                    gap: 10,
                  }}
                >
                  {quickActions.map(({ label, Icon, color, path }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => navigate(path)}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: 14,
                        padding: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        border: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
                        textAlign: 'left',
                        minWidth: 0,
                      }}
                    >
                      {/* Icono que identifica la acción. */}
                      <span
                        style={{
                          width: 38,
                          height: 38,
                          flexShrink: 0,
                          borderRadius: 11,
                          background: `${color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon color={color} />
                      </span>

                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: COLORS.navy,
                        }}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Nota sobre el origen de la información del prototipo. */}
              <p
                style={{
                  fontSize: 11,
                  color: COLORS.subtle,
                  lineHeight: 1.6,
                  margin: 0,
                  paddingBottom: 8,
                }}
              >
                Los indicadores se calculan a partir de los datos locales de
                EduAlerta. Las alertas y los perfiles de riesgo son registros
                de demostración y requieren validación antes de utilizarse
                para tomar decisiones educativas reales.
              </p>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}

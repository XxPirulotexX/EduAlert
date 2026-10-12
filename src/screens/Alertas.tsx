
import { useState } from 'react'
import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import RiskBadge from '../components/RiskBadge'
import { ChevronRight, FilterIcon } from '../components/icons'
import { alertsService } from '../services/alerts.service'
import { COLORS } from '../theme'
import type { AlertStatus } from '../types'

// Opciones disponibles para filtrar las alertas por nivel de riesgo.
const FILTERS = [
  'Todas',
  'Prioritarias',
  'Riesgo alto',
  'Riesgo medio',
  'Riesgo bajo',
]

export default function Alertas() {
  const [activeFilter, setActiveFilter] = useState('Todas')
  const [alerts, setAlerts] = useState(() => alertsService.getAll())
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null)

  // Campos del formulario de seguimiento.
  const [followUpNotes, setFollowUpNotes] = useState('')
  const [followUpResponsible, setFollowUpResponsible] = useState('')
  const [, setFollowUpRefresh] = useState(0)
  const [followUpError, setFollowUpError] = useState('')

  // Actualiza el estado de una alerta y sincroniza la lista.
  const handleStatusChange = (id: number, status: AlertStatus) => {
    try {
      alertsService.updateStatus(id, status)
      setAlerts(alertsService.getAll())
      setFollowUpError('')
    } catch (error) {
      setFollowUpError(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado de la alerta.',
      )
    }
  }

  // Registra una acción de acompañamiento para una alerta.
  const handleAddFollowUp = (alertId: number) => {
    try {
      alertsService.addFollowUp({
        alertId,
        responsible: followUpResponsible,
        notes: followUpNotes,
      })

      setFollowUpNotes('')
      setFollowUpResponsible('')
      setFollowUpError('')
      setFollowUpRefresh((previous) => previous + 1)
    } catch (error) {
      setFollowUpError(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el seguimiento.',
      )
    }
  }

  // Contadores derivados del estado actual de las alertas.
  const alertCounts = {
    total: alerts.length,
    nuevas: alerts.filter((alert) => alert.status === 'Nueva').length,
    seguimiento: alerts.filter(
      (alert) => alert.status === 'En seguimiento',
    ).length,
    revisadas: alerts.filter(
      (alert) => alert.status === 'Revisada',
    ).length,
  }

  // Aplica el filtro seleccionado.
  const filtered = alerts.filter((alert) => {
    if (activeFilter === 'Todas') return true

    if (
      activeFilter === 'Prioritarias' ||
      activeFilter === 'Riesgo alto'
    ) {
      return alert.risk === 'alto'
    }

    if (activeFilter === 'Riesgo medio') {
      return alert.risk === 'medio'
    }

    if (activeFilter === 'Riesgo bajo') {
      return alert.risk === 'bajo'
    }

    return true
  })

  return (
    <PhoneCenter>
      <PhoneFrame desktopLayout>
        {/* En escritorio, la navegación es la columna izquierda.
            En móvil, el CSS la coloca en la parte inferior. */}
        <BottomNav role="docente" />

        {/* Este contenedor agrupa todo el contenido a la derecha
            del menú lateral y permite que se adapte al espacio disponible. */}
        <div className="ea-screen-main">
          {/* Encabezado de la pantalla */}
          <div
            className="ea-screen-header"
            style={{
              background: COLORS.navy,
              padding: '16px 20px 18px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                flexWrap: 'wrap',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      width: 3,
                      height: 22,
                      background: COLORS.blue,
                      borderRadius: 2,
                    }}
                  />

                  <h1
                    style={{
                      color: '#FFFFFF',
                      fontSize: 20,
                      fontWeight: 700,
                      margin: 0,
                      letterSpacing: '-0.3px',
                    }}
                  >
                    Alertas tempranas
                  </h1>
                </div>

                <p
                  style={{
                    color: COLORS.subtle,
                    fontSize: 13,
                    margin: '0 0 0 11px',
                  }}
                >
                  Identifica situaciones que requieren seguimiento
                </p>
              </div>

              {/* Lleva al usuario directamente a los filtros. */}
              <button
                type="button"
                aria-label="Opciones de filtro"
                onClick={() =>
                  document.getElementById('alert-filters')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  padding: '7px 8px',
                  cursor: 'pointer',
                }}
              >
                <FilterIcon color="#CBD5E1" />
              </button>
            </div>
          </div>

          {/* Contenido desplazable: filtros, resumen y alertas. */}
          <div className="ea-screen-content no-scrollbar">
            {/* Filtros por nivel de riesgo. */}
            <div
              id="alert-filters"
              style={{
                padding: '12px 16px 0',
                overflowX: 'auto',
              }}
              className="no-scrollbar"
            >
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  width: 'max-content',
                }}
              >
                {FILTERS.map((filter) => {
                  const active = activeFilter === filter

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      aria-pressed={active}
                      style={{
                        background: active ? COLORS.blue : '#FFFFFF',
                        color: active ? '#FFFFFF' : '#475569',
                        border: active
                          ? `1px solid ${COLORS.blue}`
                          : `1px solid ${COLORS.border}`,
                        borderRadius: 20,
                        padding: '7px 14px',
                        fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {filter}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Resumen de alertas calculado dinámicamente. */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 10,
                padding: '14px 16px 4px',
              }}
            >
              {[
                {
                  label: 'Total de alertas',
                  value: alertCounts.total,
                  color: COLORS.blue,
                },
                {
                  label: 'Nuevas',
                  value: alertCounts.nuevas,
                  color: COLORS.riskHigh,
                },
                {
                  label: 'En seguimiento',
                  value: alertCounts.seguimiento,
                  color: COLORS.riskMid,
                },
                {
                  label: 'Revisadas',
                  value: alertCounts.revisadas,
                  color: COLORS.riskLow,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    minWidth: 0,
                    padding: 12,
                    background: '#FFFFFF',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: COLORS.subtle,
                      lineHeight: 1.4,
                    }}
                  >
                    {item.label}
                  </div>

                  <div
                    style={{
                      marginTop: 5,
                      fontSize: 22,
                      fontWeight: 700,
                      color: item.color,
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Cantidad de resultados del filtro actual. */}
            <div
              style={{
                padding: '12px 16px 6px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 12, color: COLORS.subtle }}>
                {filtered.length}{' '}
                {filtered.length === 1 ? 'alerta' : 'alertas'}
              </span>

              <span
                style={{
                  fontSize: 12,
                  color: COLORS.blue,
                  fontWeight: 500,
                }}
              >
                Por prioridad
              </span>
            </div>

            {/* Listado de alertas filtradas. */}
            <div
              style={{
                padding: '0 16px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {filtered.length === 0 && (
                <div
                  style={{
                    padding: 20,
                    background: '#FFFFFF',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                    textAlign: 'center',
                    color: COLORS.subtle,
                    fontSize: 13,
                  }}
                >
                  No hay alertas para este filtro.
                </div>
              )}

              {filtered.map((alert) => {
                const riskColor =
                  alert.risk === 'alto'
                    ? COLORS.riskHigh
                    : alert.risk === 'medio'
                      ? COLORS.riskMid
                      : COLORS.riskLow

                const isExpanded = selectedAlertId === alert.id

                return (
                  <div
                    key={alert.id}
                    onClick={() =>
                      setSelectedAlertId(isExpanded ? null : alert.id)
                    }
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 14,
                      padding: '13px 14px',
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 12,
                      borderLeft:
                        alert.risk === 'alto'
                          ? `3px solid ${COLORS.riskHigh}`
                          : '3px solid transparent',
                      boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Identificador visual del estudiante. */}
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: `${alert.avatarBg}18`,
                        border: `1.5px solid ${alert.avatarBg}35`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14,
                        color: alert.avatarBg,
                        flexShrink: 0,
                      }}
                    >
                      {alert.initials}
                    </div>

                    {/* Información principal de la alerta. */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 4,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: COLORS.navy,
                          }}
                        >
                          {alert.name}
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            color: COLORS.subtle,
                          }}
                        >
                          {alert.grade}
                        </span>
                      </div>

                      <div style={{ marginBottom: 6 }}>
                        <RiskBadge risk={alert.risk} />
                      </div>

                      <p
                        style={{
                          fontSize: 12,
                          color: '#475569',
                          margin: 0,
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        "{alert.signal}"
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginTop: 6,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            color: riskColor,
                            background: `${riskColor}15`,
                            padding: '2px 8px',
                            borderRadius: 20,
                          }}
                        >
                          {alert.status}
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            color: COLORS.subtle,
                          }}
                        >
                          {alert.time}
                        </span>
                      </div>
                    </div>

                    <ChevronRight />

                    {/* Panel expandible para gestionar la alerta. */}
                    {isExpanded && (
                      <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          marginTop: 8,
                          padding: 12,
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: 12,
                          cursor: 'default',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: COLORS.navy,
                          }}
                        >
                          Cambiar estado
                        </span>

                        {/* Estados permitidos por el modelo. */}
                        {(
                          ['Nueva', 'En seguimiento', 'Revisada'] as const
                        ).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() =>
                              handleStatusChange(alert.id, status)
                            }
                            aria-pressed={alert.status === status}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 8,
                              border:
                                alert.status === status
                                  ? `1px solid ${COLORS.blue}`
                                  : '1px solid #E2E8F0',
                              background:
                                alert.status === status
                                  ? '#DBEAFE'
                                  : '#FFFFFF',
                              color:
                                alert.status === status
                                  ? '#1D4ED8'
                                  : '#334155',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: 12,
                              fontWeight:
                                alert.status === status ? 600 : 400,
                            }}
                          >
                            {alert.status === status
                              ? `✓ ${status}`
                              : status}
                          </button>
                        ))}

                        {/* Historial y formulario de seguimiento. */}
                        <div
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            marginTop: 10,
                            padding: 12,
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: 12,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: COLORS.navy,
                              marginBottom: 10,
                            }}
                          >
                            Historial de seguimiento
                          </div>

                          {/* Registros asociados a esta alerta. */}
                          {alertsService
                            .getFollowUpsByAlert(alert.id)
                            .map((item) => (
                              <div
                                key={item.id}
                                style={{
                                  padding: '10px 0',
                                  borderBottom: '1px solid #E2E8F0',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: COLORS.blue,
                                    fontWeight: 600,
                                  }}
                                >
                                  {new Date(item.date).toLocaleString('es-CO')}
                                </div>

                                <div
                                  style={{
                                    fontSize: 12,
                                    color: COLORS.navy,
                                    marginTop: 4,
                                  }}
                                >
                                  Responsable: {item.responsible}
                                </div>

                                <p
                                  style={{
                                    fontSize: 12,
                                    color: '#475569',
                                    margin: '5px 0 0',
                                    lineHeight: 1.5,
                                    whiteSpace: 'pre-wrap',
                                    overflowWrap: 'anywhere',
                                  }}
                                >
                                  {item.notes}
                                </p>
                              </div>
                            ))}

                          {/* Formulario controlado por React. */}
                          <form
                            onSubmit={(event) => {
                              event.preventDefault()
                              handleAddFollowUp(alert.id)
                            }}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                              marginTop: 12,
                            }}
                          >
                            <label
                              style={{
                                fontSize: 12,
                                color: COLORS.navy,
                                fontWeight: 600,
                              }}
                            >
                              Responsable
                              <input
                                value={followUpResponsible}
                                onChange={(event) =>
                                  setFollowUpResponsible(event.target.value)
                                }
                                placeholder="Nombre del responsable"
                                autoComplete="name"
                                required
                                style={{
                                  boxSizing: 'border-box',
                                  width: '100%',
                                  marginTop: 5,
                                  padding: 10,
                                  border: '1px solid #CBD5E1',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  background: '#FFFFFF',
                                  color: COLORS.navy,
                                }}
                              />
                            </label>

                            <label
                              style={{
                                fontSize: 12,
                                color: COLORS.navy,
                                fontWeight: 600,
                              }}
                            >
                              Acción realizada
                              <textarea
                                value={followUpNotes}
                                onChange={(event) =>
                                  setFollowUpNotes(event.target.value)
                                }
                                placeholder="Describe la acción realizada..."
                                rows={3}
                                required
                                style={{
                                  boxSizing: 'border-box',
                                  width: '100%',
                                  marginTop: 5,
                                  padding: 10,
                                  border: '1px solid #CBD5E1',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  resize: 'vertical',
                                  background: '#FFFFFF',
                                  color: COLORS.navy,
                                }}
                              />
                            </label>

                            {/* Mensaje de error del formulario. */}
                            {followUpError && (
                              <p
                                role="alert"
                                style={{
                                  color: COLORS.riskHigh,
                                  fontSize: 12,
                                  margin: 0,
                                }}
                              >
                                {followUpError}
                              </p>
                            )}

                            <button
                              type="submit"
                              disabled={
                                !followUpResponsible.trim() ||
                                !followUpNotes.trim()
                              }
                              style={{
                                padding: 10,
                                border: 'none',
                                borderRadius: 8,
                                background:
                                  followUpResponsible.trim() &&
                                  followUpNotes.trim()
                                    ? COLORS.blue
                                    : '#CBD5E1',
                                color: '#FFFFFF',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor:
                                  followUpResponsible.trim() &&
                                  followUpNotes.trim()
                                    ? 'pointer'
                                    : 'not-allowed',
                              }}
                            >
                              Guardar seguimiento
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}

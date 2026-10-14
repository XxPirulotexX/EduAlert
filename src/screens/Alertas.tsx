import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import RiskBadge from '../components/RiskBadge'
import { SearchIcon } from '../components/icons'
import { alertasApiService, type AlertFollowUp, type AlertStatus, type ApiAlert } from '../services/alertas-api.service'
import { studentsApiService, type ApiStudent, type RiskLevel } from '../services/students-api.service'
import { getCurrentAuthUser } from '../services/auth.service'
import { ApiClientError } from '../services/api-client.service'
import { COLORS } from '../theme'
import type { Risk, Role } from '../types'

type RiskFilter = 'Todas' | 'Prioritarias' | 'Riesgo alto' | 'Riesgo medio' | 'Riesgo bajo' | 'Sin evaluar'
type StatusFilter = 'Todos' | AlertStatus
type GradeFilter = 'Todos' | '10°' | '11°' | 'Otros'

const RISK_FILTERS: RiskFilter[] = [
  'Todas', 'Prioritarias', 'Riesgo alto', 'Riesgo medio', 'Riesgo bajo', 'Sin evaluar',
]
const STATUS_FILTERS: StatusFilter[] = ['Todos', 'Nueva', 'En seguimiento', 'Revisada']
const GRADE_FILTERS: { value: GradeFilter; label: string }[] = [
  { value: 'Todos', label: 'Todos los grados' },
  { value: '10°', label: 'Décimo (10°)' },
  { value: '11°', label: 'Once (11°)' },
  { value: 'Otros', label: 'Otros / sin grado' },
]
const STATUS_OPTIONS: AlertStatus[] = ['Nueva', 'En seguimiento', 'Revisada']
const RISK_LABELS: Record<RiskLevel, string> = {
  bajo: 'Riesgo bajo', medio: 'Riesgo medio', alto: 'Riesgo alto', sin_evaluar: 'Sin evaluar',
}
const primaryButton: CSSProperties = {
  border: 'none', borderRadius: 10, padding: '10px 14px', background: COLORS.blue,
  color: '#FFFFFF', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}
const secondaryButton: CSSProperties = {
  border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: '8px 11px',
  background: '#FFFFFF', color: COLORS.navy, fontSize: 12, fontWeight: 600, cursor: 'pointer',
}
const fieldStyle: CSSProperties = {
  display: 'block', width: '100%', boxSizing: 'border-box', border: `1px solid ${COLORS.border}`,
  borderRadius: 10, padding: '10px 12px', background: '#FFFFFF', color: COLORS.navy, fontSize: 13,
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado. Inténtalo nuevamente.'
}
function isEvaluatedRisk(level: RiskLevel): level is Risk {
  return level === 'bajo' || level === 'medio' || level === 'alto'
}
function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}

/** Normaliza texto para que la búsqueda no dependa de tildes o mayúsculas. */
function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim()
}

/** Agrupa los formatos habituales del grado en las opciones del filtro. */
function normalizeGrade(value: string | null): Exclude<GradeFilter, 'Todos'> {
  const normalized = normalizeText(value ?? '')
  const number = normalized.match(/\d+/)?.[0]

  if (number === '10' || /\bdecim[oa]\b/.test(normalized)) return '10°'
  if (number === '11' || /\bonce\b|\bundecim[oa]\b/.test(normalized)) return '11°'
  return 'Otros'
}

export default function Alertas() {
  const [alerts, setAlerts] = useState<ApiAlert[]>([])
  const [students, setStudents] = useState<ApiStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<RiskFilter>('Todas')
  const [activeStatusFilter, setActiveStatusFilter] = useState<StatusFilter>('Todos')
  const [activeGradeFilter, setActiveGradeFilter] = useState<GradeFilter>('Todos')
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [signal, setSignal] = useState('')
  const [risk, setRisk] = useState<RiskLevel>('sin_evaluar')
  const [statusSavingId, setStatusSavingId] = useState<number | null>(null)
  const [expandedFollowUpId, setExpandedFollowUpId] = useState<number | null>(null)
  const [followUps, setFollowUps] = useState<Record<number, AlertFollowUp[]>>({})
  const [followUpDrafts, setFollowUpDrafts] = useState<Record<number, string>>({})
  const [followUpLoadingId, setFollowUpLoadingId] = useState<number | null>(null)
  const [followUpSavingId, setFollowUpSavingId] = useState<number | null>(null)
  const [followUpError, setFollowUpError] = useState<Record<number, string>>({})
  const currentRole = getCurrentAuthUser()?.rol ?? 'docente'

  /** Alertas, estudiantes y su nivel vigente se consultan desde SQL mediante la API. */
  const loadData = useCallback(async () => {
    setLoading(true)
    setPageError('')
    try {
      const [alertResults, studentResults] = await Promise.all([
        alertasApiService.getAll(),
        studentsApiService.getAll(),
      ])
      setAlerts(alertResults)
      setStudents(studentResults.filter((student) => student.estado === 'activo'))
    } catch (error) {
      setPageError(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  /** Los cuatro criterios se combinan: una alerta debe cumplirlos todos. */
  const filteredAlerts = useMemo(() => {
    const query = normalizeText(search)

    return alerts.filter((alert) => {
      const matchesRisk =
        activeFilter === 'Todas' ||
        ((activeFilter === 'Prioritarias' || activeFilter === 'Riesgo alto') && alert.nivelRiesgo === 'alto') ||
        (activeFilter === 'Riesgo medio' && alert.nivelRiesgo === 'medio') ||
        (activeFilter === 'Riesgo bajo' && alert.nivelRiesgo === 'bajo') ||
        (activeFilter === 'Sin evaluar' && alert.nivelRiesgo === 'sin_evaluar')

      const matchesStatus = activeStatusFilter === 'Todos' || alert.estado === activeStatusFilter
      const matchesGrade = activeGradeFilter === 'Todos' || normalizeGrade(alert.grado) === activeGradeFilter

      const searchableText = normalizeText([
        alert.nombreEstudiante,
        alert.codigoEstudiantil,
        alert.senal,
        alert.grado ?? '',
        alert.estado,
        alert.nivelRiesgo,
      ].join(' '))
      const matchesSearch = !query || searchableText.includes(query)

      return matchesRisk && matchesStatus && matchesGrade && matchesSearch
    })
  }, [alerts, activeFilter, activeStatusFilter, activeGradeFilter, search])

  const hasActiveFilters =
    Boolean(search.trim()) || activeFilter !== 'Todas' ||
    activeStatusFilter !== 'Todos' || activeGradeFilter !== 'Todos'

  const clearFilters = () => {
    setSearch('')
    setActiveFilter('Todas')
    setActiveStatusFilter('Todos')
    setActiveGradeFilter('Todos')
  }

  const openCreateForm = () => {
    setFormError(''); setNotice(''); setPageError('')
    const firstStudent = students[0]
    setSelectedStudentId(firstStudent ? String(firstStudent.id) : '')
    setSignal('')
    setRisk(firstStudent?.nivelRiesgo ?? 'sin_evaluar')
    setFormOpen(true)
  }

  const handleCreateAlert = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(''); setNotice('')
    if (!selectedStudentId) {
      setFormError('Selecciona un estudiante activo para asociar la alerta.')
      return
    }
    if (!signal.trim()) {
      setFormError('Describe la señal que requiere seguimiento.')
      return
    }
    if (signal.trim().length > 500) {
      setFormError('La descripción no puede superar 500 caracteres.')
      return
    }
    setSaving(true)
    try {
      const created = await alertasApiService.create({
        estudianteId: Number(selectedStudentId),
        senal: signal.trim(),
        nivelRiesgo: risk,
      })
      setAlerts((current) => [created, ...current])
      setNotice('La alerta se guardó en PostgreSQL.')
      setFormOpen(false)
      setSignal('')
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  /** Los cambios de estado se confirman primero en la API antes de actualizar React. */
  const handleStatusChange = async (id: number, estado: AlertStatus) => {
    setStatusSavingId(id); setPageError(''); setNotice('')
    try {
      const updated = await alertasApiService.updateStatus(id, estado)
      setAlerts((current) => current.map((item) => item.id === id ? updated : item))
      setNotice(`La alerta #${id} quedó en estado «${estado}».`)
    } catch (error) {
      setPageError(errorMessage(error))
    } finally {
      setStatusSavingId(null)
    }
  }

  const toggleFollowUps = async (alertId: number) => {
    if (expandedFollowUpId === alertId) {
      setExpandedFollowUpId(null)
      return
    }
    setExpandedFollowUpId(alertId)
    setFollowUpError((current) => ({ ...current, [alertId]: '' }))
    if (followUps[alertId]) return
    setFollowUpLoadingId(alertId)
    try {
      const items = await alertasApiService.getFollowUps(alertId)
      setFollowUps((current) => ({ ...current, [alertId]: items }))
    } catch (error) {
      setFollowUpError((current) => ({ ...current, [alertId]: errorMessage(error) }))
    } finally {
      setFollowUpLoadingId(null)
    }
  }

  /** Las notas se asocian al usuario autenticado en el backend, no a texto libre del navegador. */
  const handleAddFollowUp = async (alertId: number) => {
    const note = (followUpDrafts[alertId] ?? '').trim()
    if (!note) {
      setFollowUpError((current) => ({ ...current, [alertId]: 'Escribe una observación antes de guardar.' }))
      return
    }
    setFollowUpSavingId(alertId)
    setFollowUpError((current) => ({ ...current, [alertId]: '' }))
    try {
      const created = await alertasApiService.addFollowUp(alertId, note)
      setFollowUps((current) => ({ ...current, [alertId]: [created, ...(current[alertId] ?? [])] }))
      setFollowUpDrafts((current) => ({ ...current, [alertId]: '' }))
    } catch (error) {
      const message = error instanceof ApiClientError && error.status === 401
        ? 'La sesión venció. Inicia sesión de nuevo.'
        : errorMessage(error)
      setFollowUpError((current) => ({ ...current, [alertId]: message }))
    } finally {
      setFollowUpSavingId(null)
    }
  }

  const activeCount = alerts.filter((alert) => alert.estado !== 'Revisada').length
  const highCount = alerts.filter((alert) => alert.nivelRiesgo === 'alto' && alert.estado !== 'Revisada').length

  return (
    <PhoneCenter>
      <PhoneFrame desktopLayout>
        <BottomNav role={currentRole as Role} />
        <div className="ea-screen-main">
          <div className="ea-screen-header" style={{ background: COLORS.navy, padding: '18px 20px 16px', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ width: 3, height: 22, background: COLORS.teal, borderRadius: 2 }} />
                  <h1 style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 700, margin: 0 }}>Alertas tempranas</h1>
                </div>
                <p style={{ color: '#CBD5E1', fontSize: 12, margin: '0 0 0 11px', lineHeight: 1.5 }}>Señales, riesgo y seguimiento registrados en SQL</p>
              </div>
              <button type="button" onClick={openCreateForm} style={{ ...primaryButton, flexShrink: 0 }}>+ Nueva alerta</button>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', minWidth: 105 }}><span style={{ color: '#CBD5E1', fontSize: 11 }}>Activas</span><strong style={{ display: 'block', color: '#FFFFFF', fontSize: 20 }}>{activeCount}</strong></div>
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', minWidth: 105 }}><span style={{ color: '#CBD5E1', fontSize: 11 }}>Riesgo alto activo</span><strong style={{ display: 'block', color: '#FCA5A5', fontSize: 20 }}>{highCount}</strong></div>
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '9px 12px', minWidth: 105 }}><span style={{ color: '#CBD5E1', fontSize: 11 }}>Total histórico</span><strong style={{ display: 'block', color: '#FFFFFF', fontSize: 20 }}>{alerts.length}</strong></div>
            </div>
          </div>

          <div className="ea-screen-content no-scrollbar" style={{ padding: '16px 20px 24px' }}>
            {pageError && <div role="alert" style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13 }}><p style={{ margin: '0 0 8px' }}>{pageError}</p><button type="button" onClick={() => void loadData()} style={secondaryButton}>Reintentar</button></div>}
            {notice && <div role="status" style={{ background: '#F0FDF4', color: '#166534', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13 }}>{notice}</div>}

            {/* Búsqueda por estudiante, código, señal o atributos de la alerta. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '10px 13px', marginBottom: 16 }}>
              <SearchIcon size={18} color={COLORS.subtle} />
              <input
                type="search"
                aria-label="Buscar alertas por estudiante, código o señal"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar estudiante, código o señal..."
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: COLORS.navy, fontSize: 13 }}
              />
              {search && <button type="button" aria-label="Limpiar búsqueda" onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: COLORS.muted, fontSize: 18, cursor: 'pointer' }}>×</button>}
            </div>

            {/* Filtro de riesgo: conserva todos los niveles del sistema. */}
            <div style={{ marginBottom: 13 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, margin: '0 0 7px' }}>Nivel de riesgo</p>
              <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {RISK_FILTERS.map((filter) => {
                  const active = activeFilter === filter
                  return <button key={filter} type="button" onClick={() => setActiveFilter(filter)} aria-pressed={active} style={{ flexShrink: 0, background: active ? COLORS.blue : '#FFFFFF', color: active ? '#FFFFFF' : '#475569', border: active ? `1px solid ${COLORS.blue}` : `1px solid ${COLORS.border}`, borderRadius: 20, padding: '7px 13px', fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>{filter}</button>
                })}
              </div>
            </div>

            {/* Filtros de estado y grado para revisar un subconjunto concreto. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
              <div>
                <label htmlFor="alert-status-filter" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 6 }}>Estado de la alerta</label>
                <select id="alert-status-filter" value={activeStatusFilter} onChange={(event) => setActiveStatusFilter(event.target.value as StatusFilter)} style={{ ...fieldStyle, minHeight: 40 }}>
                  {STATUS_FILTERS.map((status) => <option key={status} value={status}>{status === 'Todos' ? 'Todos los estados' : status}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="alert-grade-filter" style={{ display: 'block', fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 6 }}>Curso o grado</label>
                <select id="alert-grade-filter" value={activeGradeFilter} onChange={(event) => setActiveGradeFilter(event.target.value as GradeFilter)} style={{ ...fieldStyle, minHeight: 40 }}>
                  {GRADE_FILTERS.map((grade) => <option key={grade.value} value={grade.value}>{grade.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {!loading && <p style={{ fontSize: 12, color: COLORS.subtle, margin: 0 }}>{filteredAlerts.length} de {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'} · ordenadas por fecha de creación</p>}
              {hasActiveFilters && <button type="button" onClick={clearFilters} style={{ ...secondaryButton, padding: '7px 10px' }}>Limpiar filtros</button>}
            </div>

            {loading && <p role="status" style={{ padding: 24, textAlign: 'center', color: COLORS.muted }}>Cargando alertas desde PostgreSQL...</p>}
            {!loading && !pageError && filteredAlerts.length === 0 && <div style={{ padding: 24, textAlign: 'center', background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 14 }}><strong style={{ color: COLORS.navy, fontSize: 14 }}>No hay alertas para este filtro</strong><p style={{ color: COLORS.muted, fontSize: 12 }}>Puedes registrar una señal nueva con el botón «Nueva alerta».</p></div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {!loading && filteredAlerts.map((alert) => {
                const highRisk = alert.nivelRiesgo === 'alto'
                const expanded = expandedFollowUpId === alert.id
                const notes = followUps[alert.id] ?? []
                const statusColor = alert.estado === 'Nueva' ? '#B45309' : alert.estado === 'En seguimiento' ? COLORS.blue : '#15803D'
                const initials = alert.nombreEstudiante.split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase()
                return <article key={alert.id} style={{ background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderLeft: highRisk ? `4px solid ${COLORS.riskHigh}` : `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div aria-hidden="true" style={{ width: 42, height: 42, borderRadius: 12, background: highRisk ? COLORS.riskHighBg : COLORS.lightBlue, color: highRisk ? COLORS.riskHigh : COLORS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <strong style={{ fontSize: 14, color: COLORS.navy }}>{alert.nombreEstudiante}</strong>
                        <span style={{ color: COLORS.subtle, fontSize: 11 }}>{alert.grado || 'Grado sin asignar'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center', marginBottom: 7 }}>
                        {isEvaluatedRisk(alert.nivelRiesgo) ? <RiskBadge risk={alert.nivelRiesgo} /> : <span style={{ color: '#64748B', background: '#F1F5F9', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{RISK_LABELS[alert.nivelRiesgo]}</span>}
                        <span style={{ color: statusColor, background: `${statusColor}14`, padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{alert.estado}</span>
                      </div>
                      <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.5, margin: '0 0 7px', overflowWrap: 'anywhere' }}>{alert.senal}</p>
                      <p style={{ color: COLORS.subtle, fontSize: 11, margin: 0 }}>Creada: {formatDate(alert.creadoEn)} · Código: {alert.codigoEstudiantil}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginTop: 13, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 7, color: COLORS.muted, fontSize: 12 }}>Estado
                      <select aria-label={`Cambiar estado de la alerta ${alert.id}`} disabled={statusSavingId === alert.id} value={alert.estado} onChange={(event) => void handleStatusChange(alert.id, event.target.value as AlertStatus)} style={{ ...fieldStyle, width: 'auto', minHeight: 34, padding: '6px 8px', fontSize: 12 }}>
                        {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </label>
                    <button type="button" onClick={() => void toggleFollowUps(alert.id)} style={secondaryButton}>{expanded ? 'Ocultar seguimiento' : 'Ver / agregar seguimiento'}</button>
                  </div>

                  {expanded && <section aria-label={`Seguimientos de alerta ${alert.id}`} style={{ marginTop: 13, borderTop: `1px solid ${COLORS.border}`, paddingTop: 13 }}>
                    <h3 style={{ fontSize: 13, color: COLORS.navy, margin: '0 0 10px' }}>Historial de seguimiento</h3>
                    {followUpLoadingId === alert.id && <p style={{ color: COLORS.muted, fontSize: 12 }}>Cargando seguimiento...</p>}
                    {followUpError[alert.id] && <p role="alert" style={{ color: COLORS.riskHigh, fontSize: 12 }}>{followUpError[alert.id]}</p>}
                    {!followUpLoadingId && notes.length === 0 && !followUpError[alert.id] && <p style={{ color: COLORS.subtle, fontSize: 12 }}>Todavía no hay observaciones registradas.</p>}
                    {notes.map((note) => <div key={note.id} style={{ padding: 10, borderRadius: 10, background: '#F8FAFC', marginBottom: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}><strong style={{ color: COLORS.navy, fontSize: 12 }}>{note.responsable}</strong><span style={{ color: COLORS.subtle, fontSize: 10 }}>{formatDate(note.creadoEn)}</span></div><p style={{ whiteSpace: 'pre-wrap', color: '#475569', fontSize: 12, lineHeight: 1.5, margin: '6px 0 0' }}>{note.observaciones}</p></div>)}
                    <label htmlFor={`follow-up-${alert.id}`} style={{ display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.navy, margin: '12px 0 6px' }}>Nueva observación</label>
                    <textarea id={`follow-up-${alert.id}`} rows={2} maxLength={1000} value={followUpDrafts[alert.id] ?? ''} onChange={(event) => setFollowUpDrafts((current) => ({ ...current, [alert.id]: event.target.value }))} placeholder="Registra la acción o contacto realizado..." style={{ ...fieldStyle, resize: 'vertical' }} />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}><button type="button" style={primaryButton} disabled={followUpSavingId === alert.id} onClick={() => void handleAddFollowUp(alert.id)}>{followUpSavingId === alert.id ? 'Guardando...' : 'Guardar seguimiento'}</button></div>
                  </section>}
                </article>
              })}
            </div>
          </div>
        </div>

        {formOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="alert-form-title" style={{ width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', borderRadius: 18, background: '#FFFFFF', padding: 22, boxSizing: 'border-box', boxShadow: '0 20px 60px rgba(15,23,42,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 16 }}><div><h2 id="alert-form-title" style={{ margin: 0, fontSize: 20, color: COLORS.navy }}>Nueva alerta</h2><p style={{ color: COLORS.muted, fontSize: 12, lineHeight: 1.5 }}>Se almacenará en la base de datos y quedará asociada a un estudiante.</p></div><button type="button" onClick={() => { if (!saving) setFormOpen(false) }} style={{ background: 'transparent', border: 'none', color: COLORS.muted, fontSize: 24, cursor: 'pointer' }} aria-label="Cerrar formulario">×</button></div>
            {formError && <p role="alert" style={{ color: '#991B1B', background: '#FEF2F2', borderRadius: 10, padding: 11, fontSize: 12 }}>{formError}</p>}
            {students.length === 0 && <p role="alert" style={{ color: '#92400E', background: '#FFFBEB', borderRadius: 10, padding: 11, fontSize: 12 }}>No hay estudiantes activos disponibles. Crea o reactiva una ficha antes de registrar una alerta.</p>}
            <form onSubmit={handleCreateAlert} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div><label htmlFor="alert-student" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.navy, marginBottom: 6 }}>Estudiante *</label><select id="alert-student" required value={selectedStudentId} onChange={(event) => { setSelectedStudentId(event.target.value); const student = students.find((item) => item.id === Number(event.target.value)); setRisk(student?.nivelRiesgo ?? 'sin_evaluar') }} style={fieldStyle}><option value="">Selecciona un estudiante</option>{students.map((student) => <option key={student.id} value={student.id}>{student.nombres} {student.apellidos} · {student.codigoEstudiantil}</option>)}</select></div>
              <div><label htmlFor="alert-risk" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.navy, marginBottom: 6 }}>Nivel de riesgo asociado</label><select id="alert-risk" value={risk} onChange={(event) => setRisk(event.target.value as RiskLevel)} style={fieldStyle}><option value="sin_evaluar">Sin evaluar</option><option value="bajo">Bajo</option><option value="medio">Medio</option><option value="alto">Alto</option></select><p style={{ color: COLORS.muted, fontSize: 11, lineHeight: 1.45, margin: '5px 0 0' }}>Se guarda como referencia del evento al momento de crear la alerta.</p></div>
              <div><label htmlFor="alert-signal" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.navy, marginBottom: 6 }}>Señal detectada *</label><textarea id="alert-signal" required maxLength={500} rows={4} value={signal} onChange={(event) => setSignal(event.target.value)} placeholder="Ej. Aumento de ausencias sin justificar" style={{ ...fieldStyle, resize: 'vertical' }} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}><button type="button" onClick={() => setFormOpen(false)} disabled={saving} style={secondaryButton}>Cancelar</button><button type="submit" disabled={saving || students.length === 0} style={{ ...primaryButton, opacity: saving || students.length === 0 ? 0.7 : 1 }}>{saving ? 'Guardando...' : 'Crear alerta'}</button></div>
            </form>
          </section>
        </div>}
      </PhoneFrame>
    </PhoneCenter>
  )
}

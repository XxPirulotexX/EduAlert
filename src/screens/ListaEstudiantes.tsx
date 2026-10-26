import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import RiskBadge from '../components/RiskBadge'
import { FilterIcon, SearchIcon } from '../components/icons'
import { ApiClientError } from '../services/api-client.service'
import {
  studentsApiService,
  type ApiStudent,
  type RiskLevel,
  type StudentRequest,
  type StudentStatus,
} from '../services/students-api.service'
import { COLORS } from '../theme'
import type { Risk } from '../types'

type FilterKey = 'todos' | StudentStatus | 'riesgo:alto' | 'riesgo:medio' | 'riesgo:bajo' | 'riesgo:sin_evaluar'
type FormValues = {
  codigoEstudiantil: string
  nombres: string
  apellidos: string
  estado: StudentStatus
  grado: string
  promedioActual: string
  nivelRiesgo: RiskLevel
  observacionesRiesgo: string
}

const PAGE_SIZE = 10

const EMPTY_FORM: FormValues = {
  codigoEstudiantil: '', nombres: '', apellidos: '', estado: 'activo',
  grado: '', promedioActual: '', nivelRiesgo: 'sin_evaluar', observacionesRiesgo: '',
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'activo', label: 'Activos' },
  { key: 'inactivo', label: 'Inactivos' },
  { key: 'riesgo:alto', label: 'Riesgo alto' },
  { key: 'riesgo:medio', label: 'Riesgo medio' },
  { key: 'riesgo:bajo', label: 'Riesgo bajo' },
  { key: 'riesgo:sin_evaluar', label: 'Sin evaluar' },
]

const STATUS_LABELS: Record<StudentStatus, string> = {
  activo: 'Activo', inactivo: 'Inactivo', egresado: 'Egresado', retirado: 'Retirado',
}
const RISK_LABELS: Record<RiskLevel, string> = {
  bajo: 'Riesgo bajo', medio: 'Riesgo medio', alto: 'Riesgo alto', sin_evaluar: 'Sin evaluar',
}
const fieldStyle: CSSProperties = {
  display: 'block', width: '100%', boxSizing: 'border-box', minHeight: 44,
  border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '10px 12px',
  fontSize: 13, color: COLORS.navy, background: '#FFFFFF', outline: 'none',
}
const labelStyle: CSSProperties = {
  display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: COLORS.navy,
}
const primaryButton: CSSProperties = {
  border: 'none', borderRadius: 10, padding: '10px 14px', background: COLORS.blue,
  color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer',
}
const secondaryButton: CSSProperties = {
  border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '9px 12px',
  background: '#FFFFFF', color: COLORS.navy, fontWeight: 600, fontSize: 12, cursor: 'pointer',
}
const dangerButton: CSSProperties = { ...secondaryButton, color: COLORS.riskHigh, borderColor: `${COLORS.riskHigh}55` }

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado. Inténtalo de nuevo.'
}
function isEvaluatedRisk(level: RiskLevel): level is Risk {
  return level === 'bajo' || level === 'medio' || level === 'alto'
}
function sortStudents(items: ApiStudent[]): ApiStudent[] {
  return [...items].sort((a, b) =>
    a.apellidos.localeCompare(b.apellidos, 'es', { sensitivity: 'base' }) ||
    a.nombres.localeCompare(b.nombres, 'es', { sensitivity: 'base' }),
  )
}

export default function ListaEstudiantes() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<ApiStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('todos')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<ApiStudent | null>(null)
  const [form, setForm] = useState<FormValues>({ ...EMPTY_FORM })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [processingId, setProcessingId] = useState<number | null>(null)

  /** La búsqueda, los filtros y la paginación se ejecutan en PostgreSQL. */
  const loadStudents = useCallback(async () => {
    setLoading(true)
    setPageError('')
    try {
      const isStatus = ['activo', 'inactivo', 'egresado', 'retirado'].includes(activeFilter)
      const riskFilter = activeFilter.startsWith('riesgo:')
        ? activeFilter.slice('riesgo:'.length) as RiskLevel
        : undefined
      const result = await studentsApiService.getPage({
        texto: search,
        estado: isStatus ? activeFilter as StudentStatus : undefined,
        nivelRiesgo: riskFilter,
        pagina: currentPage,
        tamano: PAGE_SIZE,
      })
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)
      if (currentPage > 0 && currentPage >= result.totalPages) {
        setCurrentPage(Math.max(0, result.totalPages - 1))
        return
      }
      setStudents(sortStudents(result.content))
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [activeFilter, currentPage, search])

  useEffect(() => { void loadStudents() }, [loadStudents])

  // PostgreSQL ya aplica búsqueda y filtros; no se vuelve a filtrar una sola página en React.
  const filtered = students

  const openCreateForm = () => {
    setEditingStudent(null); setForm({ ...EMPTY_FORM }); setFieldErrors({})
    setFormError(''); setNotice(''); setPageError(''); setFormOpen(true)
  }

  const openEditForm = (student: ApiStudent) => {
    setEditingStudent(student)
    setForm({
      codigoEstudiantil: student.codigoEstudiantil,
      nombres: student.nombres,
      apellidos: student.apellidos,
      estado: student.estado,
      grado: student.grado ?? '',
      promedioActual: student.promedioActual == null ? '' : String(student.promedioActual),
      nivelRiesgo: student.nivelRiesgo ?? 'sin_evaluar',
      observacionesRiesgo: student.observacionesRiesgo ?? '',
    })
    setFieldErrors({}); setFormError(''); setNotice(''); setPageError(''); setFormOpen(true)
  }

  const closeForm = () => {
    if (saving) return
    setFormOpen(false); setEditingStudent(null); setFieldErrors({}); setFormError('')
  }

  const updateField = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => { const next = { ...current }; delete next[key]; return next })
    setFormError('')
  }

  /** Validación rápida en cliente; la API vuelve a validar todos los campos. */
  const validate = () => {
    const errors: Record<string, string> = {}
    if (!form.codigoEstudiantil.trim()) errors.codigoEstudiantil = 'El código es obligatorio.'
    if (!form.nombres.trim()) errors.nombres = 'Los nombres son obligatorios.'
    if (!form.apellidos.trim()) errors.apellidos = 'Los apellidos son obligatorios.'
    if (form.grado.trim() && form.grado.trim().length > 10) errors.grado = 'El grado no puede superar 10 caracteres.'
    if (form.promedioActual.trim()) {
      const average = Number(form.promedioActual)
      if (!Number.isFinite(average) || average < 0 || average > 5) {
        errors.promedioActual = 'El promedio debe estar entre 0.0 y 5.0.'
      }
    }
    if (form.observacionesRiesgo.trim().length > 500) errors.observacionesRiesgo = 'Máximo 500 caracteres.'
    return errors
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(''); setFormError('')
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length) return

    const payload: StudentRequest = {
      // La API preserva la cuenta ya vinculada cuando usuarioId llega como null en una actualización.
      usuarioId: null,
      codigoEstudiantil: form.codigoEstudiantil.trim().toUpperCase(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      estado: form.estado,
      grado: form.grado.trim(),
      promedioActual: form.promedioActual.trim() ? Number(form.promedioActual) : null,
      nivelRiesgo: form.nivelRiesgo,
      observacionesRiesgo: form.observacionesRiesgo.trim() || null,
    }

    setSaving(true)
    try {
      if (editingStudent) {
        await studentsApiService.update(editingStudent.id, payload)
        // Se vuelve a consultar la página activa para respetar filtros y orden del servidor.
        await loadStudents()
        setNotice('La ficha y sus indicadores se actualizaron correctamente.')
      } else {
        await studentsApiService.create(payload)
        setNotice('El estudiante se registró en la base de datos.')
        if (currentPage === 0) await loadStudents()
        else setCurrentPage(0)
      }
      setFormOpen(false); setEditingStudent(null); setForm({ ...EMPTY_FORM }); setFieldErrors({})
    } catch (error) {
      if (error instanceof ApiClientError) setFieldErrors(error.fieldErrors)
      setFormError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  /** La baja lógica mantiene la ficha, las evaluaciones y las alertas históricas. */
  const handleDeactivate = async (student: ApiStudent) => {
    if (student.estado === 'inactivo' || processingId !== null) return
    if (!window.confirm(`¿Desactivar a ${student.nombres} ${student.apellidos}? El historial se conservará.`)) return
    setProcessingId(student.id); setPageError(''); setNotice('')
    try {
      await studentsApiService.deactivate(student.id)
      await loadStudents()
      setNotice('El estudiante fue desactivado. Su historial sigue guardado.')
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <PhoneCenter>
      <PhoneFrame desktopLayout>
        <BottomNav role="docente" />
        <div className="ea-screen-main">
          <div className="ea-screen-header" style={{ background: '#FFFFFF', padding: '16px 20px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.navy, margin: 0, lineHeight: 1.2 }}>Estudiantes</h1>
                <p style={{ fontSize: 13, color: COLORS.muted, margin: '4px 0 0' }}>Ficha, rendimiento y seguimiento del riesgo</p>
              </div>
              <button type="button" onClick={openCreateForm} style={{ ...primaryButton, flexShrink: 0 }}>+ Nuevo</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: '10px 14px', marginBottom: 14 }}>
              <SearchIcon />
              <input type="search" aria-label="Buscar por nombre o código" placeholder="Buscar estudiante..." value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(0) }} style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: COLORS.navy }} />
              <button type="button" aria-label="Ir a los filtros" onClick={() => document.getElementById('student-filters')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }}><FilterIcon color={COLORS.blue} /></button>
            </div>

            <div id="student-filters" className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14 }}>
              {FILTERS.map((filter) => {
                const active = activeFilter === filter.key
                return <button key={filter.key} type="button" onClick={() => { setActiveFilter(filter.key); setCurrentPage(0) }} aria-pressed={active} style={{ flexShrink: 0, background: active ? COLORS.blue : '#F1F5F9', color: active ? '#FFFFFF' : '#475569', border: 'none', borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>{filter.label}</button>
              })}
            </div>
          </div>

          <div className="ea-screen-content no-scrollbar" style={{ padding: '12px 20px 20px' }}>
            {pageError && <div role="alert" style={{ padding: 14, marginBottom: 14, borderRadius: 12, background: '#FEF2F2', color: '#991B1B', fontSize: 13 }}><p style={{ margin: '0 0 10px' }}>{pageError}</p><button type="button" onClick={() => void loadStudents()} style={secondaryButton}>Reintentar</button></div>}
            {notice && <div role="status" style={{ padding: 12, marginBottom: 14, borderRadius: 12, background: '#F0FDF4', color: '#166534', fontSize: 13 }}>{notice}</div>}
            {loading && <p role="status" style={{ padding: 20, textAlign: 'center', color: COLORS.muted, fontSize: 14 }}>Cargando estudiantes desde PostgreSQL...</p>}

            {!loading && <p aria-live="polite" style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy, margin: '0 0 12px' }}>Mostrando {filtered.length} de {totalElements} {totalElements === 1 ? 'estudiante' : 'estudiantes'}</p>}
            {!loading && !pageError && filtered.length === 0 && <div style={{ background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 22, textAlign: 'center' }}><p style={{ color: COLORS.navy, fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>No se encontraron estudiantes</p><button type="button" onClick={() => { setSearch(''); setActiveFilter('todos'); setCurrentPage(0) }} style={secondaryButton}>Limpiar filtros</button></div>}

            {!loading && filtered.map((student) => {
              const fullName = `${student.nombres} ${student.apellidos}`
              const initials = `${student.nombres.trim().charAt(0)}${student.apellidos.trim().charAt(0)}`.toUpperCase()
              const statusColor = student.estado === 'activo' ? '#15803D' : student.estado === 'inactivo' ? '#64748B' : student.estado === 'egresado' ? COLORS.blue : '#B45309'
              return (
                <article key={student.id} style={{ background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div aria-hidden="true" style={{ width: 44, height: 44, borderRadius: '50%', background: `${statusColor}18`, color: statusColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy, margin: '0 0 4px', overflowWrap: 'anywhere' }}>{fullName}</p>
                      <p style={{ fontSize: 12, color: COLORS.muted, margin: '0 0 8px' }}>Código: {student.codigoEstudiantil} · Grado: {student.grado || 'Sin asignar'}</p>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginBottom: 7 }}>
                        <span style={{ display: 'inline-block', borderRadius: 20, padding: '4px 9px', fontSize: 11, fontWeight: 600, color: statusColor, background: `${statusColor}14` }}>{STATUS_LABELS[student.estado]}</span>
                        {isEvaluatedRisk(student.nivelRiesgo) ? <RiskBadge risk={student.nivelRiesgo} /> : <span style={{ borderRadius: 20, padding: '4px 9px', fontSize: 11, fontWeight: 600, color: '#64748B', background: '#F1F5F9' }}>{RISK_LABELS[student.nivelRiesgo]}</span>}
                      </div>
                      <p style={{ fontSize: 12, color: COLORS.muted, margin: 0 }}>Promedio actual: <strong style={{ color: COLORS.navy }}>{student.promedioActual == null ? 'Sin registrar' : student.promedioActual.toFixed(1)}</strong></p>
                      {student.observacionesRiesgo && <p style={{ fontSize: 12, color: COLORS.subtle, margin: '6px 0 0', lineHeight: 1.45 }}>Observación de riesgo: {student.observacionesRiesgo}</p>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
                    <button type="button" onClick={() => navigate(`/app/estudiantes/${student.id}`)} style={secondaryButton}>Ver ficha</button>
                    <button type="button" onClick={() => openEditForm(student)} disabled={processingId !== null || saving} style={secondaryButton}>Editar ficha / riesgo</button>
                    {student.estado !== 'inactivo' && <button type="button" onClick={() => void handleDeactivate(student)} disabled={processingId !== null || saving} style={dangerButton}>{processingId === student.id ? 'Desactivando...' : 'Desactivar'}</button>}
                  </div>
                </article>
              )
            })}

            {!loading && !pageError && <div aria-label="Paginación de estudiantes" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
              <span style={{ color: COLORS.muted, fontSize: 12 }}>Página {totalPages === 0 ? 0 : currentPage + 1} de {totalPages}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" disabled={currentPage === 0 || loading} onClick={() => setCurrentPage((page) => Math.max(0, page - 1))} style={{ ...secondaryButton, opacity: currentPage === 0 ? 0.5 : 1 }}>Anterior</button>
                <button type="button" disabled={totalPages === 0 || currentPage + 1 >= totalPages || loading} onClick={() => setCurrentPage((page) => page + 1)} style={{ ...secondaryButton, opacity: totalPages === 0 || currentPage + 1 >= totalPages ? 0.5 : 1 }}>Siguiente</button>
              </div>
            </div>}
          </div>
        </div>

        {formOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="student-form-title" style={{ width: '100%', maxWidth: 500, maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box', borderRadius: 18, background: '#FFFFFF', padding: 22, boxShadow: '0 20px 60px rgba(15,23,42,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
              <div><h2 id="student-form-title" style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, margin: 0 }}>{editingStudent ? 'Editar estudiante' : 'Nuevo estudiante'}</h2><p style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.5, margin: '6px 0 0' }}>La ficha, el promedio y el nivel de riesgo se guardan en SQL.</p></div>
              <button type="button" aria-label="Cerrar formulario" onClick={closeForm} disabled={saving} style={{ border: 'none', background: 'transparent', color: COLORS.muted, cursor: 'pointer', fontSize: 24 }}>×</button>
            </div>
            {formError && <div role="alert" style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 10, padding: 12, fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>{formError}</div>}
            <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div><label htmlFor="student-code" style={labelStyle}>Código estudiantil *</label><input id="student-code" value={form.codigoEstudiantil} onChange={(e) => updateField('codigoEstudiantil', e.target.value)} maxLength={50} required style={fieldStyle} />{fieldErrors.codigoEstudiantil && <small style={{ color: COLORS.riskHigh }}>{fieldErrors.codigoEstudiantil}</small>}</div>
              <div><label htmlFor="student-names" style={labelStyle}>Nombres *</label><input id="student-names" value={form.nombres} onChange={(e) => updateField('nombres', e.target.value)} maxLength={100} required style={fieldStyle} />{fieldErrors.nombres && <small style={{ color: COLORS.riskHigh }}>{fieldErrors.nombres}</small>}</div>
              <div><label htmlFor="student-surnames" style={labelStyle}>Apellidos *</label><input id="student-surnames" value={form.apellidos} onChange={(e) => updateField('apellidos', e.target.value)} maxLength={100} required style={fieldStyle} />{fieldErrors.apellidos && <small style={{ color: COLORS.riskHigh }}>{fieldErrors.apellidos}</small>}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                <div><label htmlFor="student-grade" style={labelStyle}>Grado</label><select id="student-grade" value={form.grado} onChange={(e) => updateField('grado', e.target.value)} style={fieldStyle}><option value="">Sin asignar</option><option value="10°">10°</option><option value="11°">11°</option></select>{fieldErrors.grado && <small style={{ color: COLORS.riskHigh }}>{fieldErrors.grado}</small>}</div>
                <div><label htmlFor="student-average" style={labelStyle}>Promedio actual (0–5)</label><input id="student-average" type="number" min="0" max="5" step="0.1" value={form.promedioActual} onChange={(e) => updateField('promedioActual', e.target.value)} placeholder="Ej. 3.8" style={fieldStyle} />{fieldErrors.promedioActual && <small style={{ color: COLORS.riskHigh }}>{fieldErrors.promedioActual}</small>}</div>
              </div>
              <div><label htmlFor="student-status" style={labelStyle}>Estado de la ficha</label><select id="student-status" value={form.estado} onChange={(e) => updateField('estado', e.target.value as StudentStatus)} style={fieldStyle}><option value="activo">Activo</option><option value="inactivo">Inactivo</option><option value="egresado">Egresado</option><option value="retirado">Retirado</option></select></div>
              <div><label htmlFor="student-risk" style={labelStyle}>Nivel de riesgo actual</label><select id="student-risk" value={form.nivelRiesgo} onChange={(e) => updateField('nivelRiesgo', e.target.value as RiskLevel)} style={fieldStyle}><option value="sin_evaluar">Sin evaluar</option><option value="bajo">Bajo</option><option value="medio">Medio</option><option value="alto">Alto</option></select><p style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.45, margin: '5px 0 0' }}>El nivel escogido se registra como evaluación manual con fecha e historial; no es una predicción automática de IA.</p></div>
              <div><label htmlFor="student-risk-notes" style={labelStyle}>Observaciones del riesgo (opcional)</label><textarea id="student-risk-notes" value={form.observacionesRiesgo} onChange={(e) => updateField('observacionesRiesgo', e.target.value)} maxLength={500} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} placeholder="Factores que justifican la clasificación" />{fieldErrors.observacionesRiesgo && <small style={{ color: COLORS.riskHigh }}>{fieldErrors.observacionesRiesgo}</small>}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginTop: 6 }}><button type="button" onClick={closeForm} disabled={saving} style={secondaryButton}>Cancelar</button><button type="submit" disabled={saving} style={{ ...primaryButton, minWidth: 135, opacity: saving ? 0.7 : 1, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Guardando...' : editingStudent ? 'Guardar cambios' : 'Crear estudiante'}</button></div>
            </form>
          </section>
        </div>}
      </PhoneFrame>
    </PhoneCenter>
  )
}




import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import { ApiClientError, apiRequest } from '../services/api-client.service'
import { studentsApiService, type ApiPage, type ApiStudent } from '../services/students-api.service'
import { getCurrentAuthUser } from '../services/auth.service'
import { COLORS } from '../theme'
import type { Role } from '../types'

type AcademicOutcome = 'CONTINUIDAD' | 'DESERCION' | 'DESCONOCIDO'

type AcademicResult = {
  id: number
  estudianteId: number
  codigoEstudiantil: string
  nombres: string
  apellidos: string
  resultado: AcademicOutcome
  fechaObservacion: string | null
  fuenteEvidencia: string | null
  observaciones: string | null
  verificado: boolean
  creadoEn: string
  actualizadoEn: string | null
}

type AcademicResultRequest = {
  estudianteId: number
  resultado: AcademicOutcome
  fechaObservacion: string | null
  fuenteEvidencia: string | null
  observaciones: string | null
}

type ResultForm = {
  estudianteId: string
  resultado: AcademicOutcome
  fechaObservacion: string
  fuenteEvidencia: string
  observaciones: string
}

type OutcomeFilter = 'todos' | AcademicOutcome
const PAGE_SIZE = 10
const EMPTY_FORM: ResultForm = {
  estudianteId: '', resultado: 'DESCONOCIDO', fechaObservacion: '', fuenteEvidencia: '', observaciones: '',
}
const OUTCOME_LABELS: Record<AcademicOutcome, string> = {
  CONTINUIDAD: 'Continuidad', DESERCION: 'Deserción', DESCONOCIDO: 'Desconocido / pendiente',
}
const fieldStyle: CSSProperties = {
  display: 'block', width: '100%', boxSizing: 'border-box', minHeight: 42,
  border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '9px 11px',
  background: '#FFFFFF', color: COLORS.navy, fontSize: 13,
}
const labelStyle: CSSProperties = {
  display: 'block', marginBottom: 6, color: COLORS.navy, fontSize: 12, fontWeight: 650,
}
const primaryButton: CSSProperties = {
  border: 'none', borderRadius: 10, padding: '10px 13px', background: COLORS.blue,
  color: '#FFFFFF', fontSize: 12, fontWeight: 650, cursor: 'pointer',
}
const secondaryButton: CSSProperties = {
  border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: '8px 11px',
  background: '#FFFFFF', color: COLORS.navy, fontSize: 12, fontWeight: 600, cursor: 'pointer',
}

function messageFor(error: unknown): string {
  if (error instanceof ApiClientError) return error.message
  return error instanceof Error ? error.message : 'No fue posible completar la operación.'
}

function localDate(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** CRUD demostrable de resultados académicos persistidos en PostgreSQL. */
export default function RegistroResultadosAcademicos() {
  const currentRole = (getCurrentAuthUser()?.rol ?? 'docente') as Role
  const [results, setResults] = useState<AcademicResult[]>([])
  const [students, setStudents] = useState<ApiStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [pageError, setPageError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('todos')
  const [verifiedFilter, setVerifiedFilter] = useState<'todos' | 'true' | 'false'>('todos')
  const [studentFilter, setStudentFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AcademicResult | null>(null)
  const [form, setForm] = useState<ResultForm>({ ...EMPTY_FORM })

  const loadResults = useCallback(async () => {
    setLoading(true)
    setPageError('')
    try {
      const params = new URLSearchParams({ pagina: String(currentPage), tamano: String(PAGE_SIZE) })
      if (search.trim()) params.set('texto', search.trim())
      if (outcomeFilter !== 'todos') params.set('resultado', outcomeFilter)
      if (studentFilter) params.set('estudianteId', studentFilter)
      if (verifiedFilter !== 'todos') params.set('verificado', verifiedFilter)
      const page = await apiRequest<ApiPage<AcademicResult>>(`/resultados-academicos?${params.toString()}`)
      setTotalPages(page.totalPages)
      setTotalElements(page.totalElements)
      if (currentPage > 0 && currentPage >= page.totalPages) {
        setCurrentPage(Math.max(0, page.totalPages - 1))
        return
      }
      setResults(page.content)
    } catch (error) {
      setPageError(messageFor(error))
    } finally {
      setLoading(false)
    }
  }, [currentPage, outcomeFilter, search, studentFilter, verifiedFilter])

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true)
    try {
      setStudents(await studentsApiService.getAll())
    } catch (error) {
      setPageError(messageFor(error))
    } finally {
      setStudentsLoading(false)
    }
  }, [])

  useEffect(() => { void loadResults() }, [loadResults])
  useEffect(() => { void loadStudents() }, [loadStudents])

  const changeFilter = (change: () => void) => {
    change()
    setCurrentPage(0)
  }

  const startCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, estudianteId: students[0] ? String(students[0].id) : '' })
    setFormError('')
    setNotice('')
    setFormOpen(true)
  }

  const startEdit = (item: AcademicResult) => {
    setEditing(item)
    setForm({
      estudianteId: String(item.estudianteId),
      resultado: item.resultado,
      fechaObservacion: item.fechaObservacion ?? '',
      fuenteEvidencia: item.fuenteEvidencia ?? '',
      observaciones: item.observaciones ?? '',
    })
    setFormError('')
    setNotice('')
    setFormOpen(true)
  }

  const saveResult = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setNotice('')
    if (!form.estudianteId) {
      setFormError('Selecciona una ficha de estudiante.')
      return
    }
    if (form.resultado !== 'DESCONOCIDO') {
      if (!form.fechaObservacion) {
        setFormError('Un resultado definitivo requiere fecha de observación.')
        return
      }
      if (form.fechaObservacion > localDate()) {
        setFormError('La fecha de observación no puede ser futura.')
        return
      }
      if (!form.fuenteEvidencia.trim()) {
        setFormError('Un resultado definitivo requiere una fuente de evidencia.')
        return
      }
    }
    if (form.fuenteEvidencia.trim().length > 150) {
      setFormError('La fuente de evidencia no puede superar 150 caracteres.')
      return
    }
    if (form.observaciones.trim().length > 4000) {
      setFormError('Las observaciones no pueden superar 4000 caracteres.')
      return
    }

    const payload: AcademicResultRequest = {
      estudianteId: Number(form.estudianteId),
      resultado: form.resultado,
      fechaObservacion: form.fechaObservacion || null,
      fuenteEvidencia: form.fuenteEvidencia.trim() || null,
      observaciones: form.observaciones.trim() || null,
    }
    setSaving(true)
    try {
      if (editing) {
        await apiRequest<AcademicResult>(`/resultados-academicos/${editing.id}`, {
          method: 'PUT', body: JSON.stringify(payload),
        })
        setNotice(`El resultado #${editing.id} fue actualizado en PostgreSQL.`)
      } else {
        await apiRequest<AcademicResult>('/resultados-academicos', {
          method: 'POST', body: JSON.stringify(payload),
        })
        setNotice('El resultado académico se guardó en PostgreSQL.')
      }
      setFormOpen(false)
      setEditing(null)
      if (currentPage === 0) await loadResults()
      else setCurrentPage(0)
    } catch (error) {
      setFormError(messageFor(error))
    } finally {
      setSaving(false)
    }
  }

  const removeResult = async (item: AcademicResult) => {
    if (!window.confirm(`¿Eliminar el resultado académico #${item.id}? Esta operación elimina el registro, no la ficha del estudiante.`)) return
    setDeletingId(item.id)
    setPageError('')
    setNotice('')
    try {
      await apiRequest<void>(`/resultados-academicos/${item.id}`, { method: 'DELETE' })
      setNotice(`El resultado #${item.id} se eliminó.`)
      if (results.length === 1 && currentPage > 0) setCurrentPage((page) => page - 1)
      else await loadResults()
    } catch (error) {
      setPageError(messageFor(error))
    } finally {
      setDeletingId(null)
    }
  }

  const filteredTotalLabel = `${totalElements} resultado${totalElements === 1 ? '' : 's'}`

  return (
    <PhoneCenter>
      <PhoneFrame desktopLayout>
        <BottomNav role={currentRole} />
        <div className="ea-screen-main">
          <div className="ea-screen-header" style={{ background: COLORS.navy, padding: '18px 22px', borderBottom: `3px solid ${COLORS.teal}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ margin: '0 0 5px', color: '#99F6E4', fontSize: 11, fontWeight: 700, letterSpacing: 0.8 }}>PERSISTENCIA · CRUD · CONSULTA PAGINADA</p>
                <h1 style={{ margin: 0, color: '#FFFFFF', fontSize: 22, fontWeight: 700 }}>Resultados académicos</h1>
                <p style={{ margin: '6px 0 0', color: '#CBD5E1', fontSize: 12, lineHeight: 1.5 }}>Registro histórico de continuidad/deserción con fuente y fecha de evidencia.</p>
              </div>
              <button type="button" onClick={startCreate} style={primaryButton}>+ Nuevo resultado</button>
            </div>
          </div>

          <div className="ea-screen-content no-scrollbar" style={{ padding: '18px 22px 28px' }}>
            {pageError && <div role="alert" style={{ marginBottom: 13, borderRadius: 10, padding: 12, color: '#991B1B', background: '#FEF2F2', fontSize: 13 }}><p style={{ margin: '0 0 8px' }}>{pageError}</p><button type="button" onClick={() => void loadResults()} style={secondaryButton}>Reintentar</button></div>}
            {notice && <div role="status" style={{ marginBottom: 13, borderRadius: 10, padding: 12, color: '#166534', background: '#F0FDF4', fontSize: 13 }}>{notice}</div>}

            <div style={{ background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 13, marginBottom: 14 }}>
              <label htmlFor="academic-search" style={labelStyle}>Buscar por estudiante, código o evidencia</label>
              <input id="academic-search" type="search" value={search} onChange={(event) => changeFilter(() => setSearch(event.target.value))} placeholder="Nombre, código, fuente o nota..." style={fieldStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 10, marginTop: 12 }}>
                <div><label htmlFor="academic-outcome-filter" style={labelStyle}>Resultado</label><select id="academic-outcome-filter" value={outcomeFilter} onChange={(event) => changeFilter(() => setOutcomeFilter(event.target.value as OutcomeFilter))} style={fieldStyle}><option value="todos">Todos</option><option value="CONTINUIDAD">Continuidad</option><option value="DESERCION">Deserción</option><option value="DESCONOCIDO">Desconocido / pendiente</option></select></div>
                <div><label htmlFor="academic-student-filter" style={labelStyle}>Estudiante</label><select id="academic-student-filter" value={studentFilter} onChange={(event) => changeFilter(() => setStudentFilter(event.target.value))} style={fieldStyle}><option value="">Todos los estudiantes</option>{students.map((student) => <option key={student.id} value={student.id}>{student.codigoEstudiantil} · {student.nombres} {student.apellidos}</option>)}</select>{studentsLoading && <small style={{ color: COLORS.muted }}>Cargando fichas...</small>}</div>
                <div><label htmlFor="academic-verified-filter" style={labelStyle}>Estado de evidencia</label><select id="academic-verified-filter" value={verifiedFilter} onChange={(event) => changeFilter(() => setVerifiedFilter(event.target.value as typeof verifiedFilter))} style={fieldStyle}><option value="todos">Todos</option><option value="true">Con evidencia registrada</option><option value="false">Pendientes / no definitivos</option></select></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 12 }}><span style={{ color: COLORS.muted, fontSize: 12 }}>{filteredTotalLabel} · tamaño de página {PAGE_SIZE}</span><button type="button" onClick={() => changeFilter(() => { setSearch(''); setOutcomeFilter('todos'); setStudentFilter(''); setVerifiedFilter('todos') })} style={secondaryButton}>Limpiar filtros</button></div>
            </div>

            {loading && <p role="status" style={{ padding: 22, textAlign: 'center', color: COLORS.muted }}>Cargando resultados desde PostgreSQL...</p>}
            {!loading && !pageError && results.length === 0 && <div style={{ background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 22, textAlign: 'center' }}><strong style={{ color: COLORS.navy }}>No hay resultados para los filtros seleccionados.</strong><p style={{ color: COLORS.muted, fontSize: 12 }}>Crea un registro con fecha y fuente de evidencia si se trata de un resultado definitivo.</p></div>}

            {!loading && results.map((item) => <article key={item.id} style={{ background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 230px', minWidth: 0 }}>
                  <strong style={{ display: 'block', color: COLORS.navy, fontSize: 14 }}>{item.nombres} {item.apellidos}</strong>
                  <span style={{ color: COLORS.muted, fontSize: 11 }}>#{item.id} · {item.codigoEstudiantil} · Ficha #{item.estudianteId}</span>
                  <p style={{ margin: '8px 0 0', color: COLORS.navy, fontSize: 13, fontWeight: 700 }}>{OUTCOME_LABELS[item.resultado]}</p>
                  <p style={{ margin: '5px 0 0', color: COLORS.muted, fontSize: 12 }}>Fecha: {item.fechaObservacion ?? 'Pendiente'} · Evidencia: {item.fuenteEvidencia || 'No registrada'}</p>
                  {item.observaciones && <p style={{ margin: '7px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: '#475569', fontSize: 12, lineHeight: 1.5 }}>{item.observaciones}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: item.verificado ? '#F0FDF4' : '#FFFBEB', color: item.verificado ? '#166534' : '#92400E', borderRadius: 99, padding: '5px 9px', fontSize: 11, fontWeight: 700 }}>{item.verificado ? 'Evidencia registrada' : 'Pendiente'}</span>
                  <button type="button" onClick={() => startEdit(item)} style={secondaryButton}>Editar</button>
                  <button type="button" disabled={deletingId === item.id} onClick={() => void removeResult(item)} style={{ ...secondaryButton, color: COLORS.riskHigh }}>{deletingId === item.id ? 'Eliminando...' : 'Eliminar'}</button>
                </div>
              </div>
            </article>)}

            {!loading && !pageError && <div aria-label="Paginación de resultados académicos" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
              <span style={{ color: COLORS.muted, fontSize: 12 }}>Página {totalPages === 0 ? 0 : currentPage + 1} de {totalPages}</span>
              <div style={{ display: 'flex', gap: 8 }}><button type="button" disabled={currentPage === 0 || loading} onClick={() => setCurrentPage((page) => Math.max(0, page - 1))} style={secondaryButton}>Anterior</button><button type="button" disabled={totalPages === 0 || currentPage + 1 >= totalPages || loading} onClick={() => setCurrentPage((page) => page + 1)} style={secondaryButton}>Siguiente</button></div>
            </div>}
          </div>
        </div>

        {formOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box', background: 'rgba(15,23,42,0.55)' }}>
          <section role="dialog" aria-modal="true" aria-labelledby="academic-result-form-title" style={{ width: '100%', maxWidth: 510, maxHeight: '92vh', overflowY: 'auto', boxSizing: 'border-box', background: '#FFFFFF', borderRadius: 18, padding: 22, boxShadow: '0 20px 60px rgba(15,23,42,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}><div><h2 id="academic-result-form-title" style={{ margin: 0, color: COLORS.navy, fontSize: 20 }}>{editing ? `Editar resultado #${editing.id}` : 'Nuevo resultado académico'}</h2><p style={{ margin: '6px 0 0', color: COLORS.muted, fontSize: 12, lineHeight: 1.5 }}>Los resultados definitivos requieren fecha y fuente; el servidor repite las validaciones.</p></div><button type="button" aria-label="Cerrar formulario" disabled={saving} onClick={() => { setFormOpen(false); setEditing(null) }} style={{ border: 'none', background: 'transparent', color: COLORS.muted, fontSize: 24, cursor: 'pointer' }}>×</button></div>
            {formError && <div role="alert" style={{ marginBottom: 12, padding: 11, borderRadius: 10, background: '#FEF2F2', color: '#991B1B', fontSize: 12 }}>{formError}</div>}
            <form onSubmit={saveResult} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><label htmlFor="academic-student" style={labelStyle}>Ficha del estudiante *</label><select id="academic-student" required value={form.estudianteId} onChange={(event) => setForm((value) => ({ ...value, estudianteId: event.target.value }))} style={fieldStyle}><option value="">Selecciona un estudiante</option>{students.map((student) => <option key={student.id} value={student.id}>{student.codigoEstudiantil} · {student.nombres} {student.apellidos}{student.estado !== 'activo' ? ` (${student.estado})` : ''}</option>)}</select></div>
              <div><label htmlFor="academic-result-value" style={labelStyle}>Resultado *</label><select id="academic-result-value" value={form.resultado} onChange={(event) => setForm((value) => ({ ...value, resultado: event.target.value as AcademicOutcome }))} style={fieldStyle}><option value="DESCONOCIDO">Desconocido / pendiente</option><option value="CONTINUIDAD">Continuidad</option><option value="DESERCION">Deserción</option></select></div>
              <div><label htmlFor="academic-date" style={labelStyle}>Fecha de observación {form.resultado !== 'DESCONOCIDO' ? '*' : '(opcional)'}</label><input id="academic-date" type="date" max={localDate()} value={form.fechaObservacion} onChange={(event) => setForm((value) => ({ ...value, fechaObservacion: event.target.value }))} style={fieldStyle} /></div>
              <div><label htmlFor="academic-source" style={labelStyle}>Fuente de evidencia {form.resultado !== 'DESCONOCIDO' ? '*' : '(opcional)'}</label><input id="academic-source" maxLength={150} value={form.fuenteEvidencia} onChange={(event) => setForm((value) => ({ ...value, fuenteEvidencia: event.target.value }))} placeholder="Ej. acta de matrícula, registro oficial" style={fieldStyle} /></div>
              <div><label htmlFor="academic-notes" style={labelStyle}>Observaciones</label><textarea id="academic-notes" maxLength={4000} rows={3} value={form.observaciones} onChange={(event) => setForm((value) => ({ ...value, observaciones: event.target.value }))} style={{ ...fieldStyle, resize: 'vertical' }} /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', marginTop: 4 }}><button type="button" disabled={saving} onClick={() => { setFormOpen(false); setEditing(null) }} style={secondaryButton}>Cancelar</button><button type="submit" disabled={saving || studentsLoading || students.length === 0} style={{ ...primaryButton, opacity: saving ? 0.65 : 1 }}>{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear resultado'}</button></div>
            </form>
          </section>
        </div>}
      </PhoneFrame>
    </PhoneCenter>
  )
}

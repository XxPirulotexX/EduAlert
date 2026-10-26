import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import { alertasApiService } from '../services/alertas-api.service'
import { getCurrentAuthUser } from '../services/auth.service'
import { ApiClientError } from '../services/api-client.service'
import { mlApiService, type RiskPredictionInput, type RiskPredictionResponse } from '../services/ml.service'
import { studentsApiService, type ApiStudent } from '../services/students-api.service'
import { COLORS } from '../theme'
import type { Role } from '../types'

const INITIAL_INPUT: RiskPredictionInput = {
  promedio_actual: 3.0,
  promedio_periodo_anterior: 3.5,
  porcentaje_asistencia: 70,
  inasistencias_consecutivas: 4,
  asignaturas_perdidas: 3,
  entregas_pendientes: 5,
  participacion_academica: 2,
  acompanamiento_familiar: 1,
}

const FIELDS: {
  key: keyof RiskPredictionInput
  label: string
  min: number
  max: number
  step: number
  help: string
}[] = [
  { key: 'promedio_actual', label: 'Promedio actual', min: 0, max: 5, step: 0.1, help: 'Escala académica de 0 a 5.' },
  { key: 'promedio_periodo_anterior', label: 'Promedio del período anterior', min: 0, max: 5, step: 0.1, help: 'Permite comparar la evolución.' },
  { key: 'porcentaje_asistencia', label: 'Asistencia (%)', min: 0, max: 100, step: 1, help: 'Porcentaje entre 0 y 100.' },
  { key: 'inasistencias_consecutivas', label: 'Inasistencias consecutivas', min: 0, max: 60, step: 1, help: 'Conteo de inasistencias consecutivas.' },
  { key: 'asignaturas_perdidas', label: 'Asignaturas perdidas', min: 0, max: 15, step: 1, help: 'Número de asignaturas.' },
  { key: 'entregas_pendientes', label: 'Entregas pendientes', min: 0, max: 30, step: 1, help: 'Actividades sin entregar.' },
  { key: 'participacion_academica', label: 'Participación académica', min: 0, max: 5, step: 0.1, help: 'Escala de 0 a 5.' },
  { key: 'acompanamiento_familiar', label: 'Acompañamiento familiar', min: 0, max: 5, step: 0.1, help: 'Escala de 0 a 5.' },
]

const fieldStyle: CSSProperties = {
  display: 'block', width: '100%', boxSizing: 'border-box', minHeight: 42,
  border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '9px 11px',
  background: '#FFFFFF', color: COLORS.navy, fontSize: 13,
}
const primaryButton: CSSProperties = {
  border: 'none', borderRadius: 10, padding: '11px 14px', background: COLORS.blue,
  color: '#FFFFFF', fontSize: 13, fontWeight: 650, cursor: 'pointer',
}
const secondaryButton: CSSProperties = {
  border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '10px 13px',
  background: '#FFFFFF', color: COLORS.navy, fontSize: 12, fontWeight: 600, cursor: 'pointer',
}

const PROBABILITY_LABELS: Record<string, string> = {
  continuidad_simulada: 'Continuidad simulada',
  posible_interrupcion_simulada: 'Posible interrupción simulada',
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.status === 409) {
    return 'El modelo todavía no está preparado. Revisa el servicio ML y vuelve a intentarlo.'
  }
  return error instanceof Error ? error.message : 'No fue posible completar la operación. Inténtalo nuevamente.'
}

/** Demostración supervisada del modelo: usa el backend como proxy y no expone secretos al navegador. */
export default function PrediccionRiesgo() {
  const currentRole = getCurrentAuthUser()?.rol ?? 'docente'
  const [students, setStudents] = useState<ApiStudent[]>([])
  const [studentId, setStudentId] = useState('')
  const [input, setInput] = useState<RiskPredictionInput>({ ...INITIAL_INPUT })
  const [prediction, setPrediction] = useState<RiskPredictionResponse | null>(null)
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [predicting, setPredicting] = useState(false)
  const [savingAlert, setSavingAlert] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadStudents = useCallback(async () => {
    setLoadingStudents(true)
    setError('')
    try {
      const items = await studentsApiService.getAll()
      const active = items.filter((student) => student.estado === 'activo')
      setStudents(active)
      setStudentId((current) => current || (active[0] ? String(active[0].id) : ''))
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoadingStudents(false)
    }
  }, [])

  useEffect(() => { void loadStudents() }, [loadStudents])

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === Number(studentId)) ?? null,
    [students, studentId],
  )

  const changeField = (key: keyof RiskPredictionInput, rawValue: string) => {
    const value = Number(rawValue)
    setInput((current) => ({ ...current, [key]: value }))
    setPrediction(null)
    setNotice('')
  }

  const handlePredict = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    setPrediction(null)
    if (!studentId || !selectedStudent) {
      setError('Selecciona un estudiante activo para asociar el análisis demostrativo.')
      return
    }

    setPredicting(true)
    try {
      const result = await mlApiService.predictRisk(input)
      setPrediction(result)
    } catch (predictionError) {
      setError(getErrorMessage(predictionError))
    } finally {
      setPredicting(false)
    }
  }

  const handleSaveAlert = async () => {
    if (!prediction || !selectedStudent) return
    setSavingAlert(true)
    setError('')
    setNotice('')
    try {
      const continuation = prediction.probabilidades.continuidad_simulada
      const interruption = prediction.probabilidades.posible_interrupcion_simulada
      const signal = `Revisión humana solicitada tras ejecutar el modelo experimental: ${prediction.prediccion}. Probabilidades sintéticas: continuidad ${Math.round((continuation ?? 0) * 100)}%, posible interrupción ${Math.round((interruption ?? 0) * 100)}%. Este resultado no está validado con datos reales.`
      const created = await alertasApiService.create({
        estudianteId: selectedStudent.id,
        senal: signal.slice(0, 500),
        // No traducir la clase artificial a un nivel de riesgo real; requiere valoración humana.
        nivelRiesgo: 'sin_evaluar',
      })
      setNotice(`Se guardó la alerta #${created.id} en PostgreSQL con nivel «Sin evaluar». Requiere revisión humana.`)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setSavingAlert(false)
    }
  }

  return (
    <PhoneCenter>
      <PhoneFrame desktopLayout>
        <BottomNav role={currentRole as Role} />
        <div className="ea-screen-main">
          <div className="ea-screen-header" style={{ background: COLORS.navy, padding: '18px 22px', borderBottom: `3px solid ${COLORS.teal}` }}>
            <p style={{ margin: '0 0 5px', color: '#99F6E4', fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>COMPONENTE EMERGENTE · MACHINE LEARNING</p>
            <h1 style={{ margin: 0, color: '#FFFFFF', fontSize: 23, fontWeight: 750 }}>Evaluación experimental de riesgo</h1>
            <p style={{ margin: '7px 0 0', color: '#CBD5E1', fontSize: 12, lineHeight: 1.6, maxWidth: 760 }}>
              Ejecuta una predicción mediante React → Spring Boot → FastAPI. El modelo usa datos sintéticos y el resultado no constituye diagnóstico ni predicción validada sobre estudiantes reales.
            </p>
          </div>

          <div className="ea-screen-content no-scrollbar" style={{ padding: '18px 22px 28px' }}>
            {error && <div role="alert" style={{ marginBottom: 14, borderRadius: 11, padding: 12, color: '#991B1B', background: '#FEF2F2', fontSize: 13 }}>{error}</div>}
            {notice && <div role="status" style={{ marginBottom: 14, borderRadius: 11, padding: 12, color: '#166534', background: '#F0FDF4', fontSize: 13 }}>{notice}</div>}

            <form onSubmit={handlePredict} style={{ background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
              <div style={{ marginBottom: 17 }}>
                <label htmlFor="ml-student" style={{ display: 'block', marginBottom: 6, color: COLORS.navy, fontSize: 13, fontWeight: 700 }}>Estudiante asociado *</label>
                <select id="ml-student" required value={studentId} onChange={(event) => { setStudentId(event.target.value); setPrediction(null); setNotice('') }} disabled={loadingStudents || students.length === 0} style={fieldStyle}>
                  <option value="">Selecciona un estudiante activo</option>
                  {students.map((student) => <option key={student.id} value={student.id}>{student.nombres} {student.apellidos} · {student.codigoEstudiantil}</option>)}
                </select>
                {loadingStudents && <p style={{ color: COLORS.muted, fontSize: 11 }}>Cargando estudiantes desde PostgreSQL…</p>}
                {!loadingStudents && students.length === 0 && <p style={{ color: COLORS.riskHigh, fontSize: 12 }}>No hay estudiantes activos disponibles.</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 13 }}>
                {FIELDS.map((field) => <div key={field.key}>
                  <label htmlFor={`ml-${field.key}`} style={{ display: 'block', marginBottom: 6, color: COLORS.navy, fontSize: 12, fontWeight: 650 }}>{field.label}</label>
                  <input id={`ml-${field.key}`} type="number" min={field.min} max={field.max} step={field.step} required value={input[field.key]} onChange={(event) => changeField(field.key, event.target.value)} style={fieldStyle} />
                  <p style={{ margin: '5px 0 0', color: COLORS.subtle, fontSize: 10, lineHeight: 1.4 }}>{field.help}</p>
                </div>)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, flexWrap: 'wrap', marginTop: 18 }}>
                <button type="button" style={secondaryButton} onClick={() => { setInput({ ...INITIAL_INPUT }); setPrediction(null); setError(''); setNotice('') }}>Restablecer ejemplo</button>
                <button type="submit" disabled={predicting || loadingStudents || students.length === 0} style={{ ...primaryButton, opacity: predicting || loadingStudents || students.length === 0 ? 0.65 : 1 }}>
                  {predicting ? 'Consultando modelo…' : 'Ejecutar predicción'}
                </button>
              </div>
            </form>

            {prediction && <section aria-labelledby="ml-result-title" style={{ background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ margin: '0 0 5px', color: COLORS.teal, fontSize: 11, fontWeight: 700, letterSpacing: 0.8 }}>RESPUESTA DEL SERVICIO ML</p>
                  <h2 id="ml-result-title" style={{ margin: 0, color: COLORS.navy, fontSize: 19 }}>{PROBABILITY_LABELS[prediction.prediccion] ?? prediction.prediccion.replaceAll('_', ' ')}</h2>
                  <p style={{ margin: '7px 0 0', color: COLORS.muted, fontSize: 12 }}>Estudiante: {selectedStudent?.nombres} {selectedStudent?.apellidos}</p>
                </div>
                <span style={{ background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 99, padding: '6px 10px', fontSize: 11, fontWeight: 700 }}>Datos sintéticos</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 13, marginTop: 18 }}>
                {Object.entries(prediction.probabilidades).map(([key, probability]) => {
                  const percent = Math.max(0, Math.min(100, probability * 100))
                  return <div key={key} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <span style={{ color: COLORS.muted, fontSize: 12 }}>{PROBABILITY_LABELS[key] ?? key.replaceAll('_', ' ')}</span>
                      <strong style={{ color: COLORS.navy, fontSize: 15 }}>{percent.toFixed(1)}%</strong>
                    </div>
                    <div style={{ height: 8, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden' }}><div style={{ width: `${percent}%`, height: '100%', background: COLORS.blue, borderRadius: 99 }} /></div>
                  </div>
                })}
              </div>

              <div style={{ marginTop: 15, borderRadius: 11, background: '#FFFBEB', border: '1px solid #FDE68A', padding: 13 }}>
                <p style={{ margin: 0, color: '#92400E', fontSize: 12, lineHeight: 1.6 }}><strong>Advertencia:</strong> {prediction.advertencia}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 15 }}>
                <button type="button" onClick={() => void handleSaveAlert()} disabled={savingAlert || !selectedStudent} style={{ ...primaryButton, opacity: savingAlert ? 0.65 : 1 }}>
                  {savingAlert ? 'Guardando alerta…' : 'Guardar alerta para revisión humana'}
                </button>
              </div>
            </section>}
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}

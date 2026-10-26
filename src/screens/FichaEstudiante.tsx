import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import RiskBadge from '../components/RiskBadge'
import { ChevronLeft } from '../components/icons'
import { alertasApiService, type ApiAlert } from '../services/alertas-api.service'
import { studentsApiService, type ApiStudent, type RiskAssessment } from '../services/students-api.service'
import { getCurrentAuthUser } from '../services/auth.service'
import { COLORS } from '../theme'
import type { Risk, Role } from '../types'

type Tab = 'Resumen' | 'Alertas' | 'Historial de riesgo'
const TABS: Tab[] = ['Resumen', 'Alertas', 'Historial de riesgo']

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
}
function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No fue posible cargar la ficha.'
}
function isEvaluatedRisk(level: string): level is Risk {
  return level === 'bajo' || level === 'medio' || level === 'alto'
}

/** Ficha vinculada a la identidad de estudiante que viene de la API, nunca del mock local. */
export default function FichaEstudiante() {
  const navigate = useNavigate()
  const { id } = useParams()
  const studentId = Number(id)
  const role = getCurrentAuthUser()?.rol ?? 'docente'
  const [student, setStudent] = useState<ApiStudent | null>(null)
  const [alerts, setAlerts] = useState<ApiAlert[]>([])
  const [riskHistory, setRiskHistory] = useState<RiskAssessment[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('Resumen')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    if (!Number.isInteger(studentId) || studentId <= 0) {
      setError('El identificador del estudiante no es válido.')
      setStudent(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const [studentResult, alertResults, historyResults] = await Promise.all([
        studentsApiService.getById(studentId),
        alertasApiService.getForStudent(studentId),
        studentsApiService.getRiskHistory(studentId),
      ])
      setStudent(studentResult)
      setAlerts(alertResults)
      setRiskHistory(historyResults)
    } catch (cause) {
      setStudent(null)
      setError(errorMessage(cause))
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => { void loadData() }, [loadData])

  const activeAlerts = useMemo(() => alerts.filter((alert) => alert.estado !== 'Revisada'), [alerts])
  const initials = student
    ? `${student.nombres.trim().charAt(0)}${student.apellidos.trim().charAt(0)}`.toUpperCase()
    : 'EA'
  const riskColor = student?.nivelRiesgo === 'alto'
    ? COLORS.riskHigh
    : student?.nivelRiesgo === 'medio'
      ? COLORS.riskMid
      : student?.nivelRiesgo === 'bajo'
        ? COLORS.riskLow
        : '#94A3B8'

  return (
    <PhoneCenter>
      <PhoneFrame desktopLayout>
        <BottomNav role={role as Role} />
        <div className="ea-screen-main">
          <div className="ea-screen-header" style={{ background: '#FFFFFF', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${COLORS.border}` }}>
            <button type="button" onClick={() => navigate('/app/estudiantes')} style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: COLORS.blue, padding: 0 }}><ChevronLeft color={COLORS.blue} /><span style={{ fontSize: 12, fontWeight: 600 }}>Regresar</span></button>
            <h1 style={{ margin: 0, color: COLORS.navy, fontSize: 18, fontWeight: 700, flex: 1, textAlign: 'center' }}>Ficha del estudiante</h1>
            <button type="button" onClick={() => navigate('/app/alertas')} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: '7px 10px', background: '#FFFFFF', color: COLORS.navy, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Alertas</button>
          </div>

          <div className="ea-screen-content no-scrollbar" style={{ padding: 20 }}>
            {loading && <p role="status" style={{ textAlign: 'center', padding: 24, color: COLORS.muted }}>Cargando ficha desde PostgreSQL...</p>}
            {error && !loading && <div role="alert" style={{ borderRadius: 12, padding: 16, background: '#FEF2F2', color: '#991B1B', fontSize: 13 }}><p style={{ margin: '0 0 12px' }}>{error}</p><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}><button type="button" onClick={() => void loadData()} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 10px', background: '#FFFFFF', cursor: 'pointer' }}>Reintentar</button><button type="button" onClick={() => navigate('/app/estudiantes')} style={{ border: 'none', borderRadius: 8, padding: '8px 10px', background: COLORS.blue, color: '#FFFFFF', cursor: 'pointer' }}>Volver al listado</button></div></div>}

            {student && !loading && <>
              <section style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #0E7490 100%)', borderRadius: 18, padding: 20, color: '#FFFFFF', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                  <div aria-hidden="true" style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 19 }}>{initials}</div>
                  <div style={{ minWidth: 0, flex: 1 }}><h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, overflowWrap: 'anywhere' }}>{student.nombres} {student.apellidos}</h2><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: '5px 0 0' }}>Código {student.codigoEstudiantil} · Grado {student.grado || 'sin asignar'}</p></div>
                  <span style={{ borderRadius: 20, padding: '5px 9px', color: student.estado === 'activo' ? '#166534' : '#334155', background: student.estado === 'activo' ? '#DCFCE7' : '#E2E8F0', fontSize: 11, fontWeight: 700 }}>{student.estado}</span>
                </div>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                  {isEvaluatedRisk(student.nivelRiesgo) ? <RiskBadge risk={student.nivelRiesgo} /> : <span style={{ padding: '4px 9px', borderRadius: 20, fontSize: 11, fontWeight: 650, color: '#334155', background: '#F1F5F9' }}>Sin evaluar</span>}
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Promedio actual: {student.promedioActual == null ? 'Sin registrar' : student.promedioActual.toFixed(1)}</span>
                </div>
              </section>

              <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 12 }} className="no-scrollbar">
                {TABS.map((tab) => <button key={tab} type="button" onClick={() => setActiveTab(tab)} aria-pressed={activeTab === tab} style={{ flexShrink: 0, padding: '8px 12px', borderRadius: 20, border: activeTab === tab ? `1px solid ${COLORS.blue}` : `1px solid ${COLORS.border}`, background: activeTab === tab ? COLORS.blue : '#FFFFFF', color: activeTab === tab ? '#FFFFFF' : COLORS.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{tab}</button>)}
              </div>

              {activeTab === 'Resumen' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <article style={cardStyle}><span style={captionStyle}>Estado de ficha</span><strong style={valueStyle}>{student.estado}</strong><p style={noteStyle}>Estado administrativo actual almacenado en SQL.</p></article>
                <article style={cardStyle}><span style={captionStyle}>Promedio vigente</span><strong style={valueStyle}>{student.promedioActual == null ? 'N/D' : student.promedioActual.toFixed(2)}</strong><p style={noteStyle}>Valor resumen; el historial de notas por asignatura aún no se integra.</p></article>
                <article style={cardStyle}><span style={captionStyle}>Riesgo vigente</span><strong style={{ ...valueStyle, color: riskColor }}>{student.nivelRiesgo === 'sin_evaluar' ? 'Sin evaluar' : `Riesgo ${student.nivelRiesgo}`}</strong><p style={noteStyle}>Último registro de evaluación. No equivale a una predicción automática.</p></article>
                <article style={cardStyle}><span style={captionStyle}>Alertas activas</span><strong style={valueStyle}>{activeAlerts.length}</strong><p style={noteStyle}>{alerts.length} alertas vinculadas históricamente a esta ficha.</p></article>
                {student.observacionesRiesgo && <article style={{ ...cardStyle, gridColumn: '1 / -1' }}><span style={captionStyle}>Observación del riesgo vigente</span><p style={{ ...noteStyle, color: COLORS.navy, fontSize: 13, marginTop: 8 }}>{student.observacionesRiesgo}</p></article>}
              </div>}

              {activeTab === 'Alertas' && <section style={cardStyle}><h3 style={{ color: COLORS.navy, fontSize: 15, margin: '0 0 12px' }}>Alertas relacionadas</h3>{alerts.length === 0 && <p style={noteStyle}>No hay alertas guardadas para este estudiante.</p>}{alerts.map((alert) => <div key={alert.id} style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}><strong style={{ color: COLORS.navy, fontSize: 13 }}>{alert.senal}</strong><span style={{ color: COLORS.subtle, fontSize: 10 }}>{formatDate(alert.creadoEn)}</span></div><p style={{ fontSize: 11, color: COLORS.muted, margin: '6px 0 0' }}>Riesgo {alert.nivelRiesgo.replace('_', ' ')} · {alert.estado}</p></div>)}<button type="button" onClick={() => navigate('/app/alertas')} style={{ marginTop: 14, border: 'none', background: COLORS.blue, color: '#FFFFFF', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Gestionar alertas</button></section>}

              {activeTab === 'Historial de riesgo' && <section style={cardStyle}><h3 style={{ color: COLORS.navy, fontSize: 15, margin: '0 0 12px' }}>Evaluaciones registradas</h3>{riskHistory.length === 0 && <p style={noteStyle}>No hay evaluaciones de riesgo registradas todavía.</p>}{riskHistory.map((item) => <div key={item.id} style={{ padding: '12px 0', borderBottom: `1px solid ${COLORS.border}` }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}><strong style={{ color: COLORS.navy, fontSize: 13 }}>{item.nivel === 'sin_evaluar' ? 'Sin evaluar' : `Riesgo ${item.nivel}`}</strong><span style={{ fontSize: 10, color: COLORS.subtle }}>{formatDate(item.creadoEn)}</span></div><p style={{ fontSize: 11, color: COLORS.muted, margin: '6px 0 0' }}>Fuente: {item.fuente}{item.versionModelo ? ` · Versión: ${item.versionModelo}` : ''}</p>{item.observaciones && <p style={{ color: '#475569', fontSize: 12, lineHeight: 1.5, margin: '6px 0 0' }}>{item.observaciones}</p>}</div>)}</section>}
            </>}
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}

const cardStyle = { background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.04)' } as const
const captionStyle = { display: 'block', color: COLORS.subtle, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }
const valueStyle = { display: 'block', color: COLORS.navy, fontSize: 22, fontWeight: 700, marginTop: 8 }
const noteStyle = { color: COLORS.subtle, fontSize: 11, lineHeight: 1.5, margin: '6px 0 0' }




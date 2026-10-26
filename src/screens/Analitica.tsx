import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import SectionTitle from '../components/SectionTitle'
import { apiRequest, ApiClientError } from '../services/api-client.service'
import { getCurrentAuthUser } from '../services/auth.service'
import { COLORS } from '../theme'
import type { Role } from '../types'

type AnalyticsSummary = {
  totalFichas: number
  fichasActivas: number
  promedioActual: number | null
  fichasConPromedio: number
  alertasActivas: number
  alertasRiesgoAltoActivas: number
  alertasHistoricas: number
  distribucionRiesgo: Record<'bajo' | 'medio' | 'alto' | 'sin_evaluar', number>
  distribucionAlertas: Record<'Nueva' | 'En seguimiento' | 'Revisada', number>
}

function getMessage(error: unknown) {
  if (error instanceof ApiClientError) return error.message
  return error instanceof Error ? error.message : 'No fue posible cargar los indicadores.'
}

/** Analítica agregada en PostgreSQL: el navegador no descarga todas las filas para contar. */
export default function Analitica() {
  const [metrics, setMetrics] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const user = getCurrentAuthUser()
  const currentRole: Role = user?.rol ?? 'docente'
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setMetrics(await apiRequest<AnalyticsSummary>('/analitica/resumen'))
    } catch (cause) {
      setError(getMessage(cause))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  const riskData = useMemo(() => {
    const distribution = metrics?.distribucionRiesgo
    return [
      { name: 'Riesgo bajo', key: 'bajo', value: distribution?.bajo ?? 0, color: COLORS.riskLow },
      { name: 'Riesgo medio', key: 'medio', value: distribution?.medio ?? 0, color: COLORS.riskMid },
      { name: 'Riesgo alto', key: 'alto', value: distribution?.alto ?? 0, color: COLORS.riskHigh },
      { name: 'Sin evaluar', key: 'sin_evaluar', value: distribution?.sin_evaluar ?? 0, color: '#94A3B8' },
    ]
  }, [metrics])

  const statusData = [
    { name: 'Nuevas', value: metrics?.distribucionAlertas.Nueva ?? 0, color: COLORS.blue },
    { name: 'En seguimiento', value: metrics?.distribucionAlertas['En seguimiento'] ?? 0, color: COLORS.riskMid },
    { name: 'Revisadas', value: metrics?.distribucionAlertas.Revisada ?? 0, color: COLORS.teal },
  ]

  const visibleAlertTotal = statusData.reduce((sum, item) => sum + item.value, 0)

  const summary = [
    { label: 'Fichas activas', value: metrics?.fichasActivas ?? 0, detail: `${metrics?.totalFichas ?? 0} fichas registradas`, color: COLORS.blue, bg: COLORS.lightBlue },
    { label: 'Alertas activas', value: metrics?.alertasActivas ?? 0, detail: `${metrics?.alertasHistoricas ?? 0} alertas históricas`, color: COLORS.riskMid, bg: COLORS.riskMidBg },
    { label: 'Riesgo alto', value: metrics?.distribucionRiesgo.alto ?? 0, detail: 'Estudiantes activos', color: COLORS.riskHigh, bg: COLORS.riskHighBg },
    { label: 'Promedio actual', value: metrics?.promedioActual == null ? 'N/D' : metrics.promedioActual.toFixed(2), detail: `${metrics?.fichasConPromedio ?? 0} fichas activas con promedio`, color: COLORS.teal, bg: COLORS.lightTeal },
  ]

  return (
    <PhoneCenter>
      <PhoneFrame desktopLayout>
        <BottomNav role={currentRole} />
        <div className="ea-screen-main">
          <div className="ea-screen-header" style={{ background: '#FFFFFF', padding: '18px 22px 15px', borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 23, fontWeight: 700, color: COLORS.navy, margin: 0 }}>Analítica educativa</h1>
                <p style={{ fontSize: 12, color: COLORS.muted, margin: '5px 0 0' }}>Indicadores calculados desde registros persistidos</p>
              </div>
              {(currentRole === 'administrador' || currentRole === 'docente') && <button type="button" onClick={() => navigate('/app/resultados-academicos')} style={{ border: 'none', borderRadius: 10, padding: '10px 12px', background: COLORS.blue, color: '#FFFFFF', fontSize: 12, fontWeight: 650, cursor: 'pointer' }}>Gestionar resultados</button>}
              <button type="button" onClick={() => navigate('/app/prediccion-riesgo')} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '10px 12px', background: '#FFFFFF', color: COLORS.navy, fontSize: 12, fontWeight: 650, cursor: 'pointer' }}>Probar IA experimental</button>
            </div>
          </div>

          <div className="ea-screen-content no-scrollbar" style={{ padding: '20px 22px 28px' }}>
            {error && <div role="alert" style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 16 }}><p style={{ margin: '0 0 8px' }}>{error}</p><button type="button" onClick={() => void loadData()} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, background: '#FFFFFF', padding: '7px 10px', cursor: 'pointer' }}>Reintentar</button></div>}

            <SectionTitle style={{ marginBottom: 9 }}>Indicadores generales</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12, marginBottom: 22 }}>
              {summary.map((item) => <article key={item.label} style={{ background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 15, boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}><div style={{ width: 10, height: 10, background: item.color, borderRadius: '50%', marginBottom: 12 }} /><strong style={{ display: 'block', fontSize: 24, color: COLORS.navy }}>{loading ? '—' : item.value}</strong><span style={{ display: 'block', fontSize: 12, fontWeight: 650, color: COLORS.navy, marginTop: 4 }}>{item.label}</span><span style={{ display: 'block', fontSize: 11, color: COLORS.subtle, marginTop: 3 }}>{item.detail}</span></article>)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(285px, 1fr))', gap: 14 }}>
              <section style={{ background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 16 }}>
                <h2 style={{ fontSize: 15, color: COLORS.navy, margin: '0 0 4px' }}>Distribución de riesgo</h2>
                <p style={{ fontSize: 11, color: COLORS.subtle, margin: '0 0 10px' }}>Fichas activas · nivel vigente</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ width: 140, height: 140, flexShrink: 0 }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={2}>{riskData.map((entry) => <Cell key={entry.key} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
                  <div style={{ flex: 1, minWidth: 125, display: 'flex', flexDirection: 'column', gap: 10 }}>{riskData.map((item) => <div key={item.key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span aria-hidden="true" style={{ width: 9, height: 9, flexShrink: 0, borderRadius: '50%', background: item.color }} /><span style={{ fontSize: 12, color: '#475569', flex: 1 }}>{item.name}</span><strong style={{ fontSize: 13, color: COLORS.navy }}>{item.value}</strong></div>)}</div>
                </div>
              </section>

              <section style={{ background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 16 }}>
                <h2 style={{ fontSize: 15, color: COLORS.navy, margin: '0 0 4px' }}>Estado de alertas</h2>
                <p style={{ fontSize: 11, color: COLORS.subtle, margin: '0 0 16px' }}>Distribución de alertas no archivadas</p>
                {statusData.map((item) => {
                  const percent = visibleAlertTotal ? item.value / visibleAlertTotal * 100 : 0
                  return <div key={item.name} style={{ marginBottom: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}><span style={{ fontSize: 12, color: '#475569' }}>{item.name}</span><strong style={{ fontSize: 12, color: COLORS.navy }}>{item.value}</strong></div><div style={{ height: 7, borderRadius: 10, background: '#F1F5F9', overflow: 'hidden' }}><div style={{ width: `${percent}%`, height: '100%', background: item.color }} /></div></div>
                })}
              </section>
            </div>

            <div style={{ marginTop: 16, padding: 13, borderRadius: 12, background: '#F8FAFC', border: `1px solid ${COLORS.border}` }}>
              <p style={{ margin: 0, color: COLORS.muted, fontSize: 11, lineHeight: 1.55 }}>Nota metodológica: estos indicadores se calculan en PostgreSQL con consultas agregadas. El promedio es el valor vigente registrado por estudiante; todavía no representa un historial detallado de calificaciones por asignatura. El riesgo manual no debe interpretarse como predicción automática. La asistencia y la orientación vocacional se integrarán a SQL en una etapa posterior.</p>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}




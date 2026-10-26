import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import { AlertIcon, AnalyticsIcon, StudentsIcon } from '../components/icons'
import { alertasApiService, type ApiAlert } from '../services/alertas-api.service'
import { apiRequest } from '../services/api-client.service'
import { getCurrentAuthUser } from '../services/auth.service'
import { COLORS } from '../theme'

function message(error: unknown) {
  return error instanceof Error ? error.message : 'No fue posible cargar el resumen.'
}

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

/** Inicio de personal: KPIs agregados por PostgreSQL y cuatro prioridades consultadas con límite. */
export default function HomeDocente() {
  const navigate = useNavigate()
  const user = getCurrentAuthUser()
  const role = user?.rol ?? 'docente'
  const [metrics, setMetrics] = useState<AnalyticsSummary | null>(null)
  const [priorities, setPriorities] = useState<ApiAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summary, newAlerts, followUpAlerts] = await Promise.all([
        apiRequest<AnalyticsSummary>('/analitica/resumen'),
        alertasApiService.getPage({ nivelRiesgo: 'alto', estado: 'Nueva', pagina: 0, tamano: 4 }),
        alertasApiService.getPage({ nivelRiesgo: 'alto', estado: 'En seguimiento', pagina: 0, tamano: 4 }),
      ])
      setMetrics(summary)
      setPriorities([...newAlerts.content, ...followUpAlerts.content]
        .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
        .slice(0, 4))
    } catch (cause) {
      setError(message(cause))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  const riskLevels = [
    { label: 'Riesgo bajo', key: 'bajo', color: COLORS.riskLow },
    { label: 'Riesgo medio', key: 'medio', color: COLORS.riskMid },
    { label: 'Riesgo alto', key: 'alto', color: COLORS.riskHigh },
    { label: 'Sin evaluar', key: 'sin_evaluar', color: '#94A3B8' },
  ].map((item) => ({ ...item, count: metrics?.distribucionRiesgo[item.key as keyof AnalyticsSummary['distribucionRiesgo']] ?? 0 }))

  return (
    <PhoneCenter>
      <PhoneFrame desktopLayout>
        <BottomNav role={role} />
        <div className="ea-screen-main">
          <div className="ea-screen-header" style={{ padding: '20px 22px 16px', background: '#FFFFFF', borderBottom: `1px solid ${COLORS.border}` }}>
            <p style={{ margin: 0, color: COLORS.muted, fontSize: 13 }}>Bienvenido a EduAlerta</p>
            <h1 style={{ margin: '3px 0 4px', color: COLORS.navy, fontSize: 24, fontWeight: 750 }}>
              {user ? `${user.nombres} ${user.apellidos}` : 'Panel educativo'}
            </h1>
            <p style={{ margin: 0, color: COLORS.subtle, fontSize: 12 }}>Indicadores basados en registros de la base de datos</p>
          </div>

          <div className="ea-screen-content no-scrollbar" style={{ padding: '20px 22px 28px' }}>
            {error && <div role="alert" style={{ padding: 14, marginBottom: 16, borderRadius: 12, background: '#FEF2F2', color: '#991B1B', fontSize: 13 }}><p style={{ margin: '0 0 8px' }}>{error}</p><button type="button" onClick={() => void loadData()} style={{ padding: '7px 10px', border: `1px solid ${COLORS.border}`, borderRadius: 8, background: '#FFFFFF', cursor: 'pointer' }}>Reintentar</button></div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Estudiantes activos', value: loading ? '—' : (metrics?.fichasActivas ?? 0), sub: `${(metrics?.totalFichas ?? 0)} fichas totales`, icon: <StudentsIcon color={COLORS.blue} size={21} />, color: COLORS.blue, bg: COLORS.lightBlue },
                { label: 'Alertas activas', value: loading ? '—' : (metrics?.alertasActivas ?? 0), sub: `${(metrics?.alertasHistoricas ?? 0)} alertas registradas`, icon: <AlertIcon color={COLORS.riskMid} size={21} />, color: COLORS.riskMid, bg: COLORS.riskMidBg },
                { label: 'Riesgo alto activo', value: loading ? '—' : (metrics?.alertasRiesgoAltoActivas ?? 0), sub: `${(metrics?.distribucionRiesgo.alto ?? 0)} estudiantes en riesgo alto`, icon: <AlertIcon color={COLORS.riskHigh} size={21} />, color: COLORS.riskHigh, bg: COLORS.riskHighBg },
                { label: 'Promedio registrado', value: loading ? '—' : metrics?.promedioActual == null ? 'N/D' : metrics.promedioActual.toFixed(2), sub: `${(metrics?.fichasConPromedio ?? 0)} fichas con promedio`, icon: <AnalyticsIcon color={COLORS.teal} size={21} />, color: COLORS.teal, bg: COLORS.lightTeal },
              ].map((card) => (
                <div key={card.label} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 15, background: '#FFFFFF', padding: 15, boxShadow: '0 1px 4px rgba(15,23,42,0.04)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>{card.icon}</div>
                  <strong style={{ display: 'block', color: COLORS.navy, fontSize: 24 }}>{card.value}</strong>
                  <span style={{ display: 'block', color: COLORS.navy, fontSize: 12, fontWeight: 650, marginTop: 3 }}>{card.label}</span>
                  <span style={{ display: 'block', color: COLORS.subtle, fontSize: 11, marginTop: 4 }}>{card.sub}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
              <section style={{ border: `1px solid ${COLORS.border}`, borderRadius: 15, background: '#FFFFFF', padding: 16 }}>
                <h2 style={{ fontSize: 15, color: COLORS.navy, margin: '0 0 5px' }}>Distribución del riesgo</h2>
                <p style={{ color: COLORS.subtle, fontSize: 11, margin: '0 0 16px' }}>Estudiantes con ficha activa</p>
                {riskLevels.map((item) => {
                  const percentage = metrics?.fichasActivas ? (item.count / metrics.fichasActivas) * 100 : 0
                  return <div key={item.key} style={{ marginBottom: 13 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}><span style={{ color: '#475569', fontSize: 12 }}>{item.label}</span><strong style={{ color: COLORS.navy, fontSize: 12 }}>{item.count}</strong></div>
                    <div style={{ height: 7, background: '#F1F5F9', borderRadius: 10, overflow: 'hidden' }}><div style={{ width: `${percentage}%`, height: '100%', background: item.color, borderRadius: 10 }} /></div>
                  </div>
                })}
                <p style={{ fontSize: 11, color: COLORS.subtle, lineHeight: 1.5, margin: '12px 0 0' }}>Los niveles sin evaluar se mantienen visibles y no se clasifican automáticamente.</p>
              </section>

              <section style={{ border: `1px solid ${COLORS.border}`, borderRadius: 15, background: '#FFFFFF', padding: 16 }}>
                <h2 style={{ fontSize: 15, color: COLORS.navy, margin: '0 0 5px' }}>Requieren atención</h2>
                <p style={{ color: COLORS.subtle, fontSize: 11, margin: '0 0 12px' }}>Alertas activas clasificadas como riesgo alto</p>
                {priorities.length === 0 && <p style={{ color: COLORS.muted, fontSize: 12, lineHeight: 1.5 }}>No hay alertas activas de riesgo alto en los registros actuales.</p>}
                {priorities.map((alert) => <button key={alert.id} type="button" onClick={() => navigate('/app/alertas')} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', borderBottom: `1px solid ${COLORS.border}`, background: '#FFFFFF', padding: '11px 0', cursor: 'pointer' }}><strong style={{ display: 'block', fontSize: 12, color: COLORS.navy }}>{alert.nombreEstudiante}</strong><span style={{ display: 'block', fontSize: 11, color: COLORS.muted, marginTop: 4, lineHeight: 1.4 }}>{alert.senal}</span><span style={{ display: 'inline-block', fontSize: 10, fontWeight: 650, color: COLORS.riskHigh, background: COLORS.riskHighBg, padding: '3px 7px', borderRadius: 10, marginTop: 6 }}>{alert.estado}</span></button>)}
              </section>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
              <button type="button" onClick={() => navigate('/app/estudiantes')} style={{ ...actionButton, background: COLORS.blue, color: '#FFFFFF' }}>Gestionar estudiantes</button>
              <button type="button" onClick={() => navigate('/app/alertas')} style={{ ...actionButton, background: '#FFFFFF', color: COLORS.navy, border: `1px solid ${COLORS.border}` }}>Ver alertas</button>
              <button type="button" onClick={() => navigate('/app/analitica')} style={{ ...actionButton, background: '#FFFFFF', color: COLORS.navy, border: `1px solid ${COLORS.border}` }}>Ver analítica</button>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}

const actionButton: CSSProperties = {
  borderRadius: 10, border: 'none', padding: '11px 14px', fontSize: 12, fontWeight: 650, cursor: 'pointer',
}




import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import Card from '../components/Card'
import SectionTitle from '../components/SectionTitle'
import BottomNav from '../components/BottomNav'
import { AlertIcon, AnalyticsIcon, OrientationIcon, StudentsIcon } from '../components/icons'
import { COLORS } from '../theme'

const RISK_LEVELS = [
  { label: 'Riesgo bajo', count: 18, color: COLORS.riskLow },
  { label: 'Riesgo medio', count: 7, color: COLORS.riskMid },
  { label: 'Riesgo alto', count: 3, color: COLORS.riskHigh },
]

const STUDENTS_PRIORITY = [
  { id: 1, name: 'Juan Pérez', grade: '11°', risk: 'medio', signal: 'Disminución reciente del rendimiento académico', initials: 'JP' },
  { id: 2, name: 'Sofía Martínez', grade: '9°', risk: 'alto', signal: 'Inasistencias frecuentes en las últimas dos semanas', initials: 'SM' },
  { id: 3, name: 'Carlos Rivera', grade: '10°', risk: 'medio', signal: 'Cambios en participación y comunicación', initials: 'CR' },
]

export default function HomeDocente() {
  return (
    <PhoneCenter>
      <PhoneFrame>
        <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
          <div style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 13, color: COLORS.muted, margin: 0 }}>Hola, Profesora</p>
              <p style={{ fontSize: 20, color: COLORS.navy, fontWeight: 700, margin: '2px 0' }}>Laura García</p>
              <p style={{ fontSize: 12, color: COLORS.subtle, margin: 0 }}>Resumen educativo</p>
            </div>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563EB, #14B8A6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, color: '#fff',
            }}>
              LG
            </div>
          </div>

          <div style={{ padding: '0 20px 16px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%)',
              border: '1px solid #BFDBFE', borderRadius: 14, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.riskHigh }} />
              <p style={{ fontSize: 12, color: '#1E40AF', fontWeight: 500, margin: 0, flex: 1 }}>
                3 estudiantes requieren atención prioritaria hoy
              </p>
            </div>
          </div>

          <div style={{ padding: '0 20px 16px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 60%, #0F3BA8 100%)',
              borderRadius: 20, padding: '20px 18px',
              boxShadow: '0 8px 24px rgba(37,99,235,0.28)',
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>
                Resumen de estudiantes
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {[
                  { v: '28', l: 'Estudiantes' },
                  { v: '10', l: 'Alertas activas' },
                  { v: '5', l: 'Seguimientos' },
                ].map((m) => (
                  <div key={m.l} style={{ flex: 1, textAlign: 'center' }}>
                    <p style={{ fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1.1, margin: 0 }}>{m.v}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '4px 0 0' }}>{m.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '0 20px 16px' }}>
            <Card>
              <div style={{ marginBottom: 14 }}>
                <SectionTitle>Alertas tempranas</SectionTitle>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {RISK_LEVELS.map((r) => {
                  const pct = Math.round((r.count / 28) * 100)
                  return (
                    <div key={r.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#334155' }}>{r.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy }}>{r.count}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: r.color, borderRadius: 99 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          <div style={{ padding: '0 20px 16px' }}>
            <div style={{ marginBottom: 12 }}><SectionTitle>Seguimiento prioritario</SectionTitle></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {STUDENTS_PRIORITY.map((s) => {
                const rc = s.risk === 'alto' ? COLORS.riskHigh : s.risk === 'medio' ? COLORS.riskMid : COLORS.riskLow
                return (
                  <Card key={s.id} padding="14px">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: `${rc}18`, color: rc,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 12,
                      }}>{s.initials}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: COLORS.muted }}>Grado {s.grade}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 }}>{s.signal}</p>
                  </Card>
                )
              })}
            </div>
          </div>

          <div style={{ padding: '0 20px 24px' }}>
            <div style={{ marginBottom: 12 }}><SectionTitle>Acciones rápidas</SectionTitle></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Estudiantes', Icon: StudentsIcon, color: COLORS.blue },
                { label: 'Alertas', Icon: AlertIcon, color: COLORS.riskMid },
                { label: 'Analítica', Icon: AnalyticsIcon, color: COLORS.teal },
                { label: 'Orientación', Icon: OrientationIcon, color: '#8B5CF6' },
              ].map(({ label, Icon, color }) => (
                <button
                  key={label}
                  style={{
                    background: '#fff', borderRadius: 14, padding: '14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    border: '1px solid #F1F5F9', cursor: 'pointer',
                    boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
                  }}
                >
                  <Icon color={color} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <BottomNav role="docente" />
      </PhoneFrame>
    </PhoneCenter>
  )
}
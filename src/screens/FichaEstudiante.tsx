import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import RiskBadge from '../components/RiskBadge'
import { ChevronLeft } from '../components/icons'
import { STUDENTS } from '../data/mock'
import { COLORS } from '../theme'

const TABS = ['Resumen', 'Rendimiento', 'Asistencia', 'Historial'] as const
type Tab = (typeof TABS)[number]

export default function FichaEstudiante() {
  const navigate = useNavigate()
  const { id } = useParams()
  const student = STUDENTS.find((s) => s.id === Number(id)) ?? STUDENTS[0]
  const [activeTab, setActiveTab] = useState<Tab>('Resumen')

  const rc = student.risk === 'alto' ? COLORS.riskHigh : student.risk === 'medio' ? COLORS.riskMid : COLORS.riskLow

  return (
    <PhoneCenter>
      <PhoneFrame>
        <div style={{
          background: '#fff', padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #F1F5F9', flexShrink: 0,
        }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronLeft color={COLORS.blue} />
            <span style={{ fontSize: 13, color: COLORS.blue, fontWeight: 500 }}>Regresar</span>
          </button>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: COLORS.navy, margin: 0 }}>Ficha del estudiante</h1>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
          <div style={{
            background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #0E7490 100%)',
            padding: '20px 18px 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                border: '2.5px solid rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 20, color: '#fff',
              }}>{student.initials}</div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>{student.name}</h2>
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', margin: '2px 0' }}>{student.grade} · {student.subject}</p>
              </div>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <RiskBadge risk={student.risk} />
            </div>

            <div style={{ display: 'flex', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: '10px 0', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 12,
                    fontWeight: activeTab === tab ? 700 : 500,
                    color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.55)',
                    borderBottom: activeTab === tab ? '2.5px solid #14B8A6' : '2.5px solid transparent',
                    marginBottom: -2,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '16px 16px 90px' }}>
            {activeTab === 'Resumen' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { l: 'Promedio', v: student.avg.toFixed(1) },
                    { l: 'Asistencia', v: '87%' },
                    { l: 'Alertas', v: student.risk === 'alto' ? '3' : student.risk === 'medio' ? '1' : '0' },
                    { l: 'Grado', v: student.grade },
                  ].map((m) => (
                    <div key={m.l} style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
                      <p style={{ fontSize: 11, color: COLORS.subtle, margin: 0 }}>{m.l}</p>
                      <p style={{ fontSize: 24, fontWeight: 700, color: COLORS.navy, margin: '4px 0 0' }}>{m.v}</p>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Estado de riesgo</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${rc}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: rc }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: rc, margin: 0 }}>
                        {student.risk === 'alto' ? 'Riesgo alto' : student.risk === 'medio' ? 'Riesgo medio' : 'Riesgo bajo'}
                      </p>
                      <p style={{ fontSize: 12, color: COLORS.subtle, margin: '2px 0 0' }}>
                        Requiere {student.risk === 'alto' ? 'atención inmediata' : student.risk === 'medio' ? 'seguimiento' : 'monitoreo'}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>Ficha integral</p>
                  <p style={{ fontSize: 12, color: COLORS.subtle, margin: 0, lineHeight: 1.5 }}>
                    Accede al historial completo, alertas, intervenciones y seguimiento.
                  </p>
                  <button style={{
                    width: '100%', marginTop: 12, background: COLORS.blue, color: '#fff',
                    border: 'none', borderRadius: 12, padding: '10px 0',
                    fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                  }}>
                    Ver ficha completa
                  </button>
                </div>
              </div>
            )}

            {activeTab !== 'Resumen' && (
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.06)', textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: COLORS.muted, margin: 0 }}>Contenido de {activeTab} en desarrollo</p>
              </div>
            )}
          </div>
        </div>

        <BottomNav role="docente" />
      </PhoneFrame>
    </PhoneCenter>
  )
}
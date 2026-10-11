import { useState } from 'react'
import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import RiskBadge from '../components/RiskBadge'
import { ChevronRight, FilterIcon } from '../components/icons'
import { ALERTS } from '../data/mock'
import { COLORS } from '../theme'

const FILTERS = ['Todas', 'Prioritarias', 'Riesgo alto', 'Riesgo medio', 'Riesgo bajo']

export default function Alertas() {
  const [activeFilter, setActiveFilter] = useState('Todas')

  const filtered = ALERTS.filter((a) => {
    if (activeFilter === 'Todas') return true
    if (activeFilter === 'Prioritarias' || activeFilter === 'Riesgo alto') return a.risk === 'alto'
    if (activeFilter === 'Riesgo medio') return a.risk === 'medio'
    if (activeFilter === 'Riesgo bajo') return a.risk === 'bajo'
    return true
  })

  return (
    <PhoneCenter>
      <PhoneFrame>
        <div style={{ background: COLORS.navy, padding: '16px 20px 18px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ width: 3, height: 22, background: COLORS.blue, borderRadius: 2 }} />
                <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>Alertas tempranas</h1>
              </div>
              <p style={{ color: COLORS.subtle, fontSize: 13, margin: '0 0 0 11px' }}>
                Identifica situaciones que requieren seguimiento
              </p>
            </div>
            <button style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '7px 8px', cursor: 'pointer',
            }}>
              <FilterIcon color="#CBD5E1" />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
          <div style={{ padding: '12px 16px 0', overflowX: 'auto' }} className="no-scrollbar">
            <div style={{ display: 'flex', gap: 8, width: 'max-content' }}>
              {FILTERS.map((f) => {
                const active = activeFilter === f
                return (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    style={{
                      background: active ? COLORS.blue : '#fff',
                      color: active ? '#fff' : '#475569',
                      border: active ? `1px solid ${COLORS.blue}` : `1px solid ${COLORS.border}`,
                      borderRadius: 20, padding: '7px 14px',
                      fontSize: 13, fontWeight: active ? 600 : 400,
                      cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {f}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ padding: '12px 16px 6px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: COLORS.subtle }}>
              {filtered.length} {filtered.length === 1 ? 'alerta' : 'alertas'}
            </span>
            <span style={{ fontSize: 12, color: COLORS.blue, fontWeight: 500 }}>Por prioridad</span>
          </div>

          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((a) => {
              const rc = a.risk === 'alto' ? COLORS.riskHigh : a.risk === 'medio' ? COLORS.riskMid : COLORS.riskLow
              return (
                <div key={a.id} style={{
                  background: '#fff', borderRadius: 14, padding: '13px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  borderLeft: a.risk === 'alto' ? `3px solid ${COLORS.riskHigh}` : '3px solid transparent',
                  boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: `${a.avatarBg}18`, border: `1.5px solid ${a.avatarBg}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14, color: a.avatarBg, flexShrink: 0,
                  }}>{a.initials}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy }}>{a.name}</span>
                      <span style={{ fontSize: 11, color: COLORS.subtle }}>{a.grade}</span>
                    </div>
                    <div style={{ marginBottom: 6 }}><RiskBadge risk={a.risk} /></div>
                    <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "{a.signal}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 500, color: rc, background: `${rc}15`, padding: '2px 8px', borderRadius: 20 }}>
                        {a.status}
                      </span>
                      <span style={{ fontSize: 11, color: COLORS.subtle }}>{a.time}</span>
                    </div>
                  </div>

                  <ChevronRight />
                </div>
              )
            })}
          </div>
        </div>

        <BottomNav role="docente" />
      </PhoneFrame>
    </PhoneCenter>
  )
}
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import RiskBadge from '../components/RiskBadge'
import { FilterIcon, SearchIcon } from '../components/icons'
import { STUDENTS } from '../data/mock'
import type { Risk } from '../types'
import { COLORS } from '../theme'

type Filter = 'todos' | '10°' | '11°' | 'alto' | 'medio' | 'bajo'

const FILTERS: { key: Filter; label: string; riskColor?: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: '10°', label: '10°' },
  { key: '11°', label: '11°' },
  { key: 'alto', label: 'Riesgo alto', riskColor: COLORS.riskHigh },
  { key: 'medio', label: 'Riesgo medio', riskColor: COLORS.riskMid },
  { key: 'bajo', label: 'Riesgo bajo', riskColor: COLORS.riskLow },
]

export default function ListaEstudiantes() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<Filter>('todos')

  const filtered = STUDENTS.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = activeFilter === 'todos' || s.grade === activeFilter || s.risk === activeFilter
    return matchSearch && matchFilter
  })

  return (
    <PhoneCenter>
      <PhoneFrame>
        <div style={{ background: '#fff', padding: '16px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: COLORS.navy, margin: 0, lineHeight: 1.2 }}>Estudiantes</h1>
              <p style={{ fontSize: 13, color: COLORS.muted, margin: '4px 0 0' }}>Consulta y seguimiento</p>
            </div>
            <button style={{
              width: 40, height: 40, borderRadius: '50%', background: COLORS.lightBlue,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FilterIcon color={COLORS.blue} />
            </button>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            borderRadius: 14, padding: '10px 14px', marginBottom: 14,
          }}>
            <SearchIcon />
            <input
              placeholder="Buscar estudiante…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: COLORS.navy }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14 }} className="no-scrollbar">
            {FILTERS.map((f) => {
              const active = activeFilter === f.key
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: active ? COLORS.blue : '#F1F5F9',
                    color: active ? '#fff' : '#475569',
                    border: 'none', borderRadius: 20, padding: '6px 14px',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  {f.riskColor && <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.riskColor }} />}
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 12px' }} className="no-scrollbar">
          <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy, marginBottom: 12 }}>
            {filtered.length} {filtered.length === 1 ? 'estudiante' : 'estudiantes'}
          </p>

          {filtered.map((s) => {
            const rc = s.risk === 'alto' ? COLORS.riskHigh : s.risk === 'medio' ? COLORS.riskMid : COLORS.riskLow
            return (
              <button
                key={s.id}
                onClick={() => navigate(`/app/estudiantes/${s.id}`)}
                style={{
                  width: '100%', textAlign: 'left',
                  background: '#fff', border: 'none', borderRadius: 16,
                  padding: '14px', marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: '0 1px 3px rgba(15,23,42,0.06)', cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: `${rc}18`, color: rc,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>{s.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy, margin: 0 }}>{s.name}</p>
                  <p style={{ fontSize: 12, color: COLORS.muted, margin: '2px 0 6px' }}>
                    {s.grade} · Promedio {s.avg.toFixed(1)}
                  </p>
                  <RiskBadge risk={s.risk as Risk} />
                </div>
              </button>
            )
          })}
        </div>

        <BottomNav role="docente" />
      </PhoneFrame>
    </PhoneCenter>
  )
}
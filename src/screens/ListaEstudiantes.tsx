
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import RiskBadge from '../components/RiskBadge'
import { FilterIcon, SearchIcon } from '../components/icons'
import { studentsService } from '../services/students.service'
import type { Risk } from '../types'
import { COLORS } from '../theme'

type Filter = 'todos' | '10°' | '11°' | 'alto' | 'medio' | 'bajo'

const FILTERS: {
  key: Filter
  label: string
  riskColor?: string
}[] = [
  { key: 'todos', label: 'Todos' },
  { key: '10°', label: '10°' },
  { key: '11°', label: '11°' },
  { key: 'alto', label: 'Riesgo alto', riskColor: COLORS.riskHigh },
  { key: 'medio', label: 'Riesgo medio', riskColor: COLORS.riskMid },
  { key: 'bajo', label: 'Riesgo bajo', riskColor: COLORS.riskLow },
]

export default function ListaEstudiantes() {
  const navigate = useNavigate()

  const [students] = useState(() => studentsService.getAll())
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<Filter>('todos')

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es')

    return students.filter((student) => {
      const matchSearch =
        !normalizedSearch ||
        student.name.toLocaleLowerCase('es').includes(normalizedSearch)

      const matchFilter =
        activeFilter === 'todos' ||
        student.grade === activeFilter ||
        student.risk === activeFilter

      return matchSearch && matchFilter
    })
  }, [students, search, activeFilter])

  const handleOpenStudent = (studentId: number) => {
    navigate(`/app/estudiantes/${studentId}`)
  }

  return (
    <PhoneCenter>
      <PhoneFrame desktopLayout>
        <BottomNav role="docente" />

        <div className="ea-screen-main">
          {/* Encabezado, búsqueda y filtros */}
          <div
            className="ea-screen-header"
            style={{
              background: '#FFFFFF',
              padding: '16px 20px 0',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: COLORS.navy,
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  Estudiantes
                </h1>

                <p
                  style={{
                    fontSize: 13,
                    color: COLORS.muted,
                    margin: '4px 0 0',
                  }}
                >
                  Consulta y seguimiento
                </p>
              </div>

              <button
                type="button"
                aria-label="Ir a los filtros"
                onClick={() =>
                  document.getElementById('student-filters')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                  })
                }
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: COLORS.lightBlue,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FilterIcon color={COLORS.blue} />
              </button>
            </div>

            {/* Búsqueda por nombre */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: COLORS.bg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 14,
                padding: '10px 14px',
                marginBottom: 14,
              }}
            >
              <SearchIcon />

              <input
                type="search"
                aria-label="Buscar estudiante por nombre"
                placeholder="Buscar estudiante..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  color: COLORS.navy,
                }}
              />

              {search && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => setSearch('')}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: COLORS.muted,
                    cursor: 'pointer',
                    fontSize: 18,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Filtros por grado y nivel de riesgo */}
            <div
              id="student-filters"
              className="no-scrollbar"
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 14,
              }}
            >
              {FILTERS.map((filter) => {
                const active = activeFilter === filter.key

                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    aria-pressed={active}
                    style={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: active ? COLORS.blue : '#F1F5F9',
                      color: active ? '#FFFFFF' : '#475569',
                      border: 'none',
                      borderRadius: 20,
                      padding: '6px 14px',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {filter.riskColor && (
                      <span
                        aria-hidden="true"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: filter.riskColor,
                        }}
                      />
                    )}

                    {filter.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Resultados: esta sección ocupa el espacio restante */}
          <div
            className="ea-screen-content no-scrollbar"
            style={{
              padding: '12px 20px 20px',
            }}
          >
            <p
              aria-live="polite"
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: COLORS.navy,
                margin: '0 0 12px',
              }}
            >
              {filtered.length}{' '}
              {filtered.length === 1 ? 'estudiante' : 'estudiantes'}
            </p>

            {filtered.length === 0 && (
              <div
                style={{
                  background: '#FFFFFF',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 14,
                  padding: 20,
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.navy,
                    margin: '0 0 6px',
                  }}
                >
                  No se encontraron estudiantes
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: COLORS.muted,
                    margin: '0 0 14px',
                    lineHeight: 1.5,
                  }}
                >
                  Prueba con otro nombre o selecciona un filtro diferente.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setActiveFilter('todos')
                  }}
                  style={{
                    background: COLORS.blue,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {filtered.map((student) => {
              const riskColor =
                student.risk === 'alto'
                  ? COLORS.riskHigh
                  : student.risk === 'medio'
                    ? COLORS.riskMid
                    : COLORS.riskLow

              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleOpenStudent(student.id)}
                  aria-label={`Ver ficha de ${student.name}`}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                    background: '#FFFFFF',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
                    cursor: 'pointer',
                  }}
                >
                  {/* Avatar */}
                  <div
                    aria-hidden="true"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: `${riskColor}18`,
                      color: riskColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0,
                    }}
                  >
                    {student.initials}
                  </div>

                  {/* Información del estudiante */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: COLORS.navy,
                        margin: 0,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {student.name}
                    </p>

                    <p
                      style={{
                        fontSize: 12,
                        color: COLORS.muted,
                        margin: '2px 0 6px',
                      }}
                    >
                      {student.grade} · Promedio {student.avg.toFixed(1)}
                    </p>

                    <RiskBadge risk={student.risk as Risk} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}

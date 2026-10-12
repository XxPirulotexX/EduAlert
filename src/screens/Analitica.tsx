
import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import SectionTitle from '../components/SectionTitle'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts'

import { COLORS } from '../theme'

// Servicios existentes: no creamos una segunda fuente de datos.
import { studentsService } from '../services/students.service'
import { alertsService } from '../services/alerts.service'
import { studentAcademicService } from '../services/academic.service.ts'

// ============================================================
// TIPOS AUXILIARES
// ============================================================

// Representa cada categoría que se mostrará en el gráfico circular.
interface RiskItem {
  name: string
  value: number
  color: string
}

// Indicadores principales de la pantalla.
interface Indicator {
  label: string
  value: string
  detail: string
  color: string
  background: string
}

// ============================================================
// PANTALLA DE ANALÍTICA EDUCATIVA
// ============================================================

export default function Analitica() {
  // ----------------------------------------------------------
  // 1. CONSULTA DE LOS DATOS ACTUALES
  // ----------------------------------------------------------

  // El servicio recupera los estudiantes almacenados localmente
  // o utiliza los datos iniciales cuando todavía no hay registros.
  const students = studentsService.getAll()

  // Recuperamos las alertas para calcular su distribución por estado.
  const alerts = alertsService.getAll()

  // ----------------------------------------------------------
  // 2. CÁLCULO DE INDICADORES ACADÉMICOS
  // ----------------------------------------------------------

  // Calculamos el promedio general a partir de los promedios
  // registrados en los estudiantes, evitando utilizar cifras fijas.
  const academicAverage =
    students.length > 0
      ? students.reduce((sum, student) => sum + student.avg, 0) /
        students.length
      : 0

  // Consultamos los datos de asistencia individual.
  // El servicio genera y guarda los datos simulados que falten.
  const attendanceRecords = students.map((student) =>
    studentAcademicService.getAttendanceByStudentId(student.id),
  )

  // Sumamos las clases registradas y las clases asistidas de todos
  // los estudiantes para calcular el porcentaje general ponderado.
  const attendanceTotals = attendanceRecords.reduce(
    (totals, record) => {
      if (!record) return totals

      return {
        attended: totals.attended + record.attended,
        totalClasses: totals.totalClasses + record.totalClasses,
      }
    },
    {
      attended: 0,
      totalClasses: 0,
    },
  )

  // Evitamos dividir por cero si todavía no existen registros.
  const attendancePercentage =
    attendanceTotals.totalClasses > 0
      ? Math.round(
          (attendanceTotals.attended / attendanceTotals.totalClasses) *
            100,
        )
      : 0

  // ----------------------------------------------------------
  // 3. DISTRIBUCIÓN DEL NIVEL DE RIESGO
  // ----------------------------------------------------------

  // Contamos estudiantes según el nivel de riesgo que tienen registrado.
  // Estos valores alimentan tanto el gráfico circular como su leyenda.
  const riskData: RiskItem[] = [
    {
      name: 'Bajo',
      value: students.filter((student) => student.risk === 'bajo').length,
      color: COLORS.riskLow,
    },
    {
      name: 'Medio',
      value: students.filter((student) => student.risk === 'medio').length,
      color: COLORS.riskMid,
    },
    {
      name: 'Alto',
      value: students.filter((student) => student.risk === 'alto').length,
      color: COLORS.riskHigh,
    },
  ]

  // El total se obtiene de los estudiantes y no de una constante manual.
  const totalStudents = students.length

  // ----------------------------------------------------------
  // 4. RESUMEN DE ALERTAS
  // ----------------------------------------------------------

  // Calculamos las alertas por estado utilizando AlertStatus.
  const newAlerts = alerts.filter(
    (alert) => alert.status === 'Nueva',
  ).length

  const alertsInProgress = alerts.filter(
    (alert) => alert.status === 'En seguimiento',
  ).length

  const reviewedAlerts = alerts.filter(
    (alert) => alert.status === 'Revisada',
  ).length

  // Se consideran activas las alertas que todavía no han sido revisadas.
  const activeAlerts = newAlerts + alertsInProgress

  // ----------------------------------------------------------
  // 5. TENDENCIA ACADÉMICA
  // ----------------------------------------------------------

  // Obtenemos el rendimiento individual de cada estudiante.
  // El servicio conserva sus datos simulados para evitar que cambien
  // aleatoriamente cada vez que se visita esta pantalla.
  const performanceRecords = students.map((student) => ({
    studentId: student.id,
    performance:
      studentAcademicService.getPerformanceByStudentId(student.id),
  }))

  // Buscamos el primer registro que contenga periodos académicos.
  // Esto permite identificar las etiquetas que utilizaremos en el gráfico.
  const referencePeriods =
    performanceRecords.find(
      (record) => (record.performance?.periods.length ?? 0) > 0,
    )?.performance?.periods ?? []

  // Calculamos el promedio de todos los estudiantes para cada periodo.
  // La tendencia representa una agregación de los datos simulados,
  // no el historial real de una institución educativa.
  const academicData = referencePeriods.map((period, periodIndex) => {
    const periodAverages = performanceRecords
      .map(
        (record) =>
          record.performance?.periods[periodIndex]?.average,
      )
      .filter(
        (value): value is number =>
          typeof value === 'number' && Number.isFinite(value),
      )

    const average =
      periodAverages.length > 0
        ? periodAverages.reduce((sum, value) => sum + value, 0) /
          periodAverages.length
        : 0

    // Acortamos las etiquetas para mantener legible el eje horizontal.
    const periodLabel =
      period.period === 'Periodo actual'
        ? 'Actual'
        : period.period.replace('Periodo ', 'P')

    return {
      period: periodLabel,
      value: Number(average.toFixed(2)),
    }
  })

  // Ajustamos el eje vertical al rango de valores calculados.
  // Conservamos la escala académica entre 0 y 5.
  const trendValues = academicData.map((period) => period.value)

  const trendMin =
    trendValues.length > 0
      ? Math.max(
          0,
          Math.floor((Math.min(...trendValues) - 0.3) * 10) / 10,
        )
      : 0

  const trendMax =
    trendValues.length > 0
      ? Math.min(
          5,
          Math.ceil((Math.max(...trendValues) + 0.3) * 10) / 10,
        )
      : 5

  // ----------------------------------------------------------
  // 6. TARJETAS DE INDICADORES
  // ----------------------------------------------------------

  // Toda cifra de resumen se construye a partir de los cálculos anteriores.
  const indicators: Indicator[] = [
    {
      label: 'Estudiantes',
      value: String(totalStudents),
      detail: 'registros disponibles',
      color: COLORS.blue,
      background: COLORS.lightBlue,
    },
    {
      label: 'Asistencia',
      value: `${attendancePercentage}%`,
      detail: 'promedio ponderado',
      color: COLORS.teal,
      background: COLORS.lightTeal,
    },
    {
      label: 'Prom. académico',
      value:
        students.length > 0
          ? academicAverage.toFixed(1)
          : '—',
      detail: 'escala de 1.0 a 5.0',
      color: COLORS.blue,
      background: COLORS.lightBlue,
    },
    {
      label: 'Alertas activas',
      value: String(activeAlerts),
      detail: 'nuevas o en seguimiento',
      color: COLORS.riskMid,
      background: COLORS.riskMidBg,
    },
  ]

  // ============================================================
  // RENDERIZADO
  // ============================================================

  return (
    <PhoneCenter>
      {/* Utiliza el mismo diseño adaptable del resto de la aplicación. */}
      <PhoneFrame desktopLayout>
        {/* En móvil se presenta como navegación inferior;
            en escritorio, como menú lateral. */}
        <BottomNav role="docente" />

        <div className="ea-screen-main">
          {/* ----------------------------------------------------
              ENCABEZADO
          ---------------------------------------------------- */}

          <div
            className="ea-screen-header"
            style={{
              background: '#FFFFFF',
              padding: '16px 20px 14px',
              borderBottom: '1px solid #F1F5F9',
              flexShrink: 0,
            }}
          >
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: COLORS.navy,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Analítica educativa
            </h1>

            <p
              style={{
                fontSize: 12,
                color: COLORS.muted,
                margin: '5px 0 0',
              }}
            >
              Información para apoyar mejores decisiones
            </p>
          </div>

          {/* El contenido puede desplazarse sin mover el menú de navegación. */}
          <div className="ea-screen-content no-scrollbar">
            <div
              style={{
                width: '100%',
                maxWidth: 1200,
                boxSizing: 'border-box',
                margin: '0 auto',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {/* ------------------------------------------------
                  INDICADORES GENERALES
              ------------------------------------------------ */}

              <section>
                <SectionTitle style={{ marginBottom: 10 }}>
                  Indicadores generales
                </SectionTitle>

                {/* auto-fit adapta la cantidad de columnas al ancho disponible. */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(min(100%, 210px), 1fr))',
                    gap: 12,
                  }}
                >
                  {indicators.map((indicator) => (
                    <div
                      key={indicator.label}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: 14,
                        padding: 16,
                        border: '1px solid #F1F5F9',
                        boxShadow:
                          '0 1px 4px rgba(15,23,42,0.06)',
                        minWidth: 0,
                      }}
                    >
                      {/* Bloque de color decorativo asociado al indicador. */}
                      <div
                        aria-hidden="true"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: indicator.background,
                          marginBottom: 12,
                          borderLeft: `4px solid ${indicator.color}`,
                        }}
                      />

                      {/* Valor calculado del indicador. */}
                      <p
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: COLORS.navy,
                          margin: 0,
                          lineHeight: 1.2,
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {indicator.value}
                      </p>

                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: COLORS.muted,
                          margin: '6px 0 0',
                        }}
                      >
                        {indicator.label}
                      </p>

                      <p
                        style={{
                          fontSize: 11,
                          color: COLORS.subtle,
                          margin: '3px 0 0',
                        }}
                      >
                        {indicator.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {/* ------------------------------------------------
                  DISTRIBUCIÓN DE RIESGO
              ------------------------------------------------ */}

              <section>
                <SectionTitle style={{ marginBottom: 10 }}>
                  Distribución de riesgo
                </SectionTitle>

                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    padding: 18,
                    border: '1px solid #F1F5F9',
                    boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                  }}
                >
                  {totalStudents === 0 ? (
                    // Evita mostrar un gráfico vacío como si tuviera resultados.
                    <p
                      style={{
                        color: COLORS.muted,
                        fontSize: 13,
                        textAlign: 'center',
                        margin: '12px 0',
                      }}
                    >
                      No hay estudiantes disponibles para calcular
                      la distribución de riesgo.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                        gap: 20,
                        alignItems: 'center',
                      }}
                    >
                      {/* Gráfico circular con la proporción de cada riesgo. */}
                      <div
                        style={{
                          width: '100%',
                          maxWidth: 280,
                          height: 220,
                          minWidth: 0,
                          margin: '0 auto',
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={riskData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={2}
                              dataKey="value"
                              nameKey="name"
                              startAngle={90}
                              endAngle={-270}
                            >
                              {riskData.map((entry) => (
                                <Cell
                                  key={entry.name}
                                  fill={entry.color}
                                />
                              ))}
                            </Pie>

                            {/* Permite consultar la cantidad al pasar el cursor. */}
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Leyenda con cantidades y porcentajes. */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 18,
                          minWidth: 0,
                        }}
                      >
                        {riskData.map((item) => {
                          // Porcentaje del grupo frente al total de estudiantes.
                          const percentage =
                            totalStudents > 0
                              ? (item.value / totalStudents) * 100
                              : 0

                          return (
                            <div
                              key={item.name}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                              }}
                            >
                              {/* Punto de color de la categoría. */}
                              <span
                                style={{
                                  width: 11,
                                  height: 11,
                                  marginTop: 4,
                                  flexShrink: 0,
                                  borderRadius: '50%',
                                  background: item.color,
                                }}
                              />

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: 12,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 13,
                                      color: '#475569',
                                    }}
                                  >
                                    Riesgo {item.name.toLowerCase()}
                                  </span>

                                  <span
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 700,
                                      color: COLORS.navy,
                                    }}
                                  >
                                    {item.value}
                                  </span>
                                </div>

                                <p
                                  style={{
                                    fontSize: 11,
                                    color: COLORS.subtle,
                                    margin: '3px 0 0',
                                  }}
                                >
                                  {percentage.toFixed(1)}% de los estudiantes
                                </p>

                                {/* Barra proporcional al tamaño del grupo. */}
                                <div
                                  style={{
                                    height: 5,
                                    background: '#F1F5F9',
                                    borderRadius: 10,
                                    marginTop: 8,
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div
                                    style={{
                                      height: '100%',
                                      width: `${percentage}%`,
                                      background: item.color,
                                      borderRadius: 10,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <p
                    style={{
                      fontSize: 11,
                      color: COLORS.subtle,
                      lineHeight: 1.5,
                      margin: '14px 0 0',
                    }}
                  >
                    La distribución se calcula según el nivel de riesgo
                    registrado en cada estudiante; no representa por sí sola
                    una predicción validada de deserción escolar.
                  </p>
                </div>
              </section>

              {/* ------------------------------------------------
                  ESTADO DE LAS ALERTAS
              ------------------------------------------------ */}

              <section>
                <SectionTitle style={{ marginBottom: 10 }}>
                  Seguimiento de alertas
                </SectionTitle>

                {/* Presenta los tres estados utilizados por alertsService. */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
                    gap: 12,
                  }}
                >
                  {[
                    {
                      label: 'Nuevas',
                      value: newAlerts,
                      description: 'Pendientes de revisión',
                      color: '#B91C1C',
                      background: '#FEF2F2',
                    },
                    {
                      label: 'En seguimiento',
                      value: alertsInProgress,
                      description: 'Con seguimiento iniciado',
                      color: '#B45309',
                      background: '#FFFBEB',
                    },
                    {
                      label: 'Revisadas',
                      value: reviewedAlerts,
                      description: 'Marcadas como revisadas',
                      color: '#15803D',
                      background: '#F0FDF4',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #F1F5F9',
                        borderRadius: 14,
                        padding: 16,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: COLORS.muted,
                          }}
                        >
                          {item.label}
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 20,
                            padding: '4px 8px',
                            background: item.background,
                            color: item.color,
                          }}
                        >
                          {item.value}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: COLORS.navy,
                          margin: '12px 0 5px',
                        }}
                      >
                        {item.value}
                      </p>

                      <p
                        style={{
                          fontSize: 11,
                          color: COLORS.subtle,
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Estado vacío si todavía no existen alertas. */}
                {alerts.length === 0 && (
                  <p
                    style={{
                      fontSize: 12,
                      color: COLORS.muted,
                      margin: '10px 0 0',
                    }}
                  >
                    Todavía no hay alertas registradas.
                  </p>
                )}
              </section>

              {/* ------------------------------------------------
                  TENDENCIA ACADÉMICA
              ------------------------------------------------ */}

              <section>
                <SectionTitle style={{ marginBottom: 10 }}>
                  Tendencia académica
                </SectionTitle>

                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    padding: 18,
                    border: '1px solid #F1F5F9',
                    boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                  }}
                >
                  {academicData.length === 0 ? (
                    // Informa por qué no se dibuja una tendencia sin datos.
                    <p
                      style={{
                        color: COLORS.muted,
                        fontSize: 13,
                        textAlign: 'center',
                        margin: '24px 0',
                      }}
                    >
                      No hay registros académicos disponibles para construir
                      la tendencia.
                    </p>
                  ) : (
                    <>
                      {/* Gráfico de promedios agregados por periodo. */}
                      <div
                        style={{
                          width: '100%',
                          height: 260,
                          minWidth: 0,
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={academicData}
                            margin={{
                              top: 12,
                              right: 12,
                              left: -12,
                              bottom: 4,
                            }}
                          >
                            <XAxis
                              dataKey="period"
                              tick={{
                                fontSize: 11,
                                fill: COLORS.subtle,
                              }}
                              axisLine={false}
                              tickLine={false}
                            />

                            <YAxis
                              domain={[trendMin, trendMax]}
                              tick={{
                                fontSize: 11,
                                fill: COLORS.subtle,
                              }}
                              axisLine={false}
                              tickLine={false}
                              width={40}
                            />

                            {/* Tooltip con el promedio del periodo seleccionado. */}
                            <Tooltip
                              formatter={(value) => [
                                Number(value).toFixed(2),
                                'Promedio',
                              ]}
                              labelFormatter={(label) => `Periodo: ${label}`}
                            />

                            <Line
                              type="monotone"
                              dataKey="value"
                              name="Promedio"
                              stroke={COLORS.blue}
                              strokeWidth={3}
                              dot={{
                                fill: COLORS.blue,
                                r: 4,
                              }}
                              activeDot={{
                                r: 6,
                                strokeWidth: 0,
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Explica qué representa la serie temporal. */}
                      <p
                        style={{
                          fontSize: 11,
                          color: COLORS.subtle,
                          lineHeight: 1.5,
                          margin: '8px 0 0',
                        }}
                      >
                        Cada punto representa el promedio de los registros
                        académicos simulados de los estudiantes para ese
                        periodo. No corresponde a resultados institucionales
                        reales.
                      </p>
                    </>
                  )}
                </div>
              </section>

              {/* Nota general sobre la procedencia de la información. */}
              <p
                style={{
                  fontSize: 11,
                  color: COLORS.subtle,
                  lineHeight: 1.6,
                  margin: 0,
                  paddingBottom: 8,
                }}
              >
                Los indicadores se calculan a partir de los datos disponibles
                en EduAlerta. Los registros académicos y de asistencia de esta
                versión son simulados; las cifras no deben interpretarse como
                resultados reales de una institución educativa.
              </p>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}

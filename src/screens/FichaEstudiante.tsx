// Hook para gestionar la pestaña seleccionada y tipos de React.
import { useState } from 'react'
import type { ReactNode } from 'react'

// Hooks de React Router para navegar y obtener el ID de la URL.
import { useNavigate, useParams } from 'react-router-dom'

// Componentes compartidos para la estructura y la navegación.
import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import RiskBadge from '../components/RiskBadge'
import { ChevronLeft } from '../components/icons'

// Colores y servicios que proporcionan los datos de la aplicación.
import { COLORS } from '../theme'
import { studentsService } from '@/services/students.service'
import { alertsService } from '../services/alerts.service'
import { studentAcademicService } from '../services/academic.service.ts'

// Tipos empleados para garantizar la consistencia de los datos.
import type {
  Alert,
  AlertFollowUp,
  AlertStatus,
  AttendanceStatus,
} from '../types'
// Consulta los resultados vocacionales vinculados al ID del estudiante.
import {
  vocationalService,
  type VocationalAreaKey,
} from '../services/vocational.service.ts'
// Pestañas disponibles en la ficha integral del estudiante.
// "as const" conserva los nombres como valores literales de TypeScript.
const TABS = [
  'Resumen',
  'Rendimiento',
  'Asistencia',
  'Orientación',
  'Historial',
] as const

// Limita el estado de la pestaña a las opciones definidas anteriormente.
type Tab = (typeof TABS)[number]

// ============================================================
// COMPONENTE REUTILIZABLE: TARJETA DE INDICADOR
// ============================================================

// Propiedades que recibe una tarjeta de indicador.
// El valor puede ser texto o número, y el detalle es opcional.
interface MetricCardProps {
  label: string
  value: string | number
  detail?: string
}

function MetricCard({
  label,
  value,
  detail,
}: MetricCardProps) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #F1F5F9',
        borderRadius: 14,
        padding: 16,
        boxShadow: '0 1px 3px rgba(15,23,42,0.05)',

        // Permite que la tarjeta se reduzca sin desbordar su contenedor.
        minWidth: 0,
      }}
    >
      {/* Nombre del indicador: promedio, asistencia, alertas, etc. */}
      <p
        style={{
          fontSize: 12,
          color: COLORS.muted,
          margin: 0,
        }}
      >
        {label}
      </p>

      {/* Valor principal del indicador. */}
      <p
        style={{
          fontSize: 25,
          fontWeight: 700,
          color: COLORS.navy,
          margin: '6px 0 0',

          // Evita desbordamientos cuando el valor contiene texto largo.
          overflowWrap: 'anywhere',
        }}
      >
        {value}
      </p>

      {/* El detalle solo se muestra si se proporciona. */}
      {detail && (
        <p
          style={{
            fontSize: 11,
            color: COLORS.subtle,
            margin: '5px 0 0',
            lineHeight: 1.5,
          }}
        >
          {detail}
        </p>
      )}
    </div>
  )
}

// ============================================================
// COMPONENTE REUTILIZABLE: PANEL DE CONTENIDO
// ============================================================

// Permite agrupar información en una tarjeta con título,
// descripción opcional y contenido personalizado.
function Panel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #F1F5F9',
        borderRadius: 14,
        padding: 18,
        boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
        minWidth: 0,
      }}
    >
      {/* Encabezado del panel. */}
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: COLORS.navy,
          margin: '0 0 6px',
        }}
      >
        {title}
      </h3>

      {/* Descripción complementaria, cuando existe. */}
      {description && (
        <p
          style={{
            fontSize: 12,
            color: COLORS.muted,
            lineHeight: 1.5,
            margin: '0 0 16px',
          }}
        >
          {description}
        </p>
      )}

      {/* Contenido específico de cada panel. */}
      {children}
    </section>
  )
}

// ============================================================
// COMPONENTE REUTILIZABLE: ETIQUETA DE ESTADO
// ============================================================

// Muestra estados como "Nueva", "Presente" o "Ausencia justificada"
// con un fondo y un color de texto configurables.
function StatusPill({
  label,
  background,
  color,
}: {
  label: string
  background: string
  color: string
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        alignSelf: 'flex-start',
        background,
        color,
        borderRadius: 20,
        padding: '5px 9px',
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.3,
        maxWidth: '100%',
      }}
    >
      {label}
    </span>
  )
}

// ============================================================
// FUNCIONES AUXILIARES PARA PRESENTAR LOS DATOS
// ============================================================

// Asigna colores a los estados de las alertas.
// Se utiliza el tipo AlertStatus para evitar estados no reconocidos.
function getAlertStatusStyle(status: AlertStatus) {
  switch (status) {
    case 'Nueva':
      return {
        background: '#FEF2F2',
        color: '#B91C1C',
      }

    case 'En seguimiento':
      return {
        background: '#FFFBEB',
        color: '#B45309',
      }

    case 'Revisada':
      return {
        background: '#F0FDF4',
        color: '#15803D',
      }
  }
}

// Asigna colores según el resultado del registro de asistencia.
function getAttendanceStatusStyle(status: AttendanceStatus) {
  switch (status) {
    case 'Presente':
      return {
        background: '#F0FDF4',
        color: '#15803D',
      }

    case 'Retardo':
      return {
        background: '#FFFBEB',
        color: '#B45309',
      }

    case 'Ausencia justificada':
      return {
        background: '#EFF6FF',
        color: '#1D4ED8',
      }

    case 'Ausencia sin justificar':
      return {
        background: '#FEF2F2',
        color: '#B91C1C',
      }
  }
}

// Convierte fechas ISO en fechas legibles para el usuario.
// Se fija la hora al procesar fechas sin hora para evitar
// desplazamientos de día por diferencias de zona horaria.
function formatDate(value: string): string {
  const date =
    value.length <= 10
      ? new Date(`${value}T12:00:00`)
      : new Date(value)

  // Si la fecha es inválida, se muestra el valor original.
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Normaliza los nombres para comparar alertas antiguas
// que todavía no tienen un studentId asociado.
// Elimina espacios sobrantes y convierte el nombre a minúsculas.
function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase('es-CO')
}

// ============================================================
// PANTALLA PRINCIPAL: FICHA INTEGRAL DEL ESTUDIANTE
// ============================================================

export default function FichaEstudiante() {
  // Permite regresar a la pantalla anterior.
  const navigate = useNavigate()

  // Obtiene el identificador de estudiante definido en la URL.
  const { id } = useParams()

  // Convierte el parámetro de la URL en número.
  const studentId = Number(id)

  // Consulta el estudiante únicamente si el identificador
  // es válido, entero y positivo.
  const student =
    id && Number.isInteger(studentId) && studentId > 0
      ? studentsService.getById(studentId)
      : undefined

  // Controla la pestaña que se muestra en la ficha.
  // La pestaña inicial es "Resumen".
  const [activeTab, setActiveTab] = useState<Tab>('Resumen')

  // ----------------------------------------------------------
  // ESTADO DE ERROR: ESTUDIANTE NO ENCONTRADO
  // ----------------------------------------------------------

  // Si el ID no corresponde a un estudiante existente,
  // se muestra un mensaje en lugar de intentar renderizar la ficha.
  if (!student) {
    return (
      <PhoneCenter>
        {/* Mantiene el diseño adaptable en móvil y escritorio. */}
        <PhoneFrame desktopLayout>
          <BottomNav role="docente" />

          <div className="ea-screen-main">
            {/* Encabezado con opción para regresar. */}
            <div
              className="ea-screen-header"
              style={{
                background: '#FFFFFF',
                padding: '16px 20px',
                borderBottom: '1px solid #F1F5F9',
              }}
            >
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                  border: 'none',
                  background: 'none',
                  color: COLORS.blue,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <ChevronLeft color={COLORS.blue} />
                Regresar
              </button>
            </div>

            {/* Mensaje de error centrado en el espacio disponible. */}
            <div
              className="ea-screen-content"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                textAlign: 'center',
              }}
            >
              <h2
                style={{
                  color: COLORS.navy,
                  fontSize: 20,
                  fontWeight: 700,
                  margin: '0 0 8px',
                }}
              >
                Estudiante no encontrado
              </h2>

              <p
                style={{
                  color: COLORS.muted,
                  fontSize: 14,
                  maxWidth: 420,
                  lineHeight: 1.6,
                }}
              >
                No existe un estudiante asociado al identificador solicitado.
              </p>

              {/* Permite volver a la página desde la que se llegó. */}
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  marginTop: 12,
                  background: COLORS.blue,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 18px',
                  cursor: 'pointer',
                }}
              >
                Regresar
              </button>
            </div>
          </div>
        </PhoneFrame>
      </PhoneCenter>
    )
  }

  // ----------------------------------------------------------
  // CONSULTA DE LOS DATOS RELACIONADOS CON EL ESTUDIANTE
  // ----------------------------------------------------------

  // Obtiene las calificaciones y los promedios simulados.
  // El servicio genera los registros que falten y los conserva
  // mediante storage.service.ts.
  const performance =
    studentAcademicService.getPerformanceByStudentId(student.id)

  // Consulta los indicadores y registros simulados de asistencia.
  const attendance =
    studentAcademicService.getAttendanceByStudentId(student.id)

  // Obtiene las alertas relacionadas con este estudiante.
  const studentAlerts: Array<{
    alert: Alert
    followUps: AlertFollowUp[]
  }> = alertsService
    .getAll()
    .filter(
      (alert) =>
        // Prioriza la relación explícita entre los identificadores.
        alert.studentId === student.id ||

        // Compatibilidad con alertas antiguas que aún no tienen
        // studentId y deben identificarse mediante el nombre.
        normalizeName(alert.name) === normalizeName(student.name),
    )
    // Recupera también los seguimientos persistidos de cada alerta.
    .map((alert) => ({
      alert,
      followUps: alertsService.getFollowUpsByAlert(alert.id),
    }))
    // Recupera únicamente los resultados vocacionales de este estudiante.
    // Así no se muestran resultados pertenecientes a otros alumnos.
    const vocationalResults = vocationalService.getResults(student.id)

    // El primer resultado corresponde al intento más reciente.
    const latestVocationalResult = vocationalResults[0]

    // Asigna colores de presentación según el área vocacional.
    function getVocationalAreaColor(key: VocationalAreaKey): string {
      switch (key) {
        case 'tecnologia':
          return COLORS.blue
        case 'ciencia':
          return COLORS.teal
        case 'creatividad':
          return '#6366F1'
        case 'social':
          return '#0D9488'
        case 'negocios':
          return '#D97706'
      }
    }
  // Selecciona el color asociado al nivel de riesgo del estudiante.
  const rc =
    student.risk === 'alto'
      ? COLORS.riskHigh
      : student.risk === 'medio'
        ? COLORS.riskMid
        : COLORS.riskLow

  // Obtiene el promedio del periodo más reciente.
  // Si no hay registros académicos disponibles, utiliza el promedio
  // general del estudiante como alternativa.
  const currentAverage =
    performance?.periods[performance.periods.length - 1]?.average ??
    student.avg

  // Obtiene el promedio del periodo anterior para calcular la variación.
  // Si solo hay un periodo, toma el promedio actual como referencia.
  const previousAverage =
    performance?.periods[performance.periods.length - 2]?.average ??
    currentAverage

  // Calcula la diferencia entre los dos promedios y redondea
  // el resultado a un decimal para su presentación.
  const averageDifference = Number(
    (currentAverage - previousAverage).toFixed(1),
  )

  // Calcula el porcentaje a partir de las clases asistidas
  // y las clases registradas.
  // Se evita dividir por cero cuando no hay clases registradas.
  const attendancePercentage =
    attendance && attendance.totalClasses > 0
      ? Math.round(
          (attendance.attended / attendance.totalClasses) * 100,
        )
      : 0

  // ==========================================================
  // RENDERIZADO DE LA FICHA
  // ==========================================================

  return (
    <PhoneCenter>
      {/* Activa el diseño de escritorio con menú lateral. */}
      <PhoneFrame desktopLayout>
        {/* Navegación principal compartida con las otras pantallas. */}
        <BottomNav role="docente" />

        <div className="ea-screen-main">
          {/* --------------------------------------------------
              ENCABEZADO DE LA PÁGINA
          -------------------------------------------------- */}

          <div
            className="ea-screen-header"
            style={{
              background: '#FFFFFF',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              borderBottom: '1px solid #F1F5F9',
              flexShrink: 0,
            }}
          >
            {/* Regresa a la pantalla anterior. */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
              }}
            >
              <ChevronLeft color={COLORS.blue} />

              <span
                style={{
                  fontSize: 13,
                  color: COLORS.blue,
                  fontWeight: 500,
                }}
              >
                Regresar
              </span>
            </button>

            {/* Título central del encabezado. */}
            <h1
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: COLORS.navy,
                margin: 0,
                textAlign: 'center',
              }}
            >
              Ficha del estudiante
            </h1>

            {/* Elemento de equilibrio para centrar el título. */}
            <div style={{ width: 40, flexShrink: 0 }} />
          </div>

          {/* --------------------------------------------------
              ÁREA DESPLAZABLE DE LA FICHA
          -------------------------------------------------- */}

          <div className="ea-screen-content no-scrollbar">
            {/* ------------------------------------------------
                PERFIL Y PESTAÑAS DE NAVEGACIÓN
            ------------------------------------------------ */}

            <div
              style={{
                background:
                  'linear-gradient(135deg, #1D4ED8 0%, #2563EB 60%, #0E7490 100%)',
                padding: '24px 20px 0',
              }}
            >
              {/* Identidad básica del estudiante. */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginBottom: 16,
                  flexWrap: 'wrap',
                }}
              >
                {/* Avatar con las iniciales del estudiante. */}
                <div
                  style={{
                    width: 60,
                    height: 60,
                    flexShrink: 0,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    border: '2.5px solid rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 20,
                    color: '#FFFFFF',
                  }}
                >
                  {student.initials}
                </div>

                {/* Nombre, grado y asignatura asociada. */}
                <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#FFFFFF',
                      margin: 0,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {student.name}
                  </h2>

                  <p
                    style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.8)',
                      margin: '4px 0 0',
                    }}
                  >
                    {student.grade} · {student.subject}
                  </p>
                </div>
              </div>

              {/* Indicador visual del nivel de riesgo registrado. */}
              <div style={{ marginBottom: 16 }}>
                <RiskBadge risk={student.risk} />
              </div>

              {/* Cambia el contenido sin navegar a otra ruta. */}
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  borderBottom: '2px solid rgba(255,255,255,0.1)',
                  overflowX: 'auto',
                }}
              >
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    aria-pressed={activeTab === tab}
                    style={{
                      // Cada pestaña ocupa una parte del ancho disponible.
                      flex: '1 0 20%',
                      minWidth: 88,
                      padding: '12px 6px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,

                      // La pestaña seleccionada se resalta visualmente.
                      fontWeight: activeTab === tab ? 700 : 500,
                      color:
                        activeTab === tab
                          ? '#FFFFFF'
                          : 'rgba(255,255,255,0.65)',
                      borderBottom:
                        activeTab === tab
                          ? '2.5px solid #14B8A6'
                          : '2.5px solid transparent',
                      marginBottom: -2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenedor compartido de las cuatro pestañas. */}
            <div
              style={{
                padding: 20,
                width: '100%',
                maxWidth: 1100,
                margin: '0 auto',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* =================================================
                  PESTAÑA 1: RESUMEN
              ================================================= */}

              {activeTab === 'Resumen' && (
                <>
                  {/* Indicadores generales del estudiante. */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                      gap: 12,
                    }}
                  >
                    <MetricCard
                      label="Promedio académico"
                      value={student.avg.toFixed(1)}
                      detail="Escala de 1.0 a 5.0"
                    />

                    <MetricCard
                      label="Asistencia"
                      value={`${attendancePercentage}%`}
                      detail="Porcentaje simulado"
                    />

                    <MetricCard
                      label="Alertas asociadas"
                      value={studentAlerts.length}
                      detail="Alertas encontradas para este estudiante"
                    />

                    <MetricCard
                      label="Grado"
                      value={student.grade}
                      detail="Grado registrado"
                    />
                  </div>

                  {/* Descripción y color del nivel de riesgo. */}
                  <Panel title="Estado de riesgo">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      {/* Punto visual que representa el riesgo. */}
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          flexShrink: 0,
                          borderRadius: 12,
                          background: `${rc}18`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: rc,
                          }}
                        />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: rc,
                            margin: 0,
                          }}
                        >
                          {student.risk === 'alto'
                            ? 'Riesgo alto'
                            : student.risk === 'medio'
                              ? 'Riesgo medio'
                              : 'Riesgo bajo'}
                        </p>

                        <p
                          style={{
                            fontSize: 13,
                            color: COLORS.muted,
                            margin: '4px 0 0',
                            lineHeight: 1.5,
                          }}
                        >
                          {student.risk === 'alto'
                            ? 'Se recomienda priorizar la revisión y el acompañamiento.'
                            : student.risk === 'medio'
                              ? 'Se recomienda realizar seguimiento periódico.'
                              : 'Se recomienda mantener el monitoreo académico.'}
                        </p>
                      </div>
                    </div>
                  </Panel>

                  {/* Accesos directos a las otras pestañas.
                      Cambian la pestaña activa sin recargar la página. */}
                  <Panel
                    title="Ficha integral"
                    description="Consulta el rendimiento, la asistencia y el historial de alertas del estudiante."
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Accesos directos a las secciones de la ficha integral. */}
                      {(
                        ['Rendimiento', 'Asistencia', 'Orientación', 'Historial'] as const
                      ).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveTab(tab)}
                          style={{
                            background: '#EFF6FF',
                            color: COLORS.blue,
                            border: '1px solid #DBEAFE',
                            borderRadius: 10,
                            padding: '10px 14px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Ver {tab.toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </Panel>
                </>
              )}

              {/* =================================================
                  PESTAÑA 2: RENDIMIENTO ACADÉMICO
              ================================================= */}

              {activeTab === 'Rendimiento' && (
                <>
                  {/* Estado alternativo por si no hay datos académicos. */}
                  {!performance ? (
                    <Panel title="Rendimiento no disponible">
                      No hay información académica disponible para este estudiante.
                    </Panel>
                  ) : (
                    <>
                      {/* Indicadores del rendimiento. */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                          gap: 12,
                        }}
                      >
                        <MetricCard
                          label="Promedio actual"
                          value={currentAverage.toFixed(1)}
                          detail="Escala de 1.0 a 5.0"
                        />

                        <MetricCard
                          label="Asignaturas"
                          value={performance.subjects.length}
                          detail="Calificaciones simuladas"
                        />

                        <MetricCard
                          label="Variación del promedio"
                          // Se muestra el signo positivo cuando existe una mejora.
                          value={`${averageDifference > 0 ? '+' : ''}${averageDifference.toFixed(1)}`}
                          detail={
                            averageDifference > 0
                              ? 'Mejora frente al periodo anterior'
                              : averageDifference < 0
                                ? 'Disminución frente al periodo anterior'
                                : 'Sin variación frente al periodo anterior'
                          }
                        />
                      </div>

                      {/* Representación visual de los promedios por periodo. */}
                      <Panel
                        title="Evolución académica"
                        description="Promedio simulado en los tres periodos."
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                            gap: 12,
                            alignItems: 'end',
                          }}
                        >
                          {performance.periods.map((period, index) => (
                            <div
                              key={period.period}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 8,
                                minWidth: 0,
                              }}
                            >
                              {/* Valor exacto del promedio. */}
                              <strong
                                style={{
                                  fontSize: 14,
                                  color: COLORS.navy,
                                }}
                              >
                                {period.average.toFixed(1)}
                              </strong>

                              {/* Barra proporcional a la escala de 0 a 5. */}
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-end',
                                  justifyContent: 'center',
                                  width: '100%',
                                  height: 130,
                                  background: '#F1F5F9',
                                  borderRadius: 10,
                                  overflow: 'hidden',
                                }}
                                aria-label={`${period.period}: ${period.average.toFixed(1)} sobre 5.0`}
                              >
                                <div
                                  style={{
                                    width: '58%',
                                    maxWidth: 64,
                                    height: `${(period.average / 5) * 100}%`,
                                    minHeight: 6,

                                    // El periodo más reciente usa un color diferente.
                                    background:
                                      index === performance.periods.length - 1
                                        ? '#14B8A6'
                                        : COLORS.blue,
                                    borderRadius: '8px 8px 0 0',
                                  }}
                                />
                              </div>

                              {/* Etiqueta inferior de cada periodo. */}
                              <span
                                style={{
                                  fontSize: 11,
                                  color: COLORS.muted,
                                  textAlign: 'center',
                                  lineHeight: 1.4,
                                }}
                              >
                                {period.period}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Panel>

                      {/* Comparación de calificaciones por asignatura. */}
                      <Panel
                        title="Calificaciones por asignatura"
                        description="Comparación simulada entre la calificación anterior y la actual."
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                            gap: 12,
                          }}
                        >
                          {performance.subjects.map((subject) => {
                            // Diferencia entre la nota actual y la anterior.
                            const difference = Number(
                              (
                                subject.currentGrade -
                                subject.previousGrade
                              ).toFixed(1),
                            )

                            return (
                              <div
                                key={subject.subject}
                                style={{
                                  border: '1px solid #E2E8F0',
                                  borderRadius: 12,
                                  padding: 14,
                                  minWidth: 0,
                                }}
                              >
                                <h4
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: COLORS.navy,
                                    margin: '0 0 12px',
                                  }}
                                >
                                  {subject.subject}
                                </h4>

                                {/* Presenta ambas calificaciones para compararlas. */}
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 10,
                                  }}
                                >
                                  <div>
                                    <p
                                      style={{
                                        fontSize: 11,
                                        color: COLORS.muted,
                                        margin: 0,
                                      }}
                                    >
                                      Anterior
                                    </p>

                                    <p
                                      style={{
                                        fontSize: 21,
                                        fontWeight: 700,
                                        color: COLORS.navy,
                                        margin: '4px 0 0',
                                      }}
                                    >
                                      {subject.previousGrade.toFixed(1)}
                                    </p>
                                  </div>

                                  <div>
                                    <p
                                      style={{
                                        fontSize: 11,
                                        color: COLORS.muted,
                                        margin: 0,
                                      }}
                                    >
                                      Actual
                                    </p>

                                    <p
                                      style={{
                                        fontSize: 21,
                                        fontWeight: 700,
                                        color: COLORS.navy,
                                        margin: '4px 0 0',
                                      }}
                                    >
                                      {subject.currentGrade.toFixed(1)}
                                    </p>
                                  </div>
                                </div>

                                {/* La etiqueta cambia según la evolución de la nota. */}
                                <div style={{ marginTop: 10 }}>
                                  <StatusPill
                                    label={
                                      difference > 0
                                        ? `Mejoró +${difference.toFixed(1)}`
                                        : difference < 0
                                          ? `Disminuyó ${difference.toFixed(1)}`
                                          : 'Sin variación'
                                    }
                                    background={
                                      difference > 0
                                        ? '#F0FDF4'
                                        : difference < 0
                                          ? '#FEF2F2'
                                          : '#F1F5F9'
                                    }
                                    color={
                                      difference > 0
                                        ? '#15803D'
                                        : difference < 0
                                          ? '#B91C1C'
                                          : '#475569'
                                    }
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </Panel>
                    </>
                  )}

                  {/* Informa al usuario del origen simulado de las cifras. */}
                  <p
                    style={{
                      fontSize: 11,
                      color: COLORS.muted,
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    Datos simulados para demostración. No corresponden a
                    calificaciones reales ni a un historial académico verificado.
                  </p>
                </>
              )}

              {/* =================================================
                  PESTAÑA 3: ASISTENCIA
              ================================================= */}

              {activeTab === 'Asistencia' && (
                <>
                  {/* Mensaje alternativo cuando no existe el registro. */}
                  {!attendance ? (
                    <Panel title="Asistencia no disponible">
                      No hay información de asistencia disponible para este estudiante.
                    </Panel>
                  ) : (
                    <>
                      {/* Indicadores del registro simulado de asistencia. */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
                          gap: 12,
                        }}
                      >
                        <MetricCard
                          label="Clases registradas"
                          value={attendance.totalClasses}
                          detail="Total simulado"
                        />

                        <MetricCard
                          label="Clases asistidas"
                          value={attendance.attended}
                          detail="Incluye los retardos"
                        />

                        <MetricCard
                          label="Ausencias"
                          value={attendance.absences}
                          detail="Justificadas y sin justificar"
                        />

                        <MetricCard
                          label="Retardos"
                          value={attendance.lateArrivals}
                          detail="Incluidos en las clases asistidas"
                        />
                      </div>

                      {/* Porcentaje calculado a partir de las clases registradas. */}
                      <Panel
                        title="Porcentaje de asistencia"
                        description="Calculado a partir de las clases asistidas y las clases registradas."
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'space-between',
                            gap: 12,
                            flexWrap: 'wrap',
                          }}
                        >
                          <strong
                            style={{
                              fontSize: 30,
                              fontWeight: 700,
                              color: COLORS.navy,
                            }}
                          >
                            {attendancePercentage}%
                          </strong>

                          {/* Numerador y denominador del porcentaje. */}
                          <span
                            style={{
                              fontSize: 12,
                              color: COLORS.muted,
                            }}
                          >
                            {attendance.attended} de {attendance.totalClasses}{' '}
                            clases
                          </span>
                        </div>

                        {/* Barra de progreso con colores según el porcentaje. */}
                        <div
                          style={{
                            height: 10,
                            width: '100%',
                            borderRadius: 20,
                            background: '#E2E8F0',
                            overflow: 'hidden',
                            marginTop: 12,
                          }}
                        >
                          <div
                            style={{
                              width: `${attendancePercentage}%`,
                              height: '100%',

                              // Rojo: porcentaje bajo; amarillo: intermedio;
                              // turquesa: porcentaje de asistencia más alto.
                              background:
                                attendancePercentage < 80
                                  ? '#EF4444'
                                  : attendancePercentage < 90
                                    ? '#F59E0B'
                                    : '#14B8A6',
                              borderRadius: 20,
                              transition: 'width 0.2s ease',
                            }}
                          />
                        </div>

                        {/* Diferencia las ausencias justificadas y las no justificadas. */}
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            flexWrap: 'wrap',
                            marginTop: 16,
                          }}
                        >
                          <StatusPill
                            label={`Justificadas: ${attendance.justifiedAbsences}`}
                            background="#EFF6FF"
                            color="#1D4ED8"
                          />

                          <StatusPill
                            label={`Sin justificar: ${attendance.unexcusedAbsences}`}
                            background="#FEF2F2"
                            color="#B91C1C"
                          />
                        </div>
                      </Panel>

                      {/* Lista de los registros recientes de asistencia. */}
                      <Panel
                        title="Registros recientes"
                        description="Muestra de registros simulados de asistencia."
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0,
                          }}
                        >
                          {attendance.recentEntries.map((entry, index) => {
                            // Cada estado obtiene su propia combinación de colores.
                            const appearance =
                              getAttendanceStatusStyle(entry.status)

                            return (
                              <div
                                key={`${entry.date}-${index}`}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  gap: 12,
                                  flexWrap: 'wrap',
                                  padding: '13px 0',

                                  // Separa los registros, excepto el último.
                                  borderBottom:
                                    index !==
                                    attendance.recentEntries.length - 1
                                      ? '1px solid #F1F5F9'
                                      : 'none',
                                }}
                              >
                                <div style={{ minWidth: 0, flex: '1 1 160px' }}>
                                  <p
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: COLORS.navy,
                                      margin: '0 0 4px',
                                    }}
                                  >
                                    {formatDate(entry.date)}
                                  </p>

                                  {/* Observación guardada con el registro. */}
                                  <p
                                    style={{
                                      fontSize: 11,
                                      color: COLORS.muted,
                                      lineHeight: 1.5,
                                      margin: 0,
                                    }}
                                  >
                                    {entry.note}
                                  </p>
                                </div>

                                {/* Estado visual de la asistencia del día. */}
                                <StatusPill
                                  label={entry.status}
                                  background={appearance.background}
                                  color={appearance.color}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </Panel>
                    </>
                  )}

                  {/* Advertencia sobre la naturaleza de estos registros. */}
                  <p
                    style={{
                      fontSize: 11,
                      color: COLORS.muted,
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    Los registros de asistencia son simulados y no sustituyen
                    el registro oficial de la institución educativa.
                  </p>
                </>
              )}

              {/* =================================================
                  PESTAÑA 4: HISTORIAL DE ALERTAS Y SEGUIMIENTOS
              ================================================= */}

              {activeTab === 'Historial' && (
                <Panel
                  title="Historial de alertas y seguimiento"
                  description="Alertas relacionadas con este estudiante y las actuaciones registradas para cada una."
                >
                  {/* Estado vacío cuando el estudiante no tiene alertas asociadas. */}
                  {studentAlerts.length === 0 ? (
                    <div
                      style={{
                        padding: '24px 10px',
                        textAlign: 'center',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: COLORS.navy,
                          margin: '0 0 8px',
                        }}
                      >
                        Sin alertas asociadas
                      </h4>

                      <p
                        style={{
                          fontSize: 12,
                          lineHeight: 1.6,
                          color: COLORS.muted,
                          maxWidth: 420,
                          margin: '0 auto',
                        }}
                      >
                        No se encontraron alertas vinculadas a este estudiante.
                        Las nuevas alertas y sus seguimientos aparecerán aquí
                        cuando estén relacionados con su ficha.
                      </p>
                    </div>
                  ) : (
                    // Si existen alertas, se crea una tarjeta por cada una.
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                      }}
                    >
                      {studentAlerts.map(({ alert, followUps }) => {
                        // Define los colores del estado de esta alerta.
                        const statusAppearance =
                          getAlertStatusStyle(alert.status)

                        return (
                          <article
                            key={alert.id}
                            style={{
                              border: '1px solid #E2E8F0',
                              borderRadius: 12,
                              padding: 15,
                              minWidth: 0,
                            }}
                          >
                            {/* Identificación de la alerta y su estado actual. */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 10,
                                flexWrap: 'wrap',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  minWidth: 0,
                                  flex: '1 1 200px',
                                }}
                              >
                                {/* Avatar utilizado para identificar visualmente la alerta. */}
                                <div
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                    background: `${alert.avatarBg}18`,
                                    color: alert.avatarBg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    flexShrink: 0,
                                  }}
                                >
                                  {alert.initials}
                                </div>

                                <div style={{ minWidth: 0 }}>
                                  <h4
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 700,
                                      color: COLORS.navy,
                                      margin: 0,
                                    }}
                                  >
                                    Alerta #{alert.id}
                                  </h4>

                                  {/* Fecha o referencia temporal guardada en la alerta. */}
                                  <p
                                    style={{
                                      fontSize: 11,
                                      color: COLORS.muted,
                                      margin: '4px 0 0',
                                    }}
                                  >
                                    {alert.time}
                                  </p>
                                </div>
                              </div>

                              {/* Estado actual de la alerta. */}
                              <StatusPill
                                label={alert.status}
                                background={statusAppearance.background}
                                color={statusAppearance.color}
                              />
                            </div>

                            {/* Señal que originó la alerta. */}
                            <p
                              style={{
                                fontSize: 13,
                                color: COLORS.navy,
                                lineHeight: 1.6,
                                margin: '14px 0 10px',
                              }}
                            >
                              {alert.signal}
                            </p>

                            {/* Nivel de riesgo asociado a esta alerta concreta. */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                flexWrap: 'wrap',
                              }}
                            >
                              <RiskBadge risk={alert.risk} />

                              <span
                                style={{
                                  fontSize: 11,
                                  color: COLORS.muted,
                                }}
                              >
                                Nivel de riesgo registrado en esta alerta
                              </span>
                            </div>

                            {/* Seguimientos relacionados mediante alertId.
                                alertsService obtiene los registros persistidos. */}
                            <div
                              style={{
                                borderTop: '1px solid #F1F5F9',
                                marginTop: 16,
                                paddingTop: 14,
                              }}
                            >
                              <h5
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: COLORS.navy,
                                  margin: '0 0 10px',
                                }}
                              >
                                Seguimientos ({followUps.length})
                              </h5>

                              {/* Mensaje cuando la alerta no tiene seguimientos. */}
                              {followUps.length === 0 ? (
                                <p
                                  style={{
                                    fontSize: 12,
                                    color: COLORS.muted,
                                    lineHeight: 1.5,
                                    margin: 0,
                                  }}
                                >
                                  Todavía no hay seguimientos registrados para
                                  esta alerta.
                                </p>
                              ) : (
                                // Presenta cada seguimiento en orden descendente
                                // de fecha, según el orden entregado por el servicio.
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                  }}
                                >
                                  {followUps.map((followUp) => (
                                    <div
                                      key={followUp.id}
                                      style={{
                                        background: '#F8FAFC',
                                        borderRadius: 10,
                                        padding: 12,
                                      }}
                                    >
                                      {/* Fecha en que se registró el seguimiento. */}
                                      <p
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 600,
                                          color: COLORS.blue,
                                          margin: '0 0 5px',
                                        }}
                                      >
                                        {formatDate(followUp.date)}
                                      </p>

                                      {/* Persona responsable del seguimiento. */}
                                      <p
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 600,
                                          color: COLORS.navy,
                                          margin: '0 0 5px',
                                        }}
                                      >
                                        Responsable: {followUp.responsible}
                                      </p>

                                      {/* Observaciones registradas en la actuación.
                                          pre-wrap conserva los saltos de línea. */}
                                      <p
                                        style={{
                                          fontSize: 12,
                                          color: COLORS.muted,
                                          lineHeight: 1.6,
                                          margin: 0,
                                          whiteSpace: 'pre-wrap',
                                          overflowWrap: 'anywhere',
                                        }}
                                      >
                                        {followUp.notes}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  )}
                </Panel>
              )}
              {/* ==========================================================
                  PESTAÑA: ORIENTACIÓN VOCACIONAL
              ========================================================== */}

              {activeTab === 'Orientación' && (
                <>
                  {!latestVocationalResult ? (
                    // Estado vacío: el estudiante todavía no ha completado el test.
                    <Panel
                      title="Sin resultados vocacionales"
                      description="Aquí aparecerá el resultado del test cuando el estudiante complete su evaluación."
                    >
                      <p
                        style={{
                          fontSize: 13,
                          color: COLORS.muted,
                          lineHeight: 1.7,
                          margin: 0,
                        }}
                      >
                        El estudiante puede ingresar a su espacio de orientación
                        vocacional, responder las preguntas y consultar las áreas
                        que podría explorar. Cuando complete el proceso, sus
                        resultados vinculados a esta ficha estarán disponibles aquí.
                      </p>
                    </Panel>
                  ) : (
                    <>
                      {/* Resumen del intento más reciente del estudiante. */}
                      <Panel
                        title="Perfil vocacional"
                        description={`Último test completado el ${formatDate(latestVocationalResult.completedAt)}. Las áreas se ordenan según las respuestas registradas.`}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 14,
                          }}
                        >
                          {latestVocationalResult.areas.slice(0, 3).map((area, index) => {
                            // Asigna un color de identificación a cada área.
                            const areaColor = getVocationalAreaColor(area.key)

                            return (
                              <div
                                key={area.key}
                                style={{
                                  border: '1px solid #E2E8F0',
                                  borderRadius: 12,
                                  padding: 14,
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                  }}
                                >
                                  {/* Icono e identificación del área recomendada. */}
                                  <div
                                    style={{
                                      width: 44,
                                      height: 44,
                                      flexShrink: 0,
                                      borderRadius: 11,
                                      background: `${areaColor}15`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 22,
                                    }}
                                  >
                                    {area.icon}
                                  </div>

                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 600,
                                        color: COLORS.muted,
                                        margin: '0 0 4px',
                                      }}
                                    >
                                      Área {index + 1}
                                    </p>

                                    <h4
                                      style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: COLORS.navy,
                                        lineHeight: 1.4,
                                        margin: '0 0 6px',
                                      }}
                                    >
                                      {area.name}
                                    </h4>

                                    <p
                                      style={{
                                        fontSize: 12,
                                        color: COLORS.muted,
                                        lineHeight: 1.6,
                                        margin: 0,
                                      }}
                                    >
                                      {area.description}
                                    </p>
                                  </div>
                                </div>

                                {/* Índice relativo calculado por el servicio vocacional. */}
                                <div style={{ marginTop: 14 }}>
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      gap: 8,
                                      marginBottom: 6,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: COLORS.muted,
                                      }}
                                    >
                                      Índice relativo
                                    </span>

                                    <strong
                                      style={{
                                        fontSize: 12,
                                        color: areaColor,
                                      }}
                                    >
                                      {area.relativeScore}/100
                                    </strong>
                                  </div>

                                  <div
                                    style={{
                                      height: 6,
                                      background: '#F1F5F9',
                                      borderRadius: 20,
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <div
                                      style={{
                                        height: '100%',
                                        width: `${area.relativeScore}%`,
                                        background: areaColor,
                                        borderRadius: 20,
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Ejemplos de campos que el alumno puede investigar. */}
                                <div
                                  style={{
                                    marginTop: 13,
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 6,
                                  }}
                                >
                                  {area.options.map((option) => (
                                    <span
                                      key={option}
                                      style={{
                                        fontSize: 11,
                                        color: '#475569',
                                        background: '#F8FAFC',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: 8,
                                        padding: '6px 8px',
                                        lineHeight: 1.4,
                                      }}
                                    >
                                      {option}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* El docente consulta la información, pero no responde el test. */}
                        <p
                          style={{
                            fontSize: 11,
                            color: COLORS.subtle,
                            lineHeight: 1.6,
                            margin: '14px 0 0',
                          }}
                        >
                          Estos resultados son orientativos y se obtienen mediante
                          reglas de demostración. Deben utilizarse como punto de partida
                          para conversar con el estudiante, no como una decisión
                          definitiva sobre su futuro.
                        </p>
                      </Panel>

                      {/* Historial de intentos anteriores del mismo estudiante. */}
                      <Panel
                        title="Historial vocacional"
                        description="Resultados de evaluaciones completadas anteriormente."
                      >
                        {vocationalResults.map((result, index) => (
                          <div
                            key={result.id}
                            style={{
                              padding: '13px 0',
                              borderBottom:
                                index < vocationalResults.length - 1
                                  ? '1px solid #F1F5F9'
                                  : 'none',
                            }}
                          >
                            <p
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: COLORS.navy,
                                margin: '0 0 5px',
                              }}
                            >
                              Evaluación {index + 1} · {formatDate(result.completedAt)}
                            </p>

                            <p
                              style={{
                                fontSize: 12,
                                color: COLORS.muted,
                                lineHeight: 1.6,
                                margin: 0,
                              }}
                            >
                              Áreas principales:{' '}
                              {result.areas
                                .slice(0, 3)
                                .map((area) => area.name)
                                .join(', ')}
                            </p>
                          </div>
                        ))}
                      </Panel>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}
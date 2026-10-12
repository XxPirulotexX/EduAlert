
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import { ChevronLeft } from '../components/icons'
import { COLORS } from '../theme'

import {
  vocationalService,
  type VocationalAreaKey,
  type VocationalTestResult,
} from '../services/vocational.service'

// Color visual asociado a cada área del perfil vocacional.
const AREA_COLORS: Record<VocationalAreaKey, string> = {
  tecnologia: COLORS.blue,
  ciencia: COLORS.teal,
  creatividad: '#6366F1',
  social: '#0D9488',
  negocios: '#D97706',
}

// Convierte la fecha del intento en una fecha legible en español.
function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function ResultadosVocacionales() {
  const navigate = useNavigate()

  // Recupera el historial persistido, ordenado del intento más nuevo al más antiguo.
  const results = vocationalService.getResults()
  const latestResult = results[0]

  // Permite consultar intentos anteriores sin sobrescribir el último resultado.
  const [selectedResultId, setSelectedResultId] = useState<string | null>(
    null,
  )
  const [error, setError] = useState('')

  // Si se seleccionó un intento del historial, se muestra ese resultado.
  // En caso contrario, se presenta el intento más reciente.
  const displayedResult: VocationalTestResult | undefined =
    results.find((result) => result.id === selectedResultId) ??
    latestResult

  const isLatestResult =
    displayedResult?.id === latestResult?.id

  // Inicia un intento nuevo limpiando el borrador anterior.
  function handleRetakeTest() {
    try {
      vocationalService.startNewTest()
      setError('')
      navigate('/app/orientacion/test')
    } catch {
      setError(
        'No fue posible iniciar otro test. Comprueba el almacenamiento del navegador e inténtalo nuevamente.',
      )
    }
  }

  return (
    <PhoneCenter>
      <PhoneFrame desktopLayout>
        {/* Menú compartido para mantener la navegación del estudiante. */}
        <BottomNav role="estudiante" />

        <div className="ea-screen-main">
          {/* Encabezado de resultados. */}
          <div
            className="ea-screen-header"
            style={{
              background: '#FFFFFF',
              padding: '16px 20px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/app/orientacion')}
              aria-label="Volver a orientación vocacional"
              style={{
                width: 38,
                height: 38,
                flexShrink: 0,
                borderRadius: 10,
                background: '#F1F5F9',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft color={COLORS.blue} />
            </button>

            <div>
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.subtle,
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                EduAlerta
              </div>

              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: COLORS.navy,
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                Tus resultados vocacionales
              </h1>
            </div>
          </div>

          {/* Contenido desplazable de los resultados y el historial. */}
          <div className="ea-screen-content no-scrollbar">
            <div
              style={{
                width: '100%',
                maxWidth: 1100,
                boxSizing: 'border-box',
                margin: '0 auto',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {/* Estado vacío: el estudiante aún no ha completado el test. */}
              {!displayedResult ? (
                <section
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #F1F5F9',
                    borderRadius: 18,
                    padding: 28,
                    textAlign: 'center',
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      fontSize: 40,
                      marginBottom: 12,
                    }}
                  >
                    🧭
                  </div>

                  <h2
                    style={{
                      fontSize: 19,
                      fontWeight: 700,
                      color: COLORS.navy,
                      margin: '0 0 10px',
                    }}
                  >
                    Todavía no tienes resultados
                  </h2>

                  <p
                    style={{
                      fontSize: 13,
                      color: COLORS.muted,
                      lineHeight: 1.7,
                      maxWidth: 520,
                      margin: '0 auto 20px',
                    }}
                  >
                    Completa el test vocacional para explorar las áreas que
                    podrían relacionarse con tus intereses y preferencias.
                  </p>

                  <button
                    type="button"
                    onClick={handleRetakeTest}
                    style={{
                      width: '100%',
                      maxWidth: 400,
                      padding: 14,
                      borderRadius: 12,
                      border: 'none',
                      background: COLORS.blue,
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Comenzar test vocacional
                  </button>
                </section>
              ) : (
                <>
                  {/* Presentación del intento seleccionado. */}
                  <section
                    style={{
                      background:
                        'linear-gradient(160deg, #1D4ED8 0%, #2563EB 45%, #0D9488 100%)',
                      borderRadius: 20,
                      padding: '26px 22px',
                      color: '#FFFFFF',
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: 20,
                        padding: '6px 11px',
                        marginBottom: 14,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: '#5EEAD4',
                        }}
                      />

                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {isLatestResult
                          ? 'Resultado más reciente'
                          : 'Consulta de un intento anterior'}
                      </span>
                    </div>

                    <h2
                      style={{
                        fontSize: 23,
                        lineHeight: 1.3,
                        fontWeight: 700,
                        margin: '0 0 10px',
                      }}
                    >
                      ¡Exploraste nuevas posibilidades!
                    </h2>

                    <p
                      style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.85)',
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      Según las respuestas registradas, estas son algunas
                      áreas que podrías investigar. Tú decides cuáles deseas
                      conocer mejor.
                    </p>

                    <p
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.9)',
                        margin: '14px 0 0',
                      }}
                    >
                      Test completado el{' '}
                      {formatDate(displayedResult.completedAt)}
                    </p>
                  </section>

                  {/* Explicación del método de puntuación. */}
                  <section
                    style={{
                      padding: 15,
                      borderRadius: 12,
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                    }}
                  >
                    <p
                      style={{
                        fontSize: 12,
                        color: '#1E40AF',
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      <strong>Cómo interpretar los resultados:</strong> el
                      índice relativo compara la puntuación de cada área con
                      la puntuación más alta obtenida en este test. No es una
                      probabilidad de éxito, un diagnóstico ni una decisión
                      automática sobre tu futuro profesional.
                    </p>
                  </section>

                  {/* Las tres áreas con mayor puntuación. */}
                  <section>
                    <h3
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: COLORS.navy,
                        margin: '0 0 12px',
                      }}
                    >
                      Áreas para explorar
                    </h3>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                        gap: 14,
                      }}
                    >
                      {displayedResult.areas.slice(0, 3).map((area, index) => {
                        const color = AREA_COLORS[area.key]

                        return (
                          <article
                            key={area.key}
                            style={{
                              background: '#FFFFFF',
                              borderRadius: 16,
                              padding: 18,
                              border: '1px solid #F1F5F9',
                              boxShadow:
                                '0 1px 4px rgba(15,23,42,0.05)',
                              minWidth: 0,
                            }}
                          >
                            {/* Orden de coincidencia dentro de este intento. */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 10,
                                marginBottom: 15,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  color: COLORS.muted,
                                  fontWeight: 600,
                                }}
                              >
                                Área {index + 1}
                              </span>

                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  color,
                                  background: `${color}15`,
                                  borderRadius: 20,
                                  padding: '5px 8px',
                                }}
                              >
                                {area.level}
                              </span>
                            </div>

                            {/* Icono y nombre del área recomendada. */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 12,
                              }}
                            >
                              <div
                                style={{
                                  width: 46,
                                  height: 46,
                                  borderRadius: 12,
                                  background: `${color}15`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 23,
                                  flexShrink: 0,
                                }}
                              >
                                {area.icon}
                              </div>

                              <div style={{ minWidth: 0 }}>
                                <h4
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: COLORS.navy,
                                    margin: '0 0 6px',
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {area.name}
                                </h4>

                                <p
                                  style={{
                                    fontSize: 12,
                                    color: COLORS.muted,
                                    margin: 0,
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {area.description}
                                </p>
                              </div>
                            </div>

                            {/* Barra del índice relativo: no es una probabilidad. */}
                            <div style={{ marginTop: 17 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  gap: 10,
                                  marginBottom: 7,
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
                                    color,
                                  }}
                                >
                                  {area.relativeScore}/100
                                </strong>
                              </div>

                              <div
                                style={{
                                  width: '100%',
                                  height: 6,
                                  background: '#F1F5F9',
                                  borderRadius: 20,
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${area.relativeScore}%`,
                                    height: '100%',
                                    borderRadius: 20,
                                    background: color,
                                  }}
                                />
                              </div>

                              <p
                                style={{
                                  fontSize: 11,
                                  color: COLORS.subtle,
                                  margin: '8px 0 0',
                                }}
                              >
                                {area.score}{' '}
                                {area.score === 1
                                  ? 'respuesta asociada'
                                  : 'respuestas asociadas'}
                              </p>
                            </div>

                            {/* Ejemplos de campos que se pueden investigar. */}
                            <div
                              style={{
                                borderTop: '1px solid #F1F5F9',
                                marginTop: 16,
                                paddingTop: 13,
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: COLORS.navy,
                                  margin: '0 0 8px',
                                }}
                              >
                                Algunas opciones para investigar
                              </p>

                              <div
                                style={{
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
                          </article>
                        )
                      })}
                    </div>
                  </section>

                  {/* Muestra también las áreas con menor puntuación.
                      No se descartan como posibles intereses del estudiante. */}
                  {displayedResult.areas.length > 3 && (
                    <section>
                      <h3
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: COLORS.navy,
                          margin: '0 0 10px',
                        }}
                      >
                        Otras áreas que podrías explorar
                      </h3>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
                          gap: 10,
                        }}
                      >
                        {displayedResult.areas.slice(3).map((area) => (
                          <div
                            key={area.key}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #E2E8F0',
                              borderRadius: 12,
                              padding: 14,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 11,
                            }}
                          >
                            <span style={{ fontSize: 22 }}>
                              {area.icon}
                            </span>

                            <div style={{ minWidth: 0 }}>
                              <p
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: COLORS.navy,
                                  margin: 0,
                                }}
                              >
                                {area.name}
                              </p>

                              <p
                                style={{
                                  fontSize: 11,
                                  color: COLORS.muted,
                                  margin: '4px 0 0',
                                }}
                              >
                                {area.score}{' '}
                                {area.score === 1
                                  ? 'respuesta asociada'
                                  : 'respuestas asociadas'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}

              {/* Historial de los intentos completados anteriormente. */}
              {results.length > 1 && (
                <section>
                  <h3
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: COLORS.navy,
                      margin: '0 0 12px',
                    }}
                  >
                    Intentos anteriores
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {results.slice(1).map((result) => {
                      const isSelected = result.id === displayedResult?.id

                      return (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => setSelectedResultId(result.id)}
                          aria-pressed={isSelected}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 12,
                            width: '100%',
                            textAlign: 'left',
                            background: isSelected ? '#EFF6FF' : '#FFFFFF',
                            border: isSelected
                              ? '1px solid #93C5FD'
                              : '1px solid #E2E8F0',
                            borderRadius: 12,
                            padding: 15,
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: COLORS.navy,
                                margin: '0 0 5px',
                              }}
                            >
                              Test del {formatDate(result.completedAt)}
                            </p>

                            <p
                              style={{
                                fontSize: 11,
                                color: COLORS.muted,
                                margin: 0,
                                lineHeight: 1.5,
                              }}
                            >
                              Áreas principales:{' '}
                              {result.areas
                                .slice(0, 3)
                                .map((area) => area.name)
                                .join(', ')}
                            </p>
                          </div>

                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: COLORS.blue,
                            }}
                          >
                            {isSelected ? 'Seleccionado' : 'Consultar'}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Permite regresar al intento más reciente después de consultar otro. */}
                  {!isLatestResult && (
                    <button
                      type="button"
                      onClick={() => setSelectedResultId(null)}
                      style={{
                        marginTop: 12,
                        padding: '9px 0',
                        border: 'none',
                        background: 'none',
                        color: COLORS.blue,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Volver al resultado más reciente
                    </button>
                  )}
                </section>
              )}

              {/* Errores relacionados con la preparación de otro intento. */}
              {error && (
                <p
                  role="alert"
                  style={{
                    background: '#FEF2F2',
                    color: '#B91C1C',
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 12,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}

              {/* Acción para volver a realizar la evaluación. */}
              {displayedResult && (
                <button
                  type="button"
                  onClick={handleRetakeTest}
                  style={{
                    width: '100%',
                    padding: 15,
                    borderRadius: 14,
                    border: 'none',
                    background:
                      'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.2)',
                  }}
                >
                  Realizar nuevamente el test
                </button>
              )}

              {/* Aclaración académica sobre el alcance del instrumento. */}
              <p
                style={{
                  fontSize: 11,
                  lineHeight: 1.6,
                  color: COLORS.subtle,
                  margin: 0,
                }}
              >
                Esta versión utiliza una clasificación heurística de
                demostración. Las recomendaciones no constituyen una evaluación
                psicométrica validada ni sustituyen el acompañamiento de un
                orientador vocacional.
              </p>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}

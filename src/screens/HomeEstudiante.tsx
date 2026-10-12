
import { useNavigate } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import { COLORS } from '../theme'
import { VOCATIONAL_QUESTIONS } from '../data/mock'
import { vocationalService } from '../services/vocational.service'

export default function HomeEstudiante() {
  const navigate = useNavigate()

  // Recupera el borrador y el último resultado guardado del test.
  const draft = vocationalService.getDraft()
  const results = vocationalService.getResults()
  const latestResult = results[0]

  // Calcula el avance sin modificar las respuestas almacenadas.
  const answeredCount = VOCATIONAL_QUESTIONS.filter(
    (question) => Boolean(draft[question.id]),
  ).length

  const hasDraft = answeredCount > 0

  // Los resultados se muestran solo cuando existe un test completado.
  const topAreas = latestResult?.areas.slice(0, 3) ?? []

  return (
    <PhoneCenter>
      <PhoneFrame desktopLayout>
        {/* El menú usa las opciones correspondientes al estudiante. */}
        <BottomNav role="estudiante" />

        <div className="ea-screen-main">
          {/* Encabezado del espacio personal. */}
          <div
            className="ea-screen-header"
            style={{
              background: '#FFFFFF',
              padding: '20px 24px',
              borderBottom: '1px solid #F1F5F9',
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: COLORS.teal,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                margin: '0 0 6px',
              }}
            >
              Espacio del estudiante
            </p>

            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: COLORS.navy,
                margin: 0,
              }}
            >
              Tu camino, tus posibilidades
            </h1>

            <p
              style={{
                fontSize: 13,
                color: COLORS.muted,
                lineHeight: 1.6,
                margin: '8px 0 0',
              }}
            >
              Explora tus intereses, reconoce tus preferencias y descubre
              alternativas para tu futuro académico.
            </p>
          </div>

          {/* Área desplazable del inicio. */}
          <div className="ea-screen-content no-scrollbar">
            <div
              style={{
                width: '100%',
                maxWidth: 1000,
                boxSizing: 'border-box',
                margin: '0 auto',
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              {/* Acceso principal al módulo vocacional. */}
              <section
                style={{
                  background:
                    'linear-gradient(135deg, #1D4ED8 0%, #2563EB 55%, #0D9488 100%)',
                  borderRadius: 20,
                  padding: 24,
                  color: '#FFFFFF',
                }}
              >
                <div
                  style={{
                    fontSize: 32,
                    marginBottom: 12,
                  }}
                >
                  🧭
                </div>

                <h2
                  style={{
                    fontSize: 21,
                    fontWeight: 700,
                    lineHeight: 1.35,
                    margin: '0 0 10px',
                  }}
                >
                  {hasDraft
                    ? 'Continúa tu exploración vocacional'
                    : 'Descubre nuevas áreas de interés'}
                </h2>

                <p
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.88)',
                    lineHeight: 1.7,
                    margin: '0 0 18px',
                    maxWidth: 600,
                  }}
                >
                  Responde preguntas sobre tus intereses, habilidades y
                  preferencias. Al finalizar, podrás explorar distintas áreas
                  académicas y profesionales.
                </p>

                {hasDraft && (
                  <p
                    style={{
                      fontSize: 12,
                      color: '#FFFFFF',
                      margin: '0 0 14px',
                    }}
                  >
                    Progreso guardado: {answeredCount} de{' '}
                    {VOCATIONAL_QUESTIONS.length} preguntas.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => navigate('/app/orientacion')}
                  style={{
                    width: '100%',
                    maxWidth: 360,
                    padding: 14,
                    background: '#FFFFFF',
                    color: COLORS.blue,
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {hasDraft
                    ? 'Continuar orientación'
                    : 'Explorar orientación vocacional'}
                </button>
              </section>

              {/* Resumen del último test completado. */}
              <section
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #F1F5F9',
                  borderRadius: 16,
                  padding: 20,
                  boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: COLORS.navy,
                        margin: '0 0 5px',
                      }}
                    >
                      Tus resultados
                    </h2>

                    <p
                      style={{
                        fontSize: 12,
                        color: COLORS.muted,
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {latestResult
                        ? `Tienes ${results.length} ${results.length === 1 ? 'intento guardado' : 'intentos guardados'}.`
                        : 'Aquí aparecerán los resultados cuando completes tu primer test.'}
                    </p>
                  </div>

                  {latestResult && (
                    <span
                      style={{
                        background: '#F0FDFA',
                        color: '#0F766E',
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '6px 9px',
                        borderRadius: 20,
                      }}
                    >
                      Test completado
                    </span>
                  )}
                </div>

                {latestResult ? (
                  <>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                        gap: 10,
                      }}
                    >
                      {topAreas.map((area, index) => (
                        <div
                          key={area.key}
                          style={{
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            borderRadius: 12,
                            padding: 13,
                          }}
                        >
                          <p
                            style={{
                              fontSize: 11,
                              color: COLORS.muted,
                              margin: '0 0 8px',
                            }}
                          >
                            Área {index + 1}
                          </p>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 9,
                            }}
                          >
                            <span style={{ fontSize: 23 }}>
                              {area.icon}
                            </span>

                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: COLORS.navy,
                                lineHeight: 1.5,
                              }}
                            >
                              {area.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate('/app/orientacion/resultados')
                      }
                      style={{
                        width: '100%',
                        marginTop: 14,
                        padding: 12,
                        background: COLORS.lightBlue,
                        border: '1px solid #BFDBFE',
                        borderRadius: 11,
                        color: COLORS.blue,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Consultar todos mis resultados
                    </button>
                  </>
                ) : (
                  <div
                    style={{
                      background: '#F8FAFC',
                      borderRadius: 12,
                      padding: 18,
                      textAlign: 'center',
                    }}
                  >
                    <p
                      style={{
                        color: COLORS.muted,
                        fontSize: 12,
                        lineHeight: 1.6,
                        margin: '0 0 12px',
                      }}
                    >
                      Todavía no has completado el test vocacional.
                      Puedes comenzar cuando estés preparado.
                    </p>

                    <button
                      type="button"
                      onClick={() => navigate('/app/orientacion')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: COLORS.blue,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Ir a orientación vocacional
                    </button>
                  </div>
                )}
              </section>

              {/* Recordatorio sobre el alcance orientativo del módulo. */}
              <p
                style={{
                  fontSize: 11,
                  color: COLORS.subtle,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Las recomendaciones son orientativas y se basan en reglas
                de demostración. No reemplazan el acompañamiento de un
                orientador vocacional.
              </p>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}

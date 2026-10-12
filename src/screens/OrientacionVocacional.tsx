
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import { ChevronLeft, InfoIcon } from '../components/icons'
import { VOCATIONAL_QUESTIONS } from '../data/mock'
import { COLORS } from '../theme'
import { vocationalService } from '../services/vocational.service'

// Formatea las fechas de los intentos anteriores para mostrarlas en español.
function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function OrientacionVocacional() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  // Consulta el borrador y el historial para personalizar esta pantalla.
  const draft = vocationalService.getDraft()
  const answeredCount = VOCATIONAL_QUESTIONS.filter(
    (question) => Boolean(draft[question.id]),
  ).length

  const hasDraft = answeredCount > 0
  const results = vocationalService.getResults()
  const latestResult = results[0]

  // Inicia un test nuevo o conserva las respuestas del borrador existente.
  function handleStartTest() {
    try {
      if (!hasDraft) {
        vocationalService.startNewTest()
      }

      setError('')
      navigate('/app/orientacion/test')
    } catch {
      setError(
        'No fue posible preparar el test. Comprueba el almacenamiento del navegador e inténtalo nuevamente.',
      )
    }
  }

  return (
    <PhoneCenter>
      <PhoneFrame desktopLayout>
        {/* La navegación se adapta a una barra inferior o lateral. */}
        <BottomNav role="estudiante" />

        <div className="ea-screen-main">
          {/* Encabezado consistente con el resto de EduAlerta. */}
          <div
            className="ea-screen-header"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '18px 20px',
              background: '#FFFFFF',
              borderBottom: '1px solid #F1F5F9',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Regresar"
              style={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: 10,
                background: '#FFFFFF',
                border: `1.5px solid ${COLORS.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft color={COLORS.blue} />
            </button>

            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: COLORS.navy,
                  margin: 0,
                }}
              >
                Orientación vocacional
              </h1>

              <p
                style={{
                  fontSize: 13,
                  color: COLORS.muted,
                  margin: '4px 0 0',
                  lineHeight: 1.5,
                }}
              >
                Explora tus intereses y descubre nuevas posibilidades.
              </p>
            </div>
          </div>

          {/* El contenido se desplaza sin mover la navegación. */}
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
              {/* Presentación del test y su propósito. */}
              <section
                style={{
                  borderRadius: 20,
                  background:
                    'linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%)',
                  border: `1px solid ${COLORS.border}`,
                  padding: 22,
                  boxShadow: '0 2px 12px rgba(37,99,235,0.08)',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(37,99,235,0.1)',
                    borderRadius: 20,
                    padding: '5px 12px',
                    marginBottom: 16,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: COLORS.blue,
                    }}
                  />

                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: COLORS.blue,
                      letterSpacing: '0.4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Test vocacional
                  </span>
                </div>

                <h2
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: COLORS.navy,
                    margin: '0 0 12px',
                    lineHeight: 1.25,
                  }}
                >
                  Descubre áreas que podrían interesarte
                </h2>

                <p
                  style={{
                    fontSize: 14,
                    color: COLORS.muted,
                    margin: 0,
                    lineHeight: 1.7,
                    maxWidth: 720,
                  }}
                >
                  Responde preguntas sobre tus intereses, habilidades y
                  preferencias. Al finalizar podrás explorar áreas de estudio
                  relacionadas con tus respuestas.
                </p>
              </section>

              {/* Información práctica antes de comenzar. */}
              <section
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: `1px solid ${COLORS.border}`,
                  padding: '4px 0',
                }}
              >
                {[
                  {
                    emoji: '📝',
                    text: `${VOCATIONAL_QUESTIONS.length} preguntas · aproximadamente 5 minutos`,
                  },
                  {
                    emoji: '❓',
                    text: 'Preguntas sobre intereses, habilidades y preferencias.',
                  },
                  {
                    emoji: '💡',
                    text: 'Recomendaciones para explorar diferentes opciones de formación.',
                  },
                  {
                    emoji: '💾',
                    text: 'Tus respuestas se guardan para que puedas continuar si haces una pausa.',
                  },
                ].map((item, index, items) => (
                  <div
                    key={item.text}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 18px',
                      borderBottom:
                        index < items.length - 1
                          ? `1px solid ${COLORS.border}`
                          : 'none',
                    }}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0 }}>
                      {item.emoji}
                    </span>

                    <span
                      style={{
                        fontSize: 13,
                        color: '#334155',
                        lineHeight: 1.5,
                      }}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </section>

              {/* Si hay un borrador, se muestra el progreso guardado. */}
              {hasDraft && (
                <section
                  style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#1D4ED8',
                      margin: '0 0 5px',
                    }}
                  >
                    Tienes un test pendiente
                  </p>

                  <p
                    style={{
                      fontSize: 12,
                      color: '#1E40AF',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    Has respondido {answeredCount} de{' '}
                    {VOCATIONAL_QUESTIONS.length} preguntas. Puedes continuar
                    desde la primera pregunta que te falte.
                  </p>
                </section>
              )}

              {/* Advierte que las recomendaciones son exploratorias. */}
              <section
                style={{
                  background: COLORS.lightTeal,
                  borderRadius: 14,
                  border: '1px solid rgba(20,184,166,0.25)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <InfoIcon color={COLORS.teal} />

                <p
                  style={{
                    fontSize: 13,
                    color: '#0F766E',
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Tus resultados son una{' '}
                  <strong>guía para explorar posibilidades</strong>, no un
                  diagnóstico ni una decisión definitiva sobre tu futuro.
                </p>
              </section>

              {/* Muestra el último intento, si existe. */}
              {latestResult && (
                <section
                  style={{
                    background: '#FFFFFF',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      color: COLORS.muted,
                      margin: '0 0 5px',
                    }}
                  >
                    Último test completado
                  </p>

                  <p
                    style={{
                      fontSize: 14,
                      color: COLORS.navy,
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    {formatDate(latestResult.completedAt)}
                  </p>

                  <p
                    style={{
                      fontSize: 12,
                      color: COLORS.muted,
                      margin: '5px 0 0',
                      lineHeight: 1.5,
                    }}
                  >
                    Intentos guardados: {results.length}
                  </p>
                </section>
              )}

              {/* Informa si se produce un error de almacenamiento. */}
              {error && (
                <p
                  role="alert"
                  style={{
                    color: '#B91C1C',
                    background: '#FEF2F2',
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

              {/* CTA principal: comenzar o continuar según el estado del test. */}
              <button
                type="button"
                onClick={handleStartTest}
                style={{
                  width: '100%',
                  padding: 16,
                  borderRadius: 14,
                  background: COLORS.blue,
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
                }}
              >
                {hasDraft ? 'Continuar test' : 'Comenzar test'}
              </button>

              {/* El historial es accesible incluso antes de iniciar otro test. */}
              <button
                type="button"
                onClick={() => navigate('/app/orientacion/resultados')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: COLORS.blue,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 8,
                }}
              >
                Ver resultados anteriores ({results.length})
              </button>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}

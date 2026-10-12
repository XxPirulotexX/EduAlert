
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import { ChevronLeft, ChevronRight } from '../components/icons'
import { VOCATIONAL_QUESTIONS } from '../data/mock'
import { COLORS } from '../theme'
import { vocationalService } from '../services/vocational.service'

export default function TestVocacional() {
  const navigate = useNavigate()

  const total = VOCATIONAL_QUESTIONS.length

  // Recupera las respuestas guardadas al entrar al test.
  const [answers, setAnswers] = useState<Record<number, string>>(
    () => vocationalService.getDraft(),
  )

  // Si el test se interrumpió, vuelve a la primera pregunta pendiente.
  // Si ya estaban respondidas todas, muestra la última pregunta para
  // que el estudiante pueda terminar el proceso.
  const [currentIndex, setCurrentIndex] = useState(() => {
    const draft = vocationalService.getDraft()

    const firstUnanswered = VOCATIONAL_QUESTIONS.findIndex(
      (question) => !draft[question.id],
    )

    return firstUnanswered === -1
      ? Math.max(0, total - 1)
      : firstUnanswered
  })

  // Informa de errores al guardar o completar el test.
  const [error, setError] = useState('')

  const question = VOCATIONAL_QUESTIONS[currentIndex]
  const selected = answers[question.id]
  const isLast = currentIndex === total - 1

  // Guarda la respuesta elegida y persiste el borrador inmediatamente.
  function handleSelect(optionId: string) {
    const updatedAnswers = {
      ...answers,
      [question.id]: optionId,
    }

    // Actualiza la interfaz incluso si el almacenamiento local falla.
    setAnswers(updatedAnswers)

    try {
      vocationalService.saveDraft(updatedAnswers)
      setError('')
    } catch {
      setError(
        'No se pudo guardar el borrador. Puedes seguir respondiendo, pero los cambios podrían perderse si cierras esta página.',
      )
    }
  }

  // Avanza a la pregunta siguiente o finaliza la evaluación.
  function handleContinue() {
    // No se permite avanzar sin seleccionar una opción.
    if (!selected) {
      return
    }

    if (!isLast) {
      setCurrentIndex((index) => index + 1)
      return
    }

    try {
      // El servicio valida las 12 respuestas, calcula los perfiles,
      // guarda el intento y limpia el borrador al terminar correctamente.
      vocationalService.completeTest(answers)
      setError('')

      // La pantalla de resultados recuperará el último intento guardado.
      navigate('/app/orientacion/resultados')
    } catch (completionError) {
      setError(
        completionError instanceof Error
          ? completionError.message
          : 'No fue posible guardar tus resultados. Inténtalo de nuevo.',
      )
    }
  }

  // Retrocede una pregunta; desde la primera vuelve a la introducción.
  function handleBack() {
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1)
    } else {
      navigate('/app/orientacion')
    }
  }

  const progress = ((currentIndex + 1) / total) * 100

  return (
    <PhoneCenter>
      <PhoneFrame desktopLayout>
        {/* Mantiene la navegación compartida en móvil y escritorio. */}
        <BottomNav role="estudiante" />

        <div className="ea-screen-main">
          {/* Encabezado y progreso permanecen visibles al desplazarse. */}
          <div
            className="ea-screen-header"
            style={{
              background: '#FFFFFF',
              padding: '16px 20px 18px',
              borderBottom: '1px solid #F1F5F9',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 18,
              }}
            >
              <button
                type="button"
                onClick={handleBack}
                aria-label={
                  currentIndex > 0
                    ? 'Pregunta anterior'
                    : 'Volver a orientación vocacional'
                }
                style={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: '50%',
                  background:
                    currentIndex === 0 ? '#F8FAFC' : COLORS.lightBlue,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft color={COLORS.blue} />
              </button>

              <span
                style={{
                  fontSize: 11,
                  color: COLORS.muted,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                }}
              >
                Orientación vocacional
              </span>

              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.blue,
                  minWidth: 58,
                  textAlign: 'right',
                }}
              >
                {currentIndex + 1} de {total}
              </span>
            </div>

            {/* Barra visual de progreso del test. */}
            <div
              role="progressbar"
              aria-label="Progreso del test"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={currentIndex + 1}
              style={{
                height: 5,
                borderRadius: 99,
                background: '#DBEAFE',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background:
                    'linear-gradient(90deg, #2563EB 0%, #14B8A6 100%)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Contenido desplazable de la pregunta actual. */}
          <div className="ea-screen-content no-scrollbar">
            <div
              style={{
                width: '100%',
                maxWidth: 850,
                boxSizing: 'border-box',
                margin: '0 auto',
                padding: '24px 20px',
              }}
            >
              {/* Categoría de la pregunta. */}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: COLORS.teal,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  background: COLORS.lightTeal,
                  padding: '5px 10px',
                  borderRadius: 99,
                  border: '1px solid #CCFBF1',
                  display: 'inline-block',
                  marginBottom: 14,
                }}
              >
                {question.category}
              </span>

              {/* Texto de la pregunta. */}
              <h1
                style={{
                  fontSize: 23,
                  fontWeight: 700,
                  color: COLORS.navy,
                  lineHeight: 1.35,
                  margin: '0 0 24px',
                }}
              >
                {question.text}
              </h1>

              <p
                style={{
                  fontSize: 12,
                  color: COLORS.muted,
                  lineHeight: 1.5,
                  margin: '0 0 14px',
                }}
              >
                Selecciona la opción que mejor te represente.
              </p>

              {/* Las respuestas se mantienen marcadas al volver a una pregunta. */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                  gap: 12,
                  paddingBottom: 8,
                }}
              >
                {question.options.map((option) => {
                  const isSelected = selected === option.id

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(option.id)}
                      aria-pressed={isSelected}
                      style={{
                        width: '100%',
                        minHeight: 78,
                        boxSizing: 'border-box',
                        textAlign: 'left',
                        borderRadius: 16,
                        padding: 15,
                        border: isSelected
                          ? `2px solid ${COLORS.blue}`
                          : `1px solid ${COLORS.border}`,
                        background: isSelected
                          ? COLORS.lightBlue
                          : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        cursor: 'pointer',
                        boxShadow: isSelected
                          ? '0 0 0 4px rgba(37,99,235,0.08)'
                          : '0 1px 3px rgba(15,23,42,0.04)',
                        transition:
                          'border-color 0.15s ease, background 0.15s ease',
                      }}
                    >
                      {/* Emoji asociado a la opción de respuesta. */}
                      <span
                        style={{
                          fontSize: 24,
                          flexShrink: 0,
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isSelected ? '#DBEAFE' : '#F1F5F9',
                          borderRadius: 11,
                        }}
                      >
                        {option.emoji}
                      </span>

                      {/* Texto de la alternativa. */}
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: isSelected ? '#1E40AF' : '#334155',
                          lineHeight: 1.5,
                          flex: 1,
                        }}
                      >
                        {option.label}
                      </span>

                      {/* Marca visual para identificar la respuesta seleccionada. */}
                      <span
                        aria-hidden="true"
                        style={{
                          width: 18,
                          height: 18,
                          flexShrink: 0,
                          borderRadius: '50%',
                          border: isSelected
                            ? `5px solid ${COLORS.blue}`
                            : '1.5px solid #CBD5E1',
                          background: '#FFFFFF',
                          boxSizing: 'border-box',
                        }}
                      />
                    </button>
                  )
                })}
              </div>

              {/* Los errores de persistencia o evaluación se muestran aquí. */}
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
                    margin: '16px 0 0',
                  }}
                >
                  {error}
                </p>
              )}
            </div>
          </div>

          {/* El botón de avance queda separado del área desplazable. */}
          <div
            style={{
              padding: '14px 20px 18px',
              borderTop: '1px solid #F1F5F9',
              background: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            <div style={{ width: '100%', maxWidth: 850, margin: '0 auto' }}>
              <button
                type="button"
                onClick={handleContinue}
                disabled={!selected}
                style={{
                  width: '100%',
                  minHeight: 54,
                  borderRadius: 15,
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: selected ? 'pointer' : 'not-allowed',
                  background: selected
                    ? isLast
                      ? 'linear-gradient(135deg, #14B8A6, #0D9488)'
                      : 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                    : '#E2E8F0',
                  color: selected ? '#FFFFFF' : COLORS.subtle,
                  boxShadow: selected
                    ? '0 4px 14px rgba(37,99,235,0.2)'
                    : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {isLast ? 'Ver mis resultados' : 'Siguiente'}

                {!isLast && (
                  <ChevronRight
                    color={selected ? '#FFFFFF' : COLORS.subtle}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}

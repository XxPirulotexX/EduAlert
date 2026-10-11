import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import { ChevronLeft, ChevronRight } from '../components/icons'
import { VOCATIONAL_QUESTIONS } from '../data/mock'
import { COLORS } from '../theme'

export default function TestVocacional() {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const total = VOCATIONAL_QUESTIONS.length
  const question = VOCATIONAL_QUESTIONS[currentIndex]
  const selected = answers[question.id]
  const isLast = currentIndex === total - 1

  return (
    <PhoneCenter>
      <PhoneFrame>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '56px 20px 16px' }}>
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: currentIndex === 0 ? 'transparent' : COLORS.lightBlue,
              border: 'none', cursor: currentIndex === 0 ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronLeft color={COLORS.blue} />
          </button>
          <span style={{ fontSize: 11, color: COLORS.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Orientación vocacional
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.blue, minWidth: 40, textAlign: 'right' }}>
            {currentIndex + 1} de {total}
          </span>
        </div>

        <div style={{ padding: '0 20px 24px' }}>
          <div style={{ height: 4, borderRadius: 99, background: '#DBEAFE', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${((currentIndex + 1) / total) * 100}%`,
              background: 'linear-gradient(90deg, #2563EB 0%, #14B8A6 100%)',
              transition: 'width 0.4s',
            }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }} className="no-scrollbar">
          <span style={{
            fontSize: 10, fontWeight: 700, color: COLORS.teal,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            background: COLORS.lightTeal, padding: '3px 10px',
            borderRadius: 99, border: '1px solid #CCFBF1', display: 'inline-block', marginBottom: 12,
          }}>
            {question.category}
          </span>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.navy, lineHeight: 1.3, marginBottom: 28 }}>
            {question.text}
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 20 }}>
            {question.options.map((opt) => {
              const isSelected = selected === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setAnswers((p) => ({ ...p, [question.id]: opt.id }))}
                  style={{
                    width: '100%', minHeight: 68, textAlign: 'left',
                    borderRadius: 16, padding: '14px 16px',
                    border: isSelected ? `2px solid ${COLORS.blue}` : `2px solid ${COLORS.border}`,
                    background: isSelected ? COLORS.lightBlue : '#fff',
                    display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 0 4px rgba(37,99,235,0.08)' : '0 1px 3px rgba(15,23,42,0.06)',
                  }}
                >
                  <span style={{
                    fontSize: 24, flexShrink: 0, width: 36, height: 36,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? '#DBEAFE' : '#F1F5F9', borderRadius: 10,
                  }}>{opt.emoji}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: isSelected ? '#1E40AF' : '#334155', lineHeight: 1.4, flex: 1 }}>
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ padding: '0 20px 40px' }}>
          <button
            onClick={() => isLast ? navigate('/app/orientacion/resultados') : setCurrentIndex((i) => i + 1)}
            disabled={!selected}
            style={{
              width: '100%', height: 56, borderRadius: 16, border: 'none',
              fontSize: 16, fontWeight: 600,
              cursor: selected ? 'pointer' : 'default',
              background: selected
                ? isLast ? 'linear-gradient(135deg, #14B8A6, #0D9488)' : 'linear-gradient(135deg, #2563EB, #1D4ED8)'
                : '#E2E8F0',
              color: selected ? '#fff' : COLORS.subtle,
              boxShadow: selected ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
            }}
          >
            {isLast ? 'Ver mis resultados' : 'Siguiente'}
          </button>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}
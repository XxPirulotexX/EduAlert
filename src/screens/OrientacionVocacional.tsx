import { useNavigate } from 'react-router-dom'
import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import { ChevronLeft, InfoIcon } from '../components/icons'
import { COLORS } from '../theme'

export default function OrientacionVocacional() {
  const navigate = useNavigate()

  return (
    <PhoneCenter>
      <PhoneFrame>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 20px 16px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: `1.5px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronLeft />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, margin: 0 }}>Orientación vocacional</h1>
            <p style={{ fontSize: 13, color: COLORS.muted, margin: '4px 0 0' }}>
              Explora tus intereses y descubre nuevas posibilidades
            </p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 12px', display: 'flex', flexDirection: 'column', gap: 16 }} className="no-scrollbar">
          <div style={{
            borderRadius: 20, background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDFA 100%)',
            border: `1px solid ${COLORS.border}`, padding: '20px',
            boxShadow: '0 2px 12px rgba(37,99,235,0.08)',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37,99,235,0.1)', borderRadius: 20, padding: '4px 12px', marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.blue }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.blue, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                Test vocacional
              </span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.navy, margin: '0 0 12px', lineHeight: 1.25 }}>
              Descubre áreas que podrían interesarte
            </h2>
            <p style={{ fontSize: 14, color: COLORS.muted, margin: 0, lineHeight: 1.6 }}>
              Responde algunas preguntas sobre tus intereses, habilidades y preferencias. Al finalizar recibirás recomendaciones.
            </p>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${COLORS.border}`, padding: '4px 0' }}>
            {[
              { e: '📝', t: 'Aproximadamente 5 minutos' },
              { e: '❓', t: 'Preguntas sobre tus intereses y preferencias' },
              { e: '💡', t: 'Resultados para ayudarte a explorar opciones' },
            ].map((item, i, arr) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px',
                borderBottom: i < arr.length - 1 ? `1px solid ${COLORS.border}` : 'none',
              }}>
                <span style={{ fontSize: 18 }}>{item.e}</span>
                <span style={{ fontSize: 13.5, color: '#334155' }}>{item.t}</span>
              </div>
            ))}
          </div>

          <div style={{
            background: COLORS.lightTeal, borderRadius: 14,
            border: '1px solid rgba(20,184,166,0.25)',
            padding: '13px 16px', display: 'flex', gap: 10,
          }}>
            <InfoIcon color={COLORS.teal} />
            <p style={{ fontSize: 13, color: '#0F766E', margin: 0, lineHeight: 1.6 }}>
              Tus resultados son una <strong>guía para explorar posibilidades</strong>. La decisión sobre tu futuro siempre es tuya.
            </p>
          </div>

          <button
            onClick={() => navigate('/app/orientacion/test')}
            style={{
              width: '100%', padding: '16px', borderRadius: 14,
              background: COLORS.blue, border: 'none', color: '#fff',
              fontSize: 16, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(37,99,235,0.30)',
            }}
          >
            Comenzar test
          </button>

          <button
            onClick={() => navigate('/app/orientacion/resultados')}
            style={{ background: 'none', border: 'none', color: COLORS.blue, fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px' }}
          >
            Ver mis resultados anteriores
          </button>
        </div>

        <BottomNav role="estudiante" />
      </PhoneFrame>
    </PhoneCenter>
  )
}
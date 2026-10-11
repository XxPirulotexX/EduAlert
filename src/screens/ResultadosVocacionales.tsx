import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import { ChevronLeft } from '../components/icons'
import { useNavigate } from 'react-router-dom'
import { COLORS } from '../theme'

const AREAS = [
  { icon: '💻', name: 'Tecnología y desarrollo digital', desc: 'Programación, software, innovación y soluciones digitales.', level: 'Alta afinidad', color: COLORS.blue, bar: '92%' },
  { icon: '🔬', name: 'Ciencia e investigación', desc: 'Experimentación, análisis científico y conocimiento aplicado.', level: 'Alta afinidad', color: COLORS.teal, bar: '80%' },
  { icon: '🎨', name: 'Diseño y creatividad', desc: 'Comunicación visual, diseño de experiencias y expresión.', level: 'Afinidad media', color: '#6366F1', bar: '62%' },
]

const SECONDARY = [
  { icon: '📊', name: 'Administración' },
  { icon: '⚙️', name: 'Ingeniería' },
  { icon: '📡', name: 'Comunicación' },
  { icon: '🌍', name: 'Ciencias sociales' },
]

export default function ResultadosVocacionales() {
  const navigate = useNavigate()

  return (
    <PhoneCenter>
      <PhoneFrame>
        <div style={{ background: '#fff', padding: '16px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, background: '#F1F5F9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft />
          </button>
          <div>
            <div style={{ fontSize: 11, color: COLORS.subtle, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>EduAlerta</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, lineHeight: 1.2 }}>Tus resultados</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }} className="no-scrollbar">
          <div style={{
            background: 'linear-gradient(160deg, #1D4ED8 0%, #2563EB 40%, #0D9488 100%)',
            margin: '16px 16px 0', borderRadius: 20, padding: '28px 24px 24px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>
                ¡Exploraste nuevas posibilidades!
              </div>
              <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.55 }}>
                Según tus respuestas, estas son algunas áreas que podrías explorar.
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 16px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, marginBottom: 12 }}>Áreas para explorar</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {AREAS.map((a, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: i === 0 ? COLORS.lightBlue : i === 1 ? COLORS.lightTeal : '#F5F3FF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                    }}>{a.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy, marginBottom: 4 }}>{a.name}</div>
                      <div style={{ fontSize: 12.5, color: COLORS.muted, lineHeight: 1.5, marginBottom: 10 }}>{a.desc}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 5, background: '#F1F5F9', borderRadius: 99 }}>
                          <div style={{ width: a.bar, height: '100%', borderRadius: 99, background: a.color }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: a.color, whiteSpace: 'nowrap' }}>{a.level}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '20px 16px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, marginBottom: 12 }}>También podrías explorar</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {SECONDARY.map((s) => (
                <div key={s.name} style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{s.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: '20px 16px 24px' }}>
            <button onClick={() => navigate('/app/orientacion/test')} style={{
              width: '100%', padding: 15, borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', color: '#fff',
              fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10,
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
            }}>
              Realizar nuevamente el test
            </button>
          </div>
        </div>

        <BottomNav role="estudiante" />
      </PhoneFrame>
    </PhoneCenter>
  )
}
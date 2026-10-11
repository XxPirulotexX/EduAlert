import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import { COLORS, FONT } from '../theme'

function EduAlertaLogo() {
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-label="EduAlerta logo">
      <circle cx="48" cy="48" r="46" fill="#EFF6FF" />
      <circle cx="48" cy="48" r="46" stroke="#DBEAFE" strokeWidth="1" />
      <path d="M16 34 C16 32 18 30 20 30 L44 30 L44 66 L20 66 C18 66 16 64 16 62 Z" fill="white" stroke="#2563EB" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="22" y1="38" x2="40" y2="38" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="22" y1="43" x2="40" y2="43" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="22" y1="48" x2="38" y2="48" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="22" y1="53" x2="36" y2="53" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M80 34 C80 32 78 30 76 30 L52 30 L52 66 L76 66 C78 66 80 64 80 62 Z" fill="white" stroke="#2563EB" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="56" y1="38" x2="74" y2="38" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="56" y1="43" x2="74" y2="43" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="56" y1="48" x2="72" y2="48" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="56" y1="53" x2="70" y2="53" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="48" y1="30" x2="48" y2="66" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="48" cy="18" r="3.5" fill="#14B8A6" />
      <circle cx="34" cy="24" r="2.5" fill="#2563EB" />
      <circle cx="62" cy="24" r="2.5" fill="#2563EB" />
      <line x1="48" y1="18" x2="34" y2="24" stroke="#14B8A6" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <line x1="48" y1="18" x2="62" y2="24" stroke="#14B8A6" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
    </svg>
  )
}

function LoadingDots() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const i = setInterval(() => setActive((p) => (p + 1) % 3), 500)
    return () => clearInterval(i)
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: i === 1 ? 10 : 7,
            height: i === 1 ? 10 : 7,
            borderRadius: '50%',
            background: active === i ? COLORS.blue : '#CBD5E1',
            transition: 'all 0.3s ease',
            transform: active === i ? 'scale(1.3)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  )
}

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => navigate('/login'), 2500)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <PhoneCenter>
      <PhoneFrame>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 40px', fontFamily: FONT }}>
          <div style={{ marginBottom: 24 }}><EduAlertaLogo /></div>
          <div style={{ marginBottom: 12, lineHeight: 1 }}>
            <span style={{ fontSize: 34, fontWeight: 700, color: COLORS.blue, letterSpacing: '-0.5px' }}>Edu</span>
            <span style={{ fontSize: 34, fontWeight: 700, color: COLORS.teal, letterSpacing: '-0.5px' }}>Alerta</span>
          </div>
          <p style={{ fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
            Convirtiendo datos en oportunidades
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 56, gap: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: COLORS.subtle, textTransform: 'uppercase' }}>
            <span style={{ color: COLORS.blue, opacity: 0.6 }}>●</span> Datos · Información · Conocimiento
          </div>
          <LoadingDots />
          <p style={{ fontSize: 11, color: '#CBD5E1', letterSpacing: '0.04em', margin: 0 }}>v1.0 · Grados 10° y 11°</p>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}
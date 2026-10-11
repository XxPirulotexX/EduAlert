import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import { ChevronLeft, MailIcon } from '../components/icons'
import { COLORS, FONT } from '../theme'

export default function RecoverPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [focused, setFocused] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) setSubmitted(true)
  }

  return (
    <PhoneCenter bg={COLORS.bg}>
      <PhoneFrame rounded={false} shadow={false}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '28px 28px 48px' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              width: 40, height: 40, borderRadius: 12,
              border: '1.5px solid rgba(15,23,42,0.1)',
              background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', marginBottom: 32,
            }}
          >
            <ChevronLeft />
          </button>

          {!submitted ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{
                  width: 96, height: 96, borderRadius: 28,
                  background: '#fff',
                  border: '1.5px solid rgba(37,99,235,0.12)',
                  margin: '0 auto 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 24px rgba(37,99,235,0.1)',
                }}>
                  <svg width="44" height="44" viewBox="0 0 56 56" fill="none">
                    <path d="M28 4L8 12V26C8 37.05 16.72 47.4 28 50C39.28 47.4 48 37.05 48 26V12L28 4Z" stroke="#2563EB" strokeWidth="1.75" fill="none" />
                    <rect x="20" y="27" width="16" height="11" rx="2.5" fill="#2563EB" />
                    <path d="M23 27V23.5C23 21 25 19 28 19C31 19 33 21 33 23.5V27" stroke="#2563EB" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: COLORS.navy, marginBottom: 12, letterSpacing: '-0.02em' }}>
                  Recupera tu contraseña
                </h1>
                <p style={{ fontSize: 14.5, color: COLORS.muted, lineHeight: 1.65, maxWidth: 300, margin: '0 auto' }}>
                  Ingresa tu correo y te enviaremos las instrucciones para recuperar tu acceso.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Correo electrónico
                </label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: '#fff',
                  border: `1.75px solid ${focused ? COLORS.blue : 'rgba(15,23,42,0.12)'}`,
                  borderRadius: 14, padding: '0 18px', height: 54,
                  boxShadow: focused ? '0 0 0 4px rgba(37,99,235,0.1)' : '0 1px 3px rgba(15,23,42,0.05)',
                  marginBottom: 20,
                }}>
                  <MailIcon color={COLORS.subtle} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="tucorreo@institucion.edu"
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, fontFamily: FONT, color: COLORS.navy }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%', height: 54,
                    background: COLORS.blue, color: '#fff', border: 'none', borderRadius: 14,
                    fontSize: 15.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(37,99,235,0.32)',
                  }}
                >
                  Enviar instrucciones
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 8px 24px rgba(37,99,235,0.25)',
              }}>
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <path d="M6 15L12 21L24 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, marginBottom: 10 }}>Revisa tu correo</h2>
              <p style={{ fontSize: 14, color: COLORS.muted, lineHeight: 1.65, marginBottom: 32 }}>
                Enviamos las instrucciones de recuperación a <strong style={{ color: COLORS.navy }}>{email}</strong>
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', color: COLORS.blue, fontSize: 14.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
              >
                Volver a iniciar sesión
              </button>
            </div>
          )}
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}
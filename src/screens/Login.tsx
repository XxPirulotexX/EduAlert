import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import { EyeIcon, LockIcon, MailIcon } from '../components/icons'
import { COLORS, FONT } from '../theme'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => navigate('/app/home'), 1200)
  }

  return (
    <PhoneCenter bg={COLORS.bg}>
      <PhoneFrame rounded={false} shadow={false}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '72px 32px 48px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563EB, #14B8A6)',
              margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 22 }}>E</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy }}>
              EduAlerta <span style={{ color: COLORS.teal }}>•</span>
            </div>
          </div>

          <h1 style={{ fontSize: 30, fontWeight: 700, color: COLORS.navy, letterSpacing: '-0.6px', marginBottom: 10 }}>
            Bienvenido
          </h1>
          <p style={{ fontSize: 15, color: COLORS.muted, lineHeight: 1.55, marginBottom: 36 }}>
            Inicia sesión para acceder a tu espacio educativo.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 7 }}>
                Correo electrónico
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#fff',
                border: `1.5px solid ${emailFocused ? COLORS.blue : COLORS.border}`,
                borderRadius: 14, padding: '0 16px', height: 56,
                boxShadow: emailFocused ? '0 0 0 3px rgba(37,99,235,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <span style={{ color: emailFocused ? COLORS.blue : COLORS.subtle }}>
                  <MailIcon />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="tu@institución.edu"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, fontFamily: FONT, color: COLORS.navy }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 7 }}>
                Contraseña
              </label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#fff',
                border: `1.5px solid ${passwordFocused ? COLORS.blue : COLORS.border}`,
                borderRadius: 14, padding: '0 16px', height: 56,
                boxShadow: passwordFocused ? '0 0 0 3px rgba(37,99,235,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <span style={{ color: passwordFocused ? COLORS.blue : COLORS.subtle }}>
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="••••••••"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, fontFamily: FONT, color: COLORS.navy }}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.subtle, display: 'flex' }}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => navigate('/recuperar')}
                  style={{ background: 'none', border: 'none', color: COLORS.blue, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <div style={{ flex: 1 }} />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 56,
                background: loading ? '#93C5FD' : COLORS.blue,
                color: '#fff', border: 'none', borderRadius: 14,
                fontSize: 16, fontWeight: 600, fontFamily: FONT,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.28)',
              }}
            >
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 12, color: COLORS.subtle, marginTop: 24 }}>
            EduAlerta · Conocimiento para tomar mejores decisiones
          </p>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}
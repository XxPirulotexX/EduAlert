import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import { EyeIcon, LockIcon, MailIcon } from '../components/icons'
import { COLORS, FONT } from '../theme'
import { ApiClientError } from '../services/api-client.service'
import { getRoleHome, loginWithCredentials } from '../services/auth.service'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')

  /** Autentica con la API. El rol de destino procede de la cuenta registrada. */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    if (!email.trim() || !password) {
      setFormError('Ingresa tu correo y contraseña para continuar.')
      return
    }

    setLoading(true)
    try {
      const session = await loginWithCredentials(email, password)
      navigate(getRoleHome(session.user.rol), { replace: true })
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        setFormError('Correo o contraseña incorrectos, o cuenta inactiva.')
      } else {
        setFormError(
          error instanceof Error
            ? error.message
            : 'No fue posible iniciar sesión. Inténtalo nuevamente.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <PhoneCenter bg={COLORS.bg}>
      <PhoneFrame rounded={false} shadow={false}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '48px 28px 32px',
            overflowY: 'auto',
          }}
          className="no-scrollbar"
        >
          {/* Identidad visual de EduAlerta, conservada del login anterior. */}
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB, #14B8A6)',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 22 }}>
                E
              </span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy }}>
              EduAlerta <span style={{ color: COLORS.teal }}>•</span>
            </div>
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: COLORS.navy,
              letterSpacing: '-0.6px',
              margin: '0 0 10px',
            }}
          >
            Bienvenido
          </h1>

          <p
            style={{
              fontSize: 14,
              color: COLORS.muted,
              lineHeight: 1.55,
              margin: '0 0 24px',
            }}
          >
            Inicia sesión con las credenciales asignadas por el administrador.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}
          >
            {/* Correo de la cuenta almacenada en la base de datos. */}
            <div>
              <label
                htmlFor="login-email"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  display: 'block',
                  marginBottom: 7,
                }}
              >
                Correo electrónico
              </label>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#FFFFFF',
                  border: `1.5px solid ${emailFocused ? COLORS.blue : COLORS.border}`,
                  borderRadius: 14,
                  padding: '0 16px',
                  height: 54,
                  boxShadow: emailFocused
                    ? '0 0 0 3px rgba(37,99,235,0.10)'
                    : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <span style={{ color: emailFocused ? COLORS.blue : COLORS.subtle }}>
                  <MailIcon />
                </span>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="tu@institución.edu"
                  autoComplete="username"
                  required
                  maxLength={254}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 14,
                    fontFamily: FONT,
                    color: COLORS.navy,
                  }}
                />
              </div>
            </div>

            {/* Contraseña: el servidor valida el hash almacenado, no el navegador. */}
            <div>
              <label
                htmlFor="login-password"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  display: 'block',
                  marginBottom: 7,
                }}
              >
                Contraseña
              </label>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#FFFFFF',
                  border: `1.5px solid ${passwordFocused ? COLORS.blue : COLORS.border}`,
                  borderRadius: 14,
                  padding: '0 16px',
                  height: 54,
                  boxShadow: passwordFocused
                    ? '0 0 0 3px rgba(37,99,235,0.10)'
                    : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <span style={{ color: passwordFocused ? COLORS.blue : COLORS.subtle }}>
                  <LockIcon />
                </span>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  required
                  maxLength={72}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 14,
                    fontFamily: FONT,
                    color: COLORS.navy,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: COLORS.subtle,
                    display: 'flex',
                    padding: 4,
                  }}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => navigate('/recuperar')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: COLORS.blue,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: FONT,
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {formError && (
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
                {formError}
              </p>
            )}

            <div style={{ flex: 1, minHeight: 20 }} />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                minHeight: 54,
                background: loading ? '#93C5FD' : COLORS.blue,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 600,
                fontFamily: FONT,
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.22)',
              }}
            >
              {loading ? 'Verificando credenciales…' : 'Iniciar sesión'}
            </button>
          </form>

          <p
            style={{
              textAlign: 'center',
              fontSize: 11,
              color: COLORS.subtle,
              lineHeight: 1.5,
              margin: '20px 0 0',
            }}
          >
            EduAlerta · Conocimiento para tomar mejores decisiones
          </p>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}

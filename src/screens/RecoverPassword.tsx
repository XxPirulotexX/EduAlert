
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import { ChevronLeft, MailIcon } from '../components/icons'
import { COLORS, FONT } from '../theme'

// ============================================================
// ICONO DE SEGURIDAD
// ============================================================

// Escudo con candado que refuerza visualmente el propósito
// de la recuperación de acceso, sin depender de otra librería.
function SecurityIllustration() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 56 56"
      fill="none"
      role="img"
      aria-label="Icono de seguridad"
    >
      {/* Escudo exterior. */}
      <path
        d="M28 4L8 12V26C8 37.05 16.72 47.4 28 50C39.28 47.4 48 37.05 48 26V12L28 4Z"
        stroke="#2563EB"
        strokeWidth="1.75"
        fill="#EFF6FF"
        strokeLinejoin="round"
      />

      {/* Cuerpo del candado. */}
      <rect
        x="20"
        y="27"
        width="16"
        height="11"
        rx="2.5"
        fill="#2563EB"
      />

      {/* Arco del candado. */}
      <path
        d="M23 27V23.5C23 21 25 19 28 19C31 19 33 21 33 23.5V27"
        stroke="#2563EB"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Punto central del candado. */}
      <circle cx="28" cy="32" r="1.5" fill="#FFFFFF" />
    </svg>
  )
}

// ============================================================
// PANTALLA DE RECUPERACIÓN DE CONTRASEÑA
// ============================================================

export default function RecoverPassword() {
  const navigate = useNavigate()

  // Estado del correo introducido por el usuario.
  const [email, setEmail] = useState('')

  // Controla el borde visual del campo cuando recibe el foco.
  const [focused, setFocused] = useState(false)

  // Indica si el formulario local ya fue procesado.
  // No significa que se haya enviado un correo real.
  const [submitted, setSubmitted] = useState(false)

  // Gestiona el envío local del formulario de demostración.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // La validación básica de formato y campo obligatorio también
    // la realiza el navegador mediante type="email" y required.
    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      return
    }

    // Prepara la pantalla de confirmación sin llamar a un servidor.
    setEmail(normalizedEmail)
    setSubmitted(true)
  }

  // Permite volver al formulario si se desea corregir el correo.
  function handleEditEmail() {
    setSubmitted(false)
  }

  return (
    <PhoneCenter bg={COLORS.bg}>
      {/* Se usa un único contenedor principal para que el diseño
          conserve su estructura vertical en escritorio y móvil. */}
      <PhoneFrame rounded={false} shadow={false} desktopLayout>
        <div
          className="ea-screen-main"
          style={{
            background: COLORS.bg,
            fontFamily: FONT,
          }}
        >
          {/* ----------------------------------------------------
              ENCABEZADO Y REGRESO A LOGIN
          ---------------------------------------------------- */}

          <div
            className="ea-screen-header"
            style={{
              background: '#FFFFFF',
              borderBottom: '1px solid #F1F5F9',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => navigate('/login')}
              aria-label="Volver al inicio de sesión"
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: 12,
                border: '1px solid rgba(15,23,42,0.1)',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft color={COLORS.blue} />
            </button>

            <div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: COLORS.navy,
                  margin: 0,
                }}
              >
                EduAlerta
              </p>

              <p
                style={{
                  fontSize: 11,
                  color: COLORS.muted,
                  margin: '3px 0 0',
                }}
              >
                Recuperación de acceso
              </p>
            </div>
          </div>

          {/* ----------------------------------------------------
              CONTENIDO ADAPTABLE
          ---------------------------------------------------- */}

          <div
            className="ea-screen-content no-scrollbar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              boxSizing: 'border-box',
            }}
          >
            {/* La cuadrícula muestra dos columnas en pantallas amplias
                y se reorganiza en una columna cuando el espacio es menor. */}
            <div
              style={{
                width: '100%',
                maxWidth: 1050,
                margin: 'auto',
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
                gap: 24,
                alignItems: 'stretch',
              }}
            >
              {/* ------------------------------------------------
                  PANEL INFORMATIVO
              ------------------------------------------------ */}

              <section
                style={{
                  background:
                    'linear-gradient(145deg, #EFF6FF 0%, #F0FDFA 100%)',
                  border: '1px solid #DBEAFE',
                  borderRadius: 20,
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minWidth: 0,
                }}
              >
                {/* Ilustración principal de seguridad. */}
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 24,
                    background: '#FFFFFF',
                    border: '1px solid #DBEAFE',
                    boxShadow: '0 4px 20px rgba(37,99,235,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                  }}
                >
                  <SecurityIllustration />
                </div>

                <h1
                  style={{
                    fontSize: 27,
                    fontWeight: 700,
                    color: COLORS.navy,
                    lineHeight: 1.25,
                    letterSpacing: '-0.4px',
                    margin: '0 0 12px',
                  }}
                >
                  Recupera tu contraseña
                </h1>

                <p
                  style={{
                    fontSize: 14,
                    color: COLORS.muted,
                    lineHeight: 1.7,
                    margin: '0 0 24px',
                  }}
                >
                  Recuperar el acceso debe ser un proceso sencillo y seguro.
                  Introduce el correo asociado a tu cuenta para iniciar el
                  proceso cuando EduAlerta tenga habilitada la autenticación.
                </p>

                {/* Explica qué pasos formarán parte del flujo real. */}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.75)',
                    border: '1px solid rgba(191,219,254,0.8)',
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  {[
                    {
                      number: '1',
                      title: 'Identifica tu cuenta',
                      description: 'Introduce tu correo electrónico.',
                    },
                    {
                      number: '2',
                      title: 'Verifica tu identidad',
                      description: 'El proceso real deberá comprobar que eres el titular.',
                    },
                    {
                      number: '3',
                      title: 'Restablece tu acceso',
                      description: 'Podrás crear una nueva contraseña cuando se conecte el servicio.',
                    },
                  ].map((step, index, steps) => (
                    <div
                      key={step.number}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        paddingBottom:
                          index < steps.length - 1 ? 15 : 0,
                        marginBottom:
                          index < steps.length - 1 ? 15 : 0,
                        borderBottom:
                          index < steps.length - 1
                            ? '1px solid #E2E8F0'
                            : 'none',
                      }}
                    >
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          borderRadius: '50%',
                          background: '#DBEAFE',
                          color: COLORS.blue,
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {step.number}
                      </span>

                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: COLORS.navy,
                            margin: '2px 0 5px',
                          }}
                        >
                          {step.title}
                        </p>

                        <p
                          style={{
                            fontSize: 11,
                            color: COLORS.muted,
                            lineHeight: 1.6,
                            margin: 0,
                          }}
                        >
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ------------------------------------------------
                  FORMULARIO Y ESTADO DE CONFIRMACIÓN
              ------------------------------------------------ */}

              <section
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #F1F5F9',
                  borderRadius: 20,
                  padding: '28px 24px',
                  boxShadow: '0 4px 22px rgba(15,23,42,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  minWidth: 0,
                }}
              >
                {!submitted ? (
                  <>
                    <h2
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: COLORS.navy,
                        margin: '0 0 9px',
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </h2>

                    <p
                      style={{
                        fontSize: 13,
                        color: COLORS.muted,
                        lineHeight: 1.7,
                        margin: '0 0 24px',
                      }}
                    >
                      Escribe tu correo a continuación para probar la
                      interfaz de recuperación.
                    </p>

                    <form
                      onSubmit={handleSubmit}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      {/* Etiqueta asociada al campo para accesibilidad. */}
                      <label
                        htmlFor="recovery-email"
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#374151',
                        }}
                      >
                        Correo electrónico
                      </label>

                      {/* Campo de correo con indicador visual de foco. */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          background: '#FFFFFF',
                          border: `1.75px solid ${
                            focused ? COLORS.blue : 'rgba(15,23,42,0.12)'
                          }`,
                          borderRadius: 14,
                          padding: '0 16px',
                          height: 54,
                          boxSizing: 'border-box',
                          boxShadow: focused
                            ? '0 0 0 4px rgba(37,99,235,0.1)'
                            : '0 1px 3px rgba(15,23,42,0.05)',
                          transition: 'border-color 0.15s ease',
                        }}
                      >
                        <MailIcon
                          color={focused ? COLORS.blue : COLORS.subtle}
                        />

                        <input
                          id="recovery-email"
                          type="email"
                          name="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          onFocus={() => setFocused(true)}
                          onBlur={() => setFocused(false)}
                          placeholder="tucorreo@institucion.edu"
                          autoComplete="email"
                          required
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

                      {/* Aviso visible para evitar confundir la demostración
                          con un envío real de instrucciones. */}
                      <p
                        style={{
                          fontSize: 11,
                          color: COLORS.subtle,
                          lineHeight: 1.6,
                          margin: '0 0 8px',
                        }}
                      >
                        Modo de demostración. No se enviará ningún correo
                        ni se cambiará la contraseña.
                      </p>

                      <button
                        type="submit"
                        style={{
                          width: '100%',
                          minHeight: 52,
                          background: COLORS.blue,
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 13,
                          fontSize: 14,
                          fontWeight: 600,
                          fontFamily: FONT,
                          cursor: 'pointer',
                          boxShadow: '0 4px 16px rgba(37,99,235,0.22)',
                        }}
                      >
                        Probar recuperación
                      </button>
                    </form>
                  </>
                ) : (
                  /* Confirmación visual: no representa un correo enviado. */
                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 76,
                        height: 76,
                        borderRadius: 22,
                        background:
                          'linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 22,
                        boxShadow: '0 8px 24px rgba(37,99,235,0.2)',
                      }}
                    >
                      {/* Marca de confirmación de la interacción local. */}
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 30 30"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M6 15L12 21L24 9"
                          stroke="#FFFFFF"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <h2
                      style={{
                        fontSize: 21,
                        fontWeight: 700,
                        color: COLORS.navy,
                        margin: '0 0 10px',
                      }}
                    >
                      Solicitud preparada
                    </h2>

                    <p
                      style={{
                        fontSize: 13,
                        color: COLORS.muted,
                        lineHeight: 1.7,
                        margin: '0 0 18px',
                      }}
                    >
                      La interfaz procesó tu solicitud para el correo:
                    </p>

                    <div
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: 13,
                        borderRadius: 11,
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        marginBottom: 18,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      <strong
                        style={{
                          fontSize: 13,
                          color: COLORS.navy,
                        }}
                      >
                        {email}
                      </strong>
                    </div>

                    {/* Declaración explícita sobre lo que falta por conectar. */}
                    <p
                      style={{
                        fontSize: 12,
                        lineHeight: 1.7,
                        color: '#92400E',
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: 12,
                        padding: 13,
                        margin: '0 0 22px',
                        textAlign: 'left',
                      }}
                    >
                      <strong>Importante:</strong> todavía no se ha enviado
                      ningún correo. La recuperación real estará disponible
                      cuando EduAlerta tenga un servicio de autenticación
                      y envío de instrucciones.
                    </p>

                    {/* Permite volver a corregir el correo sin salir de la pantalla. */}
                    <button
                      type="button"
                      onClick={handleEditEmail}
                      style={{
                        width: '100%',
                        minHeight: 48,
                        borderRadius: 12,
                        border: `1px solid ${COLORS.border}`,
                        background: '#FFFFFF',
                        color: COLORS.blue,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginBottom: 10,
                      }}
                    >
                      Volver y corregir el correo
                    </button>

                    {/* Regresa a la pantalla de Login. */}
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      style={{
                        width: '100%',
                        minHeight: 48,
                        borderRadius: 12,
                        border: 'none',
                        background: COLORS.blue,
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Volver a iniciar sesión
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}

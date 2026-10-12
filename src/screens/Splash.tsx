
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import { COLORS, FONT } from '../theme'

// ============================================================
// LOGO VECTORIAL DE EDUALERTA
// ============================================================

// Se conserva el logo original construido con SVG para que se vea
// nítido en diferentes resoluciones, sin depender de imágenes externas.
function EduAlertaLogo() {
  return (
    <svg
      width="96"
      height="96"
      viewBox="0 0 96 96"
      fill="none"
      role="img"
      aria-label="Logo de EduAlerta"
    >
      {/* Fondo circular del emblema. */}
      <circle cx="48" cy="48" r="46" fill="#EFF6FF" />
      <circle
        cx="48"
        cy="48"
        r="46"
        stroke="#DBEAFE"
        strokeWidth="1"
      />

      {/* Página izquierda del libro. */}
      <path
        d="M16 34 C16 32 18 30 20 30 L44 30 L44 66 L20 66 C18 66 16 64 16 62 Z"
        fill="white"
        stroke="#2563EB"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Líneas que representan el conocimiento escrito. */}
      <line x1="22" y1="38" x2="40" y2="38" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="22" y1="43" x2="40" y2="43" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="22" y1="48" x2="38" y2="48" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="22" y1="53" x2="36" y2="53" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />

      {/* Página derecha del libro. */}
      <path
        d="M80 34 C80 32 78 30 76 30 L52 30 L52 66 L76 66 C78 66 80 64 80 62 Z"
        fill="white"
        stroke="#2563EB"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Líneas de la página derecha. */}
      <line x1="56" y1="38" x2="74" y2="38" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="56" y1="43" x2="74" y2="43" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="56" y1="48" x2="72" y2="48" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="56" y1="53" x2="70" y2="53" stroke="#BFDBFE" strokeWidth="1.2" strokeLinecap="round" />

      {/* Eje central que une las dos páginas. */}
      <line
        x1="48"
        y1="30"
        x2="48"
        y2="66"
        stroke="#2563EB"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Nodos superiores: representan la conexión entre datos y conocimiento. */}
      <circle cx="48" cy="18" r="3.5" fill="#14B8A6" />
      <circle cx="34" cy="24" r="2.5" fill="#2563EB" />
      <circle cx="62" cy="24" r="2.5" fill="#2563EB" />

      {/* Conexiones entre los nodos. */}
      <line
        x1="48"
        y1="18"
        x2="34"
        y2="24"
        stroke="#14B8A6"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.8"
      />
      <line
        x1="48"
        y1="18"
        x2="62"
        y2="24"
        stroke="#14B8A6"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  )
}

// ============================================================
// INDICADOR ANIMADO DE CARGA
// ============================================================

// Alterna el punto activo para indicar que la aplicación está iniciando.
// El intervalo se limpia al desmontar el componente para evitar fugas.
function LoadingDots() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActive((previous) => (previous + 1) % 3)
    }, 500)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <div
      role="status"
      aria-label="Cargando EduAlerta"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
      }}
    >
      {[0, 1, 2].map((index) => {
        const isActive = active === index

        return (
          <div
            key={index}
            style={{
              width: isActive ? 10 : 7,
              height: isActive ? 10 : 7,
              borderRadius: '50%',
              background: isActive ? COLORS.blue : '#CBD5E1',
              transition: 'all 0.3s ease',
              transform: isActive ? 'scale(1.15)' : 'scale(1)',
            }}
          />
        )
      })}
    </div>
  )
}

// ============================================================
// PANTALLA DE BIENVENIDA
// ============================================================

export default function Splash() {
  const navigate = useNavigate()

  // Redirige a Login después de mostrar brevemente la identidad visual.
  // El temporizador se cancela si el usuario abandona esta pantalla antes.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      navigate('/login', { replace: true })
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [navigate])

  return (
    <PhoneCenter bg={COLORS.bg}>
      {/* El modo escritorio usa el ancho disponible.
          Se usa un único contenedor hijo para conservar la composición vertical. */}
      <PhoneFrame desktopLayout rounded={false} shadow={false}>
        <div
          className="ea-screen-main"
          style={{
            width: '100%',
            background:
              'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 55%, #F8FAFC 100%)',
            fontFamily: FONT,
          }}
        >
          {/* Centro de la pantalla: marca, nombre y mensaje institucional. */}
          <main
            style={{
              flex: 1,
              minHeight: 0,
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 24px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 560,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {/* Emblema de EduAlerta. */}
              <div style={{ marginBottom: 22 }}>
                <EduAlertaLogo />
              </div>

              {/* Nombre de la aplicación con sus colores institucionales. */}
              <div
                style={{
                  marginBottom: 14,
                  lineHeight: 1.1,
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: COLORS.blue,
                    letterSpacing: '-0.7px',
                  }}
                >
                  Edu
                </span>

                <span
                  style={{
                    fontSize: 36,
                    fontWeight: 700,
                    color: COLORS.teal,
                    letterSpacing: '-0.7px',
                  }}
                >
                  Alerta
                </span>
              </div>

              {/* Eslogan principal. */}
              <p
                style={{
                  fontSize: 14,
                  color: COLORS.muted,
                  textAlign: 'center',
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                Convirtiendo datos en oportunidades
              </p>

              {/* Una breve línea refuerza el propósito educativo. */}
              <div
                aria-hidden="true"
                style={{
                  width: 54,
                  height: 3,
                  borderRadius: 99,
                  background:
                    'linear-gradient(90deg, #2563EB, #14B8A6)',
                  marginTop: 24,
                }}
              />
            </div>
          </main>

          {/* Pie de pantalla: proceso de carga y versión del prototipo. */}
          <footer
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '20px 20px max(28px, env(safe-area-inset-bottom))',
              gap: 16,
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: COLORS.subtle,
                textTransform: 'uppercase',
                textAlign: 'center',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              <span style={{ color: COLORS.blue, opacity: 0.75 }}>● </span>
              Datos · Información · Conocimiento
            </p>

            <LoadingDots />

            <p
              style={{
                fontSize: 11,
                color: COLORS.subtle,
                letterSpacing: '0.04em',
                margin: 0,
              }}
            >
              v1.0 · Grados 10° y 11°
            </p>
          </footer>
        </div>
      </PhoneFrame>
    </PhoneCenter>
  )
}


import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import { EyeIcon, LockIcon, MailIcon } from '../components/icons'
import { COLORS, FONT } from '../theme'

// Permite guardar el perfil de demostración en el almacenamiento existente.
import {
  writeStoredData,
  removeStoredData,
} from '../services/storage.service'

// Permite elegir un estudiante existente para las pruebas del prototipo.
import { studentsService } from '../services/students.service'

// Perfiles disponibles en el inicio de sesión de demostración.
// La selección todavía no concede ni verifica permisos reales.
type DemoRole = 'docente' | 'estudiante'

export default function Login() {
  const navigate = useNavigate()

  // Estado de los campos del formulario.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Estado visual de la contraseña y de los campos enfocados.
  const [showPassword, setShowPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  // Controla el estado de carga del botón de entrada.
  const [loading, setLoading] = useState(false)

  // Permite escoger el destino de demostración.
  const [selectedRole, setSelectedRole] =
    useState<DemoRole>('docente')
  // Permite informar si el navegador no puede guardar el perfil seleccionado.
  const [formError, setFormError] = useState('')

  // Recupera los estudiantes disponibles para el selector de demostración.
  const availableStudents = studentsService.getAll()

  // Selecciona inicialmente el primer estudiante disponible.
  const [selectedStudentId, setSelectedStudentId] = useState<number>(
    () => availableStudents[0]?.id ?? 1,
  )

  // Guarda el rol y, para el estudiante, su ID de demostración.
  // No almacena la contraseña ni realiza autenticación real.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    // Solo se requiere seleccionar un estudiante cuando ese es el perfil elegido.
    if (
      selectedRole === 'estudiante' &&
      !availableStudents.some((student) => student.id === selectedStudentId)
    ) {
      setFormError('Selecciona un estudiante válido para continuar.')
      return
    }

    setLoading(true)

    try {
      writeStoredData('demo-role', selectedRole)

      // Asocia las operaciones vocacionales al alumno seleccionado.
      if (selectedRole === 'estudiante') {
        writeStoredData('demo-student-id', selectedStudentId)
      } else {
        // Evita conservar el ID de estudiante al entrar como docente.
        removeStoredData('demo-student-id')
      }

      // El correo se utiliza únicamente para mostrarlo en el perfil.
      if (email.trim()) {
        writeStoredData('demo-email', email.trim())
      } else {
        removeStoredData('demo-email')
      }
    } catch (error) {
      console.error('Error al guardar el perfil de demostración:', error)
      setLoading(false)
      setFormError(
        'No se pudo guardar el perfil. Revisa los permisos de almacenamiento del navegador.',
      )
      return
    }

    // Dirige cada perfil a su pantalla de inicio correspondiente.
    const destination =
      selectedRole === 'estudiante'
        ? '/app/home-estudiante'
        : '/app/home'

    window.setTimeout(() => {
      navigate(destination)
    }, 500)
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
          {/* Identidad visual de EduAlerta. */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: 30,
            }}
          >
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
              <span
                style={{
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 22,
                }}
              >
                E
              </span>
            </div>

            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: COLORS.navy,
              }}
            >
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
            Selecciona el espacio al que deseas entrar en el prototipo.
          </p>

          {/* Selector de destino para probar ambos recorridos de la aplicación. */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 24,
            }}
          >
            {([
              {
                id: 'docente',
                title: 'Docente',
                description: 'Estudiantes y alertas',
              },
              {
                id: 'estudiante',
                title: 'Estudiante',
                description: 'Orientación vocacional',
              },
            ] as const).map((role) => {
              const selected = selectedRole === role.id

              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  aria-pressed={selected}
                  style={{
                    textAlign: 'left',
                    padding: 13,
                    borderRadius: 12,
                    border: selected
                      ? `2px solid ${COLORS.blue}`
                      : `1px solid ${COLORS.border}`,
                    background: selected ? COLORS.lightBlue : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: 14,
                      fontWeight: 700,
                      color: selected ? COLORS.blue : COLORS.navy,
                      marginBottom: 5,
                    }}
                  >
                    {role.title}
                  </span>

                  <span
                    style={{
                      display: 'block',
                      fontSize: 11,
                      color: COLORS.muted,
                      lineHeight: 1.4,
                    }}
                  >
                    {role.description}
                  </span>
                </button>
              )
            })}
          </div>
          {/* Solo se muestra al elegir el perfil Estudiante. */}
          {selectedRole === 'estudiante' && (
            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="demo-student"
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: 7,
                }}
              >
                Estudiante de demostración
              </label>

              <select
                id="demo-student"
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(Number(event.target.value))}
                required
                style={{
                  width: '100%',
                  minHeight: 48,
                  padding: '10px 12px',
                  background: '#FFFFFF',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  color: COLORS.navy,
                  fontFamily: FONT,
                  fontSize: 13,
                }}
              >
                {availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} · Grado {student.grade}
                  </option>
                ))}
              </select>

              <p
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: COLORS.subtle,
                  margin: '7px 0 0',
                }}
              >
                Sus respuestas y resultados vocacionales se guardarán separados
                de los de otros estudiantes en este navegador.
              </p>
            </div>
          )}
          {/* Aviso transparente: el selector es solo para navegación de demostración. */}
          <p
            style={{
              fontSize: 11,
              color: COLORS.muted,
              lineHeight: 1.5,
              margin: '-12px 0 20px',
            }}
          >
            Modo de demostración: este formulario aún no valida cuentas ni
            permisos de usuario.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              flex: 1,
            }}
          >
            {/* Campo de correo electrónico. */}
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
                  border: `1.5px solid ${
                    emailFocused ? COLORS.blue : COLORS.border
                  }`,
                  borderRadius: 14,
                  padding: '0 16px',
                  height: 54,
                  boxShadow: emailFocused
                    ? '0 0 0 3px rgba(37,99,235,0.10)'
                    : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <span
                  style={{
                    color: emailFocused ? COLORS.blue : COLORS.subtle,
                  }}
                >
                  <MailIcon />
                </span>

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  placeholder="tu@institución.edu"
                  autoComplete="email"
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

            {/* Campo de contraseña con opción para mostrar u ocultar el valor. */}
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
                  border: `1.5px solid ${
                    passwordFocused ? COLORS.blue : COLORS.border
                  }`,
                  borderRadius: 14,
                  padding: '0 16px',
                  height: 54,
                  boxShadow: passwordFocused
                    ? '0 0 0 3px rgba(37,99,235,0.10)'
                    : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <span
                  style={{
                    color: passwordFocused ? COLORS.blue : COLORS.subtle,
                  }}
                >
                  <LockIcon />
                </span>

                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
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

              {/* La ruta de recuperación ya existe en App.tsx. */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: 8,
                }}
              >
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

            {/* Separa visualmente el formulario del botón principal. */}
            <div style={{ flex: 1, minHeight: 20 }} />
            {/* Presenta el error de almacenamiento sin bloquear el formulario. */}
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
            {/* El texto del botón deja claro el destino de la navegación. */}
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
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading
                  ? 'none'
                  : '0 4px 16px rgba(37,99,235,0.22)',
              }}
            >
              {loading
                ? 'Ingresando…'
                : `Entrar como ${
                    selectedRole === 'estudiante' ? 'estudiante' : 'docente'
                  }`}
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

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import { ApiClientError, apiRequest } from '../services/api-client.service'
import { studentsApiService, type ApiStudent } from '../services/students-api.service'
import { COLORS, FONT } from '../theme'

type UserRole = 'administrador' | 'docente' | 'orientador' | 'estudiante'
type NewUserRole = Exclude<UserRole, 'administrador'>

type ManagedUser = {
  id: number
  nombres: string
  apellidos: string
  correo: string
  rol: UserRole
  estado: string
  estudianteId: number | null
  creadoEn?: string
}

type CreateUserRequest = {
  nombres: string
  apellidos: string
  correo: string
  password: string
  rol: NewUserRole
  estudianteId: number | null
}

const ROLE_LABELS: Record<UserRole, string> = {
  administrador: 'Administrador',
  docente: 'Docente',
  orientador: 'Orientador',
  estudiante: 'Estudiante',
}

const fieldStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 44,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  padding: '10px 12px',
  fontFamily: FONT,
  fontSize: 13,
  color: COLORS.navy,
  background: '#FFFFFF',
  outline: 'none',
}

const primaryButton: CSSProperties = {
  border: 'none',
  borderRadius: 10,
  padding: '11px 14px',
  background: COLORS.blue,
  color: '#FFFFFF',
  fontFamily: FONT,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

const secondaryButton: CSSProperties = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  padding: '10px 13px',
  background: '#FFFFFF',
  color: COLORS.navy,
  fontFamily: FONT,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'No fue posible completar la operación. Inténtalo nuevamente.'
}

/**
 * Pantalla administrativa para crear cuentas y consultar las existentes.
 * La autorización definitiva se verifica en Spring Security, no en React.
 */
export default function AdminUsuarios() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [availableStudents, setAvailableStudents] = useState<ApiStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<NewUserRole>('docente')
  const [estudianteId, setEstudianteId] = useState('')

  /** Recarga ambos catálogos desde el backend autenticado. */
  const loadData = useCallback(async () => {
    setLoading(true)
    setPageError('')
    try {
      const [usersResult, studentsResult] = await Promise.all([
        apiRequest<ManagedUser[]>('/admin/usuarios'),
        studentsApiService.getAll(),
      ])
      setUsers(usersResult)
      // Solo se puede vincular una cuenta con una ficha activa y sin usuario.
      setAvailableStudents(
        studentsResult.filter((student) => student.estado === 'activo' && student.usuarioId === null),
      )
    } catch (error) {
      setPageError(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es')
    if (!query) return users
    return users.filter((user) =>
      `${user.nombres} ${user.apellidos} ${user.correo} ${ROLE_LABELS[user.rol]}`
        .toLocaleLowerCase('es')
        .includes(query),
    )
  }, [users, search])

  const resetForm = () => {
    setNombres('')
    setApellidos('')
    setCorreo('')
    setPassword('')
    setRol('docente')
    setEstudianteId('')
    setFormError('')
  }

  const closeForm = () => {
    if (saving) return
    setFormOpen(false)
    resetForm()
  }

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setNotice('')

    // Validación temprana; el backend vuelve a validar todos los campos.
    if (!nombres.trim() || !apellidos.trim() || !correo.trim() || !password) {
      setFormError('Completa todos los campos obligatorios.')
      return
    }
    if (password.length < 10 || password.length > 72) {
      setFormError('La contraseña debe tener entre 10 y 72 caracteres.')
      return
    }
    if (rol === 'estudiante' && !estudianteId) {
      setFormError('Selecciona una ficha activa que no esté vinculada a otra cuenta.')
      return
    }

    const payload: CreateUserRequest = {
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      correo: correo.trim().toLowerCase(),
      password,
      rol,
      estudianteId: rol === 'estudiante' ? Number(estudianteId) : null,
    }

    setSaving(true)
    try {
      const created = await apiRequest<ManagedUser>('/admin/usuarios', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setUsers((current) =>
        [...current, created].sort((a, b) =>
          `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`, 'es'),
        ),
      )
      setNotice(`La cuenta de ${created.nombres} ${created.apellidos} se creó correctamente.`)
      setFormOpen(false)
      resetForm()
      // Recarga fichas disponibles para que la misma ficha no aparezca seleccionable dos veces.
      const students = await studentsApiService.getAll()
      setAvailableStudents(students.filter((student) => student.estado === 'activo' && student.usuarioId === null))
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 409) {
        setFormError(error.message)
      } else {
        setFormError(errorMessage(error))
      }
    } finally {
      setSaving(false)
    }
  }

  const roleCounts = useMemo(() => {
    const counts: Record<UserRole, number> = {
      administrador: 0,
      docente: 0,
      orientador: 0,
      estudiante: 0,
    }
    users.forEach((user) => { counts[user.rol] += 1 })
    return counts
  }, [users])

  return (
    <PhoneCenter>
      <PhoneFrame desktopLayout>
        <BottomNav role="administrador" />
        <div className="ea-screen-main">
          <div className="ea-screen-header" style={{ background: '#FFFFFF', padding: '18px 20px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h1 style={{ color: COLORS.navy, fontSize: 24, lineHeight: 1.2, margin: 0, fontWeight: 700 }}>
                  Administración de usuarios
                </h1>
                <p style={{ color: COLORS.muted, fontSize: 13, margin: '6px 0 0', lineHeight: 1.5 }}>
                  Crea cuentas y asigna el rol correspondiente.
                </p>
              </div>
              <button type="button" onClick={() => { resetForm(); setFormOpen(true) }} style={primaryButton}>
                + Nueva cuenta
              </button>
            </div>
          </div>

          <div className="ea-screen-content no-scrollbar" style={{ padding: '18px 20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: 10, marginBottom: 18 }}>
              {(['administrador', 'docente', 'orientador', 'estudiante'] as UserRole[]).map((role) => (
                <div key={role} style={{ background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 13, padding: 13 }}>
                  <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 6px' }}>{ROLE_LABELS[role]}</p>
                  <p style={{ color: COLORS.navy, fontSize: 22, fontWeight: 700, margin: 0 }}>{roleCounts[role]}</p>
                </div>
              ))}
            </div>

            {notice && <div role="status" style={{ marginBottom: 14, borderRadius: 10, background: '#F0FDF4', color: '#166534', padding: 12, fontSize: 13 }}>{notice}</div>}
            {pageError && (
              <div role="alert" style={{ marginBottom: 14, borderRadius: 10, background: '#FEF2F2', color: '#991B1B', padding: 12, fontSize: 13 }}>
                <p style={{ margin: '0 0 10px' }}>{pageError}</p>
                <button type="button" style={secondaryButton} onClick={() => void loadData()}>Reintentar</button>
              </div>
            )}

            <label htmlFor="user-search" style={{ display: 'block', color: COLORS.navy, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>
              Buscar cuentas
            </label>
            <input id="user-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, correo o rol..." style={{ ...fieldStyle, marginBottom: 14 }} />

            {loading ? (
              <p role="status" style={{ padding: 22, textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>Cargando cuentas...</p>
            ) : filteredUsers.length === 0 ? (
              <div style={{ background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
                <p style={{ margin: '0 0 5px', color: COLORS.navy, fontSize: 14, fontWeight: 600 }}>No hay cuentas que coincidan</p>
                <p style={{ margin: 0, color: COLORS.muted, fontSize: 12 }}>Prueba otra búsqueda o crea una cuenta nueva.</p>
              </div>
            ) : filteredUsers.map((user) => (
              <article key={user.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'space-between', padding: 14, marginBottom: 9, borderRadius: 13, border: `1px solid ${COLORS.border}`, background: '#FFFFFF' }}>
                <div style={{ minWidth: 0, flex: '1 1 210px' }}>
                  <p style={{ margin: 0, color: COLORS.navy, fontWeight: 700, fontSize: 14, overflowWrap: 'anywhere' }}>{user.nombres} {user.apellidos}</p>
                  <p style={{ margin: '4px 0 0', color: COLORS.muted, fontSize: 12, overflowWrap: 'anywhere' }}>{user.correo}</p>
                  {user.estudianteId !== null && <p style={{ margin: '4px 0 0', color: COLORS.muted, fontSize: 11 }}>Ficha vinculada: #{user.estudianteId}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ borderRadius: 20, padding: '5px 9px', color: COLORS.blue, background: COLORS.lightBlue, fontSize: 11, fontWeight: 700 }}>{ROLE_LABELS[user.rol]}</span>
                  <span style={{ borderRadius: 20, padding: '5px 9px', color: user.estado === 'activo' ? '#166534' : '#64748B', background: user.estado === 'activo' ? '#F0FDF4' : '#F1F5F9', fontSize: 11, fontWeight: 700 }}>{user.estado}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        {formOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box', background: 'rgba(15,23,42,0.55)' }}>
            <section role="dialog" aria-modal="true" aria-labelledby="new-user-title" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box', background: '#FFFFFF', borderRadius: 18, padding: 22, boxShadow: '0 20px 60px rgba(15,23,42,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
                <div>
                  <h2 id="new-user-title" style={{ color: COLORS.navy, fontSize: 20, fontWeight: 700, margin: 0 }}>Crear cuenta</h2>
                  <p style={{ color: COLORS.muted, fontSize: 12, lineHeight: 1.5, margin: '6px 0 0' }}>El rol se asigna en el servidor y no podrá elegirse desde el login.</p>
                </div>
                <button type="button" onClick={closeForm} disabled={saving} aria-label="Cerrar formulario" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: COLORS.muted, fontSize: 24 }}>×</button>
              </div>

              {formError && <div role="alert" style={{ marginBottom: 14, borderRadius: 10, background: '#FEF2F2', color: '#991B1B', padding: 12, fontSize: 12, lineHeight: 1.5 }}>{formError}</div>}

              <form onSubmit={handleCreate} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div>
                  <label htmlFor="account-names" style={{ display: 'block', color: COLORS.navy, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Nombres *</label>
                  <input id="account-names" value={nombres} onChange={(event) => setNombres(event.target.value)} maxLength={100} autoComplete="given-name" required style={fieldStyle} />
                </div>
                <div>
                  <label htmlFor="account-surnames" style={{ display: 'block', color: COLORS.navy, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Apellidos *</label>
                  <input id="account-surnames" value={apellidos} onChange={(event) => setApellidos(event.target.value)} maxLength={100} autoComplete="family-name" required style={fieldStyle} />
                </div>
                <div>
                  <label htmlFor="account-email" style={{ display: 'block', color: COLORS.navy, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Correo electrónico *</label>
                  <input id="account-email" type="email" value={correo} onChange={(event) => setCorreo(event.target.value)} maxLength={254} autoComplete="email" required style={fieldStyle} />
                </div>
                <div>
                  <label htmlFor="account-password" style={{ display: 'block', color: COLORS.navy, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Contraseña inicial *</label>
                  <input id="account-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} maxLength={72} autoComplete="new-password" required style={fieldStyle} />
                  <p style={{ margin: '5px 0 0', color: COLORS.muted, fontSize: 11 }}>Entre 10 y 72 caracteres. Comunica la contraseña inicial por un canal seguro.</p>
                </div>
                <div>
                  <label htmlFor="account-role" style={{ display: 'block', color: COLORS.navy, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Rol *</label>
                  <select id="account-role" value={rol} onChange={(event) => { setRol(event.target.value as NewUserRole); setEstudianteId('') }} style={fieldStyle}>
                    <option value="docente">Docente</option>
                    <option value="orientador">Orientador</option>
                    <option value="estudiante">Estudiante</option>
                  </select>
                </div>

                {rol === 'estudiante' && (
                  <div>
                    <label htmlFor="account-student" style={{ display: 'block', color: COLORS.navy, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Ficha de estudiante activa *</label>
                    <select id="account-student" value={estudianteId} onChange={(event) => setEstudianteId(event.target.value)} required style={fieldStyle}>
                      <option value="">Selecciona una ficha sin cuenta vinculada</option>
                      {availableStudents.map((student) => (
                        <option key={student.id} value={student.id}>{student.codigoEstudiantil} · {student.nombres} {student.apellidos}</option>
                      ))}
                    </select>
                    {availableStudents.length === 0 && <p style={{ color: '#B91C1C', fontSize: 11, margin: '6px 0 0' }}>No hay fichas activas disponibles. Crea o activa una ficha sin cuenta vinculada antes de continuar.</p>}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', marginTop: 5 }}>
                  <button type="button" onClick={closeForm} disabled={saving} style={secondaryButton}>Cancelar</button>
                  <button type="submit" disabled={saving || (rol === 'estudiante' && availableStudents.length === 0)} style={{ ...primaryButton, minWidth: 135, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Creando cuenta...' : 'Crear cuenta'}</button>
                </div>
              </form>
            </section>
          </div>
        )}
      </PhoneFrame>
    </PhoneCenter>
  )
}

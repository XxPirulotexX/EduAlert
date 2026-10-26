import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react'

import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import { ApiClientError, apiRequest } from '../services/api-client.service'
import { studentsApiService, type ApiPage, type ApiStudent } from '../services/students-api.service'
import { getCurrentAuthUser } from '../services/auth.service'
import { COLORS, FONT } from '../theme'

type UserRole = 'administrador' | 'docente' | 'orientador' | 'estudiante'
type NewUserRole = Exclude<UserRole, 'administrador'>
type AccountStatus = 'activo' | 'inactivo'

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

type UpdateUserRequest = {
  nombres: string
  apellidos: string
  correo: string
  rol: NewUserRole
  estado: AccountStatus
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
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [estado, setEstado] = useState<AccountStatus>('activo')
  const authenticatedUser = getCurrentAuthUser()

  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<NewUserRole>('docente')
  const [estudianteId, setEstudianteId] = useState('')

  /** Recarga la página solicitada y el catálogo de fichas desde el backend autenticado. */
  const loadData = useCallback(async () => {
    setLoading(true)
    setPageError('')
    try {
      const params = new URLSearchParams({ pagina: String(currentPage), tamano: '10' })
      if (search.trim()) params.set('texto', search.trim())
      const [usersResult, studentsResult] = await Promise.all([
        apiRequest<ApiPage<ManagedUser>>(`/admin/usuarios?${params.toString()}`),
        studentsApiService.getAll(),
      ])
      setTotalPages(usersResult.totalPages)
      setTotalUsers(usersResult.totalElements)
      if (currentPage > 0 && currentPage >= usersResult.totalPages) {
        setCurrentPage(Math.max(0, usersResult.totalPages - 1))
      } else {
        setUsers(usersResult.content)
      }
      // El formulario filtra fichas activas/no vinculadas; en edición mantiene visible la ficha propia.
      setAvailableStudents(studentsResult)
    } catch (error) {
      setPageError(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [currentPage, search])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // No se vuelve a filtrar en memoria: la búsqueda ya fue aplicada por PostgreSQL.
  const filteredUsers = users
  const selectableStudents = availableStudents.filter((student) =>
    student.estado === 'activo' && (student.usuarioId === null || student.usuarioId === editingUser?.id),
  )

  const resetForm = () => {
    setNombres('')
    setApellidos('')
    setCorreo('')
    setPassword('')
    setRol('docente')
    setEstudianteId('')
    setEstado('activo')
    setEditingUser(null)
    setFormError('')
  }

  const closeForm = () => {
    if (saving) return
    setFormOpen(false)
    resetForm()
  }

  const startEdit = (user: ManagedUser) => {
    if (user.rol === 'administrador' || user.correo.toLowerCase() === authenticatedUser?.correo.toLowerCase()) return
    setEditingUser(user)
    setNombres(user.nombres)
    setApellidos(user.apellidos)
    setCorreo(user.correo)
    setPassword('')
    setRol(user.rol as NewUserRole)
    setEstado(user.estado === 'inactivo' ? 'inactivo' : 'activo')
    setEstudianteId(user.estudianteId === null ? '' : String(user.estudianteId))
    setFormError('')
    setNotice('')
    setFormOpen(true)
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setNotice('')

    // Validación temprana; el backend vuelve a validar todos los campos.
    if (!nombres.trim() || !apellidos.trim() || !correo.trim() || (!editingUser && !password)) {
      setFormError('Completa todos los campos obligatorios.')
      return
    }
    if (!editingUser && (password.length < 10 || password.length > 72)) {
      setFormError('La contraseña debe tener entre 10 y 72 caracteres.')
      return
    }
    if (rol === 'estudiante' && !estudianteId) {
      setFormError('Selecciona una ficha de estudiante activa disponible para vincular.')
      return
    }

    const common = {
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      correo: correo.trim().toLowerCase(),
      rol,
      estudianteId: rol === 'estudiante' ? Number(estudianteId) : null,
    }

    setSaving(true)
    try {
      if (editingUser) {
        const payload: UpdateUserRequest = { ...common, estado }
        const updated = await apiRequest<ManagedUser>(`/admin/usuarios/${editingUser.id}`, {
          method: 'PUT', body: JSON.stringify(payload),
        })
        setNotice(`La cuenta de ${updated.nombres} ${updated.apellidos} se actualizó correctamente.`)
      } else {
        const payload: CreateUserRequest = { ...common, password }
        const created = await apiRequest<ManagedUser>('/admin/usuarios', {
          method: 'POST', body: JSON.stringify(payload),
        })
        setNotice(`La cuenta de ${created.nombres} ${created.apellidos} se creó correctamente.`)
      }
      setFormOpen(false)
      resetForm()
      if (currentPage === 0) await loadData()
      else setCurrentPage(0)
      setAvailableStudents(await studentsApiService.getAll())
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

  const handleDeactivate = async (user: ManagedUser) => {
    if (user.rol === 'administrador' || user.correo.toLowerCase() === authenticatedUser?.correo.toLowerCase()) return
    if (user.estado === 'inactivo') return
    if (!window.confirm(`¿Desactivar la cuenta de ${user.nombres} ${user.apellidos}? Se conservará el historial y no podrá iniciar sesión.`)) return
    setPageError('')
    setNotice('')
    try {
      await apiRequest<void>(`/admin/usuarios/${user.id}`, { method: 'DELETE' })
      setNotice(`La cuenta de ${user.correo} quedó inactiva.`)
      await loadData()
    } catch (error) {
      setPageError(errorMessage(error))
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
                  Crea, edita y desactiva cuentas; los permisos se verifican en el servidor.
                </p>
              </div>
              <button type="button" onClick={() => { resetForm(); setEditingUser(null); setEstado('activo'); setFormOpen(true) }} style={primaryButton}>
                + Nueva cuenta
              </button>
            </div>
          </div>

          <div className="ea-screen-content no-scrollbar" style={{ padding: '18px 20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))', gap: 10, marginBottom: 18 }}>
              {(['administrador', 'docente', 'orientador', 'estudiante'] as UserRole[]).map((role) => (
                <div key={role} style={{ background: '#FFFFFF', border: `1px solid ${COLORS.border}`, borderRadius: 13, padding: 13 }}>
                  <p style={{ color: COLORS.muted, fontSize: 11, margin: '0 0 6px' }}>{ROLE_LABELS[role]} en página</p>
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
            <input id="user-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(0) }} placeholder="Nombre, correo o rol..." style={{ ...fieldStyle, marginBottom: 14 }} />

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
                  {user.rol !== 'administrador' && user.correo.toLowerCase() !== authenticatedUser?.correo.toLowerCase() && <>
                    <button type="button" onClick={() => startEdit(user)} style={secondaryButton}>Editar</button>
                    {user.estado === 'activo' && <button type="button" onClick={() => void handleDeactivate(user)} style={{ ...secondaryButton, color: COLORS.riskHigh }}>Desactivar</button>}
                  </>}
                </div>
              </article>
            ))}
            {!loading && !pageError && <div aria-label="Paginación de usuarios" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
              <span style={{ color: COLORS.muted, fontSize: 12 }}>Total: {totalUsers} cuentas · Página {totalPages === 0 ? 0 : currentPage + 1} de {totalPages}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" disabled={currentPage === 0 || loading} onClick={() => setCurrentPage((page) => Math.max(0, page - 1))} style={secondaryButton}>Anterior</button>
                <button type="button" disabled={totalPages === 0 || currentPage + 1 >= totalPages || loading} onClick={() => setCurrentPage((page) => page + 1)} style={secondaryButton}>Siguiente</button>
              </div>
            </div>}
          </div>
        </div>

        {formOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box', background: 'rgba(15,23,42,0.55)' }}>
            <section role="dialog" aria-modal="true" aria-labelledby="new-user-title" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box', background: '#FFFFFF', borderRadius: 18, padding: 22, boxShadow: '0 20px 60px rgba(15,23,42,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
                <div>
                  <h2 id="new-user-title" style={{ color: COLORS.navy, fontSize: 20, fontWeight: 700, margin: 0 }}>{editingUser ? `Editar cuenta #${editingUser.id}` : 'Crear cuenta'}</h2>
                  <p style={{ color: COLORS.muted, fontSize: 12, lineHeight: 1.5, margin: '6px 0 0' }}>El rol se asigna en el servidor y no podrá elegirse desde el login.</p>
                </div>
                <button type="button" onClick={closeForm} disabled={saving} aria-label="Cerrar formulario" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: COLORS.muted, fontSize: 24 }}>×</button>
              </div>

              {formError && <div role="alert" style={{ marginBottom: 14, borderRadius: 10, background: '#FEF2F2', color: '#991B1B', padding: 12, fontSize: 12, lineHeight: 1.5 }}>{formError}</div>}

              <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
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
                {!editingUser && <div>
                  <label htmlFor="account-password" style={{ display: 'block', color: COLORS.navy, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Contraseña inicial *</label>
                  <input id="account-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} maxLength={72} autoComplete="new-password" required style={fieldStyle} />
                  <p style={{ margin: '5px 0 0', color: COLORS.muted, fontSize: 11 }}>Entre 10 y 72 caracteres. Comunica la contraseña inicial por un canal seguro. La edición no cambia contraseñas.</p>
                </div>}
                <div>
                  <label htmlFor="account-role" style={{ display: 'block', color: COLORS.navy, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Rol *</label>
                  <select id="account-role" value={rol} onChange={(event) => { const nextRole = event.target.value as NewUserRole; setRol(nextRole); if (nextRole !== 'estudiante') setEstudianteId('') }} style={fieldStyle}>
                    <option value="docente">Docente</option>
                    <option value="orientador">Orientador</option>
                    <option value="estudiante">Estudiante</option>
                  </select>
                </div>

                {editingUser && <div>
                  <label htmlFor="account-state" style={{ display: 'block', color: COLORS.navy, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Estado de la cuenta *</label>
                  <select id="account-state" value={estado} onChange={(event) => setEstado(event.target.value as AccountStatus)} style={fieldStyle}>
                    <option value="activo">Activa</option>
                    <option value="inactivo">Inactiva</option>
                  </select>
                </div>}

                {rol === 'estudiante' && (
                  <div>
                    <label htmlFor="account-student" style={{ display: 'block', color: COLORS.navy, fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Ficha de estudiante activa *</label>
                    <select id="account-student" value={estudianteId} onChange={(event) => setEstudianteId(event.target.value)} required style={fieldStyle}>
                      <option value="">Selecciona una ficha activa sin otra cuenta</option>
                      {selectableStudents.map((student) => (
                        <option key={student.id} value={student.id}>{student.codigoEstudiantil} · {student.nombres} {student.apellidos}{student.usuarioId === editingUser?.id ? ' · vinculada a esta cuenta' : ''}</option>
                      ))}
                    </select>
                    {selectableStudents.length === 0 && <p style={{ color: '#B91C1C', fontSize: 11, margin: '6px 0 0' }}>No hay fichas activas disponibles. Crea o activa una ficha sin cuenta vinculada antes de continuar.</p>}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap', marginTop: 5 }}>
                  <button type="button" onClick={closeForm} disabled={saving} style={secondaryButton}>Cancelar</button>
                  <button type="submit" disabled={saving || (rol === 'estudiante' && selectableStudents.length === 0 && !estudianteId)} style={{ ...primaryButton, minWidth: 135, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Guardando...' : editingUser ? 'Guardar cambios' : 'Crear cuenta'}</button>
                </div>
              </form>
            </section>
          </div>
        )}
      </PhoneFrame>
    </PhoneCenter>
  )
}




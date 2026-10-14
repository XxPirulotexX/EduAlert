# EduAlerta — Integración del perfil con la sesión autenticada

Esta guía actualiza los datos visibles del perfil para que provengan de `getCurrentAuthUser()` y conecta el cierre de sesión con el servicio JWT. Integra estos cambios en el `Perfil.tsx` existente sin reemplazar su diseño ni borrar los iconos añadidos.

## 1. Imports

Agrega `useNavigate` y estos símbolos a los imports existentes (combina los imports duplicados en uno solo):

```tsx
import { Navigate, useNavigate } from 'react-router-dom'
import { getCurrentAuthUser, logout } from '../services/auth.service'
```

Conserva los imports de componentes e iconos que ya usa la pantalla, incluidos los iconos de perfil, edición, preferencias, ayuda y salida.

## 2. Datos de perfil

Dentro de `Perfil()`, reemplaza el uso del objeto fijo `USER` por el usuario de sesión:

```tsx
const navigate = useNavigate()
const user = getCurrentAuthUser()

// ProtectedRoute debería impedir llegar aquí sin sesión. Este fallback
// evita mostrar un perfil ficticio si la sesión no existe o expiró.
if (!user) return <Navigate to="/login" replace />

const roleLabels: Record<Role, string> = {
  administrador: 'Administrador',
  docente: 'Docente',
  orientador: 'Orientador escolar',
  estudiante: 'Estudiante',
}

const fullName = `${user.nombres} ${user.apellidos}`.trim()
const initials = `${user.nombres.trim().charAt(0)}${user.apellidos.trim().charAt(0)}`.toUpperCase() || 'EA'
const badge = ROLE_BADGE[user.rol]

// El cierre elimina el token y devuelve al login.
const handleLogout = () => {
  logout()
  navigate('/login', { replace: true })
}
```

Sustituye en el JSX estas expresiones:

- `USER.initials` → `initials`
- `USER.name` → `fullName`
- `USER.role` → `roleLabels[user.rol]`
- `USER.email` → `user.correo`
- `<BottomNav role="docente" />` → `<BottomNav role={user.rol} />`

Elimina el objeto fijo `USER` cuando ninguna otra parte lo utilice. No inventes institución ni otros datos que la API todavía no devuelva.

## 3. Entrada a administración de usuarios

En el lugar apropiado del perfil agrega un acceso visible solo al administrador:

```tsx
{user.rol === 'administrador' && (
  <button
    type="button"
    onClick={() => navigate('/app/admin/usuarios')}
    style={{
      width: '100%',
      marginBottom: 14,
      padding: '14px 16px',
      borderRadius: 12,
      border: '1px solid #BFDBFE',
      background: '#EFF6FF',
      color: '#1D4ED8',
      fontWeight: 600,
      textAlign: 'left',
      cursor: 'pointer',
    }}
  >
    Administración de usuarios →
  </button>
)}
```

La ruta debe continuar protegida en `App.tsx` y el backend debe seguir exigiendo rol administrador. Ocultar el botón no sustituye el control de acceso del servidor.

## 4. Botón de cierre de sesión

En el botón de cierre de sesión existente, añade `onClick={handleLogout}`. No crees un segundo botón ni elimines el icono que ya se agregó. Tras pulsarlo, el token debe desaparecer de la sesión y la navegación debe ir a `/login`.

## 5. Verificación

Desde la raíz del frontend:

```powershell
npm run build
npx tsc --noEmit
```

Luego inicia sesión como administrador, docente y estudiante. Verifica que el perfil muestra nombre, correo y rol procedentes de la cuenta autenticada; que el enlace administrativo solo aparece para el administrador; y que cerrar sesión impide volver a una ruta protegida mediante el botón Atrás.

No cambies ni declares funcionales las opciones de edición personal, preferencias o recuperación de contraseña mientras no existan sus endpoints y flujos reales.

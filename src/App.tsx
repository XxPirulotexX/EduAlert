import { Navigate, Route, Routes } from 'react-router-dom'

// Pantallas públicas.
import Splash from './screens/Splash'
import Login from './screens/Login'
import RecoverPassword from './screens/RecoverPassword'

// Pantallas del área de seguimiento académico.
import HomeDocente from './screens/HomeDocente'
import ListaEstudiantes from './screens/ListaEstudiantes'
import FichaEstudiante from './screens/FichaEstudiante'
import Alertas from './screens/Alertas'
import Analitica from './screens/Analitica'
import AdminUsuarios from './screens/AdminUsuarios'
import PrediccionRiesgo from './screens/PrediccionRiesgo'
import RegistroResultadosAcademicos from './screens/RegistroResultadosAcademicos'

// Pantallas del estudiante.
import HomeEstudiante from './screens/HomeEstudiante'
import OrientacionVocacional from './screens/OrientacionVocacional'
import TestVocacional from './screens/TestVocacional'
import ResultadosVocacionales from './screens/ResultadosVocacionales'

import Perfil from './screens/Perfil'
import ProtectedRoute from './components/ProtectedRoute'
import type { Role } from './types'

const STAFF_ROLES: Role[] = ['administrador', 'docente', 'orientador']
const EDITOR_ROLES: Role[] = ['administrador', 'docente']
const ALL_ROLES: Role[] = ['administrador', 'docente', 'orientador', 'estudiante']
const STUDENT_ROLES: Role[] = ['estudiante']
const ADMIN_ROLES: Role[] = ['administrador']

/** Las rutas privadas se protegen en React y sus datos en Spring Security. */
export default function App() {
  return (
    <Routes>
      {/* Acceso y recuperación de contraseña permanecen públicos. */}
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar" element={<RecoverPassword />} />

      {/* Área administrativa, docente y de orientación. */}
      <Route path="/app/home" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><HomeDocente /></ProtectedRoute>} />
      <Route path="/app/estudiantes" element={<ProtectedRoute allowedRoles={EDITOR_ROLES}><ListaEstudiantes /></ProtectedRoute>} />
      <Route path="/app/estudiantes/:id" element={<ProtectedRoute allowedRoles={EDITOR_ROLES}><FichaEstudiante /></ProtectedRoute>} />
      <Route path="/app/alertas" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><Alertas /></ProtectedRoute>} />
      <Route path="/app/analitica" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><Analitica /></ProtectedRoute>} />
      <Route path="/app/prediccion-riesgo" element={<ProtectedRoute allowedRoles={STAFF_ROLES}><PrediccionRiesgo /></ProtectedRoute>} />
      <Route path="/app/resultados-academicos" element={<ProtectedRoute allowedRoles={EDITOR_ROLES}><RegistroResultadosAcademicos /></ProtectedRoute>} />

      {/* La administración de cuentas es exclusiva del rol administrador. */}
      <Route path="/app/admin/usuarios" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminUsuarios /></ProtectedRoute>} />

      {/* El área vocacional solamente es accesible para cuentas estudiante. */}
      <Route path="/app/home-estudiante" element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><HomeEstudiante /></ProtectedRoute>} />
      <Route path="/app/orientacion" element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><OrientacionVocacional /></ProtectedRoute>} />
      <Route path="/app/orientacion/test" element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><TestVocacional /></ProtectedRoute>} />
      <Route path="/app/orientacion/resultados" element={<ProtectedRoute allowedRoles={STUDENT_ROLES}><ResultadosVocacionales /></ProtectedRoute>} />

      {/* Perfil necesita sesión y queda disponible para todos los roles. */}
      <Route path="/app/perfil" element={<ProtectedRoute allowedRoles={ALL_ROLES}><Perfil /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}




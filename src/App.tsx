
import { Navigate, Route, Routes } from 'react-router-dom'

// Pantallas de entrada y recuperación de acceso.
import Splash from './screens/Splash'
import Login from './screens/Login'
import RecoverPassword from './screens/RecoverPassword'

// Pantallas del área docente.
import HomeDocente from './screens/HomeDocente'
import ListaEstudiantes from './screens/ListaEstudiantes'
import FichaEstudiante from './screens/FichaEstudiante'
import Alertas from './screens/Alertas'
import Analitica from './screens/Analitica'

// Pantallas del área estudiante.
import HomeEstudiante from './screens/HomeEstudiante'
import OrientacionVocacional from './screens/OrientacionVocacional'
import TestVocacional from './screens/TestVocacional'
import ResultadosVocacionales from './screens/ResultadosVocacionales'

// Pantalla compartida de perfil.
import Perfil from './screens/Perfil'

export default function App() {
  return (
    <Routes>
      {/* Entrada y recuperación de acceso. */}
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar" element={<RecoverPassword />} />

      {/* Área docente. */}
      <Route path="/app/home" element={<HomeDocente />} />
      <Route path="/app/estudiantes" element={<ListaEstudiantes />} />
      <Route path="/app/estudiantes/:id" element={<FichaEstudiante />} />
      <Route path="/app/alertas" element={<Alertas />} />
      <Route path="/app/analitica" element={<Analitica />} />

      {/* Área estudiante: inicio y flujo vocacional. */}
      <Route
        path="/app/home-estudiante"
        element={<HomeEstudiante />}
      />
      <Route
        path="/app/orientacion"
        element={<OrientacionVocacional />}
      />
      <Route
        path="/app/orientacion/test"
        element={<TestVocacional />}
      />
      <Route
        path="/app/orientacion/resultados"
        element={<ResultadosVocacionales />}
      />

      {/* Pantalla compartida. */}
      <Route path="/app/perfil" element={<Perfil />} />

      {/* Cualquier ruta desconocida regresa a la pantalla inicial. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

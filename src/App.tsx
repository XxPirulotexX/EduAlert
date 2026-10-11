import { Navigate, Route, Routes } from 'react-router-dom'

import Splash from './screens/Splash'
import Login from './screens/Login'
import RecoverPassword from './screens/RecoverPassword'
import HomeDocente from './screens/HomeDocente'
import ListaEstudiantes from './screens/ListaEstudiantes'
import FichaEstudiante from './screens/FichaEstudiante'
import Alertas from './screens/Alertas'
import Analitica from './screens/Analitica'
import OrientacionVocacional from './screens/OrientacionVocacional'
import TestVocacional from './screens/TestVocacional'
import ResultadosVocacionales from './screens/ResultadosVocacionales'
import Perfil from './screens/Perfil'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar" element={<RecoverPassword />} />
      <Route path="/app/home" element={<HomeDocente />} />
      <Route path="/app/estudiantes" element={<ListaEstudiantes />} />
      <Route path="/app/estudiantes/:id" element={<FichaEstudiante />} />
      <Route path="/app/alertas" element={<Alertas />} />
      <Route path="/app/analitica" element={<Analitica />} />
      <Route path="/app/orientacion" element={<OrientacionVocacional />} />
      <Route path="/app/orientacion/test" element={<TestVocacional />} />
      <Route path="/app/orientacion/resultados" element={<ResultadosVocacionales />} />
      <Route path="/app/perfil" element={<Perfil />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
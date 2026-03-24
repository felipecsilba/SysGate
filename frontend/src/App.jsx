import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Municipios from './pages/Municipios'
import Sistemas from './pages/Sistemas'
import Sandbox from './pages/ClienteAPI'
import EnvioLote from './pages/EnvioLote'
import Scripts from './pages/Scripts'
import Historico from './pages/Historico'
import Usuarios from './pages/Usuarios'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login />} />

        {/* Rotas protegidas */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="municipios" element={<Municipios />} />
            <Route path="sistemas" element={<Sistemas />} />
            <Route path="sandbox" element={<Sandbox />} />
            <Route path="envio-lote" element={<EnvioLote />} />
            <Route path="scripts" element={<Scripts />} />
            <Route path="historico" element={<Historico />} />

            {/* Usuários: admin vê todos; não-admin vê só o próprio perfil */}
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

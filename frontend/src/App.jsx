import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Municipios from './pages/Municipios'
import Sistemas from './pages/Sistemas'
import ClienteAPI from './pages/ClienteAPI'
import EnvioLote from './pages/EnvioLote'
import Scripts from './pages/Scripts'
import Historico from './pages/Historico'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="municipios" element={<Municipios />} />
          <Route path="sistemas" element={<Sistemas />} />
          <Route path="cliente-api" element={<ClienteAPI />} />
          <Route path="envio-lote" element={<EnvioLote />} />
          <Route path="scripts" element={<Scripts />} />
          <Route path="historico" element={<Historico />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

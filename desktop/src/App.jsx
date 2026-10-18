import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AvisoVersao from './components/AvisoVersao'
import Layout from './components/Layout'
import Login from './pages/Login'
import EmConstrucao from './pages/EmConstrucao'
import CentralTokens from './pages/CentralTokens'
import ImportarDados from './pages/ImportarDados'
import Sistemas from './pages/Sistemas'
import Sandbox from './pages/Sandbox'
import BethaAdmin from './pages/BethaAdmin'
import { MODULOS } from './modulos'
import { useAuthStore } from './stores/authStore'

// Módulos já redesenhados; o resto mostra "Em construção"
const PAGINAS = {
  api: Sandbox,
  sistemas: Sistemas,
  tokens: CentralTokens,
  'betha-admin': BethaAdmin,
  importar: ImportarDados,
}

export default function App() {
  const logado = useAuthStore(s => !!s.token)

  return (
    <HashRouter>
      <AvisoVersao />
      <Routes>
        {logado ? (
          <Route element={<Layout />}>
            {MODULOS.map(m => {
              const Pagina = PAGINAS[m.id]
              return <Route key={m.id} path={m.rota} element={Pagina ? <Pagina /> : <EmConstrucao modulo={m} />} />
            })}
            <Route path="/sandbox" element={<Navigate to="/api" replace />} />
            <Route path="*" element={<Navigate to={MODULOS[0].rota} replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Login />} />
        )}
      </Routes>
    </HashRouter>
  )
}

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import PortalRoute from './components/PortalRoute'
import Login from './pages/Login'

// Carregamento lazy: cada página vira chunk separado no build
const Dashboard      = lazy(() => import('./pages/Dashboard'))
const Municipios     = lazy(() => import('./pages/Municipios'))
const Sistemas       = lazy(() => import('./pages/Sistemas'))
const Sandbox        = lazy(() => import('./pages/Sandbox'))
const Scripts        = lazy(() => import('./pages/Scripts'))
const Historico      = lazy(() => import('./pages/Historico'))
const Usuarios       = lazy(() => import('./pages/Usuarios'))
const Portfolio      = lazy(() => import('./pages/Portfolio'))
const Chamados       = lazy(() => import('./pages/Chamados'))
const AnalisadorJson = lazy(() => import('./pages/AnalisadorJson'))
const Notas          = lazy(() => import('./pages/Notas'))
const MeuPerfil      = lazy(() => import('./pages/MeuPerfil'))
const RedefinirSenha = lazy(() => import('./pages/RedefinirSenha'))
const Conhecimento   = lazy(() => import('./pages/Conhecimento'))

// Portal externo (solicitantes) — trilho separado com store krakion-portal-auth
const PortalLogin          = lazy(() => import('./pages/Portal/Login'))
const PortalRegistro       = lazy(() => import('./pages/Portal/Registro'))
const PortalRedefinirSenha = lazy(() => import('./pages/Portal/RedefinirSenha'))
const PortalLayout         = lazy(() => import('./pages/Portal/Layout'))
const MeusChamados         = lazy(() => import('./pages/Portal/MeusChamados'))
const NovoChamado          = lazy(() => import('./pages/Portal/NovoChamado'))
const DetalheChamado       = lazy(() => import('./pages/Portal/DetalheChamado'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-sysgate-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/redefinir-senha" element={
          <Suspense fallback={<PageLoader />}><RedefinirSenha /></Suspense>
        } />

        {/* Portal externo — rotas públicas */}
        <Route path="/portal/login" element={
          <Suspense fallback={<PageLoader />}><PortalLogin /></Suspense>
        } />
        <Route path="/portal/registro" element={
          <Suspense fallback={<PageLoader />}><PortalRegistro /></Suspense>
        } />
        <Route path="/portal/redefinir-senha" element={
          <Suspense fallback={<PageLoader />}><PortalRedefinirSenha /></Suspense>
        } />

        {/* Portal externo — rotas protegidas (sessão do solicitante) */}
        <Route element={<PortalRoute />}>
          <Route path="/portal" element={
            <Suspense fallback={<PageLoader />}><PortalLayout /></Suspense>
          }>
            <Route index element={
              <Suspense fallback={<PageLoader />}><MeusChamados /></Suspense>
            } />
            <Route path="novo" element={
              <Suspense fallback={<PageLoader />}><NovoChamado /></Suspense>
            } />
            <Route path="chamados/:id" element={
              <Suspense fallback={<PageLoader />}><DetalheChamado /></Suspense>
            } />
          </Route>
        </Route>

        {/* Rotas protegidas */}
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={
              <Suspense fallback={<PageLoader />}><Dashboard /></Suspense>
            } />
            <Route path="municipios" element={
              <Suspense fallback={<PageLoader />}><Municipios /></Suspense>
            } />
            <Route path="sistemas" element={
              <Suspense fallback={<PageLoader />}><Sistemas /></Suspense>
            } />
            <Route path="sandbox" element={
              <Suspense fallback={<PageLoader />}><Sandbox /></Suspense>
            } />
            <Route path="scripts" element={
              <Suspense fallback={<PageLoader />}><Scripts /></Suspense>
            } />
            <Route path="historico" element={
              <Suspense fallback={<PageLoader />}><Historico /></Suspense>
            } />
            <Route path="portfolio" element={
              <Suspense fallback={<PageLoader />}><Portfolio /></Suspense>
            } />
            <Route path="chamados" element={
              <Suspense fallback={<PageLoader />}><Chamados /></Suspense>
            } />
            <Route path="analisador-json" element={
              <Suspense fallback={<PageLoader />}><AnalisadorJson /></Suspense>
            } />
            <Route path="notas" element={
              <Suspense fallback={<PageLoader />}><Notas /></Suspense>
            } />
            <Route path="conhecimento" element={
              <Suspense fallback={<PageLoader />}><Conhecimento /></Suspense>
            } />
            {/* Usuários: admin vê todos; não-admin é redirecionado para /perfil */}
            <Route path="usuarios" element={
              <Suspense fallback={<PageLoader />}><Usuarios /></Suspense>
            } />
            {/* Meu Perfil: acessível por todos os usuários */}
            <Route path="perfil" element={
              <Suspense fallback={<PageLoader />}><MeuPerfil /></Suspense>
            } />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

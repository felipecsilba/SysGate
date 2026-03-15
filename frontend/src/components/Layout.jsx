import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import MunicipioBadge from './MunicipioBadge'
import useMunicipioStore from '../stores/municipioStore'

export default function Layout() {
  const carregarMunicipios = useMunicipioStore((s) => s.carregarMunicipios)

  useEffect(() => {
    carregarMunicipios()
  }, [carregarMunicipios])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar fixa */}
      <Sidebar />

      {/* Área principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">SysGate</span>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-semibold text-gray-900">Toolkit Implantador</span>
          </div>
          <MunicipioBadge />
        </header>

        {/* Conteúdo scrollável */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

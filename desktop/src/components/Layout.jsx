import { Outlet, useLocation } from 'react-router-dom'
import Rail from './Rail'
import PainelLista from './PainelLista'
import LimiteErro from './LimiteErro'
import { grupoDaRota } from '../modulos'

export default function Layout() {
  const { pathname } = useLocation()
  return (
    <div className="flex h-full overflow-hidden">
      <Rail />
      {!grupoDaRota(pathname).direto && <PainelLista />}
      <main className="flex min-w-0 flex-1 flex-col bg-fundo">
        <LimiteErro key={pathname}>
          <Outlet />
        </LimiteErro>
      </main>
    </div>
  )
}

import { NavLink, useLocation } from 'react-router-dom'
import Icone from './Icone'
import { grupoDaRota } from '../modulos'

export default function PainelLista() {
  const { pathname } = useLocation()
  const grupo = grupoDaRota(pathname)

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-borda bg-fundo">
      <header className="arrastar flex h-14 shrink-0 items-center px-5">
        <h1 className="text-[17px] font-semibold tracking-tight">{grupo.titulo}</h1>
      </header>

      <ul className="flex flex-col">
        {grupo.itens.map(item => (
          <li key={item.id}>
            <NavLink
              to={`/${item.id}`}
              className={({ isActive }) =>
                `flex h-9 items-center gap-3 px-5 text-sm transition ${
                  isActive
                    ? 'bg-texto/[0.06] font-semibold text-texto'
                    : 'text-texto/80 hover:bg-texto/[0.03] hover:text-texto'
                }`
              }
            >
              <Icone nome={item.icone} className="h-[18px] w-[18px] shrink-0 text-suave" />
              <span className="truncate">{item.rotulo}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="flex-1" />
      <footer className="flex items-center gap-2 px-5 py-4 text-xs text-suave">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Local · offline
      </footer>
    </aside>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icone from '../../components/Icone'
import Pagina from '../../components/Pagina'
import { CONEXOES, buscarConexoes } from '../../lib/conexoes'
import LogoConexao from './LogoConexao'
import { chamar, drive } from './comum'

// Lista de conexões: busca + uma linha por serviço. "Conectar" abre a tela de configuração do serviço.
export default function Lista() {
  const navegar = useNavigate()
  const [termo, setTermo] = useState('')
  const [statusDrive, setStatusDrive] = useState(null)

  useEffect(() => { if (drive) chamar(drive.status).then(setStatusDrive).catch(() => {}) }, [])

  const conectado = id => id === 'google-drive' && statusDrive?.conectado
  const itens = buscarConexoes(termo)
  const disponiveis = CONEXOES.filter(c => c.disponivel).length

  return (
    <Pagina titulo="Conexões" icone="conexoes">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h3 className="text-2xl font-semibold tracking-tight">Conexões</h3>
          <p className="mt-1 text-sm text-suave">O Krakion App acessa serviços externos pelas suas conexões. As credenciais ficam cifradas pelo Windows nesta máquina.</p>

          <label className="mt-6 flex items-center gap-2.5 rounded-xl border border-borda bg-fundo px-3.5 py-2.5 focus-within:border-acento">
            <Icone nome="buscar" className="h-4 w-4 text-suave" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-suave"
              placeholder="Buscar uma conexão" value={termo} onChange={e => setTermo(e.target.value)}
            />
            <span className="shrink-0 text-xs text-suave">{disponiveis} disponível{disponiveis === 1 ? '' : 'is'}</span>
          </label>

          <ul className="mt-5 overflow-hidden rounded-xl border border-borda">
            {itens.map(c => (
              <li key={c.id} className="border-b border-borda last:border-b-0">
                <div
                  role={c.disponivel ? 'button' : undefined}
                  tabIndex={c.disponivel ? 0 : undefined}
                  onClick={c.disponivel ? () => navegar(`/conexoes/${c.id}`) : undefined}
                  onKeyDown={c.disponivel ? e => { if (e.key === 'Enter') navegar(`/conexoes/${c.id}`) } : undefined}
                  className={`flex items-center gap-4 px-4 py-3.5 ${c.disponivel ? 'cursor-pointer hover:bg-texto/[0.03]' : 'opacity-60'}`}
                >
                  <LogoConexao id={c.id} nome={c.nome} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{c.nome}</span>
                      {conectado(c.id) && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Conectado
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-suave">{c.descricao}</p>
                  </div>
                  {!c.disponivel ? (
                    <span className="shrink-0 text-xs text-suave">Em breve</span>
                  ) : (
                    <span className="shrink-0 text-sm font-medium text-texto">{conectado(c.id) ? 'Gerenciar' : 'Conectar'}</span>
                  )}
                </div>
              </li>
            ))}
            {itens.length === 0 && <li className="px-4 py-8 text-center text-sm text-suave">Nenhuma conexão encontrada.</li>}
          </ul>
        </div>
      </div>
    </Pagina>
  )
}

import { useMemo, useState } from 'react'
import Abas from '../../components/Abas'
import BotaoIcone from '../../components/BotaoIcone'
import Busca from '../../components/Busca'
import Icone from '../../components/Icone'
import MetodoBadge from '../../components/MetodoBadge'
import { agruparPorModulo, avisoUrlBase } from '../../lib/endpoints'

function Numero({ valor, rotulo }) {
  return (
    <div className="rounded-xl bg-texto/[0.04] px-4 py-3">
      <div className="text-xl font-semibold tabular-nums">{valor}</div>
      <div className="text-xs text-suave">{rotulo}</div>
    </div>
  )
}

function VisaoGeral({ sistema, endpoints }) {
  const aviso = avisoUrlBase(sistema.urlBase)
  const porMetodo = useMemo(() => {
    const c = {}
    for (const e of endpoints) c[e.metodo] = (c[e.metodo] || 0) + 1
    return c
  }, [endpoints])

  return (
    <div className="space-y-6 px-8 py-6">
      {aviso && <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">{aviso}</p>}
      <div>
        <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-suave">Descrição</h4>
        <p className="whitespace-pre-line text-sm">{sistema.descricao || <span className="text-suave">Sem descrição.</span>}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Numero valor={endpoints.length} rotulo="endpoints" />
        <Numero valor={sistema._count?.swaggerSpecs ?? 0} rotulo="specs importadas" />
        <Numero valor={porMetodo.POST || 0} rotulo="POST (cadastros)" />
        <Numero valor={porMetodo.GET || 0} rotulo="GET (consultas)" />
      </div>
    </div>
  )
}

function AbaEndpoints({ endpoints, onEditar, onExcluir }) {
  const [busca, setBusca] = useState('')
  const grupos = useMemo(() => agruparPorModulo(endpoints, busca), [endpoints, busca])

  if (!endpoints.length) {
    return (
      <div className="m-8 rounded-xl border border-dashed border-borda px-4 py-10 text-center text-sm text-suave">
        Nenhum endpoint ainda — use <span className="font-medium text-texto">Importar Swagger</span>.
      </div>
    )
  }

  return (
    <div className="px-8 py-5">
      <Busca valor={busca} onMudar={setBusca} placeholder="Buscar por módulo, nome, path ou método…" className="mb-4" />
      {grupos.map(g => (
        <section key={g.modulo} className="mb-5">
          <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-suave">
            {g.modulo} <span className="font-normal normal-case tracking-normal">· {g.itens.length}</span>
          </h4>
          <ul className="overflow-hidden rounded-xl border border-borda">
            {g.itens.map(ep => (
              <li key={ep.id} className="group flex items-center gap-3 border-b border-borda px-3 py-2 last:border-b-0 hover:bg-texto/[0.02]">
                <MetodoBadge metodo={ep.metodo} />
                <code className="min-w-0 flex-1 truncate font-mono text-xs">{ep.path}</code>
                <span className="hidden max-w-[40%] truncate text-xs text-suave lg:block">{ep.nome}</span>
                <div className="flex opacity-0 transition group-hover:opacity-100">
                  <BotaoIcone titulo="Editar endpoint" icone="editar" onClick={() => onEditar(ep)} />
                  <BotaoIcone titulo="Excluir endpoint" icone="lixeira" perigo onClick={() => onExcluir(ep)} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!grupos.length && <p className="py-6 text-center text-sm text-suave">Nada encontrado para “{busca}”.</p>}
    </div>
  )
}

function AbaSpecs({ specs, onRemover }) {
  if (!specs.length) {
    return <div className="m-8 rounded-xl border border-dashed border-borda px-4 py-10 text-center text-sm text-suave">Nenhuma spec importada neste sistema.</div>
  }
  return (
    <ul className="space-y-2 px-8 py-5">
      {specs.map(s => (
        <li key={s.id} className="flex items-center gap-4 rounded-xl border border-borda px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{s.nome}</div>
            <div className="mt-0.5 truncate text-xs text-suave">
              {s.totalEndpoints} endpoints · OpenAPI {s.versao} · {new Date(s.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
              {s.urlBase && <> · <span className="font-mono">{s.urlBase}</span></>}
            </div>
          </div>
          <BotaoIcone titulo="Remover do histórico (os endpoints ficam)" icone="lixeira" perigo onClick={() => onRemover(s)} />
        </li>
      ))}
    </ul>
  )
}

export default function DetalheSistema({ sistema, endpoints, aba, onAba, onImportar, onEditar, onExcluir, onEditarEndpoint, onExcluirEndpoint, onRemoverSpec }) {
  const specs = sistema.swaggerSpecs ?? []
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="px-8 pb-4 pt-7">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xl font-semibold tracking-tight">{sistema.nome}</h3>
            <p className="mt-1 truncate font-mono text-xs text-suave" title={sistema.urlBase}>{sistema.urlBase}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" className="botao-primario mr-1 h-8 px-3 text-xs" onClick={onImportar}>
              <Icone nome="importar" className="h-3.5 w-3.5" /> Importar Swagger
            </button>
            <BotaoIcone titulo="Editar sistema" icone="editar" onClick={onEditar} />
            <BotaoIcone titulo="Excluir sistema" icone="lixeira" perigo onClick={onExcluir} />
          </div>
        </div>
        <Abas
          className="mt-5"
          atual={aba}
          onMudar={onAba}
          abas={[
            { id: 'geral', rotulo: 'Visão geral' },
            { id: 'endpoints', rotulo: 'Endpoints', contador: endpoints.length },
            { id: 'specs', rotulo: 'Specs', contador: specs.length },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-borda">
        {aba === 'geral' && <VisaoGeral sistema={sistema} endpoints={endpoints} />}
        {aba === 'endpoints' && <AbaEndpoints endpoints={endpoints} onEditar={onEditarEndpoint} onExcluir={onExcluirEndpoint} />}
        {aba === 'specs' && <AbaSpecs specs={specs} onRemover={onRemoverSpec} />}
      </div>
    </div>
  )
}

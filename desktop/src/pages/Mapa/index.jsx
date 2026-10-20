import { useEffect, useRef, useState } from 'react'
import BotaoIcone from '../../components/BotaoIcone'
import CaixaBusca from '../../components/CaixaBusca'
import Icone from '../../components/Icone'
import Pagina from '../../components/Pagina'
import { CATEGORIAS, agruparPorCategoria } from '../../lib/mapa'
import PainelNo from './PainelNo'

const mapa = window.krakion?.mapa

async function chamar(fn, ...args) {
  const r = await fn(...args)
  if (!r?.ok) throw new Error(r?.erro || 'Falha inesperada.')
  return r.dados
}

// Mapa de dependências: entidade → dependentes diretos → (clicando) dependentes do dependente, em colunas.
// A exclusão segue da coluna mais à direita para a entidade.
export default function Mapa() {
  const [entidades, setEntidades] = useState([])
  const [entidade, setEntidade] = useState(null)
  const [colunas, setColunas] = useState([]) // [{ pai, info, dependentes }]
  const [selecionados, setSelecionados] = useState([]) // recurso escolhido em cada coluna
  const [detalhe, setDetalhe] = useState(null) // nó mostrado no painel
  const [categorias, setCategorias] = useState(new Set(['cadastro', 'financeiro', 'documentos', 'outros']))
  const [soConfirmados, setSoConfirmados] = useState(false)
  const [erro, setErro] = useState('')
  const cache = useRef(new Map())

  const carregarDependentes = async recurso => {
    if (!cache.current.has(recurso)) cache.current.set(recurso, await chamar(mapa.dependentes, recurso))
    return cache.current.get(recurso)
  }

  async function carregarEntidades() {
    try {
      const lista = await chamar(mapa.entidades)
      setEntidades(lista)
      setEntidade(atual => atual || (lista.find(e => e.recurso === 'imoveis') || lista[0])?.recurso || null)
      setErro('')
    } catch (e) {
      setErro(e.message)
    }
  }
  useEffect(() => { if (mapa) carregarEntidades() }, [])

  useEffect(() => {
    if (!entidade) return
    carregarDependentes(entidade)
      .then(d => { setColunas([{ pai: entidade, ...d }]); setSelecionados([]); setDetalhe(d.info) })
      .catch(e => setErro(e.message))
  }, [entidade])

  async function escolher(indice, no) {
    setDetalhe(no)
    const novos = [...selecionados.slice(0, indice), no.recurso]
    setSelecionados(novos)
    const base = colunas.slice(0, indice + 1)
    if (no.qtdDependentes > 0) {
      try { base.push({ pai: no.recurso, ...(await carregarDependentes(no.recurso)) }) } catch (e) { setErro(e.message) }
    }
    setColunas(base)
  }

  async function recarregar() {
    cache.current.clear()
    try {
      await chamar(mapa.recarregar)
      await carregarEntidades()
      if (entidade) {
        const d = await carregarDependentes(entidade)
        setColunas([{ pai: entidade, ...d }]); setSelecionados([]); setDetalhe(d.info)
      }
    } catch (e) { setErro(e.message) }
  }

  const alternarCategoria = c => setCategorias(atual => {
    const novo = new Set(atual)
    if (novo.has(c)) novo.delete(c); else novo.add(c)
    return novo
  })

  const rotuloDe = recurso => {
    for (const col of colunas) {
      if (col.info?.recurso === recurso) return col.info.rotulo
      const n = col.dependentes.find(d => d.recurso === recurso)
      if (n) return n.rotulo
    }
    return recurso
  }

  if (!mapa) return <Pagina titulo="Mapa de dependências" icone="mapa"><p className="p-6 text-sm text-suave">Disponível só no Krakion App.</p></Pagina>

  return (
    <Pagina titulo="Mapa de dependências" icone="mapa" acoes={<BotaoIcone titulo="Recarregar (relê Swagger, catálogo e dependencias_confirmadas.json)" icone="atualizar" onClick={recarregar} />}>
      <div className="flex flex-wrap items-center gap-3 border-b border-borda px-4 py-3">
        <div className="w-72">
          <CaixaBusca
            opcoes={entidades.map(e => ({ valor: e.recurso, rotulo: `${e.rotulo} · ${e.qtdDependentes} dep.${e.modulo ? ` — ${e.modulo}` : ''}` }))}
            valor={entidade} onEscolher={setEntidade} placeholder="Entidade"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {CATEGORIAS.filter(c => c.categoria !== 'outros').map(c => (
            <button key={c.categoria} type="button" onClick={() => alternarCategoria(c.categoria)}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${categorias.has(c.categoria) ? 'border-acento/40 bg-acento/10 text-texto' : 'border-borda text-suave hover:text-texto'}`}>
              {c.rotulo}
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-suave">
          <input type="checkbox" checked={soConfirmados} onChange={e => setSoConfirmados(e.target.checked)} /> Só confirmados
        </label>
        <div className="flex-1" />
        <Legenda />
      </div>

      {erro && <p className="mx-4 mt-3 rounded-lg bg-perigo/10 px-3 py-2 text-sm text-perigo">{erro}</p>}

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto p-4">
          {colunas.length > 0 && (
            <div className="w-52 shrink-0">
              <TituloColuna>Entidade</TituloColuna>
              <button type="button" onClick={() => { setDetalhe(colunas[0].info); setSelecionados([]); setColunas(colunas.slice(0, 1)) }}
                className={`w-full rounded-xl border-2 px-3 py-3 text-left transition ${!selecionados.length ? 'border-acento bg-acento/5' : 'border-borda hover:border-acento/40'}`}>
                <div className="text-sm font-semibold">{colunas[0].info.rotulo}</div>
                <div className="font-mono text-[11px] text-suave">{colunas[0].info.recurso}</div>
                <div className="mt-2 text-xs text-suave">{colunas[0].dependentes.length} dependentes diretos</div>
              </button>
              <p className="mt-3 text-[11px] leading-relaxed text-suave">Exclusão: da coluna mais à direita para a entidade.</p>
            </div>
          )}
          {colunas.map((col, i) => (
            <Coluna key={`${col.pai}-${i}`} titulo={i === 0 ? 'Dependentes diretos' : `Dependem de ${col.info.rotulo}`}
              grupos={agruparPorCategoria(col.dependentes, { categorias, soConfirmados })}
              total={col.dependentes.length} selecionado={selecionados[i]} onEscolher={no => escolher(i, no)} />
          ))}
        </div>
        <aside className="w-[420px] shrink-0 overflow-y-auto border-l border-borda">
          {detalhe ? <PainelNo no={detalhe} rotuloDe={rotuloDe} paiRotulo={paiDe(colunas, detalhe)} /> : null}
        </aside>
      </div>
    </Pagina>
  )
}

// Rótulo da coluna-pai do nó mostrado (para "liga por idImovel → Imóvel")
function paiDe(colunas, no) {
  const col = colunas.find(c => c.dependentes.some(d => d.recurso === no.recurso && d.campo === no.campo))
  return col?.info?.rotulo || null
}

function TituloColuna({ children }) {
  return <h4 className="mb-2 truncate text-[11px] font-semibold uppercase tracking-wider text-suave">{children}</h4>
}

function Coluna({ titulo, grupos, total, selecionado, onEscolher }) {
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <TituloColuna>{titulo} · {total}</TituloColuna>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {grupos.length === 0 && <p className="text-xs text-suave">Nada com os filtros atuais.</p>}
        {grupos.map(g => (
          <div key={g.categoria}>
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-suave">
              {g.categoria === 'financeiro' && <Icone nome="alerta" className="h-3 w-3 text-amber-500" />}
              {g.rotulo} <span className="text-suave/70">{g.nos.length}</span>
            </div>
            <div className="space-y-1">
              {g.nos.map(no => <CartaoNo key={`${no.recurso}-${no.campo}`} no={no} ativo={selecionado === no.recurso} onClick={() => onEscolher(no)} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CartaoNo({ no, ativo, onClick }) {
  const confirmado = no.status === 'confirmado'
  return (
    <button type="button" onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${confirmado ? 'border' : 'border border-dashed'} ${ativo ? 'border-acento bg-acento/5' : 'border-borda hover:border-acento/40 hover:bg-texto/[0.02]'}`}>
      <span className="w-4 shrink-0 text-center text-xs">{simbolo(no)}</span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[13px] ${confirmado ? 'font-medium' : ''}`}>{no.rotulo}</span>
        <span className="block truncate font-mono text-[10px] text-suave">{no.campo ? `via ${no.campo}` : no.recurso}</span>
      </span>
      {no.qtdDependentes > 0 && <span className="shrink-0 rounded-md bg-texto/[0.06] px-1.5 py-0.5 text-[10px] text-suave">{no.qtdDependentes} ▸</span>}
    </button>
  )
}

function simbolo(no) {
  if (no.acao === 'reprocessar') return <span title="Derivado: reprocessar">⟳</span>
  if (no.acao === 'saiJunto') return <span title="Sai junto com outro">↳</span>
  if (no.status === 'confirmado') return <span className="text-emerald-500" title="Confirmado na prática">✓</span>
  if (!no.temDelete) return <span className="text-suave" title="Sem DELETE na API">–</span>
  return <span className="text-suave/60" title="Inferido">·</span>
}

function Legenda() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-suave">
      <span><span className="text-emerald-500">✓</span> confirmado</span>
      <span className="rounded border border-dashed border-borda px-1">inferido</span>
      <span>⟳ derivado</span>
      <span>↳ sai junto</span>
      <span>– sem DELETE</span>
    </div>
  )
}

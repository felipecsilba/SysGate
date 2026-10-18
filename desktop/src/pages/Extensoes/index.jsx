import { useEffect, useMemo, useState } from 'react'
import Pagina from '../../components/Pagina'
import Abas from '../../components/Abas'
import Busca from '../../components/Busca'
import CaixaBusca from '../../components/CaixaBusca'
import Icone from '../../components/Icone'
import { TIPOS, contar, filtrarItens, grupos as listarGrupos, municipios as listarMunicipios } from '../../lib/biblioteca'
import Visualizador from './Visualizador'

// Biblioteca de extensões: scripts, fórmulas e relatórios lidos da pasta local (somente leitura).
// O índice (só nomes) vem do Electron; o conteúdo é lido quando o item é aberto.
const TODOS = ''
const POR_VEZ = 300
const ROTULO_GRUPO = { Criticas: 'Críticas', 'Fontes Dinamicas': 'Fontes dinâmicas', 'Contribuicao de Melhorias': 'Contribuição de Melhorias', 'Divida Ativa': 'Dívida Ativa', 'Debitos Gerais': 'Débitos Gerais', 'Convenios Bancarios': 'Convênios Bancários', 'ISS - Economicos': 'ISS - Econômicos', 'Imoveis - IPTU': 'Imóveis - IPTU' }
const rotuloGrupo = g => ROTULO_GRUPO[g] || g

// Filtros sobrevivem à troca de módulo enquanto o app está aberto
const lembrado = { tipo: 'script', grupo: TODOS, municipio: TODOS, busca: '', selecionado: null }

export default function Extensoes() {
  const ponte = window.krakion?.biblioteca
  const [indice, setIndice] = useState(null)
  const [tipo, setTipoEstado] = useState(lembrado.tipo)
  const [grupo, setGrupo] = useState(lembrado.grupo)
  const [municipio, setMunicipio] = useState(lembrado.municipio)
  const [busca, setBusca] = useState(lembrado.busca)
  const [selecionado, setSelecionado] = useState(lembrado.selecionado)
  const [conteudo, setConteudo] = useState(null)
  const [erroItem, setErroItem] = useState('')
  const [limite, setLimite] = useState(POR_VEZ)
  const [conteudoBusca, setConteudoBusca] = useState(null) // { termo, achados, buscando, cortado }

  useEffect(() => { Object.assign(lembrado, { tipo, grupo, municipio, busca, selecionado }) }, [tipo, grupo, municipio, busca, selecionado])
  useEffect(() => { ponte?.indice().then(setIndice) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function setTipo(t) {
    setTipoEstado(t); setGrupo(TODOS); setMunicipio(TODOS); setConteudoBusca(null); setLimite(POR_VEZ)
  }

  const itens = indice?.itens || []
  const contagem = useMemo(() => contar(itens), [itens])
  const grupos = useMemo(() => listarGrupos(itens, tipo), [itens, tipo])
  const municipios = useMemo(() => listarMunicipios(itens, tipo), [itens, tipo])
  const filtrados = useMemo(
    () => filtrarItens(itens, { tipo, grupo: grupo || null, municipio: municipio || null, busca: conteudoBusca ? '' : busca }),
    [itens, tipo, grupo, municipio, busca, conteudoBusca]
  )
  const porId = useMemo(() => new Map(itens.map(i => [i.id, i])), [itens])
  const lista = conteudoBusca && !conteudoBusca.buscando
    ? conteudoBusca.achados.map(a => ({ ...porId.get(a.id), achado: a })).filter(i => i.id)
    : filtrados
  const item = selecionado ? porId.get(selecionado) : null

  useEffect(() => { setLimite(POR_VEZ) }, [grupo, municipio, busca])

  useEffect(() => {
    if (!selecionado || !ponte) { setConteudo(null); return }
    let vivo = true
    setConteudo(null); setErroItem('')
    ponte.ler(selecionado).then(r => {
      if (!vivo) return
      if (r?.erro) setErroItem('Não foi possível abrir: ' + r.erro)
      else setConteudo(r)
    })
    return () => { vivo = false }
  }, [selecionado]) // eslint-disable-line react-hooks/exhaustive-deps

  async function buscarNoConteudo() {
    const termo = busca.trim()
    if (termo.length < 3) return
    const ids = filtrarItens(itens, { tipo, grupo: grupo || null, municipio: municipio || null }).map(i => i.id)
    setConteudoBusca({ termo, achados: [], buscando: true, total: ids.length })
    const r = await ponte.buscar(ids, termo)
    setConteudoBusca({ termo, achados: r.achados, cortado: r.cortado, buscando: false, total: ids.length })
  }

  async function trocarPasta() {
    const novo = await ponte.escolherPasta()
    if (novo) { setIndice(novo); setSelecionado(null) }
  }

  const acoes = indice?.existe && (
    <Abas abas={TIPOS.map(t => ({ ...t, contador: contagem[t.id] }))} atual={tipo} onMudar={setTipo} />
  )

  if (!ponte) {
    return <Pagina titulo="Extensões" icone="extensoes"><Aviso titulo="Disponível só no app">A biblioteca lê a pasta desta máquina pelo Krakion App.</Aviso></Pagina>
  }
  if (!indice) return <Pagina titulo="Extensões" icone="extensoes"><p className="py-16 text-center text-sm text-suave">Lendo a biblioteca…</p></Pagina>
  if (!indice.existe) {
    return (
      <Pagina titulo="Extensões" icone="extensoes">
        <Aviso titulo="Pasta da biblioteca não encontrada" acao={['Escolher pasta', trocarPasta]}>
          Procurei em <code className="font-mono">{indice.raiz}</code>. Escolha a pasta que tem Scripts, Formulas e Relatorios.
        </Aviso>
      </Pagina>
    )
  }

  return (
    <Pagina titulo="Extensões" icone="extensoes" acoes={acoes}>
      <div className="flex min-h-0 flex-1">
        {/* Filtros: grupos do tipo + município */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-borda">
          {/* Com grupos (scripts, fórmulas): município numa caixa e grupos na lista. Sem grupos (relatórios): a lista é de municípios. */}
          {grupos.length > 0 && (
            <div className="border-b border-borda p-2">
              <CaixaBusca
                opcoes={[{ valor: TODOS, rotulo: 'Todos os municípios' }, ...municipios.map(m => ({ valor: m.valor, rotulo: `${m.valor} · ${m.qtd}` }))]}
                valor={municipio}
                onEscolher={v => { setMunicipio(v); setConteudoBusca(null) }}
              />
            </div>
          )}
          <nav className="min-h-0 flex-1 overflow-y-auto p-2">
            <ul className="space-y-0.5">
              {[{ valor: TODOS, qtd: contagem[tipo] }, ...(grupos.length ? grupos : municipios)].map(g => {
                const ativo = (grupos.length ? grupo : municipio) === g.valor
                return (
                  <li key={g.valor}>
                    <button type="button"
                      onClick={() => { grupos.length ? setGrupo(g.valor) : setMunicipio(g.valor); setConteudoBusca(null) }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${ativo ? 'bg-texto/[0.07] font-medium' : 'text-suave hover:bg-texto/[0.04] hover:text-texto'}`}>
                      <span className="min-w-0 flex-1 truncate">{g.valor ? (grupos.length ? rotuloGrupo(g.valor) : g.valor) : grupos.length ? 'Todos' : 'Todos os municípios'}</span>
                      <span className="text-[11px] tabular-nums text-suave">{g.qtd}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
          <button type="button" onClick={trocarPasta} title={indice.raiz}
            className="flex items-center gap-2 border-t border-borda px-4 py-2.5 text-left text-[11px] text-suave hover:text-texto">
            <Icone nome="arquivo" className="h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{indice.raiz.split(/[\\/]/).pop()}</span>
            <span className="text-acento">trocar</span>
          </button>
        </aside>

        {/* Lista */}
        <section className="flex w-80 shrink-0 flex-col border-r border-borda">
          <div className="space-y-1.5 border-b border-borda p-2">
            <form onSubmit={e => { e.preventDefault(); buscarNoConteudo() }}>
              <Busca valor={busca} onMudar={v => { setBusca(v); setConteudoBusca(null) }} placeholder="Nome, município, tipo…" className="h-8" />
            </form>
            <div className="flex items-center gap-2 px-1 text-[11px] text-suave">
              {conteudoBusca ? (
                <>
                  <span className="min-w-0 flex-1 truncate">
                    {conteudoBusca.buscando
                      ? `Procurando “${conteudoBusca.termo}” em ${conteudoBusca.total} itens…`
                      : `${conteudoBusca.achados.length}${conteudoBusca.cortado ? '+' : ''} com “${conteudoBusca.termo}” no código`}
                  </span>
                  <button type="button" onClick={() => setConteudoBusca(null)} className="text-acento hover:underline">voltar aos nomes</button>
                </>
              ) : (
                <>
                  <span className="flex-1">{filtrados.length.toLocaleString('pt-BR')} {filtrados.length === 1 ? 'item' : 'itens'}</span>
                  <button type="button" onClick={buscarNoConteudo} disabled={busca.trim().length < 3}
                    title="Procura o texto dentro dos arquivos (Enter também busca)"
                    className="text-acento hover:underline disabled:pointer-events-none disabled:text-suave/50">buscar no código</button>
                </>
              )}
            </div>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {lista.slice(0, limite).map(i => (
              <li key={i.id}>
                <button type="button" onClick={() => setSelecionado(i.id)}
                  className={`w-full rounded-lg px-2.5 py-2 text-left transition ${selecionado === i.id ? 'bg-texto/[0.07]' : 'hover:bg-texto/[0.04]'}`}>
                  <span className="block truncate text-sm">{i.nome}</span>
                  <span className="block truncate text-[11px] text-suave">
                    {[i.municipio, !grupo && i.grupo ? rotuloGrupo(i.grupo) : null, i.detalhe].filter(Boolean).join(' · ')}
                  </span>
                  {i.achado && (
                    <span className="mt-1 block truncate font-mono text-[11px] text-suave/90" title={i.achado.trecho}>
                      <span className="text-amber-600 dark:text-amber-400">{i.achado.linha}</span> {i.achado.trecho}
                    </span>
                  )}
                </button>
              </li>
            ))}
            {lista.length > limite && (
              <li className="p-2 text-center">
                <button type="button" onClick={() => setLimite(l => l + POR_VEZ)} className="text-xs text-acento hover:underline">
                  Mostrar mais ({(lista.length - limite).toLocaleString('pt-BR')} restantes)
                </button>
              </li>
            )}
            {!lista.length && !conteudoBusca?.buscando && <li className="px-3 py-10 text-center text-sm text-suave">Nada encontrado.</li>}
          </ul>
        </section>

        {/* Código */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Visualizador item={item} conteudo={conteudo} erro={erroItem} termoConteudo={conteudoBusca?.termo} />
        </div>
      </div>
    </Pagina>
  )
}

function Aviso({ titulo, acao, children }) {
  return (
    <div className="m-auto max-w-sm py-16 text-center">
      <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-borda text-suave">
        <Icone nome="extensoes" className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium">{titulo}</p>
      <p className="mt-1 text-xs text-suave">{children}</p>
      {acao && <button type="button" onClick={acao[1]} className="botao-secundario mt-4 px-3 py-1.5">{acao[0]}</button>}
    </div>
  )
}

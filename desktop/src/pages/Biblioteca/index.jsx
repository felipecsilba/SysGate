import { useEffect, useMemo, useState } from 'react'
import Pagina from '../../components/Pagina'
import Busca from '../../components/Busca'
import CaixaBusca from '../../components/CaixaBusca'
import Icone from '../../components/Icone'
import { agruparVersoes, filtrarItens, rotuloCategoria, rotuloTipoFormula, secoes as montarSecoes } from '../../lib/biblioteca'
import Visualizador from './Visualizador'

// Biblioteca: scripts, fórmulas e relatórios lidos da pasta local (somente leitura).
// O índice (só nomes) vem do Electron; o conteúdo é lido quando o item é aberto.
const TODOS = ''
const POR_VEZ = 300
// "Geração de crédito · Imóveis (IPTU)" → assunto "Geração de crédito" + nome "Imóveis (IPTU)".
// Assunto com um tipo só fica como item solto, sem subtítulo.
function agruparPorAssunto(subgrupos) {
  const blocos = []
  for (const g of subgrupos) {
    const [assunto, ...resto] = g.rotulo.split(' · ')
    const chave = resto.length ? assunto : null
    const ultimo = blocos.at(-1)
    if (chave && ultimo?.assunto === chave) ultimo.itens.push({ ...g, nome: resto.join(' · ') })
    else blocos.push({ assunto: chave, itens: [{ ...g, nome: resto.length ? resto.join(' · ') : g.rotulo }] })
  }
  return blocos.map(b => (b.itens.length === 1 && b.assunto ? { assunto: null, itens: [{ ...b.itens[0], nome: b.itens[0].rotulo }] } : b))
}

// Linha de baixo de cada item: o que o filtro atual ainda não diz
function subtitulo(i, subgrupo) {
  if (i.tipo === 'formula') {
    const anos = i.versoes?.length > 1 ? `${i.anos} · ${i.versoes.length} versões` : i.ano
    return [i.municipio, subgrupo === null ? rotuloTipoFormula(i.codigo) : null, anos].filter(Boolean).join(' · ')
  }
  return [i.municipio, i.tipo === 'script' && subgrupo === null ? rotuloCategoria(i.grupo) : null, i.detalhe].filter(Boolean).join(' · ')
}

// Filtros sobrevivem à troca de módulo enquanto o app está aberto
// subgrupo: null = o tipo inteiro; senão a categoria (script) ou o tipo de fórmula
const lembrado = { tipo: 'script', subgrupo: null, municipio: TODOS, busca: '', selecionado: null }

export default function Biblioteca() {
  const ponte = window.krakion?.biblioteca
  const [indice, setIndice] = useState(null)
  const [tipo, setTipo] = useState(lembrado.tipo)
  const [subgrupo, setSubgrupo] = useState(lembrado.subgrupo)
  const [municipio, setMunicipio] = useState(lembrado.municipio)
  const [busca, setBusca] = useState(lembrado.busca)
  const [selecionado, setSelecionado] = useState(lembrado.selecionado)
  const [versaoInicial, setVersaoInicial] = useState(null) // ano aberto pela busca no código
  const [limite, setLimite] = useState(POR_VEZ)
  const [conteudoBusca, setConteudoBusca] = useState(null) // { termo, achados, buscando, cortado }

  useEffect(() => { Object.assign(lembrado, { tipo, subgrupo, municipio, busca, selecionado }) }, [tipo, subgrupo, municipio, busca, selecionado])
  useEffect(() => { ponte?.indice().then(setIndice) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function escolher(t, sub = null) {
    setTipo(t); setSubgrupo(sub); setConteudoBusca(null)
  }

  // Fórmulas: os anos da mesma fórmula viram um item só (as versões ficam dentro dele)
  const itens = useMemo(() => agruparVersoes(indice?.itens || []), [indice])
  const secoes = useMemo(() => montarSecoes(itens, municipio || null), [itens, municipio])
  const municipios = useMemo(() => {
    const m = new Map()
    for (const i of itens) if (i.municipio) m.set(i.municipio, (m.get(i.municipio) || 0) + 1)
    return [...m].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
  }, [itens])
  const filtro = { tipo, subgrupo, municipio: municipio || null }
  const filtrados = useMemo(
    () => filtrarItens(itens, { ...filtro, busca: conteudoBusca ? '' : busca }),
    [itens, tipo, subgrupo, municipio, busca, conteudoBusca] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const porId = useMemo(() => new Map(itens.map(i => [i.id, i])), [itens])
  // Cada arquivo (inclusive anos antigos) → o item que o representa na lista
  const porArquivo = useMemo(() => {
    const m = new Map()
    for (const i of itens) for (const v of i.versoes || [{ id: i.id }]) m.set(v.id, i)
    return m
  }, [itens])
  // Vários anos da mesma fórmula com o termo: um item só, aberto no ano mais recente que bateu
  const lista = useMemo(() => {
    if (!conteudoBusca || conteudoBusca.buscando) return filtrados
    const vistos = new Set()
    const saida = []
    for (const a of conteudoBusca.achados) {
      const i = porArquivo.get(a.id)
      if (!i || vistos.has(i.id)) continue
      vistos.add(i.id)
      saida.push({ ...i, achado: a })
    }
    return saida
  }, [conteudoBusca, filtrados, porArquivo])
  const item = selecionado ? porId.get(selecionado) : null

  useEffect(() => { setLimite(POR_VEZ) }, [tipo, subgrupo, municipio, busca])

  async function buscarNoConteudo() {
    const termo = busca.trim()
    if (termo.length < 3) return
    const ids = filtrarItens(itens, filtro).flatMap(i => (i.versoes || [{ id: i.id }]).map(v => v.id))
    setConteudoBusca({ termo, achados: [], buscando: true, total: ids.length })
    const r = await ponte.buscar(ids, termo)
    setConteudoBusca({ termo, achados: r.achados, cortado: r.cortado, buscando: false, total: ids.length })
  }

  async function trocarPasta() {
    const novo = await ponte.escolherPasta()
    if (novo) { setIndice(novo); setSelecionado(null) }
  }

  if (!ponte) {
    return <Pagina titulo="Biblioteca" icone="biblioteca"><Aviso titulo="Disponível só no app">A biblioteca lê a pasta desta máquina pelo Krakion App.</Aviso></Pagina>
  }
  if (!indice) return <Pagina titulo="Biblioteca" icone="biblioteca"><p className="py-16 text-center text-sm text-suave">Lendo a biblioteca…</p></Pagina>
  if (!indice.existe) {
    return (
      <Pagina titulo="Biblioteca" icone="biblioteca">
        <Aviso titulo="Pasta da biblioteca não encontrada" acao={['Escolher pasta', trocarPasta]}>
          Procurei em <code className="font-mono">{indice.raiz}</code>. Escolha a pasta que tem Scripts, Formulas e Relatorios.
        </Aviso>
      </Pagina>
    )
  }

  return (
    <Pagina titulo="Biblioteca" icone="biblioteca">
      <div className="flex min-h-0 flex-1">
        {/* Navegação: município no topo; Scripts por categoria, Fórmulas por tipo de fórmula, Relatórios */}
        <aside className="flex w-64 shrink-0 flex-col border-r border-borda">
          <div className="border-b border-borda p-2">
            <CaixaBusca
              opcoes={[{ valor: TODOS, rotulo: 'Todos os municípios' }, ...municipios.map(([nome, qtd]) => ({ valor: nome, rotulo: `${nome} · ${qtd}` }))]}
              valor={municipio}
              onEscolher={v => { setMunicipio(v); setConteudoBusca(null) }}
            />
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto p-2">
            {secoes.map(sec => (
              <section key={sec.tipo} className="mb-3">
                <button type="button" onClick={() => escolher(sec.tipo)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition ${tipo === sec.tipo && subgrupo === null ? 'bg-texto/[0.07]' : 'hover:bg-texto/[0.04]'}`}>
                  <span className={`flex-1 text-[11px] font-semibold uppercase tracking-wider ${tipo === sec.tipo ? 'text-texto' : 'text-suave'}`}>{sec.titulo}</span>
                  <span className="text-[11px] tabular-nums text-suave">{sec.total.toLocaleString('pt-BR')}</span>
                </button>
                {sec.subgrupos.length > 0 && (
                  <ul className="mt-0.5 space-y-0.5">
                    {agruparPorAssunto(sec.subgrupos).map(({ assunto, itens: subs }) => (
                      <li key={assunto || subs[0].valor}>
                        {assunto && <p className="px-4 pb-0.5 pt-1.5 text-[11px] text-suave">{assunto}</p>}
                        <ul className="space-y-0.5">
                          {subs.map(g => {
                            const ativo = tipo === sec.tipo && subgrupo === g.valor
                            return (
                              <li key={g.valor}>
                                <button type="button" onClick={() => escolher(sec.tipo, g.valor)} title={g.rotulo}
                                  className={`flex w-full items-center gap-2 rounded-lg py-1.5 pr-2.5 text-left text-sm transition ${assunto ? 'pl-6' : 'pl-4'} ${ativo ? 'bg-texto/[0.07] font-medium' : 'text-suave hover:bg-texto/[0.04] hover:text-texto'}`}>
                                  <span className="min-w-0 flex-1 truncate">{g.nome}</span>
                                  <span className="text-[11px] tabular-nums text-suave">{g.qtd.toLocaleString('pt-BR')}</span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
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
                <button type="button" onClick={() => { setSelecionado(i.id); setVersaoInicial(i.achado?.id ?? null) }}
                  className={`w-full rounded-lg px-2.5 py-2 text-left transition ${selecionado === i.id ? 'bg-texto/[0.07]' : 'hover:bg-texto/[0.04]'}`}>
                  <span className="block truncate text-sm">{i.nome}</span>
                  <span className="block truncate text-[11px] text-suave">
                    {subtitulo(i, conteudoBusca ? null : subgrupo)}
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
          <Visualizador item={item} termoConteudo={conteudoBusca?.termo} versaoInicial={versaoInicial} />
        </div>
      </div>
    </Pagina>
  )
}

function Aviso({ titulo, acao, children }) {
  return (
    <div className="m-auto max-w-sm py-16 text-center">
      <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-borda text-suave">
        <Icone nome="biblioteca" className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium">{titulo}</p>
      <p className="mt-1 text-xs text-suave">{children}</p>
      {acao && <button type="button" onClick={acao[1]} className="botao-secundario mt-4 px-3 py-1.5">{acao[0]}</button>}
    </div>
  )
}

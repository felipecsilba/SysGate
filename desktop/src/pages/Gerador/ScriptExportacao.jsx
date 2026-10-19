import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CaixaBusca from '../../components/CaixaBusca'
import BotaoIcone from '../../components/BotaoIcone'
import Icone from '../../components/Icone'
import { Codigo } from '../Biblioteca/Visualizador'
import { OPERADORES, montarCondicao, montarCriterio, montarScript, operadoresPara } from '../../lib/exportacao'

// Escolhas sobrevivem à troca de módulo enquanto o app está aberto
let guardado = { chave: null, condicoes: [], parametros: {}, limite: 50, csv: true, nomeBase: '' }

function Secao({ titulo, extra, children }) {
  return (
    <section className="border-b border-borda px-4 py-4">
      <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-suave">
        {titulo}{extra && <span className="font-normal normal-case tracking-normal"> · {extra}</span>}
      </h4>
      {children}
    </section>
  )
}

const rotuloFonte = f => {
  const caminho = f.path !== `/${f.nome}` ? `  ${f.path}` : ''
  return `${f.bfc}.${f.operacao}${caminho}${f.descricaoOp || f.descricao ? ` — ${f.descricaoOp || f.descricao}` : ''}`
}

export default function ScriptExportacao() {
  const ponte = window.krakion?.gerador
  const [params] = useSearchParams()
  const [lista, setLista] = useState(null)
  const [chave, setChaveEstado] = useState(guardado.chave)
  const [fonte, setFonte] = useState(null)
  const [condicoes, setCondicoes] = useState(guardado.condicoes)
  const [parametros, setParametros] = useState(guardado.parametros)
  const [limite, setLimite] = useState(guardado.limite)
  const [csv, setCsv] = useState(guardado.csv)
  const [nomeBase, setNomeBase] = useState(guardado.nomeBase)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => { guardado = { chave, condicoes, parametros, limite, csv, nomeBase } }, [chave, condicoes, parametros, limite, csv, nomeBase])

  useEffect(() => { ponte?.fontes().then(setLista) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Vindo da Checagem (?fonte=debitos): abre direto na busca principal daquela fonte
  useEffect(() => {
    const pedida = params.get('fonte')
    if (!pedida || !lista?.fontes) return
    const alvo = lista.fontes.find(f => f.bfc === pedida && f.operacao === 'busca' && f.path === `/${f.nome}`)
      || lista.fontes.find(f => (f.bfc === pedida || f.nome === pedida) && f.operacao === 'busca')
    if (alvo && alvo.chave !== chave) escolherFonte(alvo.chave)
  }, [lista]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!chave || !ponte) { setFonte(null); return }
    ponte.fonte(chave).then(setFonte)
  }, [chave]) // eslint-disable-line react-hooks/exhaustive-deps

  function escolherFonte(c) {
    setChaveEstado(c); setCondicoes([]); setParametros({}); setNomeBase('')
  }

  const criterio = useMemo(() => montarCriterio(condicoes), [condicoes])
  const script = useMemo(() => (fonte ? montarScript({
    fonte, criterio, limite, csv, nomeBase,
    parametros: fonte.parametros.map(p => ({ ...p, valor: parametros[p.nome] })),
  }) : ''), [fonte, criterio, limite, csv, nomeBase, parametros])

  const opcoesFonte = useMemo(() => (lista?.fontes || []).map(f => ({ valor: f.chave, rotulo: rotuloFonte(f) })), [lista])
  const usados = new Set(condicoes.map(c => c.campo))
  const opcoesFiltro = useMemo(() => (fonte?.filtros || []).map(f => ({
    valor: f.campo, rotulo: `${f.campo}${f.descricao ? ` — ${f.descricao}` : ''}${f.eh_enum ? ' · enum' : ''}`,
  })), [fonte])

  function adicionar(campo) {
    const f = fonte.filtros.find(x => x.campo === campo)
    if (!f) return
    setCondicoes(c => [...c, { campo: f.campo, tipo: f.tipo, eh_enum: !!f.eh_enum, descricao: f.descricao, valores: f.valores || [], operador: '=', valor: '' }])
  }
  const mudar = (i, patch) => setCondicoes(c => c.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const remover = i => setCondicoes(c => c.filter((_, j) => j !== i))

  async function copiar() {
    await navigator.clipboard.writeText(script)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  function salvar() {
    const url = URL.createObjectURL(new Blob([script], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `exporta_${(nomeBase || `${fonte.bfc}_${fonte.operacao}`).replace(/[^\w.-]+/g, '_')}.groovy`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!ponte) return <p className="m-auto text-sm text-suave">Disponível só no Krakion App (lê o catálogo da pasta desta máquina).</p>
  if (!lista) return <p className="m-auto text-sm text-suave">Lendo o catálogo de fontes…</p>
  if (!lista.existe) {
    return (
      <div className="m-auto max-w-sm text-center">
        <p className="text-sm font-medium">Catálogo de fontes não encontrado</p>
        <p className="mt-1 text-xs text-suave">O Gerador lê <code className="font-mono">FontesDeDados/catalogo_v2.json</code> e <code className="font-mono">mapa_bfc_rest.json</code> dentro da pasta da Biblioteca. Troque a pasta na Biblioteca se ela estiver em outro lugar.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1">
      {/* Configuração */}
      <div className="w-[27rem] shrink-0 overflow-y-auto border-r border-borda">
        <Secao titulo="Fonte de dados" extra={`${lista.fontes.length} operações de leitura`}>
          <CaixaBusca opcoes={opcoesFonte} valor={chave} onEscolher={escolherFonte} placeholder="Buscar fonte: debitos, imoveis, dividas…" />
          {fonte && (
            <div className="mt-2.5 space-y-1 text-xs">
              <p><code className="font-mono">Dados.tributos.v2.{fonte.bfc}.{fonte.operacao}</code> <span className="text-suave">{fonte.path}</span></p>
              {fonte.confirmado
                ? <p className="text-suave">{fonte.usos ? `Nome confirmado — usado em ${fonte.usos.toLocaleString('pt-BR')} scripts reais.` : 'Nome confirmado no mapa REST → BFC.'}</p>
                : <p className="flex gap-1.5 text-amber-600 dark:text-amber-400"><Icone nome="alerta" className="mt-px h-3.5 w-3.5 shrink-0" /> “{fonte.bfc}” é o nome da rota REST; no editor da Betha pode ser outro. Confira antes de rodar.</p>}
            </div>
          )}
        </Secao>

        {fonte?.parametros.length > 0 && (
          <Secao titulo="Parâmetros obrigatórios" extra="vão em parametros:, não no filtro">
            <div className="space-y-2">
              {fonte.parametros.map(p => (
                <label key={p.nome} className="flex items-center gap-3">
                  <code className="w-36 shrink-0 truncate font-mono text-xs">{p.nome}</code>
                  <input className="campo h-8 text-sm" value={parametros[p.nome] ?? ''} placeholder={p.tipo}
                    onChange={e => setParametros(x => ({ ...x, [p.nome]: e.target.value }))} />
                </label>
              ))}
            </div>
          </Secao>
        )}

        {fonte && (
          <Secao titulo="Filtros" extra={`${fonte.filtros.length} disponíveis · combinados com "e"`}>
            <div className="space-y-2">
              {condicoes.map((c, i) => {
                const op = OPERADORES.find(o => o.id === c.operador)
                const incompleta = !montarCondicao(c)
                return (
                  <div key={i} className="rounded-xl border border-borda p-2.5">
                    <div className="mb-2 flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate font-mono text-xs" title={c.descricao || c.campo}>{c.campo}</code>
                      <span className="text-[11px] text-suave">{c.eh_enum ? 'enum' : c.tipo}</span>
                      <BotaoIcone titulo="Remover filtro" icone="fechar" perigo className="h-6 w-6" onClick={() => remover(i)} />
                    </div>
                    <div className="grid grid-cols-[11rem_1fr] gap-2">
                      <CaixaBusca compacta buscavel={false} opcoes={operadoresPara(c).map(o => ({ valor: o.id, rotulo: o.rotulo }))}
                        valor={c.operador} onEscolher={v => mudar(i, { operador: v })} />
                      {op?.precisaValor && (c.eh_enum && c.operador !== 'in' && c.valores.length
                        ? <CaixaBusca compacta opcoes={c.valores.map(v => ({ valor: v.key, rotulo: v.descricao ? `${v.key} — ${v.descricao}` : v.key }))}
                          valor={c.valor} onEscolher={v => mudar(i, { valor: v })} placeholder="valor" />
                        : <input className="campo h-8 font-mono text-xs" value={c.valor} onChange={e => mudar(i, { valor: e.target.value })}
                          placeholder={c.operador === 'in' ? 'valor1, valor2' : c.tipo} />)}
                    </div>
                    {incompleta && <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">Falta o valor — este filtro ainda não entra no script.</p>}
                  </div>
                )
              })}
              <CaixaBusca opcoes={opcoesFiltro.filter(o => !usados.has(o.valor))} valor={null} onEscolher={adicionar}
                placeholder={condicoes.length ? '+ outro filtro…' : '+ filtro: digite o campo (ex.: idCredito, situacao)'} />
              {!condicoes.length && <p className="text-[11px] text-suave">Sem filtro o script exporta a fonte inteira — use o Limite para testar.</p>}
            </div>
          </Secao>
        )}

        {fonte && (
          <Secao titulo="Saída">
            <div className="space-y-3">
              <label className="flex items-center gap-3 text-sm">
                <span className="w-36 shrink-0 text-suave">Limite de registros</span>
                <input type="number" min={0} className="campo h-8 w-28 text-sm" value={limite} onChange={e => setLimite(Math.max(0, Number(e.target.value) || 0))} />
                <span className="text-[11px] text-suave">0 = todos</span>
              </label>
              <label className="flex items-center gap-3 text-sm">
                <span className="w-36 shrink-0 text-suave">Nome do arquivo</span>
                <input className="campo h-8 text-sm" value={nomeBase} onChange={e => setNomeBase(e.target.value)} placeholder={`${fonte.bfc}_${fonte.operacao}`} />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={csv} onChange={e => setCsv(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--acento))]" />
                Também gerar CSV para consulta
                <span className="text-[11px] text-suave">(lê a fonte duas vezes)</span>
              </label>
              <p className="text-[11px] text-suave">O JSONL sempre vai no zip — é o arquivo que a Checagem Por Fonte lê.</p>
            </div>
          </Secao>
        )}
      </div>

      {/* Script */}
      <div className="flex min-w-0 flex-1 flex-col px-6 py-5">
        {!fonte ? (
          <div className="m-auto max-w-sm text-center">
            <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-borda text-suave">
              <Icone nome="extensoes" className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium">Escolha a fonte de dados</p>
            <p className="mt-1 text-xs text-suave">O script sai pronto para rodar no Studio: busca na fonte com os filtros escolhidos e devolve um zip com o JSONL (e o CSV, se quiser).</p>
          </div>
        ) : (
          <>
            <header className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold leading-snug">Script de exportação</h3>
                <p className="mt-0.5 truncate font-mono text-xs text-suave" title={criterio}>{criterio || 'sem filtro — fonte inteira'}</p>
              </div>
              <button type="button" className="botao-secundario px-3 py-1.5" onClick={salvar}>
                <Icone nome="importar" className="h-3.5 w-3.5" /> Salvar .groovy
              </button>
              <button type="button" className="botao-primario px-3 py-1.5" onClick={copiar}>
                <Icone nome={copiado ? 'check' : 'copiar'} className="h-3.5 w-3.5" /> {copiado ? 'Copiado' : 'Copiar script'}
              </button>
            </header>
            <div className="mt-4 flex min-h-0 flex-1 flex-col">
              <Codigo texto={script} nome="script.txt" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

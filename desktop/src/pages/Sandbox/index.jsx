import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Abas from '../../components/Abas'
import CaixaBusca from '../../components/CaixaBusca'
import BotaoIcone from '../../components/BotaoIcone'
import Icone from '../../components/Icone'
import MetodoBadge from '../../components/MetodoBadge'
import Modal from '../../components/Modal'
import { lerModelos, removerModelo, salvarModelo } from '../../lib/modelos'
import Pagina from '../../components/Pagina'
import { endpointsApi, mensagemErro, municipiosApi, proxyApi, requisicoesApi, sistemasApi } from '../../lib/api'
import { parametrosDoPath, preencherPath, urlFinal } from '../../lib/caminho'
import { expandirSchema, exemploJson, montarBody, pedeJsonLivre, selecaoInicial, valoresIniciais } from '../../lib/corpo'
import { extrairId } from '../../lib/ids'
import { basePath } from '../../lib/endpoints'
import SeloValidade from '../CentralTokens/SeloValidade'
import AbaLote from './AbaLote'
import EditorBody from './EditorBody'
import Historico from './Historico'
import PainelResposta from './PainelResposta'
import SeletorEndpoint from './SeletorEndpoint'

const METODOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const METODO_ATIVO = {
  GET: 'bg-sky-600 text-white', POST: 'bg-emerald-600 text-white', PUT: 'bg-amber-500 text-white',
  PATCH: 'bg-orange-500 text-white', DELETE: 'bg-red-600 text-white',
}
const COM_BODY = ['POST', 'PUT', 'PATCH', 'DELETE']

function Rotulo({ children }) {
  return <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-suave">{children}</h4>
}

// Erro do proxy: 502 traz { error, detail } (falha de rede/DNS ao chamar a API)
function erroDoProxy(err) {
  const d = err.response?.data
  return d?.detail ? `${d.error}: ${d.detail}` : mensagemErro(err)
}

export default function Sandbox() {
  const navegar = useNavigate()
  const [municipios, setMunicipios] = useState([])
  const [sistemas, setSistemas] = useState([])
  const [municipioId, setMunicipioId] = useState(null)
  const [sistemaId, setSistemaId] = useState(null)
  const [tokens, setTokens] = useState([])
  const [endpoints, setEndpoints] = useState([])

  const [endpoint, setEndpoint] = useState(null)
  const [metodo, setMetodo] = useState('GET')
  const [path, setPath] = useState('')
  const [params, setParams] = useState({})

  const [selecao, setSelecao] = useState({})
  const [valores, setValores] = useState({})
  const [modo, setModo] = useState('campos')
  const [json, setJson] = useState('')

  const [resposta, setResposta] = useState(null)
  const [executando, setExecutando] = useState(false)
  const [consulta, setConsulta] = useState(null)
  const [consultando, setConsultando] = useState(false)
  const [abaResultado, setAbaResultado] = useState('resposta')
  const [abaPrincipal, setAbaPrincipal] = useState('unica')
  const [historico, setHistorico] = useState([])
  const [carregandoHist, setCarregandoHist] = useState(false)
  // Modelos: requisições prontas para reusar (sem município)
  const [modelos, setModelos] = useState(() => lerModelos())
  const [modeloAtual, setModeloAtual] = useState(null)
  const [modeloPendente, setModeloPendente] = useState(null) // aplicado quando os endpoints do sistema carregarem
  const [nomeModelo, setNomeModelo] = useState(null) // null = janela fechada
  const areaResultado = useRef(null)

  // Ao executar, a resposta costuma ficar abaixo da dobra — rola até ela
  useEffect(() => {
    if (executando || resposta) areaResultado.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [executando, resposta])

  // Carga inicial: município ativo (Central de Tokens) e primeiro sistema
  useEffect(() => {
    Promise.all([municipiosApi.listar(), sistemasApi.listar()]).then(([ms, ss]) => {
      setMunicipios(ms)
      setSistemas(ss)
      setMunicipioId((ms.find(m => m.ativo) ?? ms[0])?.id ?? null)
      setSistemaId(ss[0]?.id ?? null)
    })
  }, [])

  useEffect(() => {
    setTokens([])
    if (municipioId) municipiosApi.tokens(municipioId).then(setTokens).catch(() => {})
  }, [municipioId])

  useEffect(() => {
    setEndpoints([])
    escolherEndpoint(null)
    if (sistemaId) endpointsApi.listar(sistemaId).then(setEndpoints).catch(() => {})
  }, [sistemaId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (modeloPendente && endpoints.length && modeloPendente.sistemaId === sistemaId) aplicarModelo(modeloPendente)
  }, [endpoints]) // eslint-disable-line react-hooks/exhaustive-deps

  const carregarHistorico = useCallback(async () => {
    if (!municipioId) return setHistorico([])
    setCarregandoHist(true)
    try {
      setHistorico(await requisicoesApi.listar({ municipioId, limite: 50 }))
    } finally {
      setCarregandoHist(false)
    }
  }, [municipioId])

  useEffect(() => { if (abaResultado === 'historico') carregarHistorico() }, [abaResultado, carregarHistorico])

  const campos = useMemo(() => expandirSchema(endpoint?.bodySchema), [endpoint])

  function escolherEndpoint(ep) {
    setModeloAtual(null)
    setEndpoint(ep)
    setResposta(null)
    setConsulta(null)
    setParams({})
    if (!ep) { setPath(''); setJson(''); return }
    const cs = expandirSchema(ep.bodySchema)
    setMetodo(ep.metodo)
    setPath(ep.path)
    setSelecao(selecaoInicial(cs))
    setValores(valoresIniciais(cs))
    const ex = exemploJson(ep.bodySchema)
    setJson(ex !== undefined ? JSON.stringify(ex, null, 2) : '')
    setModo(cs.length && !pedeJsonLivre(cs) ? 'campos' : 'json')
  }

  // Trocar o método procura o endpoint do mesmo path com esse método
  function trocarMetodo(m) {
    setMetodo(m)
    // Mesmo recurso: primeiro o mesmo path; senão a variante com/sem {id} (GET costuma ser /x/{id})
    const par = endpoints.find(e => e.path === path && e.metodo === m)
      || endpoints.find(e => basePath(e.path) === basePath(path) && e.metodo === m)
    if (par) escolherEndpoint(par)
    else setEndpoint(null)
  }

  const sistema = sistemas.find(s => s.id === sistemaId)
  const vinculo = tokens.find(t => t.sistemaId === sistemaId)
  const nomesParams = parametrosDoPath(path)
  const pathFinal = preencherPath(path, params)
  const faltaParam = parametrosDoPath(pathFinal).length > 0
  const temBody = COM_BODY.includes(metodo)
  const previa = useMemo(() => {
    if (modo !== 'campos' || !campos.length) return ''
    const b = montarBody(campos, selecao, valores)
    return Object.keys(b).length ? JSON.stringify(b, null, 2) : ''
  }, [modo, campos, selecao, valores])

  const motivoBloqueio = !municipioId ? 'Escolha o município'
    : !sistemaId ? 'Escolha o sistema'
    : !vinculo ? 'Este município não tem token para o sistema'
    : !path ? 'Escolha o endpoint ou digite o path'
    : faltaParam ? 'Preencha os parâmetros do path'
    : null

  async function executar() {
    let body
    if (temBody) {
      if (modo === 'campos' && campos.length) body = montarBody(campos, selecao, valores)
      else if (json.trim()) {
        try { body = JSON.parse(json) } catch (e) { return setResposta({ erro: `JSON inválido no body: ${e.message}` }) }
      }
    }
    setExecutando(true)
    setResposta(null)
    setConsulta(null)
    setAbaResultado('resposta')
    try {
      setResposta(await proxyApi.executar({
        municipioId, sistemaId, endpointId: endpoint?.id ?? null, path: pathFinal, metodo, body, tipo: 'individual',
      }))
    } catch (err) {
      setResposta({ erro: erroDoProxy(err) })
    } finally {
      setExecutando(false)
    }
  }

  const idGerado = resposta && !resposta.erro ? extrairId(resposta.data) : null

  async function consultar() {
    setConsultando(true)
    try {
      setConsulta(await proxyApi.executar({
        municipioId, sistemaId, path: `${pathFinal.replace(/\/$/, '')}/${encodeURIComponent(idGerado)}`, metodo: 'GET', tipo: 'individual',
      }))
    } catch (err) {
      setConsulta({ erro: erroDoProxy(err) })
    } finally {
      setConsultando(false)
    }
  }

  async function limparHistorico() {
    await requisicoesApi.limpar({ municipioId })
    await carregarHistorico()
  }

  // ── Modelos ──
  const modeloAberto = modelos.find(m => m.id === modeloAtual)

  function aplicarModelo(m) {
    const ep = endpoints.find(e => e.path === m.path && e.metodo === m.metodo)
    if (ep) escolherEndpoint(ep)
    else { escolherEndpoint(null); setPath(m.path) }
    // depois do escolherEndpoint (que reinicia o body): o que estava salvo no modelo
    setMetodo(m.metodo)
    setParams(m.params || {})
    setSelecao(m.selecao || {})
    setValores(m.valores || {})
    setModo(m.modo || 'campos')
    setJson(m.json || '')
    setModeloAtual(m.id)
    setModeloPendente(null)
  }

  function abrirModelo(m) {
    if (m.sistemaId === sistemaId && endpoints.length) return aplicarModelo(m)
    setModeloPendente(m)
    if (m.sistemaId !== sistemaId) setSistemaId(m.sistemaId)
  }

  function guardarModelo(nome) {
    const salvo = salvarModelo(undefined, {
      ...(nome === undefined ? modeloAberto : { nome }),
      sistemaId, sistemaNome: sistema?.nome, metodo, path, params, modo, selecao, valores, json,
    })
    setModelos(lerModelos())
    setModeloAtual(salvo.id)
    setNomeModelo(null)
  }

  function excluirModelo(id) {
    removerModelo(undefined, id)
    setModelos(lerModelos())
    if (modeloAtual === id) setModeloAtual(null)
  }

  // Salvar = verde (cria algo novo); Atualizar = neutro (só regrava o que já existe)
  const acoesModelo = path ? (
    <div className="flex items-center gap-2">
      {modeloAberto && (
        <button type="button" className="botao-secundario px-3 py-1.5" onClick={() => guardarModelo()} title={`Grava as mudanças em “${modeloAberto.nome}”`}>
          <Icone nome="atualizar" className="h-3.5 w-3.5" /> Atualizar modelo
        </button>
      )}
      <button type="button" className="botao bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-700" onClick={() => setNomeModelo('')} title="Guarda esta requisição para reusar depois">
        <Icone nome="marcador" className="h-3.5 w-3.5" /> {modeloAberto ? 'Salvar como novo' : 'Salvar modelo'}
      </button>
    </div>
  ) : null

  const abas = (
    <div className="flex items-center gap-2">
      <Abas abas={[{ id: 'unica', rotulo: 'Requisição única' }, { id: 'lote', rotulo: 'Envio em lote' }]} atual={abaPrincipal} onMudar={setAbaPrincipal} />
    </div>
  )

  return (
    <Pagina titulo="API" icone="api" acoes={abas}>
      <div className="flex min-h-0 flex-1">
        {/* Esquerda — o que chamar */}
        <aside className="w-80 shrink-0 space-y-5 overflow-y-auto border-r border-borda p-5">
          <div>
            <Rotulo>Município</Rotulo>
            <CaixaBusca
              opcoes={municipios.map(m => ({ valor: m.id, rotulo: `${m.nome}${m.ativo ? ' (ativo)' : ''}` }))}
              valor={municipioId} onEscolher={setMunicipioId} placeholder="Nenhum município" buscavel={municipios.length > 8}
            />
          </div>

          <div>
            <Rotulo>Sistema</Rotulo>
            <CaixaBusca
              opcoes={sistemas.map(s => ({ valor: s.id, rotulo: s.nome }))}
              valor={sistemaId} onEscolher={setSistemaId} placeholder="Nenhum sistema" buscavel={sistemas.length > 8}
            />
            {sistemaId && municipioId && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                {vinculo ? (
                  <>
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400"><Icone nome="check" className="h-3.5 w-3.5" strokeWidth={2.5} /> Token</span>
                    <SeloValidade dataVencimento={vinculo.dataVencimento} />
                  </>
                ) : (
                  <button type="button" className="text-amber-700 hover:underline dark:text-amber-400" onClick={() => navegar('/tokens')}>
                    Sem token para este sistema — cadastrar na Central de Tokens
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <Rotulo>Endpoint</Rotulo>
            <SeletorEndpoint endpoints={endpoints} selecionado={endpoint} onSelecionar={escolherEndpoint} desabilitado={!sistemaId} />
          </div>

          <div>
            <Rotulo>Requisição</Rotulo>
            <div className="mb-2 flex flex-wrap gap-1">
              {METODOS.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => trocarMetodo(m)}
                  className={`rounded-md px-2 py-1 font-mono text-[11px] font-semibold transition ${
                    metodo === m ? METODO_ATIVO[m] : 'border border-borda text-suave hover:text-texto'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <input className="campo font-mono text-xs" value={path} onChange={e => setPath(e.target.value)} placeholder="/api/recurso/{id}" />
            {nomesParams.map(p => (
              <label key={p} className="mt-2 flex items-center gap-2">
                <span className="w-20 shrink-0 truncate font-mono text-xs text-suave">{`{${p}}`}</span>
                <input className="campo h-8 py-1 font-mono text-xs" value={params[p] ?? ''} onChange={e => setParams(v => ({ ...v, [p]: e.target.value }))} />
              </label>
            ))}
            {sistema && path && (
              <p className="mt-2 break-all rounded-lg bg-texto/[0.04] px-2.5 py-1.5 font-mono text-[11px]">
                <span className="text-suave">{sistema.urlBase}</span>{pathFinal}
              </p>
            )}
          </div>

          <div>
            <Rotulo>Modelos</Rotulo>
            {modelos.length ? (
              <ul className="space-y-0.5">
                {modelos.map(m => (
                  <li key={m.id} className={`group relative flex items-center gap-1 rounded-lg pr-1 transition ${m.id === modeloAtual ? 'bg-texto/[0.06]' : 'hover:bg-texto/[0.04]'}`}>
                    {m.id === modeloAtual && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-acento" />}
                    <button type="button" onClick={() => abrirModelo(m)} className="min-w-0 flex-1 px-2.5 py-1.5 text-left" title={`${m.sistemaNome || ''} · ${m.metodo} ${m.path}`}>
                      <span className={`block truncate text-sm ${m.id === modeloAtual ? 'font-semibold' : ''}`}>{m.nome}</span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <MetodoBadge metodo={m.metodo} className="!w-auto px-1.5 !py-0 text-[9px]" />
                        <span className="truncate font-mono text-[10px] text-suave">{m.path}</span>
                      </span>
                    </button>
                    <BotaoIcone titulo="Excluir modelo" icone="lixeira" perigo onClick={() => excluirModelo(m.id)} className="opacity-0 group-hover:opacity-100" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-borda px-3 py-3 text-xs text-suave">Monte uma requisição e use <span className="font-medium text-texto">Salvar modelo</span> para reusar depois — só trocando os valores.</p>
            )}
          </div>
        </aside>

        {/* Direita — o que enviar e o que voltou */}
        {abaPrincipal === 'lote' ? (
          <div className="min-w-0 flex-1 overflow-y-auto p-5">
            <AbaLote
              campos={campos} municipioId={municipioId} sistemaId={sistemaId} endpoint={endpoint} metodo={metodo}
              pathFinal={pathFinal} urlCompleta={sistema ? urlFinal(sistema.urlBase, pathFinal) : pathFinal} motivoBloqueio={motivoBloqueio}
            />
          </div>
        ) : (
        <div className="min-w-0 flex-1 space-y-5 overflow-y-auto p-5">
          {temBody && (
            <EditorBody
              campos={campos} selecao={selecao} onSelecao={setSelecao} valores={valores} onValores={setValores}
              modo={modo} onModo={setModo} json={json} onJson={setJson} previa={previa}
              acoes={acoesModelo}
            />
          )}

          <div className="flex items-center justify-end gap-3">
            {/* Sem body (GET/DELETE) não há cabeçalho de Body: as ações de modelo ficam à esquerda, longe do Executar */}
            {!temBody && <div className="mr-auto">{acoesModelo}</div>}
            {motivoBloqueio && <span className="text-xs text-suave">{motivoBloqueio}</span>}
            <button type="button" className="botao-primario" onClick={executar} disabled={executando || !!motivoBloqueio} title={sistema && path ? urlFinal(sistema.urlBase, pathFinal) : undefined}>
              <Icone nome="sandbox" className="h-4 w-4" /> {executando ? 'Executando…' : 'Executar'}
            </button>
          </div>

          <section ref={areaResultado} className="scroll-mt-4 border-t border-borda pt-4">
            <Abas
              className="mb-3"
              atual={abaResultado}
              onMudar={setAbaResultado}
              abas={[{ id: 'resposta', rotulo: 'Resposta' }, { id: 'historico', rotulo: 'Histórico' }]}
            />
            {abaResultado === 'resposta' ? (
              <PainelResposta resposta={resposta} executando={executando} idGerado={idGerado} onConsultar={consultar} consulta={consulta} consultando={consultando} />
            ) : (
              <Historico itens={historico} carregando={carregandoHist} onLimpar={limparHistorico} />
            )}
          </section>
        </div>
        )}
      </div>
      <Modal
        aberto={nomeModelo !== null}
        titulo="Salvar modelo"
        subtitulo="Guarda sistema, endpoint, método, campos e valores. O município não entra — vale para qualquer um."
        onFechar={() => setNomeModelo(null)}
        rodape={
          <>
            <button type="button" className="botao-secundario" onClick={() => setNomeModelo(null)}>Cancelar</button>
            <button type="submit" form="form-modelo" className="botao-primario" disabled={!nomeModelo?.trim()}>Salvar</button>
          </>
        }
      >
        <form id="form-modelo" onSubmit={e => { e.preventDefault(); guardarModelo(nomeModelo.trim()) }}>
          <label className="block">
            <span className="rotulo">Nome</span>
            <input className="campo" value={nomeModelo ?? ''} onChange={e => setNomeModelo(e.target.value)} placeholder={`ex.: ${metodo} ${path.replace('/api/', '')} — marcar PAGA`} autoFocus />
          </label>
        </form>
      </Modal>
    </Pagina>
  )
}

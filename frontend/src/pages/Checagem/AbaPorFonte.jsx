import { useState, useEffect, useRef, useMemo } from 'react'
import { checagemApi } from '../../lib/api'
import ConstrutorScript from './ConstrutorScript'
import PainelCampos from './PainelCampos'
import DetalheRegra from './DetalheRegra'
import { SEV, NOTA_CONFIG, CONTEXTO } from './LaudoRegras'
import {
  lerJsonl, caminhosNecessarios, montarLotes, mesclarResultados, perfilCampos, indexarPorId, concentracao,
} from './arquivoFonte'

/** Item aberto ao chegar o laudo: o primeiro erro, senão o primeiro alerta, senão a primeira regra. */
function itemInicial(resultado) {
  const rs = resultado?.regras || []
  const r = rs.find((x) => x.severidade === 'erro') || rs.find((x) => x.severidade === 'alerta') || rs[0]
  return r ? { tipo: 'regra', id: r.regraId } : null
}

const fmtMB = (b) => (b / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' MB'

/** Catálogo da fonte com o mesmo nome do cadastro (path /<cadastro>), ou null. */
async function carregarFonte(sistemaId, cadastro) {
  const lista = await checagemApi.fontes({ sistemaId, busca: cadastro })
  const alvo = lista.find((f) => f.nome === cadastro && f.path === `/${cadastro}`)
    || lista.find((f) => f.nome === cadastro && f.operacao === 'busca')
  return alvo ? checagemApi.fonte(alvo.id) : null
}

export default function AbaPorFonte({ sistemaId, cadastro }) {
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [verificando, setVerificando] = useState(false)
  const [regrasCadastradas, setRegrasCadastradas] = useState([])
  const [construtorAberto, setConstrutorAberto] = useState(false)
  // .jsonl carregado: os registros ficam fora do state (16 mil objetos não
  // precisam passar pelo React), só o resumo vai para a tela
  const [arquivo, setArquivo] = useState(null)
  const registrosRef = useRef([])
  const inputArquivoRef = useRef(null)
  const [progresso, setProgresso] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [semCatalogo, setSemCatalogo] = useState(false)
  // item do laudo aberto no painel da direita: { tipo: 'regra', id } | { tipo: 'campos' } | { tipo: 'notas' }
  const [selecionado, setSelecionado] = useState(null)

  useEffect(() => { setSelecionado(itemInicial(resultado)) }, [resultado])

  // Concentração das falhas só existe com arquivo: no texto colado o navegador
  // não guarda os registros inteiros.
  const porId = useMemo(
    () => (resultado && arquivo ? indexarPorId(registrosRef.current) : null),
    [resultado, arquivo]
  )
  const dimensoes = useMemo(() => {
    if (!porId || selecionado?.tipo !== 'regra') return []
    const r = resultado.regras.find((x) => x.regraId === selecionado.id)
    return r?.faltam > 0 ? concentracao(r.ids, porId) : []
  }, [porId, selecionado, resultado])

  useEffect(() => {
    setResultado(null)
    setErro(null)
    setPerfil(null)
    if (!sistemaId || !cadastro) { setRegrasCadastradas([]); return }
    checagemApi.regras({ sistemaId, frente: 'fonte', cadastro })
      .then(setRegrasCadastradas)
      .catch(() => setRegrasCadastradas([]))
  }, [sistemaId, cadastro])

  const limpar = () => {
    setTexto(''); setResultado(null); setErro(null); setPerfil(null)
    setArquivo(null); registrosRef.current = []
    if (inputArquivoRef.current) inputArquivoRef.current.value = ''
  }

  const carregarArquivo = async (file) => {
    if (!file) return
    setErro(null); setResultado(null); setPerfil(null)
    try {
      const { registros, descartadas } = lerJsonl(await file.text())
      if (registros.length === 0) {
        setErro('Não encontrei nenhum registro no arquivo. Esperado: um JSON por linha (.jsonl).')
        return
      }
      registrosRef.current = registros
      setArquivo({ nome: file.name, tamanho: file.size, registros: registros.length, descartadas })
      setTexto('')
    } catch (e) {
      setErro('Não consegui ler o arquivo: ' + e.message)
    }
  }

  const verificarArquivo = async () => {
    const registros = registrosRef.current
    const lotes = montarLotes(registros, caminhosNecessarios(regrasCadastradas, CONTEXTO))
    const parciais = []
    for (let i = 0; i < lotes.length; i++) {
      setProgresso({ lote: i + 1, total: lotes.length })
      parciais.push(await checagemApi.verificar({ sistemaId, frente: 'fonte', cadastro, texto: lotes[i] }))
    }
    setResultado(mesclarResultados(parciais, { registros: registros.length, descartadas: arquivo.descartadas }))

    // perfil de campos: sem catálogo ainda vale o preenchimento
    let fonte = null
    try { fonte = await carregarFonte(sistemaId, cadastro) } catch { /* segue sem catálogo */ }
    setSemCatalogo(!fonte)
    setPerfil(perfilCampos(registros, fonte?.campos || [], fonte?.enums || {}))
  }

  const verificar = async () => {
    setErro(null)
    setResultado(null)
    setPerfil(null)
    if (arquivo) {
      setVerificando(true)
      try {
        await verificarArquivo()
      } catch (e) {
        const d = e.response?.data
        setErro(d?.detalhe ? `${d.error} ${d.detalhe}` : (d?.error || e.message))
      } finally {
        setVerificando(false)
        setProgresso(null)
      }
      return
    }
    if (!texto.trim()) { setErro('Cole a saída do script ou carregue o arquivo .jsonl antes de verificar.'); return }
    setVerificando(true)
    try {
      setResultado(await checagemApi.verificar({ sistemaId, frente: 'fonte', cadastro, texto }))
    } catch (e) {
      const d = e.response?.data
      setErro(d?.detalhe ? `${d.error} ${d.detalhe}` : (d?.error || e.message))
    } finally {
      setVerificando(false)
    }
  }

  if (!cadastro) {
    return <p className="text-sm text-gray-400 text-center mt-10">Escolha um cadastro para começar.</p>
  }

  const temResultado = Boolean(resultado)
  const regraSel = selecionado?.tipo === 'regra' ? resultado?.regras.find((r) => r.regraId === selecionado.id) : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-4 items-start">
      {construtorAberto && (
        <ConstrutorScript sistemaId={sistemaId} onFechar={() => setConstrutorAberto(false)} />
      )}

      {/* ── coluna esquerda: entrada + um quadrado por item do laudo ── */}
      <div className="space-y-4 min-w-0">
        <div className="card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-200 bg-gradient-to-r from-white to-sysgate-50/30 flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">Saída do script</span>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-400">
                {regrasCadastradas.length} regra{regrasCadastradas.length !== 1 ? 's' : ''} para <code className="font-mono">{cadastro}</code>
              </span>
              <button onClick={() => setConstrutorAberto(true)} className="text-xs font-medium text-sysgate-600 hover:text-sysgate-800">
                Gerar script de exportação
              </button>
            </div>
          </div>
          <div
            className="p-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); carregarArquivo(e.dataTransfer.files?.[0]) }}
          >
            <input
              ref={inputArquivoRef}
              type="file"
              accept=".jsonl,.ndjson,.json,.txt"
              className="hidden"
              onChange={(e) => carregarArquivo(e.target.files?.[0])}
            />
            {arquivo ? (
              <div className={`${temResultado ? 'min-h-[150px]' : 'min-h-[330px]'} rounded-lg border-2 border-dashed border-sysgate-200 bg-sysgate-50/40 flex flex-col items-center justify-center gap-2 p-6 text-center transition-all`}>
                <svg className="w-9 h-9 text-sysgate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className="font-mono text-sm text-gray-800 break-all">{arquivo.nome}</span>
                <span className="text-xs text-gray-500">
                  {arquivo.registros.toLocaleString('pt-BR')} registros · {fmtMB(arquivo.tamanho)}
                  {arquivo.descartadas > 0 && <> · <span className="text-amber-700">{arquivo.descartadas} linha(s) ilegível(is)</span></>}
                </span>
                {progresso && (
                  <div className="w-full max-w-xs mt-2">
                    <div className="h-1.5 rounded-full bg-white overflow-hidden">
                      <div className="h-full bg-sysgate-600 transition-all" style={{ width: `${(progresso.lote / progresso.total) * 100}%` }} />
                    </div>
                    <span className="text-[11px] text-gray-500">Lote {progresso.lote}/{progresso.total}</span>
                  </div>
                )}
                <button type="button" onClick={() => inputArquivoRef.current?.click()} disabled={verificando} className="text-xs font-medium text-sysgate-600 hover:text-sysgate-800 mt-1">
                  Trocar arquivo
                </button>
              </div>
            ) : (
              <textarea
                id="entrada-fonte"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                spellCheck={false}
                placeholder={'Cole aqui a saída do BFC-Script — ou arraste o arquivo .jsonl exportado.\n\nAceita array JSON, um JSON por linha, ou o log do Studio\ncom a hora na frente:\n\n11:52:01 - {"id":274988488,"credito":"LIDFE"}'}
                className={`w-full ${temResultado ? 'min-h-[180px]' : 'min-h-[330px]'} resize-y rounded-lg bg-gray-900 text-gray-200 border-0 p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-sysgate-500`}
              />
            )}
            <div className="flex gap-2 mt-3 flex-wrap">
              <button onClick={verificar} disabled={verificando} className="btn-primary">
                {verificando ? 'Verificando…' : 'Verificar'}
              </button>
              {!arquivo && (
                <button onClick={() => inputArquivoRef.current?.click()} disabled={verificando} className="btn-secondary">
                  Carregar .jsonl
                </button>
              )}
              <button onClick={limpar} disabled={verificando} className="btn-secondary">
                Limpar
              </button>
            </div>
          </div>
        </div>

        {erro && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{erro}</div>}

        {resultado && (
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="w-1 h-4 rounded-full bg-sysgate-600" />
              <h3 className="text-sm font-semibold text-gray-700">Resultado</h3>
              <span className="flex gap-1.5 text-xs ml-auto flex-wrap">
                <span className="badge-gray">{resultado.entrada.registros.toLocaleString('pt-BR')} registro{resultado.entrada.registros !== 1 ? 's' : ''}</span>
                {resultado.resumo.erros > 0 && <span className={SEV.erro.pill + ' px-2 py-0.5 rounded-full font-medium'}>{resultado.resumo.erros} com falha</span>}
                {resultado.resumo.alertas > 0 && <span className={SEV.alerta.pill + ' px-2 py-0.5 rounded-full font-medium'}>{resultado.resumo.alertas} alerta{resultado.resumo.alertas !== 1 ? 's' : ''}</span>}
                {resultado.resumo.erros === 0 && resultado.resumo.alertas === 0 && <span className={SEV.ok.pill + ' px-2 py-0.5 rounded-full font-medium'}>nenhuma falha</span>}
              </span>
            </div>

            {resultado.entrada.descartadas > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-2">
                {resultado.entrada.descartadas} linha(s) não puderam ser lidas — provavelmente cortadas pelo log.
                O resto foi analisado normalmente.
              </p>
            )}

            {resultado.regras.length === 0 && (
              <p className="text-sm text-gray-500 py-6 text-center card">
                Nenhuma regra cadastrada para <code className="font-mono">{cadastro}</code> nesta frente.
              </p>
            )}

            <div className="space-y-2">
              {resultado.regras.map((r) => (
                <ItemLaudo
                  key={r.regraId}
                  sev={r.severidade}
                  titulo={r.nome}
                  contagem={r.severidade === 'na'
                    ? 'não se aplica'
                    : r.faltam > 0
                      ? <><strong className="text-sm text-gray-900">{r.faltam.toLocaleString('pt-BR')}</strong> de {r.aplicaveis.toLocaleString('pt-BR')}</>
                      : <><strong className="text-sm text-gray-900">{r.aplicaveis.toLocaleString('pt-BR')}</strong> ok</>}
                  ativo={selecionado?.tipo === 'regra' && selecionado.id === r.regraId}
                  onClick={() => setSelecionado({ tipo: 'regra', id: r.regraId })}
                />
              ))}

              {perfil && (
                <ItemLaudo
                  sev={perfil.foraDoEnum.length > 0 ? 'alerta' : 'info'}
                  rotulo={perfil.foraDoEnum.length > 0 ? 'alerta' : 'campos'}
                  titulo="Campos do arquivo"
                  sub={[
                    perfil.foraDoEnum.length > 0 && `${perfil.foraDoEnum.length} com valor fora do enum`,
                    `${perfil.parciais.length} parcialmente preenchido${perfil.parciais.length !== 1 ? 's' : ''}`,
                    perfil.ausentes.length > 0 && `${perfil.ausentes.length} não vieram`,
                  ].filter(Boolean).join(' · ')}
                  ativo={selecionado?.tipo === 'campos'}
                  onClick={() => setSelecionado({ tipo: 'campos' })}
                />
              )}

              {resultado.notas?.length > 0 && (
                <ItemLaudo
                  sev="nota"
                  rotulo="notas"
                  titulo="Falta fora do JSON"
                  sub={`${resultado.notas.length} observação(ões) sobre este cadastro`}
                  ativo={selecionado?.tipo === 'notas'}
                  onClick={() => setSelecionado({ tipo: 'notas' })}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── coluna direita: detalhe do item selecionado ── */}
      <div className="card overflow-hidden lg:sticky lg:top-4">
        <div className="px-4 py-2.5 border-b border-gray-200 bg-gradient-to-r from-white to-sysgate-50/30 flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Detalhe</span>
          {selecionado && <span className="text-xs text-gray-400">clique em outro item à esquerda para trocar</span>}
        </div>
        <div className="p-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          {!resultado && (
            <p className="text-sm text-gray-400 text-center py-10">
              Cole a saída ou carregue o .jsonl e clique em Verificar.<br />
              <span className="text-xs">Cada regra vira um item à esquerda; clique nele para ver o detalhe aqui.</span>
            </p>
          )}

          {resultado && !selecionado && (
            <p className="text-sm text-gray-400 text-center py-10">Clique em um item à esquerda para ver o detalhe.</p>
          )}

          {regraSel && <DetalheRegra r={regraSel} dimensoes={dimensoes} />}

          {selecionado?.tipo === 'campos' && perfil && (
            <>
              <h3 className="text-base font-semibold text-gray-900">Campos do arquivo</h3>
              <p className="text-sm text-gray-500 mt-0.5 mb-2">
                O arquivo comparado com o catálogo da fonte <code className="font-mono">{cadastro}</code>. É informação, não veredito:
                campo vazio só vira erro quando uma regra diz que algo quebra sem ele.
              </p>
              <PainelCampos perfil={perfil} semCatalogo={semCatalogo} embutido />
            </>
          )}

          {selecionado?.tipo === 'notas' && (
            <>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Falta fora do JSON</h3>
              <div className="space-y-2">
                {resultado.notas.map((n) => {
                  const cfg = NOTA_CONFIG[n.tipo] || NOTA_CONFIG.regra
                  return (
                    <div key={n.id} className="border-l-4 border-l-gray-300 bg-gray-50 rounded-r-lg p-3">
                      <span className={`${cfg.cls} px-2 py-0.5 rounded text-[10px] font-bold uppercase`}>{cfg.rotulo}</span>
                      <p className="text-sm text-gray-700 mt-1.5 whitespace-pre-line">{n.texto}</p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Quadrado clicável de um item do laudo. A forma (pill + barra) acompanha a
// severidade, como no laudo antigo, para ser lido de relance.
const ESTILO_EXTRA = {
  info: { rotulo: 'campos', barra: 'border-l-sysgate-400', pill: 'bg-sysgate-100 text-sysgate-800', fundo: '' },
  nota: { rotulo: 'notas', barra: 'border-l-gray-400', pill: 'bg-gray-200 text-gray-700', fundo: '' },
}

function ItemLaudo({ sev, rotulo, titulo, sub, contagem, ativo, onClick }) {
  const c = SEV[sev] || ESTILO_EXTRA[sev] || SEV.na
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border border-l-4 ${c.barra} bg-white transition-all
        ${ativo ? 'border-sysgate-400 ring-2 ring-sysgate-200 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
    >
      <span className={`${c.pill} px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0`}>
        {rotulo || c.rotulo}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-gray-800 truncate">{titulo}</span>
        {sub && <span className="block text-xs text-gray-500 truncate">{sub}</span>}
      </span>
      {contagem && <span className="text-xs font-mono text-gray-600 shrink-0 tabular-nums">{contagem}</span>}
      <svg className={`w-4 h-4 shrink-0 ${ativo ? 'text-sysgate-500' : 'text-gray-300'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  )
}

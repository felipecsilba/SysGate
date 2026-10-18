import { useEffect, useMemo, useRef, useState } from 'react'
import Abas from '../../components/Abas'
import Busca from '../../components/Busca'
import Icone from '../../components/Icone'
import { checagemApi, mensagemErro } from '../../lib/api'
import {
  CONTEXTO, caminhosNecessarios, concentracao, escolherFonte, indexarPorId, itemInicial, lerJsonl, listarCampos,
  mesclarResultados, montarLotes, perfilCampos,
} from '../../lib/arquivoFonte'
import { DetalheCampo, DetalheRegra, NotasCadastro, ResumoCampos } from './Detalhes'
import { Ponto, SEV, STATUS_CAMPO, fmtN, fmtPct } from './pecas'

// O laudo fica só na memória enquanto o app está aberto (trocar de módulo não perde a análise).
// Nada vai para disco nem para o banco — o arquivo tem CPF/CNPJ de contribuintes.
let guardado = null

const fmtMB = b => (b / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' MB'

const FILTROS_CAMPO = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'alerta', rotulo: 'Alerta' },
  { id: 'parcial', rotulo: 'Parciais' },
  { id: 'ok', rotulo: 'Completos' },
  { id: 'vazio', rotulo: 'Vazios' },
  { id: 'ausente', rotulo: 'Não vieram' },
]

export default function PorFonte({ sistemaId, cadastro, regras }) {
  const chave = `${sistemaId}|${cadastro}`
  const inicial = guardado?.chave === chave ? guardado : null
  const [arquivo, setArquivo] = useState(inicial?.arquivo ?? null)
  const registrosRef = useRef(inicial?.registros ?? [])
  const [texto, setTexto] = useState(inicial?.texto ?? '')
  const [modoTexto, setModoTexto] = useState(inicial?.modoTexto ?? false)
  const [resultado, setResultado] = useState(inicial?.resultado ?? null)
  const [perfil, setPerfil] = useState(inicial?.perfil ?? null)
  const [semCatalogo, setSemCatalogo] = useState(inicial?.semCatalogo ?? false)
  const [selecionado, setSelecionado] = useState(inicial?.selecionado ?? null)
  const [progresso, setProgresso] = useState(null)
  const [verificando, setVerificando] = useState(false)
  const [erro, setErro] = useState('')
  const [arrastando, setArrastando] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    guardado = { chave, arquivo, registros: registrosRef.current, texto, modoTexto, resultado, perfil, semCatalogo, selecionado }
  }, [chave, arquivo, texto, modoTexto, resultado, perfil, semCatalogo, selecionado])

  // Concentração das falhas só existe com arquivo (o texto colado não fica inteiro na tela)
  const porId = useMemo(() => (resultado && arquivo ? indexarPorId(registrosRef.current) : null), [resultado, arquivo])
  const regraSel = selecionado?.tipo === 'regra' ? resultado?.regras.find(r => r.regraId === selecionado.id) : null
  const dimensoes = useMemo(() => (porId && regraSel?.faltam > 0 ? concentracao(regraSel.ids, porId) : []), [porId, regraSel])
  const campoSel = selecionado?.tipo === 'campo' && perfil
    ? perfil.campos.find(c => c.campo === selecionado.campo)
      || { ...perfil.ausentesDetalhe.find(c => c.campo === selecionado.campo), status: 'ausente' }
    : null

  function limpar() {
    setArquivo(null); registrosRef.current = []; setTexto(''); setResultado(null); setPerfil(null); setSelecionado(null); setErro('')
  }

  async function carregar(file) {
    if (!file) return
    limpar()
    try {
      const { registros, descartadas } = lerJsonl(await file.text())
      if (!registros.length) return setErro('Não encontrei nenhum registro no arquivo. Esperado: um JSON por linha (.jsonl).')
      registrosRef.current = registros
      setArquivo({ nome: file.name, tamanho: file.size, registros: registros.length, descartadas })
      setModoTexto(false)
    } catch (e) {
      setErro('Não consegui ler o arquivo: ' + e.message)
    }
  }

  async function verificar() {
    setErro('')
    setResultado(null); setPerfil(null); setSelecionado(null)
    if (!arquivo && !texto.trim()) return setErro('Carregue o .jsonl exportado (ou cole a saída do script) antes de verificar.')
    setVerificando(true)
    try {
      let laudo
      if (arquivo) {
        const registros = registrosRef.current
        const lotes = montarLotes(registros, caminhosNecessarios(regras, CONTEXTO))
        const parciais = []
        for (let i = 0; i < lotes.length; i++) {
          setProgresso({ lote: i + 1, total: lotes.length })
          parciais.push(await checagemApi.verificar({ sistemaId, frente: 'fonte', cadastro, texto: lotes[i] }))
        }
        laudo = mesclarResultados(parciais, { registros: registros.length, descartadas: arquivo.descartadas })

        // perfil de campos: sem catálogo ainda vale o preenchimento
        let fonte = null
        try {
          const alvo = escolherFonte(await checagemApi.fontes({ sistemaId, busca: cadastro }), cadastro)
          if (alvo) fonte = await checagemApi.fonte(alvo.id)
        } catch { /* segue sem catálogo */ }
        setSemCatalogo(!fonte)
        setPerfil(perfilCampos(registros, fonte?.campos || [], fonte?.enums || {}))
      } else {
        laudo = await checagemApi.verificar({ sistemaId, frente: 'fonte', cadastro, texto })
      }
      setResultado(laudo)
      setSelecionado(itemInicial(laudo))
    } catch (e) {
      setErro(mensagemErro(e, 'Não foi possível verificar.'))
    } finally {
      setVerificando(false)
      setProgresso(null)
    }
  }

  const soltar = e => { e.preventDefault(); setArrastando(false); carregar(e.dataTransfer.files?.[0]) }

  return (
    <div className="flex min-h-0 flex-1">
      {/* Esquerda: entrada + um item por regra e por campo */}
      <div
        className={`flex w-[25rem] shrink-0 flex-col overflow-y-auto border-r border-borda ${arrastando ? 'bg-acento-suave/40' : ''}`}
        onDragOver={e => { e.preventDefault(); setArrastando(true) }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setArrastando(false) }}
        onDrop={soltar}
      >
        <input ref={inputRef} type="file" accept=".jsonl,.ndjson,.json,.txt" className="hidden"
          onChange={e => { carregar(e.target.files?.[0]); e.target.value = '' }} />

        <div className="border-b border-borda p-3">
          {arquivo ? (
            <div className="flex items-center gap-3 rounded-xl border border-borda px-3 py-2.5">
              <Icone nome="arquivo" className="h-5 w-5 shrink-0 text-suave" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs" title={arquivo.nome}>{arquivo.nome}</p>
                <p className="text-[11px] text-suave">
                  {fmtN(arquivo.registros)} registros · {fmtMB(arquivo.tamanho)}
                  {arquivo.descartadas > 0 && <span className="text-amber-600 dark:text-amber-400"> · {arquivo.descartadas} linha(s) ilegível(is)</span>}
                </p>
                {progresso && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-texto/[0.06]">
                      <span className="block h-full rounded-full bg-acento transition-all" style={{ width: `${(progresso.lote / progresso.total) * 100}%` }} />
                    </span>
                    <span className="text-[11px] tabular-nums text-suave">lote {progresso.lote}/{progresso.total}</span>
                  </div>
                )}
              </div>
            </div>
          ) : modoTexto ? (
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              spellCheck={false}
              autoFocus
              placeholder={'Cole a saída do BFC-Script.\n\nAceita array JSON, um JSON por linha ou o log do Studio com a hora na frente:\n11:52:01 - {"id":274988488}'}
              className="campo h-48 resize-y font-mono text-xs leading-relaxed"
            />
          ) : (
            <button type="button" onClick={() => inputRef.current?.click()}
              className={`flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 ${resultado ? 'py-4' : 'py-10'} text-center transition ${arrastando ? 'border-acento' : 'border-borda hover:border-suave/60'}`}>
              <Icone nome="importar" className="h-5 w-5 text-suave" />
              <span className="text-sm font-medium">Arraste o .jsonl aqui ou clique para abrir</span>
              <span className="text-xs text-suave">O arquivo gerado pelo script de exportação da fonte <code className="font-mono">{cadastro}</code></span>
            </button>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button type="button" className="botao-primario px-3 py-1.5" onClick={verificar} disabled={verificando}>
              {verificando ? 'Verificando…' : 'Verificar'}
            </button>
            {arquivo && <button type="button" className="botao-secundario px-3 py-1.5" onClick={() => inputRef.current?.click()} disabled={verificando}>Trocar</button>}
            {!arquivo && (
              <button type="button" onClick={() => setModoTexto(m => !m)} className="text-xs text-acento hover:underline">
                {modoTexto ? 'Abrir arquivo em vez disso' : 'Colar texto'}
              </button>
            )}
            {(arquivo || texto || resultado) && (
              <button type="button" onClick={limpar} disabled={verificando} className="ml-auto text-xs text-suave hover:text-perigo">Limpar</button>
            )}
          </div>
          {erro && <p className="mt-2 text-sm text-perigo">{erro}</p>}
          {!resultado && <p className="mt-3 text-[11px] text-suave">{regras.length} regra{regras.length !== 1 ? 's' : ''} para <code className="font-mono">{cadastro}</code>. O arquivo não sai desta máquina e nada é gravado.</p>}
        </div>

        {resultado && (
          <Laudo resultado={resultado} perfil={perfil} selecionado={selecionado} onSelecionar={setSelecionado} cadastro={cadastro} />
        )}
      </div>

      {/* Direita: detalhe do item escolhido */}
      <div className="min-w-0 flex-1 overflow-y-auto px-8 py-6">
        {!resultado ? (
          <div className="m-auto max-w-sm py-20 text-center">
            <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-borda text-suave">
              <Icone nome="checagem" className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium">Nada verificado ainda</p>
            <p className="mt-1 text-xs text-suave">Cada regra vira um item à esquerda; clique nele para ver aqui a consequência, como corrigir, onde as falhas se concentram e os ids afetados.</p>
          </div>
        ) : regraSel ? (
          <DetalheRegra r={regraSel} dimensoes={dimensoes} />
        ) : campoSel ? (
          <DetalheCampo campo={campoSel} total={perfil.total} regras={resultado.regras} onAbrirRegra={id => setSelecionado({ tipo: 'regra', id })} />
        ) : selecionado?.tipo === 'campos' && perfil ? (
          <ResumoCampos perfil={perfil} semCatalogo={semCatalogo} cadastro={cadastro} />
        ) : selecionado?.tipo === 'notas' ? (
          <NotasCadastro notas={resultado.notas} />
        ) : (
          <p className="py-20 text-center text-sm text-suave">Escolha um item à esquerda.</p>
        )}
      </div>
    </div>
  )
}

function Item({ ativo, onClick, ponto, titulo, sub, direita }) {
  return (
    <li>
      <button type="button" onClick={onClick}
        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${ativo ? 'bg-texto/[0.07]' : 'hover:bg-texto/[0.04]'}`}>
        <Ponto classe={ponto} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{titulo}</span>
          {sub && <span className="block truncate text-[11px] text-suave">{sub}</span>}
        </span>
        {direita && <span className="shrink-0 text-xs tabular-nums text-suave">{direita}</span>}
      </button>
    </li>
  )
}

function Laudo({ resultado, perfil, selecionado, onSelecionar, cadastro }) {
  const [filtro, setFiltro] = useState('todos')
  const [busca, setBusca] = useState('')
  const campos = useMemo(() => (perfil ? listarCampos(perfil, { status: filtro, busca }) : null), [perfil, filtro, busca])
  const { resumo, entrada } = resultado

  return (
    <div className="p-2">
      <div className="flex items-center gap-2 px-2.5 pb-1 pt-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-suave">Regras</h4>
        <span className="ml-auto text-[11px] text-suave">
          {fmtN(entrada.registros)} registros
          {resumo.erros > 0 && <span className={SEV.erro.texto}> · {resumo.erros} com falha</span>}
          {resumo.alertas > 0 && <span className={SEV.alerta.texto}> · {resumo.alertas} alerta{resumo.alertas !== 1 ? 's' : ''}</span>}
          {!resumo.erros && !resumo.alertas && <span className={SEV.ok.texto}> · nenhuma falha</span>}
        </span>
      </div>
      {entrada.descartadas > 0 && (
        <p className="mx-2.5 mb-1 text-[11px] text-amber-600 dark:text-amber-400">{entrada.descartadas} linha(s) ilegível(is) — provavelmente cortadas pelo log. O resto foi analisado.</p>
      )}
      {!resultado.regras.length && <p className="px-2.5 py-2 text-xs text-suave">Nenhuma regra para <code className="font-mono">{cadastro}</code>.</p>}

      <ul className="space-y-0.5">
        {resultado.regras.map(r => (
          <Item key={r.regraId}
            ativo={selecionado?.tipo === 'regra' && selecionado.id === r.regraId}
            onClick={() => onSelecionar({ tipo: 'regra', id: r.regraId })}
            ponto={(SEV[r.severidade] || SEV.na).ponto}
            titulo={r.nome}
            direita={r.severidade === 'na' ? 'não se aplica' : r.faltam > 0 ? `${fmtN(r.faltam)} de ${fmtN(r.aplicaveis)}` : `${fmtN(r.aplicaveis)} ok`}
          />
        ))}
        {perfil && (
          <Item
            ativo={selecionado?.tipo === 'campos'}
            onClick={() => onSelecionar({ tipo: 'campos' })}
            ponto={perfil.foraDoEnum.length ? STATUS_CAMPO.alerta.ponto : 'bg-acento/60'}
            titulo="Campos do arquivo"
            sub={[
              perfil.foraDoEnum.length > 0 && `${perfil.foraDoEnum.length} com valor fora do enum`,
              `${perfil.parciais.length} parcialmente preenchido${perfil.parciais.length !== 1 ? 's' : ''}`,
              perfil.ausentes.length > 0 && `${perfil.ausentes.length} não vieram`,
            ].filter(Boolean).join(' · ')}
          />
        )}
        {resultado.notas?.length > 0 && (
          <Item
            ativo={selecionado?.tipo === 'notas'}
            onClick={() => onSelecionar({ tipo: 'notas' })}
            ponto="bg-suave/40"
            titulo="Falta fora do arquivo"
            sub={`${resultado.notas.length} observação(ões) sobre este cadastro`}
          />
        )}
      </ul>

      {campos && (
        <>
          <div className="mt-4 flex items-center gap-2 px-2.5 pb-1">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-suave">Campos</h4>
          </div>
          <div className="space-y-2 px-1.5 pb-2">
            <Abas className="flex-wrap" abas={FILTROS_CAMPO.filter(f => f.id === 'todos' || campos.contagem[f.id]).map(f => ({ ...f, contador: campos.contagem[f.id] }))} atual={filtro} onMudar={setFiltro} />
            <Busca valor={busca} onMudar={setBusca} placeholder="Buscar campo ou descrição…" className="h-8" />
          </div>
          <ul className="space-y-0.5">
            {campos.visiveis.map(c => {
              const e = STATUS_CAMPO[c.status] || STATUS_CAMPO.vazio
              return (
                <Item key={c.campo}
                  ativo={selecionado?.tipo === 'campo' && selecionado.campo === c.campo}
                  onClick={() => onSelecionar({ tipo: 'campo', campo: c.campo })}
                  ponto={e.ponto}
                  titulo={<span className="font-mono text-xs">{c.campo}</span>}
                  sub={c.descricao}
                  direita={c.status === 'parcial' || c.status === 'alerta' ? fmtPct(c.pct) : c.status === 'ok' ? '100%' : c.status === 'vazio' ? 'vazio' : 'não veio'}
                />
              )
            })}
            {!campos.visiveis.length && <li className="px-2.5 py-3 text-center text-xs text-suave">Nenhum campo com esse filtro.</li>}
          </ul>
        </>
      )}
    </div>
  )
}

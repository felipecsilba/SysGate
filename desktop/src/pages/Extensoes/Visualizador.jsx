import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Abas from '../../components/Abas'
import BotaoIcone from '../../components/BotaoIcone'
import Icone from '../../components/Icone'
import { BFC_SCRIPT, highlightCode, highlightXml } from '../../lib/codigo'
import { blocosDiff, diffLinhas, linguagem, linhaComTermo, rotuloCategoria, rotuloTipoFormula, semCabecalho } from '../../lib/biblioteca'

const ALTURA_LINHA = 20 // leading-5 — régua, código e marca da linha usam a mesma altura
const escapar = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function Codigo({ texto: original, nome, linhaMarcada }) {
  const rolagem = useRef(null)
  // \r\n → \n: o realce fecha o <span> do comentário antes do \n e o \r sozinho viraria uma linha a mais
  const texto = useMemo(() => original.replace(/\r\n?/g, '\n'), [original])
  const html = useMemo(() => {
    const tipo = linguagem(nome)
    return tipo === 'xml' ? highlightXml(texto) : tipo === 'codigo' ? highlightCode(texto, BFC_SCRIPT) : escapar(texto)
  }, [texto, nome])
  const total = texto.split('\n').length

  // Abre já na linha que bateu com a busca no conteúdo
  useLayoutEffect(() => {
    if (rolagem.current) rolagem.current.scrollTop = linhaMarcada ? Math.max(0, (linhaMarcada - 5) * ALTURA_LINHA) : 0
  }, [linhaMarcada, texto])

  return (
    <div ref={rolagem} className="min-h-0 flex-1 overflow-auto rounded-xl border border-white/10 bg-[#1e1e1e]">
      <div className="relative flex min-w-max font-mono text-[12.5px] leading-5" style={{ fontVariantLigatures: 'none' }}>
        <div aria-hidden className="sticky left-0 z-10 select-none border-r border-white/10 bg-[#1e1e1e] py-3 pl-3 pr-2.5 text-right text-[#6e7681]">
          {Array.from({ length: total }, (_, i) => <div key={i} className={i + 1 === linhaMarcada ? 'text-amber-300' : ''}>{i + 1}</div>)}
        </div>
        {linhaMarcada && <div aria-hidden className="pointer-events-none absolute inset-x-0 bg-amber-400/10" style={{ top: 12 + (linhaMarcada - 1) * ALTURA_LINHA, height: ALTURA_LINHA }} />}
        <pre className="relative px-4 py-3 text-[#d4d4d4]" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}

// Comparação entre dois anos: só as linhas que mudaram, com 3 de contexto; o cabeçalho da extração fica de fora
function Comparacao({ antes, depois }) {
  const blocos = useMemo(() => blocosDiff(diffLinhas(semCabecalho(antes), semCabecalho(depois)), 3), [antes, depois])
  // Números de linha do arquivo inteiro: soma as linhas do cabeçalho que ficaram fora da comparação
  const desloc = useMemo(() => depois.replace(/\r\n?/g, '\n').split('\n').length - semCabecalho(depois).split('\n').length, [depois])
  const mudou = blocos.some(b => b.tipo === 'adicionado' || b.tipo === 'removido')

  if (!mudou) {
    return <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"><Icone nome="check" className="h-4 w-4" /> O código é igual nos dois anos (só o cabeçalho da extração muda).</p>
  }
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-white/10 bg-[#1e1e1e]">
      <div className="min-w-max py-2 font-mono text-[12.5px] leading-5" style={{ fontVariantLigatures: 'none' }}>
        {blocos.map((b, k) => b.tipo === 'oculto' ? (
          <div key={k} className="my-1 select-none border-y border-white/5 bg-white/[0.03] px-4 text-[11px] leading-6 text-[#6e7681]">
            ··· {b.qtd} {b.qtd === 1 ? 'linha igual' : 'linhas iguais'}
          </div>
        ) : (
          <div key={k} className={`flex ${b.tipo === 'adicionado' ? 'bg-emerald-500/15' : b.tipo === 'removido' ? 'bg-red-500/15' : ''}`}>
            <span className="w-12 shrink-0 select-none pr-2.5 text-right text-[#6e7681]">{b.linhaNova ? b.linhaNova + desloc : ''}</span>
            <span className={`w-5 shrink-0 select-none text-center ${b.tipo === 'adicionado' ? 'text-emerald-400' : b.tipo === 'removido' ? 'text-red-400' : 'text-transparent'}`}>
              {b.tipo === 'adicionado' ? '+' : b.tipo === 'removido' ? '−' : ' '}
            </span>
            <span className={`whitespace-pre pr-4 ${b.tipo === 'removido' ? 'text-red-200/80' : b.tipo === 'adicionado' ? 'text-emerald-100' : 'text-[#9da5b4]'}`}>{b.texto || ' '}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Lê um arquivo/pasta da biblioteca pelo Electron; descarta respostas atrasadas de outro id
function usarConteudo(id) {
  const [estado, setEstado] = useState({ id: null, conteudo: null, erro: '' })
  useEffect(() => {
    if (!id) return
    let vivo = true
    setEstado({ id, conteudo: null, erro: '' })
    window.krakion?.biblioteca.ler(id).then(r => {
      if (vivo) setEstado(r?.erro ? { id, conteudo: null, erro: 'Não foi possível abrir: ' + r.erro } : { id, conteudo: r, erro: '' })
    })
    return () => { vivo = false }
  }, [id])
  return estado.id === id ? estado : { conteudo: null, erro: '' }
}

export default function Visualizador({ item, termoConteudo, versaoInicial }) {
  const versoes = item?.versoes || []
  const [versaoId, setVersaoId] = useState(versaoInicial || item?.id)
  const [comparar, setComparar] = useState(false)
  const [arquivo, setArquivo] = useState(0)
  const [copiado, setCopiado] = useState(false)
  useEffect(() => { setVersaoId(versaoInicial || item?.id); setArquivo(0); setComparar(false) }, [item?.id, versaoInicial])

  const iVersao = Math.max(0, versoes.findIndex(v => v.id === versaoId))
  const anterior = versoes[iVersao + 1] // a lista vem do mais recente para o mais antigo
  const { conteudo, erro } = usarConteudo(item ? versaoId : null)
  const { conteudo: conteudoAnterior } = usarConteudo(comparar && anterior ? anterior.id : null)

  if (!item) {
    return (
      <div className="m-auto max-w-xs py-20 text-center">
        <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-borda text-suave">
          <Icone nome="extensoes" className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium">Escolha um item da biblioteca</p>
        <p className="mt-1 text-xs text-suave">O código abre aqui, com realce, para ler e copiar. Nada é alterado na pasta.</p>
      </div>
    )
  }

  const arquivos = conteudo?.arquivos || []
  const atual = arquivos[Math.min(arquivo, arquivos.length - 1)]
  const linha = atual?.texto && termoConteudo ? linhaComTermo(atual.texto, termoConteudo) : null
  const anoAtual = versoes[iVersao]?.ano ?? item.ano

  async function copiar() {
    await navigator.clipboard.writeText(atual.texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 1500)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 py-5">
      <header className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold leading-snug">{item.nome}</h3>
          <p className="mt-0.5 text-sm text-suave">
            {(item.tipo === 'formula' ? [item.municipio, rotuloTipoFormula(item.codigo), anoAtual] : [item.municipio, rotuloCategoria(item.grupo), item.detalhe]).filter(Boolean).join(' · ')}
          </p>
        </div>
        {atual?.texto && <BotaoIcone titulo={copiado ? 'Copiado' : 'Copiar código'} icone={copiado ? 'check' : 'copiar'} ativo={copiado} onClick={copiar} />}
        <BotaoIcone titulo="Mostrar na pasta" icone="arquivo" onClick={() => window.krakion?.biblioteca.mostrar(versaoId)} />
      </header>

      {versoes.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Abas abas={versoes.map(v => ({ id: v.id, rotulo: v.ano || '—' }))} atual={versaoId} onMudar={setVersaoId} />
          {anterior && (
            <button type="button" onClick={() => setComparar(c => !c)}
              className={`ml-auto flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm transition ${comparar ? 'bg-acento-suave font-medium text-acento' : 'text-suave hover:text-texto'}`}>
              <Icone nome="historico" className="h-3.5 w-3.5" /> Comparar com {anterior.ano}
            </button>
          )}
        </div>
      )}

      {!comparar && conteudo?.meta?.length > 0 && (
        <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
          {conteudo.meta.filter(([k]) => !/^(Descri|Extra|T[ií]tulo|Eventos)/i.test(k)).map(([k, v]) => (
            <div key={k} className="flex gap-1.5"><dt className="text-suave">{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      )}

      {arquivos.length > 1 && (
        <Abas className="mt-4" abas={arquivos.map((a, i) => ({ id: i, rotulo: a.rotulo }))} atual={arquivo} onMudar={setArquivo} />
      )}

      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        {erro ? (
          <p className="text-sm text-perigo">{erro}</p>
        ) : !conteudo ? (
          <p className="text-sm text-suave">Abrindo…</p>
        ) : !atual ? (
          <p className="text-sm text-suave">Pasta vazia.</p>
        ) : atual.grande ? (
          <p className="text-sm text-suave">Arquivo grande demais para abrir aqui ({(atual.tamanho / 1024 / 1024).toFixed(1)} MB). Use “Mostrar na pasta”.</p>
        ) : comparar ? (
          conteudoAnterior?.arquivos?.[0]?.texto != null
            ? (
              <>
                <p className="mb-2 text-xs text-suave">
                  <span className="text-red-500 dark:text-red-400">−</span> como estava em {anterior.ano} · <span className="text-emerald-600 dark:text-emerald-400">+</span> como ficou em {anoAtual} · números de linha do {anoAtual}
                </p>
                <Comparacao antes={conteudoAnterior.arquivos[0].texto} depois={atual.texto} />
              </>
            )
            : <p className="text-sm text-suave">Abrindo {anterior.ano}…</p>
        ) : (
          <Codigo texto={atual.texto} nome={atual.nome} linhaMarcada={linha} />
        )}
      </div>
    </div>
  )
}

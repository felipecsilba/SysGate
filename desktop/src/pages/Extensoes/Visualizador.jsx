import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Abas from '../../components/Abas'
import BotaoIcone from '../../components/BotaoIcone'
import Icone from '../../components/Icone'
import { BFC_SCRIPT, highlightCode, highlightXml } from '../../lib/codigo'
import { linguagem, linhaComTermo } from '../../lib/biblioteca'

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

export default function Visualizador({ item, conteudo, erro, termoConteudo }) {
  const [arquivo, setArquivo] = useState(0)
  const [copiado, setCopiado] = useState(false)
  useEffect(() => { setArquivo(0) }, [item?.id])

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
          <p className="mt-0.5 text-sm text-suave">{[item.municipio, item.grupo, item.detalhe].filter(Boolean).join(' · ')}</p>
        </div>
        {atual?.texto && <BotaoIcone titulo={copiado ? 'Copiado' : 'Copiar código'} icone={copiado ? 'check' : 'copiar'} ativo={copiado} onClick={copiar} />}
        <BotaoIcone titulo="Mostrar na pasta" icone="arquivo" onClick={() => window.krakion?.biblioteca.mostrar(item.id)} />
      </header>

      {conteudo?.meta?.length > 0 && (
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
        ) : (
          <Codigo texto={atual.texto} nome={atual.nome} linhaMarcada={linha} />
        )}
      </div>
    </div>
  )
}

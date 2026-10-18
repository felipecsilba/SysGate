import { useDeferredValue, useMemo, useRef, useState } from 'react'
import Pagina from '../../components/Pagina'
import Abas from '../../components/Abas'
import Busca from '../../components/Busca'
import Icone from '../../components/Icone'
import BotaoIcone from '../../components/BotaoIcone'
import Editor from './Editor'
import Arvore from './Arvore'
import Tabela from './Tabela'
import Estatisticas from './Estatisticas'
import { buscar, colorirJson, cursor as posicaoCursor, interpretar, resumoValor, tabela } from '../../lib/json'

// O texto sobrevive à troca de módulo enquanto o app está aberto — não vai para disco
let textoGuardado = ''

const ALTURA_LINHA = 13 * 1.6

export default function AnalisadorJson() {
  const [texto, setTextoEstado] = useState(textoGuardado)
  const [aba, setAba] = useState('formatado')
  const [busca, setBusca] = useState('')
  const [cursor, setCursor] = useState({ linha: 1, coluna: 1 })
  const [aviso, setAviso] = useState(null)
  const editorRef = useRef(null)
  const arquivoRef = useRef(null)

  const textoAdiado = useDeferredValue(texto)
  const r = useMemo(() => interpretar(textoAdiado), [textoAdiado])
  const valido = 'valor' in r
  const valor = r.valor

  const formatado = useMemo(() => (valido ? JSON.stringify(valor, null, 2) : ''), [valido, valor])
  const htmlFormatado = useMemo(() => (aba === 'formatado' ? colorirJson(formatado) : ''), [aba, formatado])
  const achados = useMemo(() => (valido && busca.trim() ? buscar(valor, busca) : []), [valido, valor, busca])
  const temTabela = useMemo(() => valido && !!tabela(valor), [valido, valor])

  function setTexto(t) {
    textoGuardado = t
    setTextoEstado(t)
  }

  function avisar(msg) {
    setAviso(msg)
    clearTimeout(avisar.t)
    avisar.t = setTimeout(() => setAviso(null), 1800)
  }

  async function copiarCaminho(caminho) {
    await navigator.clipboard.writeText(caminho)
    avisar(`Copiado ${caminho}`)
  }

  async function colar() {
    const t = await navigator.clipboard.readText()
    if (t) setTexto(t)
  }

  async function abrirArquivo(e) {
    const arq = e.target.files?.[0]
    e.target.value = ''
    if (arq) setTexto(await arq.text())
  }

  async function copiarFormatado() {
    await navigator.clipboard.writeText(formatado)
    avisar('JSON formatado copiado')
  }

  function irParaErro() {
    const el = editorRef.current
    if (!el || !r.erro) return
    el.focus()
    el.setSelectionRange(r.erro.posicao, Math.min(r.erro.posicao + 1, texto.length))
    el.scrollTop = Math.max(0, (r.erro.linha - 4) * ALTURA_LINHA)
    setCursor({ linha: r.erro.linha, coluna: r.erro.coluna })
  }

  const ferramentas = [
    { rotulo: 'Colar', icone: 'copiar', acao: colar },
    { rotulo: 'Abrir', icone: 'importar', acao: () => arquivoRef.current?.click() },
    { rotulo: 'Formatar', icone: 'texto', acao: () => setTexto(formatado), desligado: !valido },
    { rotulo: 'Minificar', icone: 'codigo', acao: () => setTexto(JSON.stringify(valor)), desligado: !valido },
  ]

  const abas = [
    { id: 'formatado', rotulo: 'Formatado' },
    { id: 'arvore', rotulo: 'Árvore' },
    { id: 'tabela', rotulo: 'Tabela' },
    { id: 'estatisticas', rotulo: 'Estatísticas' },
  ]

  return (
    <Pagina titulo="Analisador JSON" icone="json">
      <div className="flex min-h-0 flex-1">
        {/* Esquerda: entrada */}
        <div className="flex w-2/5 min-w-[18rem] flex-col border-r border-borda">
          <div className="flex items-center gap-1 border-b border-borda px-2 py-1.5">
            {ferramentas.map(f => (
              <button key={f.rotulo} type="button" onClick={f.acao} disabled={f.desligado}
                className="flex h-7 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-xs text-suave transition hover:bg-texto/[0.06] hover:text-texto disabled:pointer-events-none disabled:opacity-40">
                <Icone nome={f.icone} className="h-3.5 w-3.5" /> {f.rotulo}
              </button>
            ))}
            <button type="button" onClick={() => setTexto('')} disabled={!texto}
              className="ml-auto flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs text-suave transition hover:bg-perigo/10 hover:text-perigo disabled:pointer-events-none disabled:opacity-40">
              <Icone nome="lixeira" className="h-3.5 w-3.5" /> Limpar
            </button>
            <input ref={arquivoRef} type="file" accept=".json,.txt,application/json" className="hidden" onChange={abrirArquivo} />
          </div>
          <Editor
            valor={texto}
            onMudar={setTexto}
            onCursor={(t, pos) => setCursor(posicaoCursor(t, pos))}
            linhaErro={r.erro?.linha}
            editorRef={editorRef}
            placeholder="Cole ou digite um JSON aqui…"
          />
        </div>

        {/* Direita: visualizações */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-borda px-3 py-1.5">
            <Abas abas={abas} atual={aba} onMudar={a => { setAba(a); setBusca('') }} />
            <div className="flex-1" />
            {aba === 'formatado' && valido && (
              <BotaoIcone titulo="Copiar JSON formatado" icone="copiar" onClick={copiarFormatado} />
            )}
            <Busca valor={busca} onMudar={setBusca} placeholder="Buscar chave ou valor…" className="h-8 w-48 min-w-0" />
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-auto">
            {r.vazio ? (
              <Vazio />
            ) : !valido ? (
              <div className="py-16 text-center text-sm">
                <p className="text-perigo">JSON inválido na linha {r.erro.linha}, coluna {r.erro.coluna}</p>
                <p className="mt-1 text-suave">{r.erro.mensagem}</p>
                <button type="button" onClick={irParaErro} className="mt-3 text-acento hover:underline">Ir para o erro</button>
              </div>
            ) : busca.trim() ? (
              <Resultados achados={achados} onCopiar={copiarCaminho} />
            ) : aba === 'formatado' ? (
              <pre className="p-3 font-mono text-[13px] leading-[1.6]" dangerouslySetInnerHTML={{ __html: htmlFormatado }} />
            ) : aba === 'arvore' ? (
              <Arvore valor={valor} onCopiar={copiarCaminho} />
            ) : aba === 'tabela' ? (
              <Tabela valor={valor} />
            ) : (
              <Estatisticas valor={valor} texto={texto} />
            )}
          </div>
        </div>
      </div>

      {/* Barra de status */}
      <footer className="flex h-8 shrink-0 items-center gap-4 border-t border-borda px-3 text-[11px] text-suave">
        {r.vazio ? (
          <span>Vazio</span>
        ) : valido ? (
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><Icone nome="check" className="h-3 w-3" /> JSON válido</span>
        ) : (
          <button type="button" onClick={irParaErro} className="text-perigo hover:underline">Erro na linha {r.erro.linha}, coluna {r.erro.coluna}</button>
        )}
        {valido && aba !== 'tabela' && temTabela && <span>Lista de objetos — veja a aba Tabela</span>}
        {aviso && <span className="truncate text-texto">{aviso}</span>}
        <span className="ml-auto tabular-nums">Ln {cursor.linha}, Col {cursor.coluna}</span>
        <span className="tabular-nums">{texto.length.toLocaleString('pt-BR')} caracteres</span>
      </footer>
    </Pagina>
  )
}

function Vazio() {
  return (
    <div className="m-auto max-w-xs py-16 text-center">
      <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-borda text-suave">
        <Icone nome="json" className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium">Nada para analisar ainda</p>
      <p className="mt-1 text-xs text-suave">Cole um JSON à esquerda ou abra um arquivo. A resposta de uma chamada da API serve.</p>
    </div>
  )
}

function Resultados({ achados, onCopiar }) {
  if (!achados.length) return <p className="py-16 text-center text-sm text-suave">Nada encontrado.</p>
  return (
    <div>
      <p className="px-3 pt-3 text-xs text-suave">{achados.length >= 500 ? 'Mostrando os 500 primeiros' : `${achados.length} ${achados.length === 1 ? 'encontrado' : 'encontrados'}`} · clique para copiar o caminho</p>
      <ul className="p-2">
        {achados.map((a, i) => (
          <li key={i}>
            <button type="button" onClick={() => onCopiar(a.caminho)}
              className="flex w-full items-baseline gap-3 rounded-lg px-2 py-1.5 text-left font-mono text-xs hover:bg-texto/[0.04]">
              <span className="w-10 shrink-0 font-sans text-[10px] uppercase tracking-wider text-suave">{a.em}</span>
              <span className="min-w-0 flex-1 truncate">{a.caminho}</span>
              <span className="max-w-[40%] shrink-0 truncate text-suave">{resumoValor(a.valor, 60)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

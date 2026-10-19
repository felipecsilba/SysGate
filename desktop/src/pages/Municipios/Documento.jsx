import { useEffect, useMemo, useRef, useState } from 'react'
import Papa from 'papaparse'
import BotaoIcone from '../../components/BotaoIcone'
import Icone from '../../components/Icone'
import { detalheDocumento, tamanhoArquivo, tituloDocumento, urlDocumento, visualizacao } from '../../lib/documentos'

const ponte = () => window.krakion?.municipios

// Texto (.md/.txt): editável, grava sozinho 800 ms depois de parar de digitar
function EditorTexto({ doc }) {
  const [texto, setTexto] = useState(null)
  const [estado, setEstado] = useState('') // '', 'salvando', 'salvo', erro
  const espera = useRef(null)

  useEffect(() => {
    setTexto(null); setEstado('')
    ponte().lerTexto(doc.id).then(r => setTexto(r.ok ? (r.dados.grande ? null : r.dados.texto) : ''))
    return () => clearTimeout(espera.current)
  }, [doc.id])

  function mudar(v) {
    setTexto(v); setEstado('salvando')
    clearTimeout(espera.current)
    espera.current = setTimeout(async () => {
      const r = await ponte().salvarTexto({ id: doc.id, texto: v })
      setEstado(r.ok ? 'salvo' : `Não salvou: ${r.erro}`)
    }, 800)
  }

  if (texto === null) return <p className="text-sm text-suave">Abrindo…</p>
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <textarea value={texto} onChange={e => mudar(e.target.value)} spellCheck
        className="min-h-0 flex-1 resize-none rounded-xl border border-borda bg-transparent p-4 text-sm leading-relaxed outline-none focus:border-acento"
        placeholder="Escreva aqui. Markdown funciona: # Título, - item, **negrito**." />
      <p className={`mt-1.5 text-[11px] ${estado.startsWith('Não') ? 'text-perigo' : 'text-suave'}`}>
        {estado === 'salvando' ? 'Salvando…' : estado === 'salvo' ? 'Salvo na pasta do município' : estado || 'Grava sozinho enquanto você escreve'}
      </p>
    </div>
  )
}

// CSV: tabela (separador detectado; até 1.000 linhas na tela)
function TabelaCsv({ doc }) {
  const [dados, setDados] = useState(null)
  useEffect(() => {
    setDados(null)
    ponte().lerTexto(doc.id).then(r => {
      if (!r.ok || r.dados.grande) return setDados({ erro: r.ok ? 'Arquivo grande demais para mostrar aqui.' : r.erro })
      setDados(Papa.parse(r.dados.texto, { skipEmptyLines: true }))
    })
  }, [doc.id])
  if (!dados) return <p className="text-sm text-suave">Abrindo…</p>
  if (dados.erro) return <p className="text-sm text-suave">{dados.erro}</p>
  const [cab = [], ...linhas] = dados.data
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-borda">
      <table className="w-max min-w-full border-collapse text-xs">
        <thead className="sticky top-0 bg-painel"><tr>{cab.map((c, i) => <th key={i} className="border-b border-borda px-2.5 py-1.5 text-left font-medium">{c}</th>)}</tr></thead>
        <tbody>
          {linhas.slice(0, 1000).map((l, i) => (
            <tr key={i} className="hover:bg-texto/[0.03]">{l.map((c, j) => <td key={j} className="max-w-[24rem] truncate border-b border-borda/60 px-2.5 py-1">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {linhas.length > 1000 && <p className="px-3 py-2 text-xs text-suave">Mostrando 1.000 de {linhas.length.toLocaleString('pt-BR')} linhas.</p>}
    </div>
  )
}

export default function Documento({ doc, onEditarDados, onExcluir }) {
  const modo = useMemo(() => (doc ? visualizacao(doc.ext) : null), [doc])

  if (!doc) {
    return (
      <div className="m-auto max-w-xs py-20 text-center">
        <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-borda text-suave">
          <Icone nome="arquivo" className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium">Escolha um documento</p>
        <p className="mt-1 text-xs text-suave">PDFs abrem aqui mesmo; anotações e textos dá para editar direto.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 py-5">
      <header className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold leading-snug" title={doc.arquivo}>{tituloDocumento(doc)}</h3>
          <p className="mt-0.5 truncate text-sm text-suave">{detalheDocumento(doc)} · {tamanhoArquivo(doc.tamanho)}</p>
        </div>
        <BotaoIcone titulo="Editar dados (número, ano, assunto, tipo)" icone="editar" onClick={onEditarDados} />
        <BotaoIcone titulo="Abrir no programa do Windows" icone="importar" onClick={() => ponte().abrir(doc.id)} />
        <BotaoIcone titulo="Mostrar na pasta" icone="arquivo" onClick={() => ponte().mostrar(doc.id)} />
        <BotaoIcone titulo="Mandar para a Lixeira" icone="lixeira" perigo onClick={onExcluir} />
      </header>

      <div className="mt-4 flex min-h-0 flex-1 flex-col">
        {modo === 'pdf' && <iframe key={doc.id} title={doc.arquivo} src={urlDocumento(doc.id)} className="min-h-0 flex-1 rounded-xl border border-borda bg-white" />}
        {modo === 'imagem' && <div className="min-h-0 flex-1 overflow-auto"><img src={urlDocumento(doc.id)} alt={doc.arquivo} className="max-w-full rounded-xl border border-borda" /></div>}
        {modo === 'texto' && <EditorTexto key={doc.id} doc={doc} />}
        {modo === 'csv' && <TabelaCsv key={doc.id} doc={doc} />}
        {modo === 'externo' && (
          <div className="m-auto text-center">
            <p className="text-sm text-suave">Este formato ({String(doc.ext).toUpperCase() || 'sem extensão'}) abre no programa do Windows.</p>
            <button type="button" className="botao-secundario mt-3 px-3 py-1.5" onClick={() => ponte().abrir(doc.id)}>Abrir</button>
          </div>
        )}
      </div>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import Pagina from '../../components/Pagina'
import Busca from '../../components/Busca'
import Icone from '../../components/Icone'
import Confirmar from '../../components/Confirmar'
import BotaoIcone from '../../components/BotaoIcone'
import { municipiosApi } from '../../lib/api'
import { normalizar } from '../../lib/texto'
import { agruparDocumentos, detalheDocumento, filtrarMunicipios, tituloDocumento, visualizacao } from '../../lib/documentos'
import Documento from './Documento'
import { ModalAnexar, ModalDados } from './Modais'

// Municípios: legislação (código tributário, leis, decretos, portarias), anotações e outros documentos de cada município.
// Os arquivos ficam em <pasta da Biblioteca>/Municipios/<município>/Legislacao — os agentes do VS Code leem os mesmos.
const lembrado = { pasta: null, docId: null }
const ICONE_EXT = { pdf: 'arquivo', md: 'notas', txt: 'texto', csv: 'lista' }

export default function Municipios() {
  const ponte = window.krakion?.municipios
  const [lista, setLista] = useState(null)
  const [buscaMun, setBuscaMun] = useState('')
  const [pasta, setPastaEstado] = useState(lembrado.pasta)
  const [docs, setDocs] = useState(null)
  const [buscaDoc, setBuscaDoc] = useState('')
  const [docId, setDocIdEstado] = useState(lembrado.docId)
  const [novoNome, setNovoNome] = useState(null) // null = fechado
  const [erro, setErro] = useState('')
  const [anexar, setAnexar] = useState(null) // { caminhos, tipo }
  const [editando, setEditando] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [soltando, setSoltando] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  const [daCentral, setDaCentral] = useState([]) // nomes da Central de Tokens (os municípios do dia a dia)

  const setPasta = p => { lembrado.pasta = p; setPastaEstado(p); setDocId(null); setBuscaDoc('') }
  const setDocId = id => { lembrado.docId = id; setDocIdEstado(id) }

  const carregarMunicipios = useCallback(async () => {
    const r = await ponte?.listar()
    if (r?.ok) setLista(r.dados)
    else setErro(r?.erro || 'Não foi possível ler a pasta.')
  }, [ponte])

  const carregarDocs = useCallback(async () => {
    if (!pasta) return setDocs(null)
    const r = await ponte.documentos(pasta)
    setDocs(r.ok ? r.dados : [])
    if (!r.ok) setErro(r.erro)
  }, [pasta, ponte])

  useEffect(() => { carregarMunicipios() }, [carregarMunicipios])
  useEffect(() => { municipiosApi.listar().then(l => setDaCentral(l.map(m => m.nome))).catch(() => {}) }, [])
  useEffect(() => { carregarDocs() }, [carregarDocs])

  const municipios = useMemo(() => filtrarMunicipios(lista?.municipios || [], buscaMun), [lista, buscaMun])
  const grupos = useMemo(() => agruparDocumentos(docs || [], buscaDoc), [docs, buscaDoc])
  const atual = lista?.municipios.find(m => m.pasta === pasta)
  const doc = docs?.find(d => d.id === docId) || null

  async function criarMunicipio(nome = novoNome) {
    const r = await ponte.criar(nome)
    if (!r.ok) return setErro(r.erro)
    setNovoNome(null); setErro('')
    await carregarMunicipios()
    setPasta(r.dados)
  }

  // Sugestões ao criar: municípios da Central de Tokens que ainda não estão na lista
  const sugestoes = useMemo(() => {
    const ja = new Set((lista?.municipios || []).map(m => normalizar(m.nome)))
    const termo = normalizar(novoNome || '')
    return daCentral.filter(n => !ja.has(normalizar(n)) && (!termo || normalizar(n).includes(termo))).slice(0, 8)
  }, [daCentral, lista, novoNome])

  async function removerMunicipio() {
    const r = await ponte.remover(pasta)
    if (!r.ok) return setErro(r.erro)
    setPasta(null)
    await carregarMunicipios()
  }

  async function confirmarAnexo(meta, caminhos) {
    const r = await ponte.anexar(pasta, meta.tipo, meta, caminhos)
    if (!r.ok) return { erro: r.erro }
    setAnexar(null)
    if (!r.dados.length) return null // cancelou a janela de arquivos
    await Promise.all([carregarDocs(), carregarMunicipios()])
    setDocId(r.dados[0])
    return null
  }

  async function novaAnotacao() {
    const r = await ponte.salvarTexto({ pasta, tipo: 'anotacoes', titulo: 'Nova anotação', texto: '' })
    if (!r.ok) return setErro(r.erro)
    await Promise.all([carregarDocs(), carregarMunicipios()])
    setDocId(r.dados)
  }

  async function salvarDados(meta) {
    const r = await ponte.renomear(doc.id, meta)
    if (!r.ok) return { erro: r.erro }
    setEditando(false)
    await carregarDocs()
    setDocId(r.dados)
    return null
  }

  async function excluir() {
    const r = await ponte.excluir(doc.id)
    if (!r.ok) return setErro(r.erro)
    setDocId(null)
    await Promise.all([carregarDocs(), carregarMunicipios()])
  }

  // Arrastar arquivos do Windows para a lista de documentos
  function soltar(e) {
    e.preventDefault(); setSoltando(false)
    if (!pasta) return
    const caminhos = [...e.dataTransfer.files].map(f => ponte.caminhoDoArquivo(f)).filter(Boolean)
    if (caminhos.length) setAnexar({ caminhos })
  }

  if (!ponte) return <Pagina titulo="Municípios" icone="municipio"><p className="m-auto text-sm text-suave">Disponível só no Krakion App.</p></Pagina>
  if (!lista) return <Pagina titulo="Municípios" icone="municipio"><p className="m-auto text-sm text-suave">{erro || 'Lendo a pasta…'}</p></Pagina>

  return (
    <Pagina titulo="Municípios" icone="municipio">
      <div className="flex min-h-0 flex-1">
        {/* Municípios */}
        <aside className="flex w-60 shrink-0 flex-col border-r border-borda">
          <div className="border-b border-borda p-2">
            <Busca valor={buscaMun} onMudar={setBuscaMun} placeholder="Buscar município…" className="h-8" />
          </div>
          <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5">
            {!lista.municipios.length && (
              <li className="px-3 py-6 text-center text-xs text-suave">
                Nenhum município ainda. Adicione os que você atende no dia a dia — os municípios de onde só vieram scripts ficam fora desta lista.
              </li>
            )}
            {municipios.map(m => (
              <li key={m.pasta}>
                <button type="button" onClick={() => setPasta(m.pasta)} title={m.entidade || m.nome}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition ${pasta === m.pasta ? 'bg-texto/[0.07] font-medium' : 'hover:bg-texto/[0.04]'}`}>
                  <span className="min-w-0 flex-1 truncate text-sm">{m.nome}</span>
                  {m.documentos > 0 && <span className="text-[11px] tabular-nums text-suave">{m.documentos}</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-borda p-2">
            {novoNome === null ? (
              <button type="button" onClick={() => { setNovoNome(''); setErro('') }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-suave hover:bg-texto/[0.04] hover:text-texto">
                <Icone nome="mais" className="h-4 w-4" /> Adicionar município
              </button>
            ) : (
              <form onSubmit={e => { e.preventDefault(); criarMunicipio() }} className="space-y-1.5">
                <input autoFocus className="campo h-8 text-sm" value={novoNome} onChange={e => setNovoNome(e.target.value)} placeholder="Nome do município"
                  onKeyDown={e => { if (e.key === 'Escape') setNovoNome(null) }} />
                {sugestoes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="w-full text-[10px] uppercase tracking-wider text-suave">Da Central de Tokens</span>
                    {sugestoes.map(n => (
                      <button key={n} type="button" onClick={() => criarMunicipio(n)} className="rounded-full border border-borda px-2 py-0.5 text-[11px] hover:border-acento hover:text-acento">{n}</button>
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5">
                  <button type="submit" className="botao-primario flex-1 px-2 py-1 text-xs" disabled={!novoNome.trim()}>Adicionar</button>
                  <button type="button" className="botao-secundario px-2 py-1 text-xs" onClick={() => setNovoNome(null)}>Cancelar</button>
                </div>
              </form>
            )}
            {erro && <p className="mt-1.5 px-1 text-[11px] text-perigo">{erro}</p>}
          </div>
        </aside>

        {/* Documentos do município */}
        <section
          className={`flex w-80 shrink-0 flex-col border-r border-borda ${soltando ? 'bg-acento-suave/40' : ''}`}
          onDragOver={e => { if (pasta) { e.preventDefault(); setSoltando(true) } }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setSoltando(false) }}
          onDrop={soltar}
        >
          {!atual ? (
            <p className="m-auto px-6 text-center text-sm text-suave">Escolha um município à esquerda.</p>
          ) : (
            <>
              <div className="space-y-2 border-b border-borda p-3">
                <div className="flex items-start gap-1">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-semibold">{atual.nome}</h3>
                    {atual.entidade && <p className="truncate text-[11px] text-suave">{atual.entidade}</p>}
                  </div>
                  <BotaoIcone titulo="Remover município da lista" icone="lixeira" perigo className="h-7 w-7" onClick={() => setRemovendo(true)} />
                </div>
                <div className="flex gap-1.5">
                  <button type="button" className="botao-primario flex-1 px-2.5 py-1.5 text-xs" onClick={() => setAnexar({ caminhos: [] })}>
                    <Icone nome="mais" className="h-3.5 w-3.5" /> Anexar
                  </button>
                  <button type="button" className="botao-secundario flex-1 px-2.5 py-1.5 text-xs" onClick={novaAnotacao}>
                    <Icone nome="notas" className="h-3.5 w-3.5" /> Nova anotação
                  </button>
                </div>
                {docs?.length > 0 && <Busca valor={buscaDoc} onMudar={setBuscaDoc} placeholder="Buscar: número, assunto…" className="h-8" />}
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
                {docs === null ? (
                  <p className="p-4 text-center text-sm text-suave">Abrindo…</p>
                ) : !docs.length ? (
                  <div className="m-4 rounded-xl border border-dashed border-borda p-5 text-center">
                    <p className="text-sm font-medium">Nenhum documento ainda</p>
                    <p className="mt-1 text-xs text-suave">Arraste PDFs, CSVs ou textos aqui, ou use “Anexar”. Código tributário, leis, decretos…</p>
                  </div>
                ) : !grupos.length ? (
                  <p className="p-4 text-center text-sm text-suave">Nada encontrado.</p>
                ) : grupos.map(g => (
                  <section key={g.id} className="mb-2">
                    <h4 className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-suave">{g.rotulo} <span className="font-normal">{g.docs.length}</span></h4>
                    <ul className="space-y-0.5">
                      {g.docs.map(d => (
                        <li key={d.id}>
                          <button type="button" onClick={() => setDocId(d.id)}
                            className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition ${docId === d.id ? 'bg-texto/[0.07]' : 'hover:bg-texto/[0.04]'}`}>
                            <Icone nome={ICONE_EXT[d.ext] || (visualizacao(d.ext) === 'imagem' ? 'olho' : 'arquivo')} className="mt-0.5 h-4 w-4 shrink-0 text-suave" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm">{tituloDocumento(d)}</span>
                              <span className="block truncate text-[11px] text-suave">{detalheDocumento(d)}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Documento */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Documento doc={doc} onEditarDados={() => setEditando(true)} onExcluir={() => setExcluindo(true)} />
        </div>
      </div>

      <ModalAnexar aberto={!!anexar} caminhos={anexar?.caminhos} onFechar={() => setAnexar(null)} onAnexar={confirmarAnexo} />
      <ModalDados aberto={editando} doc={doc} onFechar={() => setEditando(false)} onSalvar={salvarDados} />
      <Confirmar aberto={removendo} titulo={`Remover ${atual?.nome || 'município'} da lista?`} rotulo="Remover"
        mensagem={atual ? `${atual.documentos ? `Os ${atual.documentos} documento(s) de ${atual.nome} vão para a Lixeira do Windows (dá para recuperar de lá).` : `${atual.nome} sai da lista.`} Os metadados e os scripts desse município não são tocados.` : ''}
        onConfirmar={removerMunicipio} onFechar={() => setRemovendo(false)} />
      <Confirmar aberto={excluindo} titulo="Mandar para a Lixeira?" rotulo="Mandar para a Lixeira"
        mensagem={doc ? `“${doc.arquivo}” sai da pasta do município e vai para a Lixeira do Windows (dá para recuperar de lá).` : ''}
        onConfirmar={excluir} onFechar={() => setExcluindo(false)} />
    </Pagina>
  )
}

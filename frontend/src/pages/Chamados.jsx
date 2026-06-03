import { useState, useEffect, useRef } from 'react'
import api, { chamadosApi, catalogoApi } from '../lib/api'
import useAuthStore from '../stores/authStore'

// ── Constantes de cores ──────────────────────────────────────────────────────
const STATUS_CORES = {
  'Nao Analisado':      '#94A3B8',
  'Em Analise':         '#3B82F6',
  'Em Atendimento':     '#F59E0B',
  'Aguardando Retorno': '#F97316',
  'Concluido':          '#22C55E',
}

const CLASSIF_CORES = {
  'Pendencia de Migracao': '#8B5CF6',
  'Configuracao':          '#3B82F6',
  'Bug':                   '#EF4444',
  'Duvida':                '#F59E0B',
}

const PRIORIDADE_CORES = {
  'Baixa':   '#94A3B8',
  'Normal':  '#3B82F6',
  'Alta':    '#F59E0B',
  'Urgente': '#EF4444',
}

const STATUS_OPTS = ['Nao Analisado', 'Em Analise', 'Em Atendimento', 'Aguardando Retorno', 'Concluido']
const CLASSIF_OPTS = ['', 'Pendencia de Migracao', 'Configuracao', 'Bug', 'Duvida']
const PRIORIDADE_OPTS = ['Baixa', 'Normal', 'Alta', 'Urgente']

// ── Helpers ──────────────────────────────────────────────────────────────────
function diasDesde(data) {
  return Math.floor((Date.now() - new Date(data).getTime()) / 86400000)
}

function formatData(data) {
  return new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function tempoRelativo(data) {
  const diff = Date.now() - new Date(data).getTime()
  const min = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min}min`
  if (h < 24) return `há ${h}h`
  if (d === 1) return 'há 1 dia'
  return `há ${d} dias`
}

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function iniciais(nome) {
  if (!nome) return '?'
  const partes = nome.trim().split(' ')
  if (partes.length === 1) return partes[0][0].toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function iconeAnexo(tipo) {
  if (!tipo) return '📎'
  if (tipo.startsWith('image/')) return '🖼️'
  if (tipo === 'application/pdf') return '📄'
  return '📎'
}

// ── Badge colorido ────────────────────────────────────────────────────────────
function Badge({ label, cor, className = '' }) {
  if (!label) return null
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${className}`}
      style={{ backgroundColor: cor || '#94A3B8' }}
    >
      {label}
    </span>
  )
}

// ── Dot de status ─────────────────────────────────────────────────────────────
function StatusDot({ status }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: STATUS_CORES[status] || '#94A3B8' }}
    />
  )
}

// ── Modal Novo / Editar Chamado ───────────────────────────────────────────────
function ModalChamado({ chamado, usuarios, catalogo, onSalvo, onFechar }) {
  const isEdicao = !!chamado
  const [form, setForm] = useState({
    titulo:        chamado?.titulo        || '',
    descricao:     chamado?.descricao     || '',
    municipio:     chamado?.municipio     || '',
    entidade:      chamado?.entidade      || '',
    classificacao: chamado?.classificacao || '',
    prioridade:    chamado?.prioridade    || 'Normal',
    vertical:      chamado?.vertical      || '',
    sistema:       chamado?.sistema       || '',
    responsavelId: chamado?.responsavelId || '',
  })
  const [arquivos, setArquivos] = useState([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const fileRef = useRef()

  const sistemasDaVertical = form.vertical
    ? (catalogo.find(v => v.nome === form.vertical)?.sistemas || [])
    : []

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.titulo.trim()) { setErro('Título é obrigatório'); return }
    setSalvando(true)
    setErro('')
    try {
      const payload = {
        titulo:        form.titulo.trim(),
        descricao:     form.descricao.trim() || null,
        municipio:     form.municipio.trim() || null,
        entidade:      form.entidade.trim() || null,
        classificacao: form.classificacao || null,
        prioridade:    form.prioridade,
        vertical:      form.vertical || null,
        sistema:       form.sistema || null,
        responsavelId: form.responsavelId ? Number(form.responsavelId) : null,
      }
      let criado
      if (isEdicao) {
        criado = await chamadosApi.atualizar(chamado.id, payload)
      } else {
        criado = await chamadosApi.criar(payload)
        // Upload de anexos
        for (const arq of arquivos) {
          await chamadosApi.criarAnexo(criado.id, arq)
        }
      }
      onSalvo(criado)
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  const handleFiles = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const base64 = ev.target.result.split(',')[1]
        setArquivos(prev => [...prev, {
          nomeArquivo: file.name,
          tipo: file.type,
          conteudo: base64,
          tamanho: file.size,
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {isEdicao ? 'Editar Chamado' : 'Novo Chamado'}
          </h2>
          <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {erro && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{erro}</p>}

          <div>
            <label className="label">Título *</label>
            <input className="input" value={form.titulo} onChange={e => setField('titulo', e.target.value)} required />
          </div>

          <div>
            <label className="label">Descrição</label>
            <textarea className="input min-h-[80px]" value={form.descricao} onChange={e => setField('descricao', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Município</label>
              <input className="input" placeholder="Nome do município" value={form.municipio} onChange={e => setField('municipio', e.target.value)} />
            </div>
            <div>
              <label className="label">Entidade</label>
              <input className="input" placeholder="Nome da entidade" value={form.entidade} onChange={e => setField('entidade', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Classificação</label>
              <select className="input" value={form.classificacao} onChange={e => setField('classificacao', e.target.value)}>
                <option value="">— Sem classificação —</option>
                <option>Pendencia de Migracao</option>
                <option>Configuracao</option>
                <option>Bug</option>
                <option>Duvida</option>
              </select>
            </div>
            <div>
              <label className="label">Prioridade</label>
              <select className="input" value={form.prioridade} onChange={e => setField('prioridade', e.target.value)}>
                {PRIORIDADE_OPTS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Vertical</label>
              <select className="input" value={form.vertical} onChange={e => { setField('vertical', e.target.value); setField('sistema', '') }}>
                <option value="">— Selecione —</option>
                {catalogo.map(v => <option key={v.id} value={v.nome}>{v.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sistema</label>
              <select className="input" value={form.sistema} onChange={e => setField('sistema', e.target.value)} disabled={!form.vertical}>
                <option value="">— Selecione —</option>
                {sistemasDaVertical.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Responsável</label>
            <select className="input" value={form.responsavelId} onChange={e => setField('responsavelId', e.target.value)}>
              <option value="">— Sem responsável —</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>

          {!isEdicao && (
            <div>
              <label className="label">Anexos</label>
              <input type="file" multiple ref={fileRef} onChange={handleFiles} className="hidden" />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="text-sm text-sysgate-600 hover:underline">
                + Selecionar arquivos
              </button>
              {arquivos.length > 0 && (
                <ul className="mt-1 space-y-1">
                  {arquivos.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{iconeAnexo(a.tipo)}</span>
                      <span className="truncate">{a.nomeArquivo}</span>
                      <span className="text-gray-400 text-xs shrink-0">{formatBytes(a.tamanho)}</span>
                      <button type="button" className="text-red-400 hover:text-red-600 text-xs ml-auto"
                        onClick={() => setArquivos(prev => prev.filter((_, j) => j !== i))}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button type="button" onClick={onFechar} className="btn btn-ghost text-sm">Cancelar</button>
          <button onClick={handleSubmit} disabled={salvando} className="btn text-sm">
            {salvando ? 'Salvando…' : isEdicao ? 'Salvar' : 'Criar Chamado'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Chamados() {
  const usuario = useAuthStore(s => s.usuario)
  const isAdmin = usuario?.role === 'admin'

  const [chamados, setChamados]           = useState([])
  const [chamadoSelId, setChamadoSelId]   = useState(null)
  const [detalhe, setDetalhe]             = useState(null)
  const [busca, setBusca]                 = useState('')
  const [filtroStatus, setFiltroStatus]   = useState('')
  const [filtroClassif, setFiltroClassif] = useState('')
  const [carregando, setCarregando]       = useState(true)
  const [modalNovo, setModalNovo]         = useState(false)
  const [modalEditar, setModalEditar]     = useState(false)
  const [usuarios, setUsuarios]           = useState([])
  const [catalogo, setCatalogo]           = useState([])
  const [novoComentario, setNovoComentario] = useState('')
  const [enviandoComent, setEnviandoComent] = useState(false)
  const [uploadAnexo, setUploadAnexo]     = useState(false)
  const [mostrarLista, setMostrarLista]   = useState(true)
  const fileAnexoRef = useRef()

  // ── Carregar lista ────────────────────────────────────────────────────────
  const carregar = async () => {
    setCarregando(true)
    try {
      const params = {}
      if (busca) params.busca = busca
      if (filtroStatus) params.status = filtroStatus
      if (filtroClassif) params.classificacao = filtroClassif
      const data = await chamadosApi.listar(params)
      setChamados(data)
    } catch (e) { console.error(e) }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [busca, filtroStatus, filtroClassif])

  useEffect(() => {
    api.get('/usuarios').then(r => setUsuarios(r.data.filter(u => u.ativo))).catch(() => {})
    catalogoApi.listar().then(setCatalogo).catch(() => {})
  }, [])

  // ── Selecionar chamado ────────────────────────────────────────────────────
  const selecionarChamado = async (id) => {
    setChamadoSelId(id)
    setMostrarLista(false)
    try {
      const data = await chamadosApi.obter(id)
      setDetalhe(data)
    } catch (e) { console.error(e) }
  }

  const recarregarDetalhe = async () => {
    if (!chamadoSelId) return
    try {
      const data = await chamadosApi.obter(chamadoSelId)
      setDetalhe(data)
      setChamados(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c))
    } catch (e) { console.error(e) }
  }

  // ── Atualizar campo direto (inline) ───────────────────────────────────────
  const atualizarCampo = async (campo, valor) => {
    try {
      const atualizado = await chamadosApi.atualizar(chamadoSelId, { [campo]: valor || null })
      setDetalhe(prev => ({ ...prev, ...atualizado }))
      setChamados(prev => prev.map(c => c.id === atualizado.id ? { ...c, ...atualizado } : c))
    } catch (e) { console.error(e) }
  }

  // ── Comentários ──────────────────────────────────────────────────────────
  const enviarComentario = async () => {
    if (!novoComentario.trim()) return
    setEnviandoComent(true)
    try {
      await chamadosApi.criarComentario(chamadoSelId, { conteudo: novoComentario })
      setNovoComentario('')
      await recarregarDetalhe()
    } catch (e) { console.error(e) }
    finally { setEnviandoComent(false) }
  }

  const deletarComentario = async (cid) => {
    if (!confirm('Remover comentário?')) return
    try {
      await chamadosApi.deletarComentario(cid)
      await recarregarDetalhe()
    } catch (e) { console.error(e) }
  }

  // ── Anexos ────────────────────────────────────────────────────────────────
  const handleAnexoUpload = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploadAnexo(true)
    Promise.all(files.map(file => new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const base64 = ev.target.result.split(',')[1]
        resolve(chamadosApi.criarAnexo(chamadoSelId, {
          nomeArquivo: file.name,
          tipo: file.type,
          conteudo: base64,
          tamanho: file.size,
        }))
      }
      reader.readAsDataURL(file)
    }))).then(() => recarregarDetalhe()).finally(() => setUploadAnexo(false))
    e.target.value = ''
  }

  const deletarAnexo = async (aid) => {
    if (!confirm('Remover anexo?')) return
    try {
      await chamadosApi.deletarAnexo(aid)
      await recarregarDetalhe()
    } catch (e) { console.error(e) }
  }

  const downloadAnexo = async (aid, nome) => {
    try {
      const resp = await api.get(`/chamados/anexos/${aid}`, { responseType: 'blob' })
      const url = URL.createObjectURL(resp.data)
      const a = document.createElement('a')
      a.href = url; a.download = nome; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
  }

  // ── Deletar chamado ───────────────────────────────────────────────────────
  const deletarChamado = async () => {
    if (!confirm('Remover chamado permanentemente? Esta ação não pode ser desfeita.')) return
    try {
      await chamadosApi.deletar(chamadoSelId)
      setChamados(prev => prev.filter(c => c.id !== chamadoSelId))
      setChamadoSelId(null)
      setDetalhe(null)
      setMostrarLista(true)
    } catch (e) { console.error(e) }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header da página */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white shrink-0">
        <div className="w-1 h-6 rounded-full bg-sysgate-600" />
        <h1 className="text-base font-semibold text-gray-900">Chamados</h1>
        <span className="text-xs text-gray-400 ml-1">{chamados.length} chamado{chamados.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => setModalNovo(true)}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-sysgate-600 hover:bg-sysgate-700 text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Novo Chamado
        </button>
      </div>

      {/* Corpo — duas colunas */}
      <div className="flex flex-1 min-h-0">

        {/* ── Painel esquerdo — Lista ─────────────────────────────────────── */}
        <div className={`w-80 shrink-0 flex flex-col border-r border-gray-100 bg-gray-50 ${!mostrarLista && 'hidden md:flex'}`}>

          {/* Filtros */}
          <div className="p-3 space-y-2 border-b border-gray-100 bg-white">
            <input
              className="input text-sm w-full"
              placeholder="Buscar chamados…"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <div className="flex gap-2">
              <select className="input text-xs flex-1" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                <option value="">Todos os status</option>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="input text-xs flex-1" value={filtroClassif} onChange={e => setFiltroClassif(e.target.value)}>
                <option value="">Todas as classif.</option>
                {CLASSIF_OPTS.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Lista de chamados */}
          <div className="flex-1 overflow-y-auto">
            {carregando ? (
              <div className="p-6 text-center text-sm text-gray-400">Carregando…</div>
            ) : chamados.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">Nenhum chamado encontrado.</div>
            ) : (
              chamados.map(c => (
                <button
                  key={c.id}
                  onClick={() => selecionarChamado(c.id)}
                  className={`w-full text-left px-3 py-3 border-b border-gray-100 hover:bg-sysgate-50 transition-colors ${
                    chamadoSelId === c.id ? 'bg-sysgate-50 border-l-2 border-sysgate-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <StatusDot status={c.status} />
                    <span className="text-sm font-medium text-gray-900 truncate flex-1">{c.titulo}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-1">
                    {c.classificacao && (
                      <Badge label={c.classificacao} cor={CLASSIF_CORES[c.classificacao]} />
                    )}
                    <Badge
                      label={c.prioridade !== 'Normal' ? c.prioridade : null}
                      cor={PRIORIDADE_CORES[c.prioridade]}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 flex-wrap">
                    <span>{c.criadoPor?.nome}</span>
                    <span>·</span>
                    <span>há {diasDesde(c.criadoEm)}d</span>
                    {c.responsavel && (
                      <>
                        <span>·</span>
                        <span className="text-sysgate-600">{c.responsavel.nome}</span>
                      </>
                    )}
                  </div>
                  {(c._count?.comentarios > 0 || c._count?.anexos > 0) && (
                    <div className="flex gap-2 mt-1">
                      {c._count.comentarios > 0 && (
                        <span className="text-xs text-gray-400">💬 {c._count.comentarios}</span>
                      )}
                      {c._count.anexos > 0 && (
                        <span className="text-xs text-gray-400">📎 {c._count.anexos}</span>
                      )}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

        </div>

        {/* ── Painel direito — Detalhe ────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col min-w-0 overflow-y-auto ${mostrarLista && !detalhe ? 'hidden md:flex' : ''}`}>
          {!detalhe ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Selecione um chamado para ver os detalhes
            </div>
          ) : (
            <div className="p-6 space-y-6">

              {/* Botão voltar (mobile) */}
              <button
                className="md:hidden text-sm text-sysgate-600 mb-2"
                onClick={() => { setMostrarLista(true); setChamadoSelId(null); setDetalhe(null) }}
              >
                ← Voltar
              </button>

              {/* Header do chamado */}
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-gray-900 flex-1">{detalhe.titulo}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Dropdown status */}
                    <div className="flex items-center gap-1.5 border border-gray-200 rounded px-2 py-1 bg-white">
                      <span
                        className="w-2 h-2 rounded-full shrink-0 transition-colors duration-200"
                        style={{ backgroundColor: STATUS_CORES[detalhe.status] || '#94A3B8' }}
                      />
                      <select
                        className="text-xs font-medium text-gray-700 border-0 outline-none bg-transparent cursor-pointer pr-1"
                        value={detalhe.status}
                        onChange={e => atualizarCampo('status', e.target.value)}
                      >
                        {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      há {diasDesde(detalhe.criadoEm)}d
                    </span>
                    <button
                      onClick={() => setModalEditar(true)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={deletarChamado}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                        title="Deletar chamado"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Info card — read-only */}
                <div className="bg-gray-50 rounded-lg p-4 mt-2">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Município</p>
                      <p className="text-gray-800 font-medium">{detalhe.municipio || <span className="text-gray-400 font-normal">—</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Entidade</p>
                      <p className="text-gray-800 font-medium">{detalhe.entidade || <span className="text-gray-400 font-normal">—</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Criado por</p>
                      <p className="text-gray-700">{detalhe.criadoPor?.nome}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Responsável</p>
                      <p className="text-gray-700">{detalhe.responsavel?.nome || <span className="text-gray-400">—</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Data de abertura</p>
                      <p className="text-gray-700">{formatData(detalhe.criadoEm)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Classificação</p>
                      {detalhe.classificacao
                        ? <Badge label={detalhe.classificacao} cor={CLASSIF_CORES[detalhe.classificacao]} />
                        : <span className="text-gray-400 text-xs">—</span>}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Prioridade</p>
                      <Badge label={detalhe.prioridade} cor={PRIORIDADE_CORES[detalhe.prioridade]} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Vertical</p>
                      <p className="text-gray-700">{detalhe.vertical || <span className="text-gray-400">—</span>}</p>
                    </div>
                    {detalhe.sistema && (
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Sistema</p>
                        <p className="text-gray-700">{detalhe.sistema}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Descrição</h3>
                <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap min-h-[48px]">
                  {detalhe.descricao || <span className="text-gray-400">Sem descrição</span>}
                </div>
              </div>

              {/* Anexos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Anexos ({detalhe.anexos?.length || 0})
                  </h3>
                  <div>
                    <input type="file" multiple ref={fileAnexoRef} onChange={handleAnexoUpload} className="hidden" />
                    <button
                      onClick={() => fileAnexoRef.current?.click()}
                      disabled={uploadAnexo}
                      className="text-xs text-sysgate-600 hover:underline"
                    >
                      {uploadAnexo ? 'Enviando…' : '+ Anexar'}
                    </button>
                  </div>
                </div>
                {detalhe.anexos?.length === 0 ? (
                  <p className="text-xs text-gray-400">Nenhum anexo.</p>
                ) : (
                  <ul className="space-y-1">
                    {detalhe.anexos.map(a => (
                      <li key={a.id} className="flex items-center gap-2 bg-gray-50 rounded px-3 py-2 text-sm">
                        <span>{iconeAnexo(a.tipo)}</span>
                        <span className="flex-1 truncate text-gray-700">{a.nomeArquivo}</span>
                        {a.tamanho && <span className="text-xs text-gray-400">{formatBytes(a.tamanho)}</span>}
                        <button
                          onClick={() => downloadAnexo(a.id, a.nomeArquivo)}
                          className="text-sysgate-600 hover:underline text-xs"
                        >↓ Baixar</button>
                        <button
                          onClick={() => deletarAnexo(a.id)}
                          className="text-red-400 hover:text-red-600 text-xs"
                        >×</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Comentários */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Comentários ({detalhe.comentarios?.length || 0})
                </h3>

                {/* Timeline */}
                <div className="space-y-3 mb-4">
                  {detalhe.comentarios?.length === 0 && (
                    <p className="text-xs text-gray-400">Nenhum comentário ainda.</p>
                  )}
                  {detalhe.comentarios?.map(c => (
                    <div key={c.id} className="flex gap-3">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-sysgate-100 text-sysgate-600 flex items-center justify-center text-xs font-semibold shrink-0">
                        {iniciais(c.autor?.nome)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-900">{c.autor?.nome}</span>
                          <span className="text-xs text-gray-400">{tempoRelativo(c.criadoEm)}</span>
                          {(c.autorId === usuario?.id || isAdmin) && (
                            <button
                              onClick={() => deletarComentario(c.id)}
                              className="ml-auto text-gray-300 hover:text-red-400 text-xs"
                              title="Remover comentário"
                            >×</button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.conteudo}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Novo comentário */}
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-sysgate-100 text-sysgate-600 flex items-center justify-center text-xs font-semibold shrink-0">
                    {iniciais(usuario?.nome)}
                  </div>
                  <div className="flex-1">
                    <textarea
                      className="input text-sm w-full min-h-[60px] resize-none"
                      placeholder="Escreva um comentário…"
                      value={novoComentario}
                      onChange={e => setNovoComentario(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) enviarComentario() }}
                    />
                    <div className="flex justify-end mt-1">
                      <button
                        onClick={enviarComentario}
                        disabled={enviandoComent || !novoComentario.trim()}
                        className="btn text-sm"
                      >
                        {enviandoComent ? 'Enviando…' : 'Comentar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      {modalNovo && (
        <ModalChamado
          usuarios={usuarios}
          catalogo={catalogo}
          onSalvo={(c) => {
            setChamados(prev => [c, ...prev])
            setModalNovo(false)
            selecionarChamado(c.id)
          }}
          onFechar={() => setModalNovo(false)}
        />
      )}

      {modalEditar && detalhe && (
        <ModalChamado
          chamado={detalhe}
          usuarios={usuarios}
          catalogo={catalogo}
          onSalvo={(c) => {
            setDetalhe(prev => ({ ...prev, ...c }))
            setChamados(prev => prev.map(x => x.id === c.id ? { ...x, ...c } : x))
            setModalEditar(false)
          }}
          onFechar={() => setModalEditar(false)}
        />
      )}
    </div>
  )
}

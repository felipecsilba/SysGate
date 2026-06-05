import { useState, useEffect, useRef } from 'react'
import api, { chamadosApi, catalogoApi } from '../../lib/api'
import useAuthStore from '../../stores/authStore'
import {
  STATUS_CORES,
  CLASSIF_CORES,
  PRIORIDADE_CORES,
  STATUS_OPTS,
  CLASSIF_OPTS,
  formatData,
} from './constants'
import PainelHistorico from './PainelHistorico'
import ChamadosDashboard from './ChamadosDashboard'
import ModalChamado from './ModalChamado'
import ModalFilaConfig from './ModalFilaConfig'
import AbaPainel from './AbaPainel'

// ── Helpers (used only in this file) ─────────────────────────────────────────
function tempoRelativo(data) {
  const diff = Date.now() - new Date(data).getTime()
  const min = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min}min`
  if (h < 24)  return `há ${h}h`
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
  const p = nome.trim().split(' ')
  return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}
function iconeAnexo(tipo) {
  if (!tipo) return '📎'
  if (tipo.startsWith('image/')) return '🖼️'
  if (tipo === 'application/pdf') return '📄'
  return '📎'
}
function prefixoMunicipio(municipio) {
  if (!municipio) return ''
  return municipio
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)
}
// MUNI-YYYY-NNNNN — sequência dentro do mesmo município+ano a partir da lista carregada
function ticketNum(c, lista) {
  const ano = new Date(c.criadoEm).getFullYear()
  const prefixo = c.municipio ? prefixoMunicipio(c.municipio) : 'CH'
  let seq = 0
  if (lista && c.municipio) {
    seq = lista.filter(
      x => x.municipio === c.municipio &&
           new Date(x.criadoEm).getFullYear() === ano &&
           x.id <= c.id
    ).length
  }
  const num = seq > 0 ? String(seq).padStart(5, '0') : String(c.id).padStart(5, '0')
  return `${prefixo}-${ano}-${num}`
}
function linkify(texto) {
  if (!texto) return ''
  const escaped = texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(
    /(https?:\/\/[^\s<>"']+)|(@[\wÀ-ú]+)/g,
    (match, url, mention) => {
      if (url) return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-sysgate-600 underline hover:text-sysgate-700 break-all">${url}</a>`
      if (mention) return `<span class="text-sysgate-600 font-medium bg-sysgate-50 rounded px-1">${mention}</span>`
      return match
    }
  )
}

// ── Badge colorido ─────────────────────────────────────────────────────────────
function Badge({ label, cor, className = '' }) {
  if (!label) return null
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${className}`}
      style={{ backgroundColor: cor || '#94A3B8' }}>{label}</span>
  )
}

// ── Avatar com iniciais ────────────────────────────────────────────────────────
function Avatar({ nome, size = 7 }) {
  return (
    <div className={`w-${size} h-${size} rounded-full bg-sysgate-100 text-sysgate-700 flex items-center justify-center text-xs font-bold shrink-0`}>
      {iniciais(nome)}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Chamados() {
  const usuario = useAuthStore(s => s.usuario)
  const isAdmin = usuario?.role === 'admin'

  const [aba, setAba]                         = useState('lista') // 'lista' | 'painel' | 'dashboard'
  const [subAba, setSubAba]                   = useState('meus') // 'meus' | 'fila' | 'semdono'
  const [filaConfig, setFilaConfig]           = useState(null)   // null = não configurado
  const [modalFilaConfig, setModalFilaConfig] = useState(false)
  const [contSemDono, setContSemDono]         = useState(0)
  const [chamados, setChamados]               = useState([])
  const [chamadoSelId, setChamadoSelId]       = useState(null)
  const [detalhe, setDetalhe]                 = useState(null)
  const [busca, setBusca]                     = useState('')
  const [carregando, setCarregando]           = useState(true)
  const [modalNovo, setModalNovo]             = useState(false)
  const [modalEditar, setModalEditar]         = useState(false)
  const [usuarios, setUsuarios]               = useState([])
  const [catalogo, setCatalogo]               = useState([])
  const [novoComentario, setNovoComentario]   = useState('')
  const [enviandoComent, setEnviandoComent]   = useState(false)
  const [uploadAnexo, setUploadAnexo]         = useState(false)
  const [erroAnexo, setErroAnexo]             = useState('')
  const LIMITE_ARQUIVO_MB = 35
  const [mostrarLista, setMostrarLista]       = useState(true)
  const [dragOver, setDragOver]               = useState(false)
  const [mostrarHistorico, setMostrarHistorico] = useState(false)
  const [historicoKey, setHistoricoKey]         = useState(0)
  const [mostrarMention, setMostrarMention]     = useState(false)
  const [mentionQuery, setMentionQuery]         = useState('')
  const [pendingCommentAnexos, setPendingCommentAnexos] = useState([])
  const [comentarioImgs, setComentarioImgs]     = useState({})
  const fileAnexoRef   = useRef()
  const commentFileRef = useRef()
  const textareaRef    = useRef()

  const carregar = async () => {
    setCarregando(true)
    try {
      const params = { limite: 100 }
      if (busca) params.busca = busca

      if (subAba === 'meus') {
        params.responsavelId      = usuario?.id
        params.excluirEncerrados  = 'true'
      } else if (subAba === 'semdono') {
        params.semResponsavel    = 'true'
        params.excluirEncerrados = 'true'
      } else if (subAba === 'fila' && filaConfig) {
        if (filaConfig.verticais?.length) params.verticais = filaConfig.verticais.join(',')
        if (filaConfig.sistemas?.length)  params.sistemas  = filaConfig.sistemas.join(',')
        if (filaConfig.status?.length === 1) params.status = filaConfig.status[0]
        else params.excluirEncerrados = 'true'
      }

      const result = await chamadosApi.listar(params)
      setChamados(result.data ?? result)

      // Contagem sem dono (sempre atualizada, independente da sub-aba)
      const sdResult = await chamadosApi.listar({ semResponsavel: 'true', excluirEncerrados: 'true', limite: 1 })
      setContSemDono(sdResult.total ?? 0)
    } catch (e) { console.error(e) }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [subAba, busca, filaConfig])

  useEffect(() => {
    api.get('/usuarios').then(r => setUsuarios(r.data.filter(u => u.ativo))).catch(() => {})
    catalogoApi.listar().then(setCatalogo).catch(() => {})
    // Carregar filaFiltro atualizado do servidor
    api.get('/auth/me').then(r => {
      if (r.data.filaFiltro) {
        try { setFilaConfig(JSON.parse(r.data.filaFiltro)) } catch {}
      }
    }).catch(() => {})
  }, [])

  const carregarImgsComentarios = async (detalheData) => {
    const imgAnexos = (detalheData.anexos || []).filter(
      a => a.tipo?.startsWith('image/') && a.comentarioId != null
    )
    if (!imgAnexos.length) { setComentarioImgs({}); return }
    const mapa = {}
    await Promise.all(imgAnexos.map(async a => {
      try {
        const resp = await api.get(`/chamados/anexos/${a.id}`, { responseType: 'blob' })
        const url = URL.createObjectURL(resp.data)
        if (!mapa[a.comentarioId]) mapa[a.comentarioId] = []
        mapa[a.comentarioId].push({ id: a.id, url, nomeArquivo: a.nomeArquivo })
      } catch {}
    }))
    setComentarioImgs(mapa)
  }

  const selecionarChamado = async (id) => {
    setChamadoSelId(id)
    setMostrarLista(false)
    setHistoricoKey(k => k + 1)
    setPendingCommentAnexos([])
    try {
      const data = await chamadosApi.obter(id)
      setDetalhe(data)
      carregarImgsComentarios(data)
    } catch (e) { console.error(e) }
  }

  const recarregarDetalhe = async () => {
    if (!chamadoSelId) return
    try {
      const data = await chamadosApi.obter(chamadoSelId)
      setDetalhe(data)
      setChamados(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c))
      setHistoricoKey(k => k + 1)
      carregarImgsComentarios(data)
    } catch (e) { console.error(e) }
  }

  const atualizarCampo = async (campo, valor) => {
    try {
      const atualizado = await chamadosApi.atualizar(chamadoSelId, { [campo]: valor || null })
      setDetalhe(prev => ({ ...prev, ...atualizado }))
      setChamados(prev => prev.map(c => c.id === atualizado.id ? { ...c, ...atualizado } : c))
      setHistoricoKey(k => k + 1)
    } catch (e) { console.error(e) }
  }

  const enviarComentario = async () => {
    if (!novoComentario.trim()) return
    setEnviandoComent(true)
    setMostrarMention(false)
    try {
      await chamadosApi.criarComentario(chamadoSelId, {
        conteudo: novoComentario,
        pendingAnexoIds: pendingCommentAnexos.map(a => a.id),
      })
      setNovoComentario('')
      pendingCommentAnexos.forEach(a => URL.revokeObjectURL(a.previewUrl))
      setPendingCommentAnexos([])
      await recarregarDetalhe()
    } catch (e) { console.error(e) }
    finally { setEnviandoComent(false) }
  }

  const handleComentarioChange = (e) => {
    const val = e.target.value
    setNovoComentario(val)
    const cursor = e.target.selectionStart
    const textAte = val.slice(0, cursor)
    const match = textAte.match(/@(\w*)$/)
    if (match) {
      setMentionQuery(match[1].toLowerCase())
      setMostrarMention(true)
    } else {
      setMostrarMention(false)
      setMentionQuery('')
    }
  }

  const inserirMencao = (nomeCompleto) => {
    const cursor = textareaRef.current?.selectionStart ?? novoComentario.length
    const textAte = novoComentario.slice(0, cursor)
    const textDepois = novoComentario.slice(cursor)
    const semAt = textAte.replace(/@\w*$/, '')
    setNovoComentario(semAt + `@${nomeCompleto.split(' ')[0]} ` + textDepois)
    setMostrarMention(false)
    setMentionQuery('')
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const uploadCommentImage = (e) => {
    const file = e.target.files[0]
    if (!file || !chamadoSelId) return
    if (!file.type.startsWith('image/')) return
    if (file.size > LIMITE_ARQUIVO_MB * 1024 * 1024) { setErroAnexo(`Imagem excede ${LIMITE_ARQUIVO_MB} MB.`); return }
    const previewUrl = URL.createObjectURL(file)
    setUploadAnexo(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const base64 = ev.target.result.split(',')[1]
        const anexo = await chamadosApi.criarAnexo(chamadoSelId, { nomeArquivo: file.name, tipo: file.type, conteudo: base64, tamanho: file.size })
        setPendingCommentAnexos(prev => [...prev, { id: anexo.id, nomeArquivo: file.name, previewUrl }])
      } catch { URL.revokeObjectURL(previewUrl) }
      finally { setUploadAnexo(false) }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const mentionUsuarios = mentionQuery !== undefined
    ? usuarios.filter(u => u.nome.toLowerCase().includes(mentionQuery)).slice(0, 6)
    : []

  const deletarComentario = async (cid) => {
    if (!confirm('Remover comentário?')) return
    try { await chamadosApi.deletarComentario(cid); await recarregarDetalhe() } catch (e) { console.error(e) }
  }

  const processarArquivos = (files) => {
    if (!files.length) return
    setErroAnexo('')
    const rejeitados = files.filter(f => f.size > LIMITE_ARQUIVO_MB * 1024 * 1024)
    const validos    = files.filter(f => f.size <= LIMITE_ARQUIVO_MB * 1024 * 1024)
    if (rejeitados.length > 0) {
      const nomes = rejeitados.map(f => `"${f.name}" (${formatBytes(f.size)})`).join(', ')
      setErroAnexo(`${nomes} ${rejeitados.length === 1 ? 'excede' : 'excedem'} o limite de ${LIMITE_ARQUIVO_MB} MB e ${rejeitados.length === 1 ? 'não foi enviado' : 'não foram enviados'}.`)
    }
    if (!validos.length) return
    setUploadAnexo(true)
    Promise.all(validos.map(file => new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const base64 = ev.target.result.split(',')[1]
        resolve(chamadosApi.criarAnexo(chamadoSelId, { nomeArquivo: file.name, tipo: file.type, conteudo: base64, tamanho: file.size }))
      }
      reader.readAsDataURL(file)
    }))).then(() => recarregarDetalhe()).finally(() => setUploadAnexo(false))
  }

  const handleAnexoUpload = (e) => { processarArquivos(Array.from(e.target.files)); e.target.value = '' }
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); processarArquivos(Array.from(e.dataTransfer.files)) }

  const deletarAnexo = async (aid) => {
    if (!confirm('Remover anexo?')) return
    try { await chamadosApi.deletarAnexo(aid); await recarregarDetalhe() } catch (e) { console.error(e) }
  }

  const downloadAnexo = async (aid, nome) => {
    try {
      const resp = await api.get(`/chamados/anexos/${aid}`, { responseType: 'blob' })
      const url = URL.createObjectURL(resp.data)
      const a = document.createElement('a'); a.href = url; a.download = nome; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
  }

  const deletarChamado = async () => {
    if (!confirm('Remover chamado permanentemente? Esta ação não pode ser desfeita.')) return
    try {
      await chamadosApi.deletar(chamadoSelId)
      setChamados(prev => prev.filter(c => c.id !== chamadoSelId))
      setChamadoSelId(null); setDetalhe(null); setMostrarLista(true); setMostrarHistorico(false)
    } catch (e) { console.error(e) }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white shrink-0">
        <div className="w-1 h-6 rounded-full bg-sysgate-600" />
        <h1 className="text-base font-semibold text-gray-900">Chamados</h1>
        <span className="text-xs text-gray-400">| {chamados.length} chamado{chamados.length !== 1 ? 's' : ''}</span>

        {/* Abas principais */}
        <div className="flex items-center gap-0.5 ml-4 bg-slate-100 rounded-lg p-0.5">
          {[
            { key: 'lista',     label: 'Minha Fila',
              icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
            { key: 'painel',    label: 'Painel',
              icon: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></> },
            { key: 'dashboard', label: 'Dashboard',
              icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></> },
          ].map(({ key, label, icon }) => (
            <button key={key} onClick={() => setAba(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                aba === key
                  ? 'bg-white text-sysgate-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">{icon}</svg>
              {label}
            </button>
          ))}
        </div>

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

      {/* ── Aba Dashboard ────────────────────────────────────────────────── */}
      {aba === 'dashboard' && <ChamadosDashboard />}

      {/* ── Abas Minha Fila e Painel (layout compartilhado com painel de detalhe) ── */}
      {(aba === 'lista' || aba === 'painel') && (
        <div className="flex flex-1 min-h-0">

          {/* Aba Painel: tabela com todos os chamados */}
          {aba === 'painel' && (
            <AbaPainel
              usuarios={usuarios}
              chamadoSelId={chamadoSelId}
              onSelecionarChamado={selecionarChamado}
            />
          )}

          {/* Aba Minha Fila: painel esquerdo com sub-abas */}
          {aba === 'lista' && (
          <div className={`w-80 shrink-0 flex flex-col border-r border-gray-200 bg-slate-50 ${!mostrarLista && 'hidden md:flex'}`}>

            {/* Sub-abas: Meus / Fila / Sem dono */}
            <div className="flex gap-0.5 px-2 pt-2.5 pb-2 bg-slate-50 border-b border-gray-200">
              <button onClick={() => setSubAba('meus')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${
                  subAba === 'meus' ? 'bg-sysgate-100 text-sysgate-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Meus
              </button>
              <button onClick={() => setSubAba('fila')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${
                  subAba === 'fila' ? 'bg-sysgate-100 text-sysgate-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                Fila
              </button>
              <button onClick={() => setSubAba('semdono')}
                className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center ${
                  subAba === 'semdono' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Sem dono
                {contSemDono > 0 && (
                  <span className="ml-0.5 bg-orange-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {contSemDono}
                  </span>
                )}
              </button>
            </div>

            {/* Barra de busca + ações contextuais */}
            <div className="px-3 py-2 bg-slate-50 border-b border-gray-200 flex items-center gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input className="input text-sm w-full pl-7" placeholder="Buscar chamados..."
                  value={busca} onChange={e => setBusca(e.target.value)} />
              </div>
              {subAba === 'fila' && (
                <button onClick={() => setModalFilaConfig(true)} title="Configurar fila"
                  className="p-1.5 rounded-md text-gray-400 hover:text-sysgate-600 hover:bg-sysgate-50 transition-colors shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Empty state da sub-aba Fila não configurada */}
              {subAba === 'fila' && !filaConfig ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 px-5 py-10 text-center">
                  <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                  </svg>
                  <p className="text-sm font-medium text-gray-700">Fila não configurada</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Configure filtros de vertical e sistema para montar sua fila de trabalho.
                  </p>
                  <button onClick={() => setModalFilaConfig(true)}
                    className="mt-1 px-4 py-1.5 rounded-lg bg-sysgate-600 hover:bg-sysgate-700 text-white text-xs font-medium transition-colors">
                    Configurar minha fila
                  </button>
                </div>
              ) : carregando ? (
                <div className="p-8 text-center text-sm text-gray-400">Carregando…</div>
              ) : chamados.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">Nenhum chamado encontrado.</div>
              ) : (
                chamados.map(c => (
                  <button key={c.id} onClick={() => selecionarChamado(c.id)}
                    className={`w-full text-left p-3 border-b border-gray-100 border-l-[3px] transition-colors ${
                      chamadoSelId === c.id ? 'bg-white shadow-sm' : 'hover:bg-white/70'
                    }`}
                    style={{ borderLeftColor: chamadoSelId === c.id ? '#6366f1' : (STATUS_CORES[c.status] || '#94A3B8') }}>
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{c.titulo}</p>
                    <span className="text-[10px] text-gray-400 font-mono mb-2 block">{ticketNum(c, chamados)}</span>
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      {c.classificacao && <Badge label={c.classificacao} cor={CLASSIF_CORES[c.classificacao]} />}
                      <span className="text-xs text-gray-400">• {formatData(c.criadoEm)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {c.responsavel ? (
                        <>
                          <Avatar nome={c.responsavel.nome} size={5} />
                          <span className="text-xs text-gray-500 truncate flex-1">{c.responsavel.nome}</span>
                        </>
                      ) : (
                        <>
                          <span className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                            <svg className="w-2.5 h-2.5 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                          </span>
                          <span className="text-xs text-orange-500 truncate flex-1">sem responsável</span>
                        </>
                      )}
                      {(c._count?.comentarios > 0 || c._count?.anexos > 0) && (
                        <div className="flex gap-2 shrink-0">
                          {c._count.comentarios > 0 && <span className="text-[10px] text-gray-400">💬 {c._count.comentarios}</span>}
                          {c._count.anexos > 0 && <span className="text-[10px] text-gray-400">📎 {c._count.anexos}</span>}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

          </div>
          )} {/* fim aba === 'lista' */}

          {/* Painel direito (compartilhado entre Minha Fila e Painel) */}
          <div className={`flex min-w-0 overflow-hidden bg-white ${
            aba === 'painel'
              ? detalhe ? 'w-[500px] shrink-0 border-l border-gray-200' : 'hidden'
              : `flex-1 ${mostrarLista && !detalhe ? 'hidden md:flex' : ''}`
          }`}>
            {!detalhe ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
                <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
                </svg>
                <p className="text-sm">Selecione um chamado para ver os detalhes</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 space-y-6 max-w-4xl w-full">

                    <button className="md:hidden text-sm text-sysgate-600"
                      onClick={() => { setMostrarLista(true); setChamadoSelId(null); setDetalhe(null); setMostrarHistorico(false) }}>
                      ← Voltar
                    </button>

                    {/* Cabeçalho */}
                    <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-gray-100 rounded-2xl p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <h2 className="text-xl font-bold text-gray-900 flex-1 leading-snug">{detalhe.titulo}</h2>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white shadow-sm">
                            <span className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: STATUS_CORES[detalhe.status] || '#94A3B8' }} />
                            <select className="text-xs font-medium text-gray-700 border-0 outline-none bg-transparent cursor-pointer"
                              value={detalhe.status} onChange={e => atualizarCampo('status', e.target.value)}>
                              {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <button onClick={() => setMostrarHistorico(h => !h)}
                            title={mostrarHistorico ? 'Fechar histórico' : 'Ver histórico'}
                            className={`p-1.5 rounded-lg transition-colors ${mostrarHistorico ? 'bg-sysgate-100 text-sysgate-600' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                            </svg>
                          </button>
                          <button onClick={() => setModalEditar(true)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Editar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          {isAdmin && (
                            <button onClick={deletarChamado}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Deletar">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: (STATUS_CORES[detalhe.status] || '#94A3B8') + '20', color: STATUS_CORES[detalhe.status] || '#94A3B8' }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_CORES[detalhe.status] || '#94A3B8' }} />
                          {detalhe.status}
                        </span>
                        <span className="text-xs text-gray-400 font-mono tracking-wide">{ticketNum(detalhe, chamados)}</span>
                      </div>
                    </div>

                    {/* Grid de informações */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 py-1">
                      {[
                        { label: 'MUNICÍPIO',        val: detalhe.municipio,       bold: true },
                        { label: 'ENTIDADE',         val: detalhe.entidade,        bold: true },
                        { label: 'CRIADO POR',       val: detalhe.criadoPor?.nome, avatar: true },
                        { label: 'RESPONSÁVEL',      val: detalhe.responsavel?.nome },
                        { label: 'DATA DE ABERTURA', val: formatData(detalhe.criadoEm) },
                        { label: 'CLASSIFICAÇÃO',    badge: { label: detalhe.classificacao, cor: CLASSIF_CORES[detalhe.classificacao] } },
                        { label: 'PRIORIDADE',       badge: { label: detalhe.prioridade, cor: PRIORIDADE_CORES[detalhe.prioridade] } },
                        { label: 'VERTICAL',         val: detalhe.vertical },
                        detalhe.sistema ? { label: 'SISTEMA', val: detalhe.sistema, highlight: true } : null,
                        detalhe.solicitante ? { label: 'SOLICITANTE', val: detalhe.solicitante.cargo ? `${detalhe.solicitante.nome} · ${detalhe.solicitante.cargo}` : detalhe.solicitante.nome } : null,
                      ].filter(Boolean).map(item => (
                        <div key={item.label} className="bg-slate-50 border border-gray-100 rounded-xl px-3 py-2.5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                          {item.badge ? (
                            item.badge.label ? <Badge label={item.badge.label} cor={item.badge.cor} /> : <span className="text-sm text-gray-400">—</span>
                          ) : item.avatar ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar nome={item.val} size={5} />
                              <span className="text-sm text-gray-700">{item.val || '—'}</span>
                            </div>
                          ) : (
                            <p className={`text-sm ${item.bold ? 'text-gray-900 font-semibold' : item.highlight ? 'text-sysgate-600 font-medium' : 'text-gray-700'}`}>
                              {item.val || <span className="text-gray-400 font-normal">—</span>}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Descrição */}
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Descrição</h3>
                      <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 whitespace-pre-wrap min-h-[52px] leading-relaxed">
                        {detalhe.descricao
                          ? <span dangerouslySetInnerHTML={{ __html: linkify(detalhe.descricao) }} />
                          : <span className="text-gray-400">Sem descrição</span>}
                      </div>
                    </div>

                    {/* Anexos */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Anexos ({detalhe.anexos?.length || 0})
                        </h3>
                        <div className="flex flex-col items-end gap-0.5">
                          <input type="file" multiple ref={fileAnexoRef} onChange={handleAnexoUpload} className="hidden" />
                          <button onClick={() => { setErroAnexo(''); fileAnexoRef.current?.click() }} disabled={uploadAnexo}
                            className="flex items-center gap-1 text-xs text-sysgate-600 font-medium hover:underline disabled:opacity-50">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                            {uploadAnexo ? 'Enviando…' : 'Anexar Arquivo'}
                          </button>
                          <span className="text-[10px] text-gray-400">JPG, PNG, PDF · máx. {LIMITE_ARQUIVO_MB} MB</span>
                        </div>
                      </div>
                      {erroAnexo && (
                        <p className="mb-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">{erroAnexo}</p>
                      )}
                      {detalhe.anexos?.length === 0 ? (
                        <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
                          onDrop={handleDrop} onClick={() => fileAnexoRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                            dragOver ? 'border-sysgate-400 bg-sysgate-50/50' : 'border-gray-200 hover:border-sysgate-300 hover:bg-gray-50/50'
                          }`}>
                          <svg className={`w-8 h-8 ${dragOver ? 'text-sysgate-400' : 'text-gray-300'}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                          </svg>
                          <p className="text-sm text-gray-400">Nenhum anexo. Arraste arquivos aqui ou clique para selecionar.</p>
                          <p className="text-xs text-gray-300">JPG, PNG, PDF e outros · máx. {LIMITE_ARQUIVO_MB} MB por arquivo</p>
                        </div>
                      ) : (
                        <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
                          onDrop={handleDrop}
                          className={`space-y-1.5 rounded-xl p-2 transition-colors ${dragOver ? 'bg-sysgate-50/50 border border-dashed border-sysgate-300' : ''}`}>
                          {detalhe.anexos.map(a => (
                            <div key={a.id} className="flex items-center gap-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2.5 text-sm transition-colors">
                              <span className="text-base">{iconeAnexo(a.tipo)}</span>
                              <span className="flex-1 truncate text-gray-700 font-medium">{a.nomeArquivo}</span>
                              {a.tamanho && <span className="text-xs text-gray-400 shrink-0">{formatBytes(a.tamanho)}</span>}
                              <button onClick={() => downloadAnexo(a.id, a.nomeArquivo)}
                                className="text-sysgate-600 hover:text-sysgate-700 text-xs font-medium shrink-0">↓ Baixar</button>
                              <button onClick={() => deletarAnexo(a.id)}
                                className="text-gray-300 hover:text-red-400 text-sm leading-none shrink-0">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Comentários */}
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                        Comentários ({detalhe.comentarios?.length || 0})
                      </h3>
                      <div className="space-y-4 mb-5">
                        {detalhe.comentarios?.length === 0 && <p className="text-sm text-gray-400">Nenhum comentário ainda.</p>}
                        {detalhe.comentarios?.map(c => (
                          <div key={c.id} className="flex gap-3">
                            <Avatar nome={c.autor?.nome} size={8} />
                            <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-4 py-3">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-sm font-semibold text-gray-900">{c.autor?.nome}</span>
                                <span className="text-xs text-gray-400">{tempoRelativo(c.criadoEm)}</span>
                                {(c.autorId === usuario?.id || isAdmin) && (
                                  <button onClick={() => deletarComentario(c.id)}
                                    className="ml-auto text-gray-300 hover:text-red-400 text-sm leading-none" title="Remover">×</button>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: linkify(c.conteudo) }} />
                              {comentarioImgs[c.id]?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {comentarioImgs[c.id].map(img => (
                                    <img key={img.id} src={img.url} alt={img.nomeArquivo}
                                      className="max-w-xs max-h-48 rounded-lg border border-gray-200 cursor-pointer object-contain bg-gray-50"
                                      onClick={() => window.open(img.url, '_blank')}
                                      title={img.nomeArquivo} />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <Avatar nome={usuario?.nome} size={8} />
                        <div className="flex-1 relative">
                          <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-sysgate-400 focus-within:ring-1 focus-within:ring-sysgate-300 transition-all">
                            <textarea
                              ref={textareaRef}
                              className="w-full px-4 py-3 text-sm text-gray-700 border-0 outline-none resize-none bg-transparent min-h-[64px]"
                              placeholder="Escreva um comentário… (use @ para mencionar)"
                              value={novoComentario}
                              onChange={handleComentarioChange}
                              onKeyDown={e => {
                                if (e.key === 'Escape') { setMostrarMention(false); return }
                                if (e.key === 'Enter' && e.ctrlKey) enviarComentario()
                              }}
                            />
                            {pendingCommentAnexos.length > 0 && (
                              <div className="flex flex-wrap gap-2 px-4 pb-2">
                                {pendingCommentAnexos.map(a => (
                                  <div key={a.id} className="relative group">
                                    <img src={a.previewUrl} alt={a.nomeArquivo}
                                      className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                                    <button type="button"
                                      onClick={() => { URL.revokeObjectURL(a.previewUrl); setPendingCommentAnexos(prev => prev.filter(x => x.id !== a.id)) }}
                                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
                              <div className="flex items-center gap-2">
                                <input type="file" accept="image/*" ref={commentFileRef} onChange={uploadCommentImage} className="hidden" />
                                <button type="button" onClick={() => commentFileRef.current?.click()} disabled={uploadAnexo}
                                  title="Adicionar imagem ao comentário"
                                  className="text-gray-400 hover:text-sysgate-600 transition-colors disabled:opacity-40">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                                    <path d="M21 15l-5-5L5 21"/>
                                  </svg>
                                </button>
                                <span className="text-xs text-gray-400">Ctrl+Enter para enviar · @ para mencionar</span>
                              </div>
                              <button onClick={enviarComentario} disabled={enviandoComent || (!novoComentario.trim() && pendingCommentAnexos.length === 0)}
                                className="px-3 py-1 text-xs font-semibold bg-sysgate-600 hover:bg-sysgate-700 text-white rounded-lg disabled:opacity-40 transition-colors">
                                {enviandoComent ? 'Enviando…' : 'Comentar'}
                              </button>
                            </div>
                          </div>
                          {/* Dropdown @mention */}
                          {mostrarMention && mentionUsuarios.length > 0 && (
                            <div className="absolute bottom-full mb-1 left-0 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                              {mentionUsuarios.map(u => (
                                <button key={u.id} type="button"
                                  onMouseDown={e => { e.preventDefault(); inserirMencao(u.nome) }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-sysgate-50 transition-colors text-left">
                                  <div className="w-6 h-6 rounded-full bg-sysgate-100 text-sysgate-700 flex items-center justify-center text-xs font-bold shrink-0">
                                    {u.nome[0].toUpperCase()}
                                  </div>
                                  {u.nome}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Painel histórico */}
                {mostrarHistorico && (
                  <PainelHistorico key={historicoKey} chamadoId={chamadoSelId} onFechar={() => setMostrarHistorico(false)} />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modais */}
      {modalNovo && (
        <ModalChamado usuarios={usuarios} catalogo={catalogo}
          onSalvo={(c) => { setChamados(prev => [c, ...prev]); setModalNovo(false); selecionarChamado(c.id); setAba('lista') }}
          onFechar={() => setModalNovo(false)} />
      )}
      {modalEditar && detalhe && (
        <ModalChamado chamado={detalhe} usuarios={usuarios} catalogo={catalogo}
          onSalvo={(c) => {
            setDetalhe(prev => ({ ...prev, ...c }))
            setChamados(prev => prev.map(x => x.id === c.id ? { ...x, ...c } : x))
            setModalEditar(false); setHistoricoKey(k => k + 1)
          }}
          onFechar={() => setModalEditar(false)} />
      )}
      {modalFilaConfig && (
        <ModalFilaConfig
          aberto={modalFilaConfig}
          onFechar={() => setModalFilaConfig(false)}
          configAtual={filaConfig}
          catalogo={catalogo}
          onSalvar={async (config) => {
            await api.put(`/usuarios/${usuario.id}`, { filaFiltro: JSON.stringify(config) })
            setFilaConfig(config)
            setModalFilaConfig(false)
          }}
        />
      )}
    </div>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { conhecimentoApi, catalogoApi } from '../../lib/api'
import useAuthStore from '../../stores/authStore'
import ModalConhecimento from './ModalConhecimento'
import ConfirmDialog from '../../components/ConfirmDialog'
import Toast from '../../components/Toast'
import { TIPO_CONFIG, parseConteudo } from './constants'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tempoRelativo(data) {
  const diff = Date.now() - new Date(data).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}min atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d atrás`
  const m = Math.floor(d / 30)
  if (m < 12) return `${m}m atrás`
  return `${Math.floor(m / 12)}a atrás`
}

// ─── Renderizador de blocos ───────────────────────────────────────────────────

function RenderBlocos({ conteudo }) {
  const blocos = parseConteudo(conteudo)
  return (
    <div className="space-y-2">
      {blocos.map((b, i) => {
        if (b.tipo === 'codigo') return (
          <div key={i} className="rounded-lg overflow-hidden border border-gray-700 bg-gray-900 my-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="ml-1 text-[10px] font-mono tracking-widest text-gray-500 uppercase">Código</span>
            </div>
            <pre className="font-mono text-sm text-green-400 px-3 py-2.5 whitespace-pre-wrap">{b.valor}</pre>
          </div>
        )
        if (b.tipo === 'subtitulo') return (
          <p key={i} className="text-sm font-bold text-gray-800 mt-1">{b.valor}</p>
        )
        if (b.tipo === 'nota') return (
          <div key={i} className="flex gap-2 items-start pl-1">
            <div className="w-0.5 self-stretch bg-gray-300 rounded-full shrink-0 mt-0.5" />
            <p className="text-sm text-gray-500 italic leading-relaxed">{b.valor}</p>
          </div>
        )
        return b.valor ? (
          <p key={i} className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{b.valor}</p>
        ) : null
      })}
    </div>
  )
}

// ─── Ícones ───────────────────────────────────────────────────────────────────

function IconEdit() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconBook() {
  return (
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" /><path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}

function IconChevron() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-400 pointer-events-none shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

// ─── Card da lista ────────────────────────────────────────────────────────────

function ArtigoCard({ artigo, ativo, onClick }) {
  const cfg = TIPO_CONFIG[artigo.tipo] || TIPO_CONFIG.outro
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 border-l-2 hover:bg-gray-50 transition-colors ${ativo ? 'bg-sysgate-50 border-l-sysgate-500' : 'border-l-transparent'}`}
    >
      <div className="flex items-start gap-2 mb-1">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${cfg.cls}`}>
          {cfg.label}
        </span>
        <span className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">
          {artigo.titulo}
        </span>
      </div>
      {artigo.descricao && (
        <p className="text-xs text-gray-500 line-clamp-1 mb-1.5 ml-[calc(1.5rem+0.5rem)]">
          {artigo.descricao}
        </p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap ml-[calc(1.5rem+0.5rem)]">
        {artigo.vertical && (
          <span className="text-[10px] px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded-full">
            {artigo.vertical}
          </span>
        )}
        {artigo.sistema && (
          <span className="text-[10px] px-1.5 py-0.5 bg-sysgate-100 text-sysgate-600 rounded-full">
            {artigo.sistema}
          </span>
        )}
        <span className="text-[10px] text-gray-400 ml-auto shrink-0">
          {tempoRelativo(artigo.criadoEm)}
        </span>
      </div>
    </button>
  )
}

// ─── Painel de detalhe ────────────────────────────────────────────────────────

function PainelDetalhe({ artigo, usuario, isAdmin, onEditar, onDeletar, onFechar }) {
  const cfg = TIPO_CONFIG[artigo.tipo] || TIPO_CONFIG.outro
  const podeEditar = isAdmin || artigo.autorId === usuario?.id

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>
                {cfg.label}
              </span>
              {artigo.vertical && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                  {artigo.vertical}
                </span>
              )}
              {artigo.sistema && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-sysgate-100 text-sysgate-600">
                  {artigo.sistema}
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-gray-900 leading-snug">{artigo.titulo}</h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {podeEditar && (
              <button onClick={onEditar} className="p-1.5 text-gray-400 hover:text-sysgate-600 hover:bg-sysgate-50 rounded-lg transition-colors" title="Editar">
                <IconEdit />
              </button>
            )}
            {isAdmin && (
              <button onClick={onDeletar} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                <IconTrash />
              </button>
            )}
            <button onClick={onFechar} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <IconClose />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {artigo.descricao && (
          <p className="text-sm text-gray-600 italic border-l-2 border-sysgate-200 pl-3 py-0.5">
            {artigo.descricao}
          </p>
        )}

        {artigo.tipo === 'passo-a-passo' ? (
          artigo.passos.length > 0 ? (
            <ol className="space-y-4">
              {artigo.passos.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-sysgate-600 text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-semibold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <RenderBlocos conteudo={p.texto} />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-gray-400 italic">Nenhum passo cadastrado.</p>
          )
        ) : (
          artigo.conteudo && artigo.conteudo !== '[]' ? (
            <RenderBlocos conteudo={artigo.conteudo} />
          ) : (
            <p className="text-sm text-gray-400 italic">Sem conteúdo.</p>
          )
        )}

        {artigo.etiquetas?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
            {artigo.etiquetas.map((e) => (
              <span key={e} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{e}</span>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-sysgate-100 text-sysgate-600 text-xs flex items-center justify-center font-semibold shrink-0">
          {artigo.autor?.nome?.[0]?.toUpperCase() || '?'}
        </span>
        <span className="text-xs text-gray-500">{artigo.autor?.nome}</span>
        <span className="text-xs text-gray-300">·</span>
        <span className="text-xs text-gray-400">{tempoRelativo(artigo.criadoEm)}</span>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Conhecimento() {
  const usuario = useAuthStore((s) => s.usuario)
  const isAdmin = usuario?.role === 'admin'

  const [artigos, setArtigos] = useState([])
  const [selecionado, setSelecionado] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const LIMITE = 20

  const [buscaInput, setBuscaInput] = useState('')
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroVertical, setFiltroVertical] = useState('')
  const [filtroSistema, setFiltroSistema] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState(null)
  const [confirmDeletar, setConfirmDeletar] = useState(null)
  const [toastMsg, setToastMsg] = useState('')
  const [toastTipo, setToastTipo] = useState('success')
  const [toastVisivel, setToastVisivel] = useState(false)

  const [catalogo, setCatalogo] = useState([])

  const debounceRef = useRef(null)

  const mostrarToast = (msg, tipo = 'success') => {
    setToastMsg(msg)
    setToastTipo(tipo)
    setToastVisivel(true)
    setTimeout(() => setToastVisivel(false), 3000)
  }

  const handleBuscaChange = (v) => {
    setBuscaInput(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setBusca(v); setPagina(1) }, 400)
  }

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const params = { pagina, limite: LIMITE }
      if (busca) params.busca = busca
      if (filtroTipo) params.tipo = filtroTipo
      if (filtroVertical) params.vertical = filtroVertical
      if (filtroSistema) params.sistema = filtroSistema
      const r = await conhecimentoApi.listar(params)
      setArtigos(r.data)
      setTotal(r.total)
      if (selecionado) {
        const atualizado = r.data.find((a) => a.id === selecionado.id)
        if (atualizado) setSelecionado(atualizado)
      }
    } catch {
      mostrarToast('Erro ao carregar artigos', 'error')
    } finally {
      setCarregando(false)
    }
  }, [pagina, busca, filtroTipo, filtroVertical, filtroSistema]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    catalogoApi.listar().then(setCatalogo).catch(() => {})
  }, [])

  const handleSaved = async () => {
    setShowModal(false)
    setEditando(null)
    await carregar()
    mostrarToast(editando ? 'Artigo atualizado!' : 'Artigo criado!')
  }

  const handleDeletar = async () => {
    if (!confirmDeletar) return
    try {
      await conhecimentoApi.deletar(confirmDeletar.id)
      if (selecionado?.id === confirmDeletar.id) setSelecionado(null)
      setConfirmDeletar(null)
      await carregar()
      mostrarToast('Artigo excluído')
    } catch {
      mostrarToast('Erro ao excluir artigo', 'error')
      setConfirmDeletar(null)
    }
  }

  const totalPaginas = Math.ceil(total / LIMITE)
  const filtroAtivo = filtroTipo || filtroVertical || filtroSistema || busca

  const TIPO_OPTS = Object.entries(TIPO_CONFIG).map(([value, { label }]) => ({ value, label }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-sysgate-600" />
            <h1 className="text-base font-semibold text-gray-800">Conhecimento</h1>
            {total > 0 && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {total} artigo{total !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button onClick={() => { setEditando(null); setShowModal(true) }} className="btn-primary flex items-center gap-1.5 text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo Artigo
          </button>
        </div>

        {/* Barra de filtros unificada */}
        <div className="flex items-center mt-3 border border-gray-200 rounded-xl bg-white shadow-sm divide-x divide-gray-200 overflow-hidden">
          {/* Busca */}
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <IconSearch />
            </span>
            <input
              type="text"
              value={buscaInput}
              onChange={(e) => handleBuscaChange(e.target.value)}
              placeholder="Buscar artigos por título, conteúdo ou etiqueta..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-700"
            />
          </div>

          {/* Tipo */}
          <div className="relative flex items-center shrink-0">
            <select
              value={filtroTipo}
              onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1) }}
              className={`appearance-none pl-3 pr-7 py-2.5 text-sm bg-transparent outline-none cursor-pointer transition-colors ${filtroTipo ? 'text-sysgate-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <option value="">Tipo</option>
              {TIPO_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2"><IconChevron /></span>
          </div>

          {/* Vertical */}
          <div className="relative flex items-center shrink-0">
            <select
              value={filtroVertical}
              onChange={(e) => { setFiltroVertical(e.target.value); setFiltroSistema(''); setPagina(1) }}
              className={`appearance-none pl-3 pr-7 py-2.5 text-sm bg-transparent outline-none cursor-pointer transition-colors ${filtroVertical ? 'text-sysgate-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <option value="">Vertical</option>
              {catalogo.map((v) => <option key={v.id} value={v.nome}>{v.nome}</option>)}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2"><IconChevron /></span>
          </div>

          {/* Sistema */}
          <div className="relative flex items-center shrink-0">
            <select
              value={filtroSistema}
              onChange={(e) => { setFiltroSistema(e.target.value); setPagina(1) }}
              className={`appearance-none pl-3 pr-7 py-2.5 text-sm bg-transparent outline-none cursor-pointer transition-colors ${filtroSistema ? 'text-sysgate-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <option value="">Sistema</option>
              {(filtroVertical
                ? (catalogo.find((v) => v.nome === filtroVertical)?.sistemas ?? [])
                : catalogo.flatMap((v) => v.sistemas)
              ).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2"><IconChevron /></span>
          </div>

          {/* Limpar filtros */}
          {filtroAtivo && (
            <button
              onClick={() => { setBuscaInput(''); setBusca(''); setFiltroTipo(''); setFiltroVertical(''); setFiltroSistema(''); setPagina(1) }}
              className="px-3 py-2.5 text-xs text-sysgate-600 hover:bg-sysgate-50 font-medium transition-colors whitespace-nowrap shrink-0"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Corpo */}
      <div className="flex flex-1 overflow-hidden">
        {/* Lista */}
        <div className="w-80 shrink-0 flex flex-col border-r border-gray-200 bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {carregando ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-sysgate-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : artigos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="text-gray-300 mb-3"><IconBook /></div>
                <p className="text-sm text-gray-500 font-medium">{filtroAtivo ? 'Nenhum artigo encontrado' : 'Nenhum artigo ainda'}</p>
                <p className="text-xs text-gray-400 mt-1">{filtroAtivo ? 'Tente outros filtros' : 'Clique em "Novo Artigo" para começar'}</p>
              </div>
            ) : (
              artigos.map((a) => (
                <ArtigoCard key={a.id} artigo={a} ativo={selecionado?.id === a.id} onClick={() => setSelecionado(a)} />
              ))
            )}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-white shrink-0">
              <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <span className="text-xs text-gray-400">{pagina} / {totalPaginas}</span>
              <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}
        </div>

        {/* Detalhe */}
        <div className="flex-1 overflow-hidden bg-white">
          {selecionado ? (
            <PainelDetalhe
              artigo={selecionado}
              usuario={usuario}
              isAdmin={isAdmin}
              onEditar={() => { setEditando(selecionado); setShowModal(true) }}
              onDeletar={() => setConfirmDeletar(selecionado)}
              onFechar={() => setSelecionado(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
              <IconBook />
              <p className="text-sm text-gray-400">Selecione um artigo para ver o conteúdo</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <div className="fixed bottom-4 right-4 z-50">
        <Toast visivel={toastVisivel} mensagem={toastMsg} tipo={toastTipo} />
      </div>

      {/* Modal */}
      {showModal && (
        <ModalConhecimento
          artigo={editando}
          catalogo={catalogo}
          onSaved={handleSaved}
          onClose={() => { setShowModal(false); setEditando(null) }}
        />
      )}

      {/* Confirmar exclusão */}
      <ConfirmDialog
        aberto={!!confirmDeletar}
        titulo="Excluir artigo"
        mensagem={`Tem certeza que deseja excluir "${confirmDeletar?.titulo}"? Esta ação não pode ser desfeita.`}
        labelConfirmar="Excluir"
        corConfirmar="bg-red-600 hover:bg-red-700"
        onConfirmar={handleDeletar}
        onCancelar={() => setConfirmDeletar(null)}
      />
    </div>
  )
}

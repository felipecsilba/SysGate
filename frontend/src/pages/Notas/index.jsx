import { useState, useEffect, useRef } from 'react'
import { notasApi } from '../../lib/api'
import NotaCard from './NotaCard'
import ModalNota from './ModalNota'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function Notas() {
  const [notas, setNotas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroEtiqueta, setFiltroEtiqueta] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [confirmDeletar, setConfirmDeletar] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const reorderTimerRef = useRef(null)

  const carregar = async () => {
    setCarregando(true)
    try {
      const params = {}
      if (busca) params.busca = busca
      if (filtroEtiqueta) params.etiqueta = filtroEtiqueta
      if (filtroTipo) params.tipo = filtroTipo
      const data = await notasApi.listar(params)
      setNotas(data)
    } catch (err) {
      console.error('Erro ao carregar notas:', err)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [busca, filtroEtiqueta, filtroTipo])

  // Todas as etiquetas únicas para filtro
  const todasEtiquetas = [...new Set(notas.flatMap(n => n.etiquetas))].sort()

  const notasFixadas = notas.filter(n => n.fixada)
  const notasNormais = notas.filter(n => !n.fixada)

  // Drag & Drop
  const handleDragStart = (id) => setDraggingId(id)

  const handleDragOver = (id) => setDragOverId(id)

  const handleDrop = (targetId) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    const lista = [...notas]
    const fromIdx = lista.findIndex(n => n.id === draggingId)
    const toIdx = lista.findIndex(n => n.id === targetId)

    if (fromIdx === -1 || toIdx === -1) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    // Reordenar localmente
    const [item] = lista.splice(fromIdx, 1)
    lista.splice(toIdx, 0, item)

    // Atualizar campo ordem
    const novasOrdens = lista.map((n, i) => ({ ...n, ordem: i }))
    setNotas(novasOrdens)
    setDraggingId(null)
    setDragOverId(null)

    // Persistir no backend (debounce)
    clearTimeout(reorderTimerRef.current)
    reorderTimerRef.current = setTimeout(() => {
      notasApi.reordenar(novasOrdens.map(n => ({ id: n.id, ordem: n.ordem }))).catch(() => {})
    }, 800)
  }

  const handleFixar = async (nota) => {
    try {
      const atualizada = await notasApi.fixar(nota.id)
      setNotas(prev => prev.map(n => n.id === nota.id ? { ...n, fixada: atualizada.fixada } : n))
    } catch (err) {
      console.error('Erro ao fixar nota:', err)
    }
  }

  const handleDeletar = async () => {
    if (!confirmDeletar) return
    try {
      await notasApi.deletar(confirmDeletar.id)
      setNotas(prev => prev.filter(n => n.id !== confirmDeletar.id))
    } catch (err) {
      console.error('Erro ao deletar nota:', err)
    } finally {
      setConfirmDeletar(null)
    }
  }

  const abrirNova = () => { setEditando(null); setModalAberto(true) }
  const abrirEditar = (nota) => { setEditando(nota); setModalAberto(true) }
  const fecharModal = () => { setModalAberto(false); setEditando(null) }
  const aoSalvar = () => { fecharModal(); carregar() }

  const GridNotas = ({ lista }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {lista.map(nota => (
        <NotaCard
          key={nota.id}
          nota={nota}
          onEditar={abrirEditar}
          onDeletar={setConfirmDeletar}
          onFixar={handleFixar}
          draggingId={draggingId}
          dragOverId={dragOverId}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}
    </div>
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-1 h-6 rounded-full bg-sysgate-600" />
            <h1 className="text-2xl font-bold text-gray-900">Notas</h1>
          </div>
          <p className="text-sm text-gray-400 ml-3">
            {notas.length > 0 ? `${notas.length} nota${notas.length !== 1 ? 's' : ''}` : 'Suas anotações pessoais'}
          </p>
        </div>
        <button onClick={abrirNova} className="btn inline-flex items-center gap-1.5 bg-sysgate-600 text-white hover:bg-sysgate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nova nota
        </button>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Busca */}
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Buscar notas..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sysgate-500 bg-white w-48"
          />
        </div>

        {/* Filtro por tipo */}
        <div className="flex items-center gap-1">
          {[
            { id: '', label: 'Todos' },
            { id: 'texto', label: 'Texto' },
            { id: 'checklist', label: 'Checklist' },
            { id: 'lista', label: 'Lista' },
            { id: 'codigo', label: 'Código' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFiltroTipo(t.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroTipo === t.id
                  ? 'bg-sysgate-100 text-sysgate-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtro por etiqueta */}
        {todasEtiquetas.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-gray-400">Etiquetas:</span>
            {todasEtiquetas.map(et => (
              <button
                key={et}
                onClick={() => setFiltroEtiqueta(filtroEtiqueta === et ? '' : et)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  filtroEtiqueta === et
                    ? 'bg-sysgate-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {et}
              </button>
            ))}
            {filtroEtiqueta && (
              <button onClick={() => setFiltroEtiqueta('')} className="text-xs text-gray-400 hover:text-gray-600">
                × Limpar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin w-6 h-6 text-sysgate-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : notas.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-sysgate-50 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-sysgate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">
            {busca || filtroEtiqueta || filtroTipo ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}
          </p>
          <p className="text-xs text-gray-400 mb-4">
            {busca || filtroEtiqueta || filtroTipo
              ? 'Tente ajustar os filtros'
              : 'Crie sua primeira nota para começar'}
          </p>
          {!busca && !filtroEtiqueta && !filtroTipo && (
            <button onClick={abrirNova} className="text-sm text-sysgate-600 hover:text-sysgate-700 font-medium">
              + Nova nota
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Notas fixadas */}
          {notasFixadas.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                Fixadas
              </p>
              <GridNotas lista={notasFixadas} />
            </section>
          )}

          {/* Notas normais */}
          {notasNormais.length > 0 && (
            <section>
              {notasFixadas.length > 0 && (
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Outras</p>
              )}
              <GridNotas lista={notasNormais} />
            </section>
          )}
        </div>
      )}

      {/* Modal criar/editar */}
      {modalAberto && (
        <ModalNota
          nota={editando}
          onSalvar={aoSalvar}
          onFechar={fecharModal}
        />
      )}

      {/* Confirmar deleção */}
      <ConfirmDialog
        aberto={!!confirmDeletar}
        titulo="Deletar nota?"
        mensagem={`A nota "${confirmDeletar?.titulo || 'Sem título'}" será removida permanentemente.`}
        labelConfirmar="Deletar"
        corConfirmar="bg-red-600 hover:bg-red-700"
        onConfirmar={handleDeletar}
        onCancelar={() => setConfirmDeletar(null)}
      />
    </div>
  )
}

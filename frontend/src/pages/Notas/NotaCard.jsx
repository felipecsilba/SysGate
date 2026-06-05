import { useState } from 'react'

// Ícone de pin
function IconPin({ ativo }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill={ativo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}

function IconDelete() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function IconShare() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  )
}

const TIPO_ICONE = {
  texto: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  ),
  checklist: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  lista: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  ),
  codigo: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
}

export default function NotaCard({ nota, onEditar, onDeletar, onFixar, draggingId, onDragStart, onDragOver, onDrop }) {
  const [hovering, setHovering] = useState(false)
  const isDragging = draggingId === nota.id

  const fundo = nota.cor || '#FFFDE7'
  // Calcular cor de texto com base na luminosidade do fundo
  const isLight = true // todas as cores da paleta são claras

  const feitos = nota.tipo === 'checklist' ? nota.itens.filter(i => i.feito).length : 0
  const total = nota.itens.length

  return (
    <div
      draggable
      onDragStart={() => onDragStart(nota.id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(nota.id) }}
      onDrop={() => onDrop(nota.id)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={`rounded-xl border transition-all duration-150 select-none ${
        isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
      } hover:shadow-md cursor-grab active:cursor-grabbing`}
      style={{ backgroundColor: fundo, borderColor: 'rgba(0,0,0,0.12)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-3 pt-3 pb-1 gap-2">
        <h3 className="font-semibold text-sm text-gray-800 leading-snug flex-1 min-w-0 break-words">
          {nota.titulo || 'Sem título'}
        </h3>
        {/* Ações — visíveis no hover */}
        <div className={`flex items-center gap-0.5 shrink-0 transition-opacity ${hovering ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={(e) => { e.stopPropagation(); onFixar(nota) }}
            title={nota.fixada ? 'Desafixar' : 'Fixar no topo'}
            className={`p-1 rounded-md transition-colors ${nota.fixada ? 'text-sysgate-600 bg-white/60' : 'text-gray-500 hover:text-sysgate-600 hover:bg-white/60'}`}
          >
            <IconPin ativo={nota.fixada} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEditar(nota) }}
            title="Editar"
            className="p-1 rounded-md text-gray-500 hover:text-sysgate-600 hover:bg-white/60 transition-colors"
          >
            <IconEdit />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDeletar(nota) }}
            title="Deletar"
            className="p-1 rounded-md text-gray-500 hover:text-red-500 hover:bg-white/60 transition-colors"
          >
            <IconDelete />
          </button>
        </div>
      </div>

      {/* Corpo por tipo */}
      <div className="px-3 pb-2">
        {nota.tipo === 'texto' && nota.conteudo && (
          <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-8 leading-relaxed">
            {nota.conteudo}
          </p>
        )}

        {nota.tipo === 'checklist' && nota.itens.length > 0 && (
          <div className="space-y-1">
            {nota.itens.slice(0, 8).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                  item.feito ? 'bg-gray-500 border-gray-500' : 'border-gray-400 bg-white/50'
                }`}>
                  {item.feito && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm leading-snug ${item.feito ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {item.texto}
                </span>
              </div>
            ))}
            {nota.itens.length > 8 && (
              <p className="text-xs text-gray-400 mt-1">+ {nota.itens.length - 8} itens</p>
            )}
            {nota.tipo === 'checklist' && total > 0 && (
              <p className="text-xs text-gray-400 mt-1">{feitos}/{total} concluídos</p>
            )}
          </div>
        )}

        {nota.tipo === 'lista' && nota.itens.length > 0 && (
          <ul className="space-y-0.5">
            {nota.itens.slice(0, 8).map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                <span className="text-gray-400 shrink-0 mt-0.5">•</span>
                <span className="leading-snug">{item.texto}</span>
              </li>
            ))}
            {nota.itens.length > 8 && (
              <p className="text-xs text-gray-400">+ {nota.itens.length - 8} itens</p>
            )}
          </ul>
        )}

        {nota.tipo === 'codigo' && nota.conteudo && (
          <pre className="font-mono text-xs bg-black/10 rounded-lg p-2 overflow-x-auto text-gray-800 line-clamp-6 whitespace-pre-wrap">
            {nota.conteudo}
          </pre>
        )}

        {/* Nota vazia */}
        {!nota.conteudo && nota.itens.length === 0 && (
          <p className="text-sm text-gray-400 italic">Nota vazia</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
        {/* Etiquetas */}
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {nota.etiquetas.map((et, i) => (
            <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/10 text-gray-700">
              {et}
            </span>
          ))}
        </div>

        {/* Metadados */}
        <div className="flex items-center gap-2 shrink-0">
          {nota.compartilhada && (
            <span title={`Compartilhada por ${nota.donoNome}`} className="text-gray-500">
              <IconShare />
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] text-gray-400" title={nota.tipo}>
            {TIPO_ICONE[nota.tipo]}
          </span>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { catalogoApi } from '../../lib/api'
import { confirmClose } from '../../lib/formGuard'

// ── Ícone ─────────────────────────────────────────────────────────────────────

function IconX() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

// ── Modal Configurar Catálogo ────────────────────────────────────────────────

export default function ModalCatalogo({ onClose, onSaved }) {
  const [itens, setItens] = useState([])
  const [deletados, setDeletados] = useState([])
  const [novoSis, setNovoSis] = useState({})
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const iniciaisRef = useRef(null)
  const fecharComGuard = () => {
    const dirty = deletados.length > 0 || (iniciaisRef.current !== null && JSON.stringify(iniciaisRef.current) !== JSON.stringify(itens))
    confirmClose(dirty, onClose)
  }

  useEffect(() => {
    catalogoApi.listar().then((data) => { setItens(data); iniciaisRef.current = data; setCarregando(false) })
  }, [])

  const atualizarItem = (idx, campo, valor) =>
    setItens((prev) => prev.map((item, i) => (i === idx ? { ...item, [campo]: valor } : item)))

  const removerSistema = (idx, sIdx) =>
    setItens((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, sistemas: item.sistemas.filter((_, j) => j !== sIdx) } : item
      )
    )

  const adicionarSistema = (idx) => {
    const nome = (novoSis[idx] || '').trim()
    if (!nome) return
    setItens((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, sistemas: [...item.sistemas, nome] } : item))
    )
    setNovoSis((prev) => ({ ...prev, [idx]: '' }))
  }

  const adicionarVertical = () =>
    setItens((prev) => [...prev, { _novo: true, nome: '', cor: '#94A3B8', sistemas: [], ordem: prev.length }])

  const marcarDeletar = (idx) => {
    const item = itens[idx]
    if (item.id) setDeletados((prev) => [...prev, item.id])
    setItens((prev) => prev.filter((_, i) => i !== idx))
  }

  const salvar = async () => {
    setSalvando(true)
    setErro('')
    try {
      for (const id of deletados) {
        await catalogoApi.deletar(id)
      }
      for (const item of itens) {
        const { _novo, id, criadoEm, atualizadoEm, ...data } = item
        if (_novo) {
          if (!item.nome.trim()) continue
          await catalogoApi.criar(data)
        } else {
          await catalogoApi.atualizar(id, data)
        }
      }
      onSaved()
      onClose()
    } catch (err) {
      setErro(err.response?.data?.error || err.message)
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-8 text-sm text-gray-500">Carregando catálogo...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Configurar Catálogo Betha</h2>
            <p className="text-xs text-gray-500 mt-0.5">Gerencie as verticais e seus sistemas</p>
          </div>
          <button onClick={fecharComGuard} className="text-gray-400 hover:text-gray-600 transition-colors"><IconX /></button>
        </div>

        {/* Lista de verticais */}
        <div className="overflow-y-auto px-6 py-4 flex-1 space-y-3">
          {itens.map((item, idx) => {
            const hex = item.cor || '#94A3B8'
            return (
              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Header do card */}
                <div className="flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 bg-gray-50/50">
                  <input
                    type="color"
                    value={hex}
                    onChange={(e) => atualizarItem(idx, 'cor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-200 p-0.5 shrink-0"
                    title="Cor da vertical"
                  />
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: hex }}
                  />
                  <input
                    className="flex-1 text-sm font-semibold text-gray-800 bg-transparent border-b border-transparent focus:border-sysgate-400 focus:outline-none pb-0.5"
                    placeholder="Nome da vertical..."
                    value={item.nome}
                    onChange={(e) => atualizarItem(idx, 'nome', e.target.value)}
                  />
                  <button
                    onClick={() => marcarDeletar(idx)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50 shrink-0"
                  >
                    Remover
                  </button>
                </div>
                {/* Sistemas */}
                <div className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                    {item.sistemas.map((s, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium"
                        style={{ borderColor: hex + '60', backgroundColor: hex + '18', color: hex }}
                      >
                        {s}
                        <button onClick={() => removerSistema(idx, sIdx)} className="hover:opacity-60 ml-0.5 font-bold">×</button>
                      </span>
                    ))}
                    {item.sistemas.length === 0 && (
                      <span className="text-xs text-gray-400 italic">Nenhum sistema. Adicione abaixo.</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      className="input text-xs py-1.5 flex-1"
                      placeholder="Nome do sistema... (Enter para adicionar)"
                      value={novoSis[idx] || ''}
                      onChange={(e) => setNovoSis((prev) => ({ ...prev, [idx]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarSistema(idx) } }}
                    />
                    <button onClick={() => adicionarSistema(idx)} className="btn btn-ghost text-xs py-1.5 px-3 shrink-0">
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          <button
            onClick={adicionarVertical}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-sysgate-300 hover:text-sysgate-500 transition-colors"
          >
            + Nova vertical
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          <div>
            {erro
              ? <p className="text-sm text-red-600">{erro}</p>
              : <p className="text-xs text-gray-400">Alterações aplicadas ao clicar em "Salvar".</p>
            }
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={fecharComGuard} className="btn btn-ghost">Cancelar</button>
            <button type="button" onClick={salvar} disabled={salvando} className="btn btn-primary">
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

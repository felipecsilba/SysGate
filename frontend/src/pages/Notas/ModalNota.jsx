import { useState, useEffect, useRef } from 'react'
import { notasApi } from '../../lib/api'
import { usuariosApi } from '../../lib/api'
import useAuthStore from '../../stores/authStore'

const CORES = [
  { hex: '#FFFDE7', nome: 'Amarelo' },
  { hex: '#F3E5F5', nome: 'Lilás' },
  { hex: '#E8F5E9', nome: 'Verde' },
  { hex: '#E3F2FD', nome: 'Azul' },
  { hex: '#FBE9E7', nome: 'Salmão' },
  { hex: '#FFF3E0', nome: 'Laranja' },
  { hex: '#E8EAF6', nome: 'Índigo' },
  { hex: '#FCE4EC', nome: 'Rosa' },
  { hex: '#E0F2F1', nome: 'Teal' },
  { hex: '#FAFAFA', nome: 'Branco' },
]

const TIPOS = [
  { id: 'texto', label: 'Texto' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'lista', label: 'Lista' },
  { id: 'codigo', label: 'Código' },
]

function ItemListaEditor({ itens, onChange, tipo }) {
  const inputRef = useRef(null)

  const addItem = (texto) => {
    if (!texto.trim()) return
    onChange([...itens, { texto: texto.trim(), feito: false }])
  }

  const removeItem = (i) => {
    onChange(itens.filter((_, idx) => idx !== i))
  }

  const toggleFeito = (i) => {
    const novos = [...itens]
    novos[i] = { ...novos[i], feito: !novos[i].feito }
    onChange(novos)
  }

  const editarTexto = (i, texto) => {
    const novos = [...itens]
    novos[i] = { ...novos[i], texto }
    onChange(novos)
  }

  return (
    <div className="space-y-1.5">
      {itens.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {tipo === 'checklist' && (
            <button
              type="button"
              onClick={() => toggleFeito(i)}
              className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                item.feito ? 'bg-sysgate-600 border-sysgate-600' : 'border-gray-300 hover:border-sysgate-400'
              }`}
            >
              {item.feito && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )}
          {tipo === 'lista' && (
            <span className="text-gray-400 shrink-0 text-sm">•</span>
          )}
          <input
            type="text"
            value={item.texto}
            onChange={(e) => editarTexto(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                inputRef.current?.focus()
              }
            }}
            className={`flex-1 text-sm bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none py-0.5 ${
              item.feito ? 'line-through text-gray-400' : 'text-gray-700'
            }`}
          />
          <button
            type="button"
            onClick={() => removeItem(i)}
            className="text-gray-300 hover:text-red-400 shrink-0 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      {/* Input para adicionar novo item */}
      <div className="flex items-center gap-2">
        {tipo === 'checklist' && <div className="w-4 h-4 rounded-sm border border-dashed border-gray-300 shrink-0" />}
        {tipo === 'lista' && <span className="text-gray-300 shrink-0 text-sm">+</span>}
        <input
          ref={inputRef}
          type="text"
          placeholder="Adicionar item..."
          className="flex-1 text-sm bg-transparent border-b border-dashed border-gray-300 focus:border-sysgate-400 focus:outline-none py-0.5 text-gray-500 placeholder-gray-300"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addItem(e.target.value)
              e.target.value = ''
            }
          }}
          onBlur={(e) => {
            if (e.target.value.trim()) {
              addItem(e.target.value)
              e.target.value = ''
            }
          }}
        />
      </div>
    </div>
  )
}

export default function ModalNota({ nota, onSalvar, onFechar }) {
  const usuario = useAuthStore(s => s.usuario)
  const [titulo, setTitulo] = useState(nota?.titulo || '')
  const [tipo, setTipo] = useState(nota?.tipo || 'texto')
  const [conteudo, setConteudo] = useState(nota?.conteudo || '')
  const [itens, setItens] = useState(nota?.itens || [])
  const [cor, setCor] = useState(nota?.cor || '#FFFDE7')
  const [etiquetas, setEtiquetas] = useState(nota?.etiquetas || [])
  const [etiquetaInput, setEtiquetaInput] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Compartilhamento
  const [usuarios, setUsuarios] = useState([])
  const [compartilhamentos, setCompartilhamentos] = useState(nota?.compartilhamentos || [])
  const [usuarioCompartilharId, setUsuarioCompartilharId] = useState('')
  const [abaCompartilhar, setAbaCompartilhar] = useState(false)
  const [compartilhando, setCompartilhando] = useState(false)

  const isDono = !nota || nota.usuarioId === usuario?.id

  useEffect(() => {
    if (nota && isDono && nota.id) {
      // Carregar detalhe completo para obter lista de compartilhamentos
      notasApi.obter(nota.id).then(n => {
        setCompartilhamentos(n.compartilhamentos || [])
      }).catch(() => {})
    }
  }, [nota?.id])

  useEffect(() => {
    if (isDono) {
      usuariosApi.listar().then(setUsuarios).catch(() => {})
    }
  }, [isDono])

  // Ao mudar tipo, converter itens se necessário
  const handleTipoChange = (novoTipo) => {
    if ((tipo === 'texto' || tipo === 'codigo') && (novoTipo === 'checklist' || novoTipo === 'lista')) {
      // Converter linhas do conteúdo em itens
      const linhas = conteudo.split('\n').filter(l => l.trim())
      if (linhas.length > 0) {
        setItens(linhas.map(l => ({ texto: l.trim(), feito: false })))
        setConteudo('')
      }
    }
    if ((tipo === 'checklist' || tipo === 'lista') && (novoTipo === 'texto' || novoTipo === 'codigo')) {
      // Converter itens em texto
      if (itens.length > 0) {
        setConteudo(itens.map(i => i.texto).join('\n'))
        setItens([])
      }
    }
    setTipo(novoTipo)
  }

  const addEtiqueta = (valor) => {
    const et = valor.trim().toLowerCase()
    if (!et || etiquetas.includes(et)) return
    setEtiquetas([...etiquetas, et])
    setEtiquetaInput('')
  }

  const removeEtiqueta = (et) => setEtiquetas(etiquetas.filter(e => e !== et))

  const handleSalvar = async (e) => {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      const dados = { titulo, tipo, conteudo, itens, cor, etiquetas }
      if (nota?.id) {
        await notasApi.atualizar(nota.id, dados)
      } else {
        await notasApi.criar(dados)
      }
      onSalvar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  const handleCompartilhar = async () => {
    if (!usuarioCompartilharId) return
    setCompartilhando(true)
    try {
      const comp = await notasApi.compartilhar(nota.id, Number(usuarioCompartilharId))
      setCompartilhamentos(prev => [...prev, comp])
      setUsuarioCompartilharId('')
    } catch (err) {
      setErro(err.message)
    } finally {
      setCompartilhando(false)
    }
  }

  const handleRemoverCompartilhamento = async (uid) => {
    try {
      await notasApi.removerCompartilhamento(nota.id, uid)
      setCompartilhamentos(prev => prev.filter(c => c.usuarioId !== uid))
    } catch (err) {
      setErro(err.message)
    }
  }

  const usuariosDisponiveis = usuarios.filter(u =>
    u.id !== usuario?.id && !compartilhamentos.some(c => c.usuarioId === u.id)
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: cor }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 gap-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
          <h2 className="text-base font-semibold text-gray-800">
            {nota?.id ? 'Editar nota' : 'Nova nota'}
          </h2>
          <div className="flex items-center gap-1">
            {nota?.id && isDono && (
              <button
                type="button"
                onClick={() => setAbaCompartilhar(!abaCompartilhar)}
                title="Compartilhamento"
                className={`p-1.5 rounded-lg transition-colors text-sm ${abaCompartilhar ? 'bg-black/10 text-gray-800' : 'text-gray-500 hover:bg-black/10'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={onFechar}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-black/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Corpo scrollável */}
        <form onSubmit={handleSalvar} className="flex flex-col flex-1 overflow-y-auto">
          <div className="px-5 py-3 space-y-4">
            {/* Título */}
            <input
              type="text"
              placeholder="Título"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="w-full text-base font-semibold bg-transparent border-0 focus:outline-none text-gray-800 placeholder-gray-400"
            />

            {/* Abas de tipo */}
            <div className="flex items-center gap-1 bg-black/5 rounded-lg p-1">
              {TIPOS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTipoChange(t.id)}
                  className={`flex-1 py-1 px-2 rounded-md text-xs font-medium transition-colors ${
                    tipo === t.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Conteúdo por tipo */}
            {(tipo === 'texto') && (
              <textarea
                placeholder="Escreva sua nota..."
                value={conteudo}
                onChange={e => setConteudo(e.target.value)}
                rows={6}
                className="w-full text-sm bg-transparent border-0 focus:outline-none text-gray-700 placeholder-gray-400 resize-none leading-relaxed"
              />
            )}

            {tipo === 'codigo' && (
              <textarea
                placeholder="// Seu código aqui..."
                value={conteudo}
                onChange={e => setConteudo(e.target.value)}
                rows={8}
                className="w-full text-xs font-mono bg-black/10 rounded-lg p-3 border-0 focus:outline-none focus:ring-1 focus:ring-black/20 text-gray-800 placeholder-gray-400 resize-none leading-relaxed"
              />
            )}

            {(tipo === 'checklist' || tipo === 'lista') && (
              <ItemListaEditor itens={itens} onChange={setItens} tipo={tipo} />
            )}

            {/* Etiquetas */}
            <div>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {etiquetas.map((et, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-black/10 text-gray-700">
                    {et}
                    <button type="button" onClick={() => removeEtiqueta(et)} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Adicionar etiqueta (Enter)..."
                value={etiquetaInput}
                onChange={e => setEtiquetaInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addEtiqueta(etiquetaInput) }
                  if (e.key === ',' || e.key === ' ') { e.preventDefault(); addEtiqueta(etiquetaInput) }
                }}
                onBlur={() => addEtiqueta(etiquetaInput)}
                className="text-xs bg-transparent border-b border-dashed border-gray-300 focus:border-gray-500 focus:outline-none py-0.5 text-gray-600 placeholder-gray-300 w-full"
              />
            </div>

            {/* Seletor de cor */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Cor do card</p>
              <div className="flex flex-wrap gap-2">
                {CORES.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.nome}
                    onClick={() => setCor(c.hex)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      cor === c.hex ? 'border-gray-600 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.hex, boxShadow: '0 0 0 1px rgba(0,0,0,0.12)' }}
                  />
                ))}
              </div>
            </div>

            {/* Painel de compartilhamento */}
            {abaCompartilhar && nota?.id && isDono && (
              <div className="bg-white/60 rounded-xl p-3 space-y-3">
                <p className="text-xs font-semibold text-gray-600">Compartilhamento</p>

                {/* Usuários com acesso */}
                {compartilhamentos.length > 0 && (
                  <div className="space-y-1">
                    {compartilhamentos.map(comp => (
                      <div key={comp.usuarioId || comp.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-gray-700">{comp.usuario?.nome || comp.usuarioId}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoverCompartilhamento(comp.usuarioId)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Adicionar usuário */}
                {usuariosDisponiveis.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={usuarioCompartilharId}
                      onChange={e => setUsuarioCompartilharId(e.target.value)}
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-sysgate-500"
                    >
                      <option value="">Selecionar usuário...</option>
                      {usuariosDisponiveis.map(u => (
                        <option key={u.id} value={u.id}>{u.nome}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleCompartilhar}
                      disabled={!usuarioCompartilharId || compartilhando}
                      className="text-xs px-2 py-1 bg-sysgate-600 text-white rounded-lg hover:bg-sysgate-700 disabled:opacity-50"
                    >
                      {compartilhando ? '...' : 'Compartilhar'}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    {usuarios.length <= 1 ? 'Não há outros usuários.' : 'Todos os usuários já têm acesso.'}
                  </p>
                )}
              </div>
            )}

            {erro && <p className="text-sm text-red-500">{erro}</p>}
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-black/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-sysgate-600 text-white hover:bg-sysgate-700 disabled:opacity-50 transition-colors"
            >
              {salvando ? 'Salvando...' : nota?.id ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

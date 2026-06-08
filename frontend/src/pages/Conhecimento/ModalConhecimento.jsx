import { useState, useEffect } from 'react'
import { conhecimentoApi } from '../../lib/api'
import { TIPO_CONFIG, TIPO_OPTS } from './constants'

export default function ModalConhecimento({ artigo, catalogo, onSaved, onClose }) {
  const editando = Boolean(artigo)

  const [titulo, setTitulo]       = useState(artigo?.titulo || '')
  const [tipo, setTipo]           = useState(artigo?.tipo || 'faq')
  const [descricao, setDescricao] = useState(artigo?.descricao || '')
  const [conteudo, setConteudo]   = useState(artigo?.conteudo || '')
  const [passos, setPassos]       = useState(
    artigo?.passos?.length > 0 ? artigo.passos : [{ texto: '' }]
  )
  const [vertical, setVertical]   = useState(artigo?.vertical || '')
  const [sistema, setSistema]     = useState(artigo?.sistema || '')
  const [etiquetaInput, setEtiquetaInput] = useState('')
  const [etiquetas, setEtiquetas] = useState(artigo?.etiquetas || [])
  const [salvando, setSalvando]   = useState(false)
  const [erro, setErro]           = useState('')

  // Sistemas disponíveis baseados na vertical selecionada
  const sistemasDisponiveis = vertical
    ? (catalogo.find((v) => v.nome === vertical)?.sistemas ?? [])
    : catalogo.flatMap((v) => v.sistemas)

  // Ao mudar vertical, resetar sistema se ele não estiver na nova lista
  const handleVerticalChange = (novaVertical) => {
    setVertical(novaVertical)
    const disponiveis = novaVertical
      ? (catalogo.find((v) => v.nome === novaVertical)?.sistemas ?? [])
      : catalogo.flatMap((v) => v.sistemas)
    if (sistema && !disponiveis.includes(sistema)) {
      setSistema('')
    }
  }

  // Converte conteúdo ao mudar tipo
  const handleTipoChange = (novoTipo) => {
    if (novoTipo === tipo) return
    if (novoTipo === 'passo-a-passo') {
      const linhas = conteudo.split('\n').filter((l) => l.trim())
      setPassos(linhas.length > 0 ? linhas.map((t) => ({ texto: t })) : [{ texto: '' }])
    } else if (tipo === 'passo-a-passo') {
      setConteudo(passos.map((p) => p.texto).filter(Boolean).join('\n'))
    }
    setTipo(novoTipo)
  }

  // Gerenciar passos
  const addPasso = () => setPassos((prev) => [...prev, { texto: '' }])
  const removePasso = (idx) => setPassos((prev) => prev.filter((_, i) => i !== idx))
  const updatePasso = (idx, texto) => {
    setPassos((prev) => {
      const novo = [...prev]
      novo[idx] = { texto }
      return novo
    })
  }

  // Gerenciar etiquetas
  const addEtiqueta = (valor) => {
    const tag = valor.trim().toLowerCase()
    if (tag && !etiquetas.includes(tag)) {
      setEtiquetas((prev) => [...prev, tag])
    }
    setEtiquetaInput('')
  }
  const removeEtiqueta = (tag) => setEtiquetas((prev) => prev.filter((e) => e !== tag))

  const handleEtiquetaKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addEtiqueta(etiquetaInput)
    } else if (e.key === 'Backspace' && !etiquetaInput && etiquetas.length > 0) {
      setEtiquetas((prev) => prev.slice(0, -1))
    }
  }

  // Salvar
  const salvar = async () => {
    if (!titulo.trim()) { setErro('Título obrigatório'); return }
    setSalvando(true)
    setErro('')
    try {
      const data = {
        titulo: titulo.trim(),
        tipo,
        descricao: descricao.trim() || null,
        conteudo: tipo !== 'passo-a-passo' ? conteudo : '',
        passos: tipo === 'passo-a-passo' ? passos.filter((p) => p.texto.trim()) : [],
        vertical: vertical || null,
        sistema: sistema || null,
        etiquetas,
      }
      if (editando) {
        await conhecimentoApi.atualizar(artigo.id, data)
      } else {
        await conhecimentoApi.criar(data)
      }
      onSaved()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  // Fechar com ESC
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Cabeçalho do modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-sysgate-600" />
            <h2 className="text-sm font-semibold text-gray-800">
              {editando ? 'Editar Artigo' : 'Novo Artigo'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Corpo */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Título */}
          <div>
            <label className="label">Título <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Como resolver o erro 401 no e-Pessoal"
              className="input w-full"
              autoFocus
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="label">Tipo</label>
            <div className="flex gap-2 flex-wrap">
              {TIPO_OPTS.map((o) => {
                const cfg = TIPO_CONFIG[o.value]
                const ativo = tipo === o.value
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => handleTipoChange(o.value)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                      ativo
                        ? `${cfg.cls} border-transparent`
                        : 'text-gray-500 border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Descrição (resumo) */}
          <div>
            <label className="label">
              Descrição curta <span className="text-gray-400 font-normal">(opcional — aparece nos cards)</span>
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Resumo de uma linha para facilitar a busca..."
              className="input w-full"
              maxLength={200}
            />
          </div>

          {/* Vertical e Sistema */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Vertical</label>
              <select
                value={vertical}
                onChange={(e) => handleVerticalChange(e.target.value)}
                className="input w-full"
              >
                <option value="">— Geral (sem vertical) —</option>
                {catalogo.map((v) => (
                  <option key={v.id} value={v.nome}>{v.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Sistema</label>
              <select
                value={sistema}
                onChange={(e) => setSistema(e.target.value)}
                className="input w-full"
                disabled={sistemasDisponiveis.length === 0}
              >
                <option value="">— Sem sistema —</option>
                {sistemasDisponiveis.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Conteúdo ou Passos */}
          <div>
            <label className="label">
              {tipo === 'passo-a-passo' ? 'Etapas' : 'Conteúdo'}
            </label>

            {tipo === 'passo-a-passo' ? (
              <div className="space-y-2">
                {passos.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-sysgate-100 text-sysgate-600 text-xs flex items-center justify-center shrink-0 mt-2.5 font-semibold">
                      {i + 1}
                    </span>
                    <textarea
                      value={p.texto}
                      onChange={(e) => updatePasso(i, e.target.value)}
                      placeholder={`Passo ${i + 1}...`}
                      rows={2}
                      className="input flex-1 resize-none text-sm"
                    />
                    {passos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePasso(i)}
                        className="p-1 mt-2 text-gray-400 hover:text-red-500 transition-colors rounded"
                        title="Remover passo"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPasso}
                  className="text-sm text-sysgate-600 hover:text-sysgate-700 flex items-center gap-1 mt-1 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Adicionar passo
                </button>
              </div>
            ) : (
              <textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                placeholder={
                  tipo === 'faq'
                    ? 'Descreva a pergunta e a resposta...'
                    : tipo === 'erro'
                    ? 'Descreva o erro e como resolvê-lo...'
                    : tipo === 'dica'
                    ? 'Escreva a dica...'
                    : 'Conteúdo do artigo...'
                }
                rows={8}
                className="input w-full resize-none font-mono text-sm leading-relaxed"
              />
            )}
          </div>

          {/* Etiquetas */}
          <div>
            <label className="label">
              Etiquetas <span className="text-gray-400 font-normal">(Enter ou vírgula para confirmar)</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 border border-gray-200 rounded-lg min-h-[38px] focus-within:border-sysgate-400 focus-within:ring-1 focus-within:ring-sysgate-100 transition-colors bg-white">
              {etiquetas.map((e) => (
                <span key={e} className="flex items-center gap-1 text-xs bg-sysgate-100 text-sysgate-700 px-2 py-0.5 rounded-full">
                  {e}
                  <button type="button" onClick={() => removeEtiqueta(e)} className="hover:text-sysgate-900">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={etiquetaInput}
                onChange={(e) => setEtiquetaInput(e.target.value)}
                onKeyDown={handleEtiquetaKeyDown}
                onBlur={() => { if (etiquetaInput.trim()) addEtiqueta(etiquetaInput) }}
                placeholder={etiquetas.length === 0 ? 'token, vencimento, entidade...' : ''}
                className="flex-1 min-w-[120px] outline-none text-sm bg-transparent text-gray-700 placeholder-gray-300"
              />
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          {erro ? (
            <p className="text-xs text-red-500">{erro}</p>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="btn text-sm disabled:opacity-60"
            >
              {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar artigo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

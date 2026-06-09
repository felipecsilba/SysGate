import { useState, useEffect } from 'react'
import { conhecimentoApi } from '../../lib/api'
import { TIPO_CONFIG, TIPO_OPTS, parseConteudo } from './constants'

// ─── Tipos de bloco disponíveis ───────────────────────────────────────────────

const BLOCO_TIPOS = [
  { tipo: 'texto',     label: 'Parágrafo',      desc: 'Texto comum' },
  { tipo: 'subtitulo', label: 'Subtítulo',       desc: 'Rótulo em negrito' },
  { tipo: 'codigo',    label: 'Bloco de Código', desc: 'Fundo escuro monospace' },
  { tipo: 'nota',      label: 'Nota',            desc: 'Texto em itálico' },
]

// ─── Ícones ───────────────────────────────────────────────────────────────────

function IcoUp()   { return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg> }
function IcoDown() { return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg> }
function IcoX()    { return <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg> }
function IcoPlus() { return <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> }

// ─── Item de bloco (editor individual) ───────────────────────────────────────

function BlocoItem({ bloco, onChange, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  const btnAcao = 'p-0.5 text-gray-400 hover:text-gray-700 transition-colors rounded'
  const linhas  = (bloco.valor.match(/\n/g) || []).length + 1

  return (
    <div className="relative group">
      {bloco.tipo === 'codigo' ? (
        <div className="rounded-lg overflow-hidden border border-gray-700" style={{ background: '#1e1e1e' }}>
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/10" style={{ background: '#2d2d2d' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            <span className="ml-1 text-[10px] font-mono tracking-widest text-gray-500 uppercase">Código</span>
          </div>
          <textarea
            value={bloco.valor}
            onChange={e => onChange({ ...bloco, valor: e.target.value })}
            rows={Math.max(2, linhas)}
            className="w-full font-mono text-sm bg-transparent px-3 py-2.5 outline-none resize-none"
            style={{ color: '#d4d4d4', caretColor: '#d4d4d4' }}
            placeholder="/api/endpoint ou comando..."
          />
        </div>
      ) : bloco.tipo === 'subtitulo' ? (
        <input
          value={bloco.valor}
          onChange={e => onChange({ ...bloco, valor: e.target.value })}
          className="w-full text-sm font-bold text-gray-800 bg-gray-100 rounded-lg px-3 py-2 outline-none border border-gray-200 focus:border-sysgate-400 focus:ring-1 focus:ring-sysgate-100 transition-colors"
          placeholder="Subtítulo ou rótulo..."
        />
      ) : bloco.tipo === 'nota' ? (
        <div className="flex gap-2 items-start pl-1">
          <div className="w-0.5 self-stretch bg-gray-300 rounded-full shrink-0" />
          <textarea
            value={bloco.valor}
            onChange={e => onChange({ ...bloco, valor: e.target.value })}
            rows={2}
            className="flex-1 text-sm text-gray-500 italic bg-transparent outline-none resize-none leading-relaxed py-0.5"
            placeholder="Nota ou observação..."
          />
        </div>
      ) : (
        <textarea
          value={bloco.valor}
          onChange={e => onChange({ ...bloco, valor: e.target.value })}
          rows={Math.max(2, linhas + 1)}
          className="w-full text-sm text-gray-700 bg-transparent outline-none resize-none leading-relaxed border-b border-transparent focus:border-gray-200 transition-colors py-0.5"
          placeholder="Escreva aqui..."
        />
      )}

      {/* Ações no hover */}
      <div className="absolute right-1.5 top-1.5 hidden group-hover:flex items-center gap-0.5 bg-white rounded-md shadow-sm border border-gray-200 px-0.5 py-0.5 z-10">
        {canMoveUp   && <button type="button" onClick={onMoveUp}   className={btnAcao} title="Mover para cima"><IcoUp /></button>}
        {canMoveDown && <button type="button" onClick={onMoveDown} className={btnAcao} title="Mover para baixo"><IcoDown /></button>}
        <button type="button" onClick={onRemove} className="p-0.5 text-gray-400 hover:text-red-500 transition-colors rounded" title="Remover bloco"><IcoX /></button>
      </div>
    </div>
  )
}

// ─── Menu de adicionar bloco ──────────────────────────────────────────────────

function AddBlocoMenu({ onAdd }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-sysgate-600 hover:text-sysgate-700 font-medium mt-1 transition-colors">
        <IcoPlus /> Adicionar bloco
      </button>
      {open && (
        <div className="absolute left-0 bottom-7 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1.5 min-w-[200px]">
          {BLOCO_TIPOS.map(bt => (
            <button key={bt.tipo} type="button" onClick={() => { onAdd(bt.tipo); setOpen(false) }}
              className="w-full text-left px-3 py-2 hover:bg-sysgate-50 transition-colors">
              <div className="text-xs font-semibold text-gray-800">{bt.label}</div>
              <div className="text-[10px] text-gray-400">{bt.desc}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Lista editável de blocos ─────────────────────────────────────────────────

function BlocoEditorList({ blocos, onChange }) {
  const update   = (i, novo) => { const n = [...blocos]; n[i] = novo; onChange(n) }
  const remove   = (i) => onChange(blocos.length <= 1 ? [{ tipo: 'texto', valor: '' }] : blocos.filter((_, k) => k !== i))
  const moveUp   = (i) => { if (i === 0) return; const n = [...blocos]; [n[i-1], n[i]] = [n[i], n[i-1]]; onChange(n) }
  const moveDown = (i) => { if (i === blocos.length - 1) return; const n = [...blocos]; [n[i], n[i+1]] = [n[i+1], n[i]]; onChange(n) }
  const add      = (tipo) => onChange([...blocos, { tipo, valor: '' }])

  return (
    <div className="space-y-2.5">
      {blocos.map((b, i) => (
        <BlocoItem key={i} bloco={b}
          onChange={novo => update(i, novo)}
          onRemove={() => remove(i)}
          onMoveUp={() => moveUp(i)}
          onMoveDown={() => moveDown(i)}
          canMoveUp={i > 0}
          canMoveDown={i < blocos.length - 1}
        />
      ))}
      <AddBlocoMenu onAdd={add} />
    </div>
  )
}

// ─── Modal principal ──────────────────────────────────────────────────────────

export default function ModalConhecimento({ artigo, catalogo, onSaved, onClose }) {
  const editando = Boolean(artigo)

  const [titulo, setTitulo]       = useState(artigo?.titulo || '')
  const [tipo, setTipo]           = useState(artigo?.tipo || 'faq')
  const [descricao, setDescricao] = useState(artigo?.descricao || '')
  const [blocos, setBlocos]       = useState(() => parseConteudo(artigo?.conteudo))
  const [passos, setPassos]       = useState(() =>
    artigo?.passos?.length > 0
      ? artigo.passos.map(p => ({ blocos: parseConteudo(p.texto) }))
      : [{ blocos: [{ tipo: 'texto', valor: '' }] }]
  )
  const [vertical, setVertical]   = useState(artigo?.vertical || '')
  const [sistema, setSistema]     = useState(artigo?.sistema || '')
  const [etiquetaInput, setEtiquetaInput] = useState('')
  const [etiquetas, setEtiquetas] = useState(artigo?.etiquetas || [])
  const [salvando, setSalvando]   = useState(false)
  const [erro, setErro]           = useState('')

  const sistemasDisponiveis = vertical
    ? (catalogo.find(v => v.nome === vertical)?.sistemas ?? [])
    : catalogo.flatMap(v => v.sistemas)

  const handleVerticalChange = (novaVertical) => {
    setVertical(novaVertical)
    const disp = novaVertical
      ? (catalogo.find(v => v.nome === novaVertical)?.sistemas ?? [])
      : catalogo.flatMap(v => v.sistemas)
    if (sistema && !disp.includes(sistema)) setSistema('')
  }

  const handleTipoChange = (novoTipo) => {
    if (novoTipo === tipo) return
    if (novoTipo === 'passo-a-passo') {
      const textos = blocos.filter(b => b.tipo === 'texto' && b.valor.trim())
        .flatMap(b => b.valor.split('\n')).filter(l => l.trim())
      setPassos(textos.length > 0
        ? textos.map(t => ({ blocos: [{ tipo: 'texto', valor: t }] }))
        : [{ blocos: [{ tipo: 'texto', valor: '' }] }]
      )
    } else if (tipo === 'passo-a-passo') {
      const textos = passos.flatMap(p => p.blocos.filter(b => b.tipo === 'texto').map(b => b.valor)).filter(Boolean)
      setBlocos(textos.length > 0 ? textos.map(v => ({ tipo: 'texto', valor: v })) : [{ tipo: 'texto', valor: '' }])
    }
    setTipo(novoTipo)
  }

  const addPasso         = () => setPassos(prev => [...prev, { blocos: [{ tipo: 'texto', valor: '' }] }])
  const removePasso      = (idx) => setPassos(prev => prev.filter((_, i) => i !== idx))
  const updatePassoBlocos = (idx, novos) => setPassos(prev => { const n = [...prev]; n[idx] = { blocos: novos }; return n })

  const addEtiqueta = (valor) => {
    const tag = valor.trim().toLowerCase()
    if (tag && !etiquetas.includes(tag)) setEtiquetas(prev => [...prev, tag])
    setEtiquetaInput('')
  }
  const removeEtiqueta = (tag) => setEtiquetas(prev => prev.filter(e => e !== tag))
  const handleEtiquetaKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEtiqueta(etiquetaInput) }
    else if (e.key === 'Backspace' && !etiquetaInput && etiquetas.length > 0) setEtiquetas(prev => prev.slice(0, -1))
  }

  const salvar = async () => {
    if (!titulo.trim()) { setErro('Título obrigatório'); return }
    setSalvando(true); setErro('')
    try {
      const data = {
        titulo: titulo.trim(),
        tipo,
        descricao: descricao.trim() || null,
        conteudo: tipo !== 'passo-a-passo' ? JSON.stringify(blocos) : '[]',
        passos: tipo === 'passo-a-passo'
          ? passos.filter(p => p.blocos.some(b => b.valor?.trim())).map(p => ({ texto: JSON.stringify(p.blocos) }))
          : [],
        vertical: vertical || null,
        sistema: sistema || null,
        etiquetas,
      }
      if (editando) { await conhecimentoApi.atualizar(artigo.id, data) }
      else { await conhecimentoApi.criar(data) }
      onSaved()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full bg-sysgate-600" />
            <h2 className="text-sm font-semibold text-gray-800">
              {editando ? 'Editar Artigo' : 'Novo Artigo'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
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
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Como resolver o erro 401 no e-Pessoal"
              className="input w-full" autoFocus />
          </div>

          {/* Tipo */}
          <div>
            <label className="label">Tipo</label>
            <div className="flex gap-2 flex-wrap">
              {TIPO_OPTS.map(o => {
                const cfg  = TIPO_CONFIG[o.value]
                const ativo = tipo === o.value
                return (
                  <button key={o.value} type="button" onClick={() => handleTipoChange(o.value)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${ativo ? `${cfg.cls} border-transparent` : 'text-gray-500 border-gray-200 hover:border-gray-300 bg-white'}`}>
                    {o.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="label">
              Descrição curta <span className="text-gray-400 font-normal">(opcional — aparece nos cards)</span>
            </label>
            <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
              placeholder="Resumo de uma linha para facilitar a busca..."
              className="input w-full" maxLength={200} />
          </div>

          {/* Vertical e Sistema */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Vertical</label>
              <select value={vertical} onChange={e => handleVerticalChange(e.target.value)} className="input w-full">
                <option value="">— Geral (sem vertical) —</option>
                {catalogo.map(v => <option key={v.id} value={v.nome}>{v.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sistema</label>
              <select value={sistema} onChange={e => setSistema(e.target.value)} className="input w-full" disabled={sistemasDisponiveis.length === 0}>
                <option value="">— Sem sistema —</option>
                {sistemasDisponiveis.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Conteúdo / Etapas */}
          <div>
            <label className="label">{tipo === 'passo-a-passo' ? 'Etapas' : 'Conteúdo'}</label>

            {tipo === 'passo-a-passo' ? (
              <div className="space-y-3">
                {passos.map((passo, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="w-6 h-6 rounded-full bg-sysgate-100 text-sysgate-600 text-xs flex items-center justify-center shrink-0 mt-1 font-semibold">
                      {i + 1}
                    </span>
                    <div className="flex-1 border border-gray-200 rounded-lg p-3 bg-gray-50/40">
                      <BlocoEditorList blocos={passo.blocos} onChange={novos => updatePassoBlocos(i, novos)} />
                    </div>
                    {passos.length > 1 && (
                      <button type="button" onClick={() => removePasso(i)}
                        className="p-1 mt-1 text-gray-400 hover:text-red-500 transition-colors rounded" title="Remover passo">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addPasso}
                  className="text-sm text-sysgate-600 hover:text-sysgate-700 flex items-center gap-1 mt-1 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Adicionar passo
                </button>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/30 min-h-[120px]">
                <BlocoEditorList blocos={blocos} onChange={setBlocos} />
              </div>
            )}
          </div>

          {/* Etiquetas */}
          <div>
            <label className="label">
              Etiquetas <span className="text-gray-400 font-normal">(Enter ou vírgula para confirmar)</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 border border-gray-200 rounded-lg min-h-[38px] focus-within:border-sysgate-400 focus-within:ring-1 focus-within:ring-sysgate-100 transition-colors bg-white">
              {etiquetas.map(e => (
                <span key={e} className="flex items-center gap-1 text-xs bg-sysgate-100 text-sysgate-700 px-2 py-0.5 rounded-full">
                  {e}
                  <button type="button" onClick={() => removeEtiqueta(e)} className="hover:text-sysgate-900">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
              <input type="text" value={etiquetaInput}
                onChange={e => setEtiquetaInput(e.target.value)}
                onKeyDown={handleEtiquetaKeyDown}
                onBlur={() => { if (etiquetaInput.trim()) addEtiqueta(etiquetaInput) }}
                placeholder={etiquetas.length === 0 ? 'token, vencimento, entidade...' : ''}
                className="flex-1 min-w-[120px] outline-none text-sm bg-transparent text-gray-700 placeholder-gray-300" />
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          {erro ? <p className="text-xs text-red-500">{erro}</p> : <span />}
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={salvar} disabled={salvando}
              className="btn-primary text-sm disabled:opacity-60">
              {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Criar artigo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
